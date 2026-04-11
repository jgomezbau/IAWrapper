const { app, BrowserWindow, Menu, session, shell, Tray, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');
const { APPS, parseArgs } = require('./apps');
const { setupIPC } = require('./ipc');
const { applyRuntimeFlags } = require('./runtime-flags');

const cli = parseArgs(process.argv);
const projectRoot = path.resolve(__dirname, '..', '..');
const iconsRoot = path.join(projectRoot, 'assets', 'icons');
const brandingAppConfig = cli.explicitApp ? APPS[cli.appId] : APPS.iawrapper;

let activeAppConfig = cli.explicitApp ? APPS[cli.appId] : null;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function resolveIconPath(iconName) {
  const candidates = [
    path.join(iconsRoot, iconName),
    path.join(iconsRoot, 'iawrapper.png')
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[candidates.length - 1];
}

function createTrayIcon(iconName) {
  const iconPath = resolveIconPath(iconName);
  let image = nativeImage.createFromPath(iconPath);

  if (image.isEmpty()) {
    image = nativeImage.createFromPath(path.join(iconsRoot, 'iawrapper.png'));
  }

  if (image.isEmpty()) {
    return image;
  }

  if (process.platform === 'linux') {
    return image.resize({
      width: 22,
      height: 22,
      quality: 'best'
    });
  }

  return image;
}

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function profileLockPort(profileId) {
  return 41000 + (hashString(`iawrapper:${profileId}`) % 2000);
}

function getActiveAppConfig() {
  return activeAppConfig || brandingAppConfig;
}

function getPartitionName() {
  return `persist:iawrapper:${getActiveAppConfig().id}`;
}

function getUserDataPath() {
  return path.join(app.getPath('appData'), 'IAWrappers', getActiveAppConfig().id);
}

function setActiveApp(appId) {
  activeAppConfig = APPS[appId];
  ensureDir(getUserDataPath());
  app.setPath('userData', getUserDataPath());
}

function hostnameOf(targetUrl) {
  try {
    return new URL(targetUrl).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function originOf(targetUrl) {
  try {
    return new URL(targetUrl).origin;
  } catch {
    return '';
  }
}

function matchesAllowed(url, rules) {
  const hostname = hostnameOf(url);
  if (!hostname) return false;

  return rules.some((rule) => {
    if (rule instanceof RegExp) return rule.test(hostname);
    const value = String(rule).toLowerCase();
    return hostname === value || hostname.endsWith(`.${value}`) || hostname.includes(value);
  });
}

function isBaseAppUrl(url) {
  return originOf(url) === originOf(getActiveAppConfig().url);
}

function isGeminiInternalUrl(url) {
  if (getActiveAppConfig().id !== 'gemini') return false;

  const hostname = hostnameOf(url);
  if (!hostname) return false;

  return (
    hostname === 'gemini.google.com' ||
    hostname.endsWith('.gemini.google.com') ||
    hostname === 'accounts.google.com' ||
    hostname.endsWith('.accounts.google.com') ||
    hostname === 'consent.google.com' ||
    hostname.endsWith('.consent.google.com') ||
    hostname === 'ogs.google.com' ||
    hostname.endsWith('.ogs.google.com') ||
    hostname === 'myaccount.google.com' ||
    hostname.endsWith('.myaccount.google.com') ||
    hostname === 'www.google.com' ||
    hostname.endsWith('.www.google.com') ||
    hostname === 'google.com' ||
    hostname.endsWith('.google.com')
  );
}

app.setName(`iawrapper-${brandingAppConfig.id}`);
app.setDesktopName(`iawrapper-${brandingAppConfig.id}.desktop`);
ensureDir(getUserDataPath());
app.setPath('userData', getUserDataPath());
applyRuntimeFlags(app);

let mainWindow = null;
let loginWindow = null;
let selectorWindow = null;
let tray = null;
let lockServer = null;
let isQuitting = false;

function focusMainWindow() {
  if (selectorWindow && !selectorWindow.isDestroyed()) {
    if (!selectorWindow.isVisible()) selectorWindow.show();
    selectorWindow.focus();
    return;
  }

  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  if (!mainWindow.isVisible()) mainWindow.show();
  mainWindow.focus();
}

function sendFocusToExistingInstance() {
  const client = net.createConnection({ host: '127.0.0.1', port: profileLockPort(brandingAppConfig.id) }, () => {
    client.write('focus');
    client.end();
    app.quit();
  });

  client.on('error', () => {
    app.quit();
  });
}

function acquireProfileLock() {
  lockServer = net.createServer((socket) => {
    socket.on('data', () => {
      focusMainWindow();
    });
  });

  lockServer.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      sendFocusToExistingInstance();
      return;
    }

    console.error(`Profile lock error for ${brandingAppConfig.id}:`, error);
    app.quit();
  });

  lockServer.listen(profileLockPort(brandingAppConfig.id), '127.0.0.1');
}

function getSession() {
  return session.fromPartition(getPartitionName());
}

function buildContextMenu(params) {
  return Menu.buildFromTemplate([
    { label: 'Cortar', role: 'cut', enabled: params.isEditable && params.editFlags.canCut },
    { label: 'Copiar', role: 'copy', enabled: params.editFlags.canCopy || !!params.selectionText?.trim() },
    { label: 'Pegar', role: 'paste', enabled: params.isEditable && params.editFlags.canPaste },
    { label: 'Seleccionar todo', role: 'selectAll', enabled: params.editFlags.canSelectAll },
    { type: 'separator' },
    { label: 'Recargar', click: () => mainWindow?.reload() },
    { label: 'Imprimir', click: () => mainWindow?.webContents.print() },
    {
      label: 'Inspeccionar',
      click: () => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        mainWindow.webContents.inspectElement(params.x, params.y);
      }
    }
  ]);
}

function buildAppMenu() {
  return Menu.buildFromTemplate([
    {
      label: 'Aplicación',
      submenu: [
        { label: 'Recargar', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
        { label: 'Abrir DevTools', accelerator: 'CmdOrCtrl+Shift+D', click: () => mainWindow?.webContents.openDevTools() },
        {
          label: 'Limpiar caché de esta app',
          click: async () => {
            const ses = getSession();
            await ses.clearCache();
            await ses.clearStorageData();
            mainWindow?.reload();
          }
        },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            isQuitting = true;
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edición',
      submenu: [
        { label: 'Deshacer', role: 'undo' },
        { label: 'Rehacer', role: 'redo' },
        { type: 'separator' },
        { label: 'Cortar', role: 'cut' },
        { label: 'Copiar', role: 'copy' },
        { label: 'Pegar', role: 'paste' },
        { label: 'Seleccionar todo', role: 'selectAll' }
      ]
    }
  ]);
}

function createTray() {
  if (tray) return;

  const icon = createTrayIcon(brandingAppConfig.icon);
  tray = new Tray(icon);

  tray.setToolTip(brandingAppConfig.name);
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: `Mostrar/Ocultar ${brandingAppConfig.name}`,
      click: () => {
        if (selectorWindow && !selectorWindow.isDestroyed()) {
          selectorWindow.isVisible() ? selectorWindow.hide() : selectorWindow.show();
          selectorWindow.focus();
          return;
        }

        if (!mainWindow || mainWindow.isDestroyed()) return;
        mainWindow.isVisible() ? mainWindow.hide() : focusMainWindow();
      }
    },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]));

  tray.on('click', () => {
    if (selectorWindow && !selectorWindow.isDestroyed()) {
      selectorWindow.isVisible() ? selectorWindow.hide() : selectorWindow.show();
      selectorWindow.focus();
      return;
    }

    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.isVisible() ? mainWindow.hide() : focusMainWindow();
  });
}

function createLoginWindow(targetUrl) {
  const appConfig = getActiveAppConfig();
  const partitionName = getPartitionName();

  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.loadURL(targetUrl);
    loginWindow.focus();
    return;
  }

  loginWindow = new BrowserWindow({
    width: 520,
    height: 760,
    parent: mainWindow,
    modal: true,
    show: true,
    autoHideMenuBar: true,
    title: `${appConfig.title} - Login`,
    icon: resolveIconPath(appConfig.icon),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true,
      sandbox: false,
      webSecurity: true,
      spellcheck: false,
      partition: partitionName
    }
  });

  loginWindow.loadURL(targetUrl);

  loginWindow.webContents.on('will-redirect', (_event, nextUrl) => {
    if (isBaseAppUrl(nextUrl)) {
      mainWindow?.loadURL(nextUrl);
      loginWindow?.close();
    }
  });

  loginWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isBaseAppUrl(url) || matchesAllowed(url, appConfig.loginDomains)) {
      createLoginWindow(url);
    } else {
      shell.openExternal(url);
    }

    return { action: 'deny' };
  });

  loginWindow.on('closed', () => {
    loginWindow = null;
  });
}

function shouldStayInsideApp(url) {
  return isBaseAppUrl(url) || isGeminiInternalUrl(url);
}

function isClaudeAuthPopup(url) {
  if (getActiveAppConfig().id !== 'claude') return false;

  const lowerUrl = String(url).toLowerCase();
  const hostname = hostnameOf(url);

  return (
    hostname.includes('accounts.google.com') ||
    hostname.includes('login.microsoftonline.com') ||
    hostname.includes('login.live.com') ||
    hostname.includes('appleid.apple.com') ||
    lowerUrl.includes('oauth') ||
    lowerUrl.includes('signin') ||
    lowerUrl.includes('login') ||
    lowerUrl.includes('auth')
  );
}

function shouldUseLoginWindow(url) {
  if (isClaudeAuthPopup(url)) {
    return false;
  }

  if (getActiveAppConfig().id === 'gemini') {
    return false;
  }

  return matchesAllowed(url, getActiveAppConfig().loginDomains) && !isBaseAppUrl(url);
}

function buildProviderSelectorHtml() {
  const providers = Object.values(APPS).filter(({ id }) => id !== 'iawrapper');
  const cards = providers.map((provider) => {
    const iconPath = resolveIconPath(provider.icon);
    const iconBuffer = fs.readFileSync(iconPath);
    const iconUrl = `data:image/png;base64,${iconBuffer.toString('base64')}`;
    return `
      <a class="provider-card" href="iawrapper-select://${provider.id}">
        <img src="${iconUrl}" alt="${provider.name}" class="provider-icon">
        <span class="provider-name">${provider.name}</span>
      </a>
    `;
  }).join('');

  return `<!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>IAWrapper</title>
      <style>
        :root {
          color-scheme: light;
          font-family: "Noto Sans", "Segoe UI", sans-serif;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          min-height: 100vh;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle at top, rgba(34, 197, 94, 0.18), transparent 36%),
            linear-gradient(145deg, #f6f7fb 0%, #eef2f7 50%, #e8edf4 100%);
          color: #162032;
        }
        .panel {
          width: min(560px, calc(100vw - 32px));
          padding: 28px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 24px 80px rgba(15, 23, 42, 0.18);
          border: 1px solid rgba(148, 163, 184, 0.22);
        }
        h1 {
          margin: 0 0 8px;
          font-size: 28px;
        }
        p {
          margin: 0 0 22px;
          line-height: 1.5;
          color: #475569;
        }
        .providers {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .provider-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 16px;
          text-decoration: none;
          color: inherit;
          background: #f8fafc;
          border: 1px solid #dbe3ef;
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }
        .provider-card:hover {
          transform: translateY(-1px);
          border-color: #94a3b8;
          box-shadow: 0 14px 32px rgba(15, 23, 42, 0.12);
        }
        .provider-icon {
          width: 36px;
          height: 36px;
          object-fit: contain;
          flex: none;
        }
        .provider-name {
          font-size: 16px;
          font-weight: 600;
        }
        @media (max-width: 540px) {
          .providers { grid-template-columns: 1fr; }
        }
      </style>
    </head>
    <body>
      <main class="panel">
        <h1>Selecciona un modelo</h1>
        <p>Elige el asistente que quieres abrir. IAWrapper mantendrá su icono genérico mientras cargas el chat seleccionado.</p>
        <section class="providers">
          ${cards}
        </section>
      </main>
    </body>
  </html>`;
}

function createSelectorWindow() {
  if (selectorWindow && !selectorWindow.isDestroyed()) {
    selectorWindow.show();
    selectorWindow.focus();
    return;
  }

  selectorWindow = new BrowserWindow({
    width: 560,
    height: 420,
    resizable: false,
    maximizable: false,
    minimizable: false,
    show: false,
    autoHideMenuBar: true,
    title: brandingAppConfig.title,
    icon: resolveIconPath(brandingAppConfig.icon),
    backgroundColor: '#eef2f7',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  selectorWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(buildProviderSelectorHtml())}`);

  selectorWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('iawrapper-select://')) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    const appId = url.replace('iawrapper-select://', '').trim().toLowerCase();
    if (!APPS[appId] || appId === 'iawrapper') {
      return;
    }

    selectorWindow.hide();
    openSelectedProvider(appId);
  });

  selectorWindow.once('ready-to-show', () => {
    selectorWindow.show();
    selectorWindow.focus();
  });

  selectorWindow.on('closed', () => {
    selectorWindow = null;
    if (!mainWindow && !isQuitting) {
      app.quit();
    }
  });
}

function openSelectedProvider(appId) {
  setActiveApp(appId);

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.loadURL(getActiveAppConfig().url);
    focusMainWindow();
    return;
  }

  createWindow();
}

function createWindow() {
  const appConfig = getActiveAppConfig();
  const partitionName = getPartitionName();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    title: appConfig.title,
    icon: resolveIconPath(appConfig.icon),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(projectRoot, 'src', 'preload', 'preload.js'),
      devTools: true,
      spellcheck: false,
      backgroundThrottling: false,
      enableWebSQL: false,
      enableRemoteModule: false,
      sandbox: false,
      webSecurity: true,
      partition: partitionName
    }
  });

  const ses = getSession();

  ses.setPermissionRequestHandler((_wc, permission, callback) => {
    const allowedPermissions = new Set([
      'media',
      'clipboard-read',
      'clipboard-sanitized-write'
    ]);
    callback(allowedPermissions.has(permission));
  });

  mainWindow.webContents.setWindowOpenHandler(({ url, features }) => {
    if (shouldStayInsideApp(url)) {
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL(url);
        }
      }, 0);

      return { action: 'deny' };
    }

    if (isClaudeAuthPopup(url)) {
      let width = 520;
      let height = 760;

      if (features) {
        const parts = features.split(',');
        for (const part of parts) {
          const [key, value] = part.trim().split('=');
          if (key === 'width' && !Number.isNaN(Number(value))) {
            width = Math.max(Number(value), 420);
          }
          if (key === 'height' && !Number.isNaN(Number(value))) {
            height = Math.max(Number(value), 640);
          }
        }
      }

      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width,
          height,
          title: `${appConfig.title} - Login`,
          show: true,
          autoHideMenuBar: true,
          icon: resolveIconPath(appConfig.icon),
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            devTools: true,
            sandbox: false,
            webSecurity: true,
            spellcheck: false,
            partition: partitionName
          }
        }
      };
    }

    if (shouldUseLoginWindow(url)) {
      createLoginWindow(url);
      return { action: 'deny' };
    }

    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (shouldStayInsideApp(url)) {
      return;
    }

    if (isClaudeAuthPopup(url)) {
      return;
    }

    if (shouldUseLoginWindow(url)) {
      event.preventDefault();
      createLoginWindow(url);
      return;
    }

    // Allow file URLs so drag-and-drop keeps working in the embedded web app.
    if (url.startsWith('file://')) {
      return;
    }

    event.preventDefault();
    shell.openExternal(url);
  });

  mainWindow.webContents.on('context-menu', (_event, params) => {
    buildContextMenu(params).popup();
  });

  mainWindow.on('close', (event) => {
    if (process.platform !== 'darwin' && !isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (!cli.explicitApp && selectorWindow && !selectorWindow.isDestroyed()) {
      selectorWindow.show();
      selectorWindow.focus();
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    if (process.env.FORCE_DEVTOOLS === '1' || cli.forceDevtools) {
      mainWindow.webContents.openDevTools({ mode: 'right' });
    }
  });

  mainWindow.loadURL(appConfig.url);
}

setupIPC();
acquireProfileLock();

app.on('certificate-error', (event, _webContents, _url, _error, _certificate, callback) => {
  if (process.env.NODE_ENV === 'development') {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

app.whenReady().then(() => {
  createTray();
  if (cli.explicitApp) {
    createWindow();
  } else {
    createSelectorWindow();
  }
  Menu.setApplicationMenu(buildAppMenu());
});

app.on('activate', () => {
  if (mainWindow === null && !cli.explicitApp) {
    createSelectorWindow();
  } else if (mainWindow === null) {
    createWindow();
  } else {
    focusMainWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform === 'darwin') return;
  if (isQuitting) app.quit();
});

app.on('before-quit', () => {
  isQuitting = true;

  if (tray) {
    tray.destroy();
  }

  if (lockServer) {
    try {
      lockServer.close();
    } catch {}
  }
});
