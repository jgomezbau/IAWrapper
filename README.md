# IAWrapper
**Versión 2.0.0**
IAWrapper es una aplicación de escritorio desarrollada con **Electron** para ejecutar interfaces web de asistentes de IA como aplicaciones nativas, independientes del navegador.
El proyecto está diseñado como un **wrapper universal parametrizable**, capaz de iniciar distintas plataformas de IA desde un único binario, cambiando dinámicamente el proveedor, la URL base, el icono, el nombre visible de la aplicación, el aislamiento de sesión y distintos parámetros de rendimiento al momento de la ejecución.
Su objetivo es ofrecer una experiencia de escritorio consistente, mantenible y optimizada para servicios como:
- **ChatGPT**
- **Claude**
- **Grok**
- **DeepSeek**
- **Qwen**

---
## Disclaimer

IAWrapper is an independent and unofficial desktop wrapper for web-based AI services.

This project is not affiliated with, endorsed by, sponsored by, or supported by OpenAI, Anthropic, xAI, DeepSeek, Alibaba, or any of the companies behind the services it can access.

ChatGPT, Claude, Grok, DeepSeek, Qwen, and any related names, logos, or trademarks are the property of their respective owners.

IAWrapper only provides an alternative desktop wrapper to access publicly available web interfaces and does not claim any official relationship with those services.

---

## 🚀 Características principales

- **Wrapper universal multisitio**: un único proyecto capaz de ejecutar múltiples plataformas de IA.
- **Selección de proveedor por parámetro**: permite iniciar distintas IAs desde el mismo ejecutable.
- **Sesiones aisladas por proveedor**: separación de cookies, caché, storage y datos persistentes.
- **Identidad visual por aplicación**: cada proveedor puede tener su propio nombre, icono, URL y acceso directo.
- **Interfaz independiente del navegador**: uso de servicios web de IA como aplicaciones de escritorio reales.
- **Menú contextual mejorado**: cortar, copiar, pegar, seleccionar todo, recargar, imprimir e inspeccionar.
- **Permisos multimedia**: soporte para cámara y micrófono cuando la plataforma lo requiera.
- **Atajos de teclado**: recarga, DevTools, salir y acciones comunes de edición.
- **Tray del sistema**: mostrar, ocultar y salir desde el área de notificación.
- **Flujos de autenticación controlados**: apertura de ventanas de login y navegación restringida según dominios permitidos.
- **Preload e IPC desacoplados**: arquitectura más mantenible y segura.
- **Parámetros avanzados de rendimiento**: control fino sobre GPU, QUIC, Wayland, heap de V8, hilos de rasterizado, límite de procesos renderer y apertura automática de DevTools.

---

## 🎯 Objetivo del proyecto

IAWrapper no busca reemplazar los servicios de IA ni modificar su lógica interna. Su propósito es ofrecer una **capa de escritorio unificada**, reutilizable y configurable para acceder a distintos asistentes web con:
- mejor organización
- mejor mantenimiento
- sesiones separadas
- comportamiento consistente
- parámetros de rendimiento ajustables
- accesos directos independientes por proveedor

---

## ⚙️ Tecnologías utilizadas

- **Electron**
- **Node.js**
- **JavaScript**
- **IPC (Inter-Process Communication)**
- **Preload scripts**
- **electron-builder**
- **HTML/CSS/JS para integración y soporte visual**
- **Tray API**
- **Session API de Electron**
- **BrowserWindow / shell / Menu / nativeImage**

---

## 🔧 Requisitos previos

Antes de comenzar, asegurate de tener instalado:
- **Node.js** 18 o superior
- **npm** 8 o superior

En Linux, según la distribución y el formato de paquete, pueden ser necesarias librerías como:
- `libnotify4`
- `libxtst6`
- `libnss3`

Para AppImage también pueden requerirse dependencias estándar del entorno gráfico.

---

## 📦 Instalación desde código fuente

### Clonar el repositorio
```bash
git clone https://github.com/jgomezbau/IAWrapper.git
cd IAWrapper
```

### Instalar dependencias
```bash
npm install
```

---

## 📜 Scripts disponibles

```bash
# Iniciar en modo normal
npm start

# Iniciar con logging de Electron habilitado
npm run dev

# Iniciar con inspección remota
npm run debug

# Construir para los targets configurados
npm run build

# Construir para Linux
npm run build:linux

# Construir AppImage
npm run build:appimage

# Construir paquete .deb
npm run build:deb
```

---

## 📦 Instalación desde binarios compilados

### Linux (.deb)
```bash
sudo dpkg -i iawrapper_2.0.0.deb
```

### Linux (.AppImage)
```bash
chmod +x IAWrapper_2.0.0.AppImage
./IAWrapper_2.0.0.AppImage
```

---

## 📦 Instalación como Flatpak

### Requisitos previos

```bash
# Instalar flatpak-builder
sudo apt install flatpak-builder

# Añadir repositorio Flathub si no está
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo

# Instalar el runtime y SDK necesarios
flatpak install flathub org.freedesktop.Platform//24.08
flatpak install flathub org.freedesktop.Sdk//24.08
flatpak install flathub org.electronjs.Electron2.BaseApp//24.08
```

---

### 🛠️ Build local (desarrollo)

Usar este método mientras desarrollás — no requiere subir cambios a GitHub.

```bash
# Desde la raíz del proyecto
flatpak-builder --user --install --force-clean build-dir flatpak/io.github.jgomezbau.iawrapper.yml
```

Para ejecutar después del build:

```bash
flatpak run io.github.jgomezbau.iawrapper --app=chatgpt
flatpak run io.github.jgomezbau.iawrapper --app=claude
flatpak run io.github.jgomezbau.iawrapper --app=grok
flatpak run io.github.jgomezbau.iawrapper --app=deepseek
flatpak run io.github.jgomezbau.iawrapper --app=qwen
```

---

### 🌐 Build desde GitHub (distribución / Flathub)

Este método descarga el código directamente desde el repositorio. Se usa para distribuir la app o publicar en Flathub.

El manifest de distribución está en un repositorio separado:  
`https://github.com/jgomezbau/io.github.jgomezbau.iawrapper`

```bash
# Clonar el repo del manifest
git clone https://github.com/jgomezbau/io.github.jgomezbau.iawrapper.git
cd io.github.jgomezbau.iawrapper

# Build e instalación
flatpak-builder --user --install --force-clean build-dir io.github.jgomezbau.iawrapper.yml
```

---

### 🔄 Actualizar el manifest al publicar una nueva versión

Cada vez que hagas cambios en el código y quieras distribuir una nueva versión:

**1. En el repo principal (`IAWrapper`), hacer commit y push:**
```bash
git add .
git commit -m "Nueva versión X.Y.Z"
git push
git rev-parse HEAD   # copiar el hash resultante
```

**2. Regenerar las fuentes de npm si cambiaron las dependencias:**
```bash
flatpak-node-generator npm package-lock.json -o flatpak/generated-sources.json
```

**3. En el repo del manifest (`io.github.jgomezbau.iawrapper`), actualizar el commit hash:**

Editar `io.github.jgomezbau.iawrapper.yml` y reemplazar el valor de `commit:` con el nuevo hash:
```yaml
sources:
  - type: git
    url: https://github.com/jgomezbau/IAWrapper.git
    commit: <nuevo_hash_aqui>
```

Si cambió la versión de Electron, obtener el nuevo SHA256:
```bash
curl -Ls https://github.com/electron/electron/releases/download/vX.Y.Z/SHASUMS256.txt | grep "linux-x64.zip"
```

Y actualizar en el yml:
```yaml
  - type: archive
    url: https://github.com/electron/electron/releases/download/vX.Y.Z/electron-vX.Y.Z-linux-x64.zip
    sha256: <nuevo_sha256>
    dest: electron-dist
    strip-components: 0
```

**4. Copiar el `generated-sources.json` actualizado y hacer push:**
```bash
cp ~/Desarrollos/IAWrapper/flatpak/generated-sources.json .
git add .
git commit -m "Update to vX.Y.Z"
git push
```

---

### 🗑️ Desinstalar el Flatpak

```bash
flatpak uninstall io.github.jgomezbau.iawrapper
```

---

## 🧠 Arquitectura general

IAWrapper está diseñado como un **único proyecto base**, parametrizable al iniciar.

La idea central es:
- **un solo código fuente**
- **un solo `main.js` base**
- **un solo sistema de build**
- **un solo conjunto de optimizaciones**
- **múltiples proveedores configurables por parámetro**

Cada proveedor puede definir su propia:
- URL base
- lista de dominios permitidos
- icono
- nombre visible
- título de ventana
- carpeta de datos
- sesión persistente
- reglas de navegación

---

## 🧩 Proveedores soportados

- `chatgpt`
- `claude`
- `grok`
- `deepseek`
- `qwen`

---

## ▶️ Uso básico

```bash
# En desarrollo
npm start -- --app=chatgpt
npm start -- --app=claude

# Con DevTools
npm run dev:chatgpt -- --devtools
```

---

## 🖥️ Accesos directos `.desktop`

La forma recomendada de usar IAWrapper en Linux es crear **varios `.desktop`**, todos apuntando al mismo ejecutable con distinto parámetro `--app=`.

Para que los accesos directos pineados en la barra de tareas respondan correctamente, el `StartupWMClass` debe coincidir con `iawrapper-<proveedor>`.

```ini
[Desktop Entry]
Name=ChatGPT
Exec=/opt/iawrapper/iawrapper --app=chatgpt
Icon=/opt/iawrapper/icons/chatgpt.png
Type=Application
Categories=Network;
StartupWMClass=iawrapper-chatgpt
```

En la instalación Flatpak, los `.desktop` se instalan automáticamente al hacer el build.

---

## ⚡ Parámetros de rendimiento

Estos parámetros estaban disponibles como variables de entorno en versiones anteriores. En la versión actual están integrados directamente en `main.js` y se aplican automáticamente.

| Variable (legacy)     | Comportamiento actual                          |
|-----------------------|------------------------------------------------|
| `RENDERER_THREADS`    | Calculado automáticamente según CPUs del sistema |
| `FORCE_WAYLAND`       | Activado via `ELECTRON_OZONE_PLATFORM_HINT=auto` |
| `DISABLE_BG_THR`      | Siempre activo                                 |
| `INCREASE_HEAP_MB`    | 4096 MB por defecto                            |
| `DISABLE_HW_ACCEL`    | Disponible via `DISABLE_HW_ACCEL=1`            |
| `DISABLE_QUIC`        | Disponible via `DISABLE_QUIC=1`                |
| `FORCE_DEVTOOLS`      | Disponible via `--devtools`                    |

---

## 🖱️ Menú contextual

- Cortar / Copiar / Pegar / Seleccionar todo
- Recargar
- Imprimir
- Inspeccionar

## ⌨️ Atajos de teclado

- **Ctrl+R**: recargar
- **Ctrl+Shift+D**: abrir DevTools
- **Ctrl+Q**: salir

---

## 🧱 Estructura del proyecto

```text
iawrapper/
├── flatpak/
│   ├── io.github.jgomezbau.iawrapper.yml          ← manifest local
│   ├── io.github.jgomezbau.iawrapper.desktop
│   ├── io.github.jgomezbau.iawrapper.chatgpt.desktop
│   ├── io.github.jgomezbau.iawrapper.claude.desktop
│   ├── io.github.jgomezbau.iawrapper.grok.desktop
│   ├── io.github.jgomezbau.iawrapper.deepseek.desktop
│   ├── io.github.jgomezbau.iawrapper.qwen.desktop
│   ├── io.github.jgomezbau.iawrapper.metainfo.xml
│   ├── io.github.jgomezbau.iawrapper.png
│   └── generated-sources.json
├── icons/
│   ├── chatgpt.png
│   ├── claude.png
│   ├── grok.png
│   ├── deepseek.png
│   ├── qwen.png
│   └── icon.png
├── src/
│   ├── preload/
│   │   ├── clipboard-fix.js
│   │   ├── inject-styles.js
│   │   ├── ipc.js
│   │   └── preload.js
│   ├── index.html
│   └── styles.css
├── main.js
├── package.json
├── README.md
└── LICENSE
```

---

## 🛠️ Desarrollo y contribución

```bash
git checkout -b feature/nueva-funcionalidad
git commit -am "Add new feature"
git push origin feature/nueva-funcionalidad
```

Luego abrí un Pull Request.

---

## 📄 Licencia

MIT — ver archivo `LICENSE`.

---

## ❤️ Autor

Desarrollado por **Juan Bau**  
Contacto: **jgomezbau@gmail.com**
