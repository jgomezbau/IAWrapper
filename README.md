# IAWrapper

IAWrapper is a Linux-first Electron desktop wrapper for popular AI assistants. It turns supported web apps into standalone desktop launchers with isolated sessions, Linux packaging, and a generic IAWrapper mode for people who want to choose an assistant at runtime.

Supported assistants:

- ChatGPT
- Claude
- Gemini
- Grok
- DeepSeek
- Qwen

## Features

- Standalone Linux desktop wrapper for multiple AI assistants
- Isolated Electron session data per assistant
- Direct launch support through `--app=<assistant>`
- Generic `iawrapper` launcher mode when started without `--app`
- First-run assistant chooser window in generic mode
- Remembers the last assistant used in generic mode
- Assistant switching from the system tray in generic mode
- Generic IAWrapper branding for taskbar, tray, and window icon in generic mode
- Assistant-specific launchers, icons, and runtime identity when launched directly
- Linux packaging for `AppImage`, `.deb`, and `tar.gz`
- Flatpak metadata and desktop entries included in the repository

## Screenshots

Screenshots for the Flatpak/AppStream metadata live in [`flatpak/screenshots`](flatpak/screenshots).

## Requirements

- Linux
- Node.js 18 or newer
- npm 8 or newer

Runtime and packaging on Debian-based systems may require:

- `libnotify4`
- `libxtst6`
- `libnss3`

## Installation

```bash
git clone https://github.com/jgomezbau/IAWrapper.git
cd IAWrapper
npm install
```

## Usage

Start IAWrapper in generic mode:

```bash
npm start
```

Generic mode behavior:

- On first launch, or when no last assistant is stored, IAWrapper opens a chooser window labeled `Elegi un Asistente`.
- After an assistant is selected, IAWrapper remembers it and opens that assistant directly on future launches without `--app`.
- In generic mode, the taskbar icon, tray icon, and main application identity remain `IAWrapper`.
- The active assistant can be changed from the tray menu through `Elegi un Asistente`.

Start a specific assistant directly:

```bash
npm run start:chatgpt
npm run start:claude
npm run start:gemini
npm run start:grok
npm run start:deepseek
npm run start:qwen
```

You can also launch directly with:

```bash
electron . --app=chatgpt
```

Direct-launch mode behavior:

- Opens the requested assistant immediately
- Does not show the generic chooser flow
- Does not show the assistant-switching tray submenu
- Uses the selected assistant identity and icon as the runtime branding

## Development

Useful commands:

```bash
npm run dev
npm run debug
node -c src/main/index.js
node -c src/preload/preload.js
```

## Build And Packaging

Available build commands:

```bash
npm run build
npm run build:linux
npm run build:dir
npm run build:appimage
npm run build:deb
```

Release artifacts are written to `dist/` and typically include:

- `IAWrapper-<version>-x86_64.AppImage`
- `IAWrapper-<version>-amd64.deb`
- `IAWrapper-<version>-x64.tar.gz`

Packaging notes:

- `electron-builder` is configured for Linux packaging.
- The main packaging icon is [`assets/icons/iawrapper.png`](assets/icons/iawrapper.png).
- Runtime and launcher assistant icons live in [`assets/icons/providers`](assets/icons/providers).
- The Debian package installs the main `iawrapper.desktop` entry plus assistant-specific `.desktop` launchers.
- Flatpak metadata and desktop entries are maintained in [`flatpak/`](flatpak/).

## Flatpak

Local Flatpak build:

```bash
flatpak-builder --user --install --force-clean build-dir flatpak/io.github.jgomezbau.iawrapper.yml
```

Run a specific assistant after installation:

```bash
flatpak run io.github.jgomezbau.iawrapper --app=chatgpt
flatpak run io.github.jgomezbau.iawrapper --app=claude
flatpak run io.github.jgomezbau.iawrapper --app=gemini
flatpak run io.github.jgomezbau.iawrapper --app=grok
flatpak run io.github.jgomezbau.iawrapper --app=deepseek
flatpak run io.github.jgomezbau.iawrapper --app=qwen
```

## Project Structure

```text
.
├── assets/
│   ├── icons/
│   │   ├── iawrapper.png
│   │   ├── providers/
│   │   └── source/
│   └── linux/
├── flatpak/
├── src/
│   ├── main/
│   └── preload/
├── CHANGELOG.md
├── LICENSE
├── README.md
├── package.json
└── package-lock.json
```

## Icons And Assets

- `assets/icons/iawrapper.png` is the canonical packaging icon.
- `assets/icons/providers/*.png` are the assistant runtime icons and launcher assets.
- `assets/icons/providers/iawrapper.png` is the generic runtime icon used by IAWrapper mode.
- Legacy `.ico` assets are not part of the current Linux release pipeline.

## Session Model

Each assistant uses its own Electron partition and user-data directory. This keeps cookies, storage, and login state isolated between ChatGPT, Claude, Gemini, Grok, DeepSeek, and Qwen.

In generic mode, IAWrapper also stores a small separate configuration file for the last assistant used:

- `~/.config/IAWrappers/config.json`

That file is only used to remember the last assistant selected in generic mode. It does not replace or mix with the per-assistant session data.

## Troubleshooting

- If `npm start` opens the chooser window, no valid last assistant is stored yet for generic mode.
- If you want to bypass the chooser entirely, start the app with `--app=<assistant>` or use `npm run start:<assistant>`.
- If Gemini shows a Google consent flow, complete it inside the embedded window. IAWrapper keeps the relevant Gemini and Google navigation inside the app flow.
- If `.deb` packaging fails, verify the host has the system tooling required by `electron-builder`.
- If AppImage creation fails on a minimal system, install the usual Linux desktop packaging dependencies first.

## License

This project is released under the [MIT License](LICENSE).

## Disclaimer

IAWrapper is an independent and unofficial desktop wrapper project.

It is not affiliated with, endorsed by, sponsored by, or supported by the companies behind the supported assistants, including:

- OpenAI
- Anthropic
- Google
- xAI
- DeepSeek
- Alibaba

`ChatGPT`, `Claude`, `Gemini`, `Grok`, `DeepSeek`, `Qwen`, and any related product names, logos, icons, and trademarks are the property of their respective owners.

This repository is intended to provide a Linux desktop wrapper experience for publicly available web applications. Users are responsible for complying with the terms of service, account requirements, and usage policies of each respective service.
