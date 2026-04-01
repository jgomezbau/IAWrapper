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
git clone https://github.com/jgomezbau/iawrapper.git
cd iawrapper
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

### Scripts sugeridos en `package.json`

```json
{
  "scripts": {
    "start": "electron .",
    "dev": "electron . --enable-logging",
    "debug": "electron --inspect=5858 .",
    "build": "electron-builder",
    "build:linux": "electron-builder --linux",
    "build:appimage": "electron-builder --linux AppImage",
    "build:deb": "electron-builder --linux deb",
    "postinstall": "electron-builder install-app-deps"
  }
}
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

La nueva versión del proyecto está pensada para ejecutar al menos estos proveedores:

- `chatgpt`
- `claude`
- `grok`
- `deepseek`
- `qwen`

Ejemplo conceptual de configuración interna:

```js
const APPS = {
  chatgpt: {
    name: "ChatGPT",
    url: "https://chatgpt.com",
    icon: "icons/chatgpt.png"
  },
  claude: {
    name: "Claude",
    url: "https://claude.ai",
    icon: "icons/claude.png"
  },
  grok: {
    name: "Grok",
    url: "https://grok.com",
    icon: "icons/grok.png"
  },
  deepseek: {
    name: "DeepSeek",
    url: "https://chat.deepseek.com",
    icon: "icons/deepseek.png"
  },
  qwen: {
    name: "Qwen",
    url: "https://chat.qwen.ai",
    icon: "icons/qwen.png"
  }
};
```

---

## ▶️ Uso básico

### Ejecutar con proveedor específico

Esta versión permite iniciar la aplicación indicando qué IA querés abrir.

```bash
./iawrapper --app=chatgpt
./iawrapper --app=claude
./iawrapper --app=grok
./iawrapper --app=deepseek
./iawrapper --app=qwen
```

### En desarrollo

```bash
npm start -- --app=chatgpt
npm start -- --app=claude
npm start -- --app=grok
npm start -- --app=deepseek
npm start -- --app=qwen
```

> `--app=` define el proveedor que la aplicación debe cargar al iniciar.

---

## 🧭 Parámetros de línea de comandos

### `--app=<proveedor>`

Selecciona qué proveedor de IA debe abrirse.

#### Valores esperados

- `chatgpt`
- `claude`
- `grok`
- `deepseek`
- `qwen`

#### Ejemplos

```bash
./iawrapper --app=chatgpt
./iawrapper --app=claude
./iawrapper --app=grok
```

#### Qué hace

- cambia la URL base
- cambia el título de la ventana
- cambia el icono usado por la aplicación
- cambia la identidad visual del tray
- cambia los dominios permitidos para login y navegación
- permite usar perfiles separados por proveedor

---

## 🗂️ Aislamiento de sesiones y datos

Una de las metas principales de IAWrapper es que cada proveedor tenga su propio entorno aislado.

Esto evita mezclar entre distintas plataformas:

- cookies
- localStorage
- IndexedDB
- Service Workers
- caché HTTP
- GPUCache
- Code Cache
- sesiones de login
- preferencias persistentes

### Recomendación de implementación

Cada proveedor debe tener:

- su propio `userData`
- su propia `partition`
- su propio lock lógico
- su propio icono
- su propio acceso directo

### Ejemplo conceptual

```bash
~/.config/iawrappers/chatgpt
~/.config/iawrappers/claude
~/.config/iawrappers/grok
~/.config/iawrappers/deepseek
~/.config/iawrappers/qwen
```

---

## 🖥️ Accesos directos `.desktop`

La forma recomendada de usar IAWrapper en Linux es crear **varios `.desktop`**, todos apuntando al mismo ejecutable, pero con distinto parámetro `--app=`, para que los accesos directos pineados en la barra de tarea respondan correctamente, se debera agregar "iawrapper" tango en el nombre del archivo como en la clase.

### Ejemplo: iawrapper-chatgpt.desktop

```ini
[Desktop Entry]
Name=ChatGPT
Exec=/opt/iawrapper/iawrapper --app=chatgpt
Icon=/opt/iawrapper/icons/chatgpt.png
Type=Application
Categories=Network;
StartupWMClass=iawrapper-chatgpt
```

### Ejemplo: iawrapper-claude.desktop

```ini
[Desktop Entry]
Name=Claude
Exec=/opt/iawrapper/iawrapper --app=claude
Icon=/opt/iawrapper/icons/claude.png
Type=Application
Categories=Network;
StartupWMClass=iawrapper-claude
```

### Ejemplo: iawrapper-grok.desktop

```ini
[Desktop Entry]
Name=Grok
Exec=/opt/iawrapper/iawrapper --app=grok
Icon=/opt/iawrapper/icons/grok.png
Type=Application
Categories=Network;
StartupWMClass=iawrapper-grok
```

---

## ⚡ Parámetros de rendimiento y depuración

Además del proveedor, IAWrapper permite modificar el comportamiento interno del motor Electron usando variables de entorno.

Estas opciones deben definirse **antes de ejecutar la aplicación**.

---

## 1. Desactivar aceleración por hardware

### Variable

```bash
DISABLE_HW_ACCEL=1
```

### Ejemplo

```bash
DISABLE_HW_ACCEL=1 ./iawrapper --app=chatgpt
```

### Qué hace

Desactiva la aceleración por hardware de Electron y Chromium.

### Cuándo usarlo

- si hay glitches visuales
- si el driver gráfico da problemas
- si hay incompatibilidades con ciertas GPUs o máquinas virtuales
- si querés comparar comportamiento CPU vs GPU

### Consideraciones

No siempre mejora el rendimiento. En muchas aplicaciones web modernas puede empeorar:

- fluidez de scroll
- composición visual
- renderizado
- uso de CPU

Usarlo solo para pruebas o cuando haya un problema gráfico real.

---

## 2. Forzar Wayland

### Variable

```bash
FORCE_WAYLAND=1
```

### Ejemplo

```bash
FORCE_WAYLAND=1 ./iawrapper --app=claude
```

### Qué hace

Fuerza el uso de la plataforma **Wayland** mediante flags de Chromium.

### Cuándo usarlo

- en escritorios Linux que corren Wayland nativamente
- si querés mejorar integración visual en GNOME o KDE sobre Wayland
- si querés evitar ciertos comportamientos de XWayland

### Consideraciones

Puede mejorar integración y renderizado en algunos entornos, pero conviene probar según compositor, drivers y sesión gráfica.

---

## 3. Desactivar QUIC

### Variable

```bash
DISABLE_QUIC=1
```

### Ejemplo

```bash
DISABLE_QUIC=1 ./iawrapper --app=grok
```

### Qué hace

Deshabilita el protocolo QUIC en Chromium.

### Cuándo usarlo

- si tu red tiene problemas con QUIC
- si hay cortes extraños de conexión
- si querés comparar comportamiento con tráfico HTTP tradicional
- si estás detrás de ciertos proxies, firewalls o inspección HTTPS

### Consideraciones

Puede ayudar en redes corporativas, conexiones inestables o entornos donde QUIC provoca fallas.

---

## 4. Aumentar heap de V8

### Variable

```bash
INCREASE_HEAP_MB=<megabytes>
```

### Ejemplo

```bash
INCREASE_HEAP_MB=4096 ./iawrapper --app=chatgpt
INCREASE_HEAP_MB=6144 ./iawrapper --app=claude
```

### Qué hace

Aumenta el límite de memoria heap de V8 usando `--max-old-space-size`.

### Cuándo usarlo

- si querés reducir GC agresivo
- si hay tirones por recolección de basura
- si trabajás con sesiones largas o contenido pesado
- si querés hacer pruebas con más margen de memoria

### Consideraciones

No acelera por sí mismo la aplicación, pero puede evitar pausas por GC en algunos escenarios.

---

## 5. Desactivar background throttling

### Variable

```bash
DISABLE_BG_THR=1
```

### Ejemplo

```bash
DISABLE_BG_THR=1 ./iawrapper --app=deepseek
```

### Qué hace

Desactiva varias políticas de throttling de Chromium para ventanas en segundo plano u ocultas.

### Cuándo usarlo

- si ocultás la ventana al tray
- si querés que siga trabajando sin degradación
- si notás pausas o suspensión de timers al minimizar
- si querés mantener actividad aunque la ventana no esté visible

### Consideraciones

Puede aumentar el consumo de CPU y batería, especialmente en notebooks.

---

## 6. Desactivar smooth scrolling

### Variable

```bash
DISABLE_SMOOTH_SCROLL=1
```

### Ejemplo

```bash
DISABLE_SMOOTH_SCROLL=1 ./iawrapper --app=qwen
```

### Qué hace

Desactiva el desplazamiento suave de Chromium.

### Cuándo usarlo

- si el scroll se siente pesado
- si querés una respuesta más inmediata
- si comparás fluidez o latencia visual
- si preferís un scroll más directo

### Consideraciones

Es una preferencia de comportamiento. No siempre mejora rendimiento, pero puede dar sensación de mayor respuesta.

---

## 7. Ajustar raster threads

### Variable

```bash
RENDERER_THREADS=<número>
```

### Ejemplo

```bash
RENDERER_THREADS=4 ./iawrapper --app=chatgpt
RENDERER_THREADS=8 ./iawrapper --app=claude
```

### Qué hace

Ajusta el número de hilos usados para rasterización.

### Cuándo usarlo

- para pruebas A/B
- en equipos con más núcleos
- si querés experimentar con el renderizado
- si querés encontrar un punto de equilibrio entre uso de CPU y fluidez

### Consideraciones

No existe un valor universalmente mejor. Conviene probar según tu hardware y tu sesión gráfica.

---

## 8. Ajustar renderer process limit

### Variable

```bash
METAL_THREADS=<número>
```

### Ejemplo

```bash
METAL_THREADS=2 ./iawrapper --app=grok
METAL_THREADS=4 ./iawrapper --app=deepseek
```

### Qué hace

Ajusta el límite de procesos renderer que Chromium puede usar.

### Cuándo usarlo

- si querés reducir consumo de procesos
- si querés hacer pruebas de límites internos
- si querés comparar impacto en memoria y respuesta

### Consideraciones

Un valor demasiado bajo puede perjudicar aislamiento, estabilidad y fluidez.

> Aunque el nombre de la variable sea `METAL_THREADS`, en la práctica controla `renderer-process-limit`.

---

## 9. Abrir DevTools automáticamente

### Variable

```bash
FORCE_DEVTOOLS=1
```

### Ejemplo

```bash
FORCE_DEVTOOLS=1 ./iawrapper --app=chatgpt
```

### Qué hace

Abre automáticamente las DevTools al iniciar la aplicación.

### Cuándo usarlo

- depuración de preload
- diagnóstico de red
- inspección de DOM
- pruebas de consola
- análisis de performance

---

## 🧪 Ejemplos combinados

### ChatGPT en Wayland con DevTools

```bash
FORCE_WAYLAND=1 FORCE_DEVTOOLS=1 ./iawrapper --app=chatgpt
```

### Claude sin QUIC y con más heap

```bash
DISABLE_QUIC=1 INCREASE_HEAP_MB=4096 ./iawrapper --app=claude
```

### Grok con throttling desactivado

```bash
DISABLE_BG_THR=1 ./iawrapper --app=grok
```

### DeepSeek sin aceleración por hardware

```bash
DISABLE_HW_ACCEL=1 ./iawrapper --app=deepseek
```

### Qwen con raster threads y límite de renderer

```bash
RENDERER_THREADS=4 METAL_THREADS=3 ./iawrapper --app=qwen
```

### ChatGPT con varios parámetros combinados

```bash
DISABLE_QUIC=1 DISABLE_SMOOTH_SCROLL=1 INCREASE_HEAP_MB=4096 FORCE_DEVTOOLS=1 ./iawrapper --app=chatgpt
```

---

## 🖱️ Menú contextual

La aplicación incorpora menú contextual con clic derecho dentro de la ventana.

### Acciones disponibles

- Cortar
- Copiar
- Pegar
- Seleccionar todo
- Recargar
- Imprimir
- Inspeccionar

---

## ⌨️ Atajos de teclado

- **Ctrl+R**: recargar la aplicación
- **Ctrl+Shift+I**: abrir DevTools
- **Ctrl+Q**: salir de la aplicación

---

## 🔐 Seguridad y navegación

IAWrapper restringe la navegación según el proveedor configurado.

### Objetivos

- evitar navegar libremente fuera de la app base
- controlar redirecciones de login
- abrir enlaces externos en el navegador del sistema
- encapsular los flujos de autenticación

### Comportamiento esperado

- las URLs del proveedor se abren dentro del wrapper
- los dominios permitidos para login pueden abrirse en ventanas controladas
- los enlaces externos ajenos al proveedor se abren con `shell.openExternal`

---

## 🎙️ Permisos

La aplicación puede solicitar permisos para:

- micrófono
- cámara
- lectura segura del portapapeles
- escritura saneada del portapapeles

Estos permisos deben limitarse a los estrictamente necesarios para el uso de cada plataforma.

---

## 🧱 Estructura sugerida del proyecto

```text
iawrapper/
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

## 🧪 Solución de problemas

### La aplicación no abre el proveedor correcto

Verificá que estés lanzando correctamente:

```bash
./iawrapper --app=chatgpt
```

Si `--app=` no coincide con un proveedor soportado, la aplicación debe usar uno por defecto o rechazar el valor.

### Se mezclan sesiones entre proveedores

Asegurate de usar:

- `userData` separado por proveedor
- `partition` separada por proveedor

No conviene compartir almacenamiento entre ChatGPT, Claude, Grok, DeepSeek y Qwen.

### No puedo abrir varias apps al mismo tiempo

Si el proyecto usa un lock global de Electron, el binario solo permitirá una instancia total.

Para el diseño correcto de IAWrapper se recomienda:

- **una instancia por proveedor**
- no una sola instancia global del binario

Ejemplo esperado:

- permitir `chatgpt`, `grok` y `claude` al mismo tiempo
- evitar dos `chatgpt` simultáneos si así se decide

### Problemas gráficos

Probá:

```bash
DISABLE_HW_ACCEL=1 ./iawrapper --app=chatgpt
```

o:

```bash
FORCE_WAYLAND=1 ./iawrapper --app=chatgpt
```

### Problemas de red

Probá:

```bash
DISABLE_QUIC=1 ./iawrapper --app=chatgpt
```

### La app consume más recursos de lo esperado

Revisá si estás usando:

- `DISABLE_BG_THR=1`
- `FORCE_DEVTOOLS=1`
- un heap muy alto
- demasiados renderer threads

---

## 🔄 Actualización

Para actualizar a una nueva versión:

1. descargá la nueva release
2. reemplazá la versión anterior
3. mantené tus perfiles por proveedor si querés conservar sesiones

Si la estructura de datos cambia entre versiones, se recomienda hacer backup de:

```bash
~/.config/iawrappers/
```

---

## 🛠️ Desarrollo y contribución

Si querés contribuir al proyecto:

1. hacé un fork del repositorio
2. creá una nueva rama
3. implementá los cambios
4. hacé commit
5. subí tu rama
6. abrí un Pull Request

### Flujo sugerido

```bash
git checkout -b feature/nueva-funcionalidad
git commit -am "Add new feature"
git push origin feature/nueva-funcionalidad
```

---

## 📝 Recomendaciones de diseño

- mantener una única base de código
- no duplicar wrappers por proveedor
- aislar almacenamiento por IA
- usar un `.desktop` por proveedor
- mantener iconos separados
- centralizar flags de rendimiento
- evitar compartir `userData`
- evitar compartir `partition`
- evitar `requestSingleInstanceLock()` global si querés varias IAs al mismo tiempo

---

## 📄 Licencia

Este proyecto puede distribuirse bajo licencia **MIT**, salvo que se indique otra licencia en el repositorio.

Ver el archivo `LICENSE` para más detalles.

---

## ❤️ Autor

Desarrollado por **Juan Bau**  
Contacto: **jgomezbau@gmail.com**
