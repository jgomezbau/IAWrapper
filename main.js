const { app, BrowserWindow, Menu, session, shell, Tray, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');
const os = require('os');
const { setupIPC } = require('./src/preload/ipc');

const APPS = {
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT',
    title: 'ChatGPT',
    url: 'https://chatgpt.com/',
    icon: 'chatgpt.png',
    loginDomains: [
      /(^|\.)chatgpt\.com$/i,
      /(^|\.)openai\.com$/i,
      /(^|\.)accounts\.google\.com$/i,
      /(^|\.)login\.microsoftonline\.com$/i,
      /(^|\.)login\.live\.com$/i,
      /(^|\.)appleid\.apple\.com$/i
    ]
  },
  claude: {
    id: 'claude',
    name: 'Claude',
    title: 'Claude',
    url: 'https://claude.ai/new',
    icon: 'claude.png',
    loginDomains: [
      /(^|\.)claude\.ai$/i,
      /(^|\.)anthropic\.com$/i,
      /(^|\.)claudeusercontent\.com$/i,
      /(^|\.)claudemcpclient\.com$/i,
      /(^|\.)intercom\.com$/i,
      /(^|\.)intercomcdn\.com$/i,
      /(^|\.)accounts\.google\.com$/i,
      /(^|\.)login\.microsoftonline\.com$/i,
      /(^|\.)login\.live\.com$/i,
      /(^|\.)appleid\.apple\.com$/i,
      /(^|\.)googleapis\.com$/i,
      /(^|\.)gstatic\.com$/i
    ]
  },
  grok: {
    id: 'grok',
    name: 'Grok',
    title: 'Grok',
    url: 'https://grok.com/',
    icon: 'grok.png',
    loginDomains: [
      /(^|\.)grok\.com$/i,
      /(^|\.)x\.com$/i,
      /(^|\.)twitter\.com$/i,
      /(^|\.)accounts\.google\.com$/i,
      /(^|\.)appleid\.apple\.com$/i
    ]
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    title: 'DeepSeek',
    url: 'https://chat.deepseek.com/',
    icon: 'deepseek.png',
    loginDomains: [
      /(^|\.)deepseek\.com$/i,
      /(^|\.)accounts\.google\.com$/i,
      /(^|\.)login\.live\.com$/i,
      /(^|\.)appleid\.apple\.com$/i
    ]
  },
  qwen: {
    id: 'qwen',
    name: 'Qwen',
    title: 'Qwen',
    url: 'https://chat.qwen.ai/',
    icon: 'qwen.png',
    loginDomains: [
      /(^|\.)qwen\.ai$/i,
      /(^|\.)tongyi\.com$/i,
      /(^|\.)aliyun\.com$/i,
      /(^|\.)accounts\.google\.com$/i,
      /(^|\.)login\.live\.com$/i,
      /(^|\.)appleid\.apple\.com$/i
    ]
  }
};

function parseArgs(argv) {
  const result = {
    appId: 'chatgpt',
    forceDevtools: false
  };

  for (const arg of argv.slice(1)) {
    if (arg.startsWith('--app=')) {
      result.appId = arg.slice('--app='.length).trim().toLowerCase();
    } else if (arg === '--devtools') {
      result.forceDevtools = true;
    }
  }

  if (!APPS[result.appId]) {
    result.appId = 'chatgpt';
  }

  return result;
}

const cli = parseArgs(process.argv);
const appConfig = APPS[cli.appId];
const partitionName = `persist:iawrapper:${appConfig.id}`;
const userDataPath = path.join(app.getPath('appData'), 'IAWrappers', appConfig.id);

function applyRuntimeFlags() {
  // --- Flags SIEMPRE activos para mejorar rendimiento en chats largos ---

  // Usa todos los cores disponibles para rasterizar (pintar píxeles).
  // Por defecto Chromium usa solo 1-2 hilos; esto satura el hilo principal
  // cuando el chat tiene cientos de bloques de código o mensajes largos.
  const cpuCount = os.cpus().length;
  const rasterThreads = Math.min(Math.max(cpuCount, 2), 8);
  app.commandLine.appendSwitch('num-raster-threads', String(rasterThreads));

  // Descarga el rasterizado al proceso GPU en lugar del hilo del renderer.
  // Crítico para chats con mucho contenido renderizado (código, tablas, etc.)
  app.commandLine.appendSwitch('enable-gpu-rasterization');

  // Elimina copias de memoria innecesarias al pasar texturas CPU→GPU.
  app.commandLine.appendSwitch('enable-zero-copy');

  // Evita que el renderer sea throttleado cuando la ventana pierde foco
  // o está minimizada (el SO puede ralentizar el proceso en background).
  app.commandLine.appendSwitch('disable-renderer-backgrounding');
  app.commandLine.appendSwitch('disable-background-timer-throttling');
  app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

  // Aumenta el heap de V8 a 4 GB. En chats muy largos, el heap por defecto
  // (~1.5 GB) se llena y los GC (Garbage Collection) pausan todo el hilo JS.
  const heapMb = Number(process.env.INCREASE_HEAP_MB) || 4096;
  app.commandLine.appendSwitch('js-flags', `--max-old-space-size=${heapMb}`);

  // Activa el scheduler del renderer para dar prioridad a tareas de usuario
  // (input, scroll) sobre trabajo de background (precarga de recursos, etc.)
  // UseSkiaRenderer: pipeline de render más eficiente para DOMs muy grandes.
  app.commandLine.appendSwitch('enable-features', 'MainThreadCustomScheduler,UseSkiaRenderer');

  // Al escribir rápido con un DOM grande, el renderer dispara decenas de mensajes
  // IPC/segundo hacia el proceso principal. Sin este flag, Chromium los throttlea
  // agresivamente y el textarea parece "lento" o con teclas que se "saltan".
  app.commandLine.appendSwitch('disable-ipc-flooding-protection');

  // --- Flags opcionales vía variables de entorno (comportamiento anterior) ---

  if (process.env.DISABLE_HW_ACCEL === '1') {
    app.disableHardwareAcceleration();
    // Si se deshabilita HW accel, revertir gpu-rasterization (incompatible)
    app.commandLine.appendSwitch('disable-gpu-rasterization');
  }

  if (process.env.FORCE_WAYLAND === '1') {
    app.commandLine.appendSwitch('ozone-platform', 'wayland');
    app.commandLine.appendSwitch('enable-features', 'UseOzonePlatform,MainThreadCustomScheduler');
  }

  if (process.env.DISABLE_QUIC === '1') {
    app.commandLine.appendSwitch('disable-quic');
  }

  if (process.env.DISABLE_SMOOTH_SCROLL === '1') {
    app.commandLine.appendSwitch('disable-smooth-scrolling');
  }

  // Permite sobreescribir el límite de procesos renderer (por defecto 4)
  if (process.env.METAL_THREADS) {
    app.commandLine.appendSwitch('renderer-process-limit', String(process.env.METAL_THREADS));
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function resolveIconPath(iconName) {
  const candidates = [
    path.join(__dirname, 'icons', iconName),
    path.join(__dirname, 'icons', 'icon.png'),
    path.join(__dirname, 'icons', 'icon.ico')
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[candidates.length - 1];
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
  return originOf(url) === originOf(appConfig.url);
}

// app.setName(appConfig.name); 
app.setName(`iawrapper-${appConfig.id}`);
app.setDesktopName(`iawrapper-${appConfig.id}.desktop`); // ← esto es lo que falta
ensureDir(userDataPath);
app.setPath('userData', userDataPath);
applyRuntimeFlags();

let mainWindow = null;
let loginWindow = null;
let tray = null;
let lockServer = null;
let isQuitting = false;

function focusMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  if (!mainWindow.isVisible()) mainWindow.show();
  mainWindow.focus();
}

function sendFocusToExistingInstance() {
  const client = net.createConnection({ host: '127.0.0.1', port: profileLockPort(appConfig.id) }, () => {
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

    console.error(`Profile lock error for ${appConfig.id}:`, error);
    app.quit();
  });

  lockServer.listen(profileLockPort(appConfig.id), '127.0.0.1');
}

function getSession() {
  return session.fromPartition(partitionName);
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

  const icon = nativeImage.createFromPath(resolveIconPath(appConfig.icon));
  tray = new Tray(icon);

  tray.setToolTip(appConfig.name);
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: `Mostrar/Ocultar ${appConfig.name}`,
      click: () => {
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
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.isVisible() ? mainWindow.hide() : focusMainWindow();
  });
}

function createLoginWindow(targetUrl) {
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
  return isBaseAppUrl(url);
}

function isClaudeAuthPopup(url) {
  if (appConfig.id !== 'claude') return false;

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

  return matchesAllowed(url, appConfig.loginDomains) && !isBaseAppUrl(url);
}

function createWindow() {
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
      preload: path.join(__dirname, 'src', 'preload', 'preload.js'),
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

  // Permitir URLs de archivo (drag & drop debe pasar al navegador)
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
  createWindow();
  createTray();
  Menu.setApplicationMenu(buildAppMenu());
});

app.on('activate', () => {
  if (mainWindow === null) {
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