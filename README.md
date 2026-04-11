# IAWrapper

IAWrapper is a Linux-first Electron desktop wrapper for web-based AI assistants. It turns supported services into standalone desktop applications with isolated sessions, provider-specific launchers, and native Linux packaging.

The current release targets:

- ChatGPT
- Claude
- Gemini
- Grok
- DeepSeek
- Qwen

IAWrapper is an independent and unofficial wrapper. It is not affiliated with, endorsed by, or supported by OpenAI, Anthropic, xAI, DeepSeek, Alibaba, or any other service provider. All product names, logos, and trademarks belong to their respective owners.

## Features

- Single codebase with provider selection through `--app=<provider>`
- Generic IAWrapper launcher with a floating provider selector when started without parameters
- Isolated Electron session data per provider
- Generic IAWrapper branding for taskbar and tray when launched without a provider parameter
- Provider-specific icons, tray labels, and desktop launchers when launched directly with a provider
- Context menu and clipboard helpers for web chat interfaces
- Support for Linux desktop packaging with `AppImage`, `.deb`, and `tar.gz`
- Flatpak metadata and launcher files included in the repository
- Main/preload separation with a maintainable project layout

## Screenshots

Screenshots for supported providers live in [`flatpak/screenshots`](flatpak/screenshots).

## Requirements

- Linux
- Node.js 18 or newer
- npm 8 or newer

For Debian-based packaging and runtime usage, these libraries are expected:

- `libnotify4`
- `libxtst6`
- `libnss3`

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/jgomezbau/IAWrapper.git
cd IAWrapper
npm install
```

## Development

Run the generic IAWrapper launcher:

```bash
npm start
```

This opens a floating selector window so the user can choose one of the configured providers while keeping the generic IAWrapper branding.

Run a specific provider:

```bash
npm run start:chatgpt
npm run start:claude
npm run start:gemini
npm run start:grok
npm run start:deepseek
npm run start:qwen
```

The application also accepts direct provider arguments such as `--app=chatgpt`.

Useful development commands:

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

Expected release artifacts are written to `dist/` and include:

- `IAWrapper-<version>-<arch>.AppImage`
- `IAWrapper-<version>-<arch>.deb`
- `IAWrapper-<version>-<arch>.tar.gz`

Notes:

- `electron-builder` is configured for Linux packaging only.
- The canonical application icon for Linux packaging is [`assets/icons/iawrapper.png`](assets/icons/iawrapper.png).
- Provider PNG icons used by the app and Flatpak launchers live in [`assets/icons/providers`](assets/icons/providers).
- The Debian package installs the main launcher plus provider-specific `.desktop` entries for ChatGPT, Claude, Gemini, Grok, DeepSeek, and Qwen.
- Launching `iawrapper` without `--app` uses the generic IAWrapper identity, icon, tray entry, and model selector window.
- Launching with `--app=<provider>` opens that provider directly and uses its dedicated runtime identity.

## Flatpak

The repository also includes Flatpak metadata in [`flatpak/`](flatpak/).

Local Flatpak build:

```bash
flatpak-builder --user --install --force-clean build-dir flatpak/io.github.jgomezbau.iawrapper.yml
```

Run a specific provider after installation:

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
│   └── icons/
│       ├── iawrapper.png
│       ├── providers/
│       └── source/
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

The repository now keeps one canonical Linux asset set:

- `assets/icons/iawrapper.png` is the main application icon used by Electron Builder and Flatpak.
- `assets/icons/providers/*.png` are the runtime and launcher icons for each supported provider.
- `assets/icons/source/` can hold editable source artwork when a vector or original asset is worth retaining.

Legacy `.ico` files are not required for the current Linux release pipeline. They are not used by `electron-builder`, the runtime icon resolution, or Flatpak metadata, so they should not be part of the release branch unless Windows packaging is introduced later.

## Troubleshooting

- If the generic launcher opens the selector instead of a provider directly, make sure you are using `npm run start:<provider>` or `--app=<provider>`.
- If a provider based on a Google flow such as Gemini shows a consent page, complete it inside the embedded window. The wrapper keeps Google consent and Gemini navigation inside the app flow.
- If packaging fails for `.deb`, verify the host has the system tooling required by `electron-builder` for Debian package creation.
- If AppImage generation fails on a minimal system, verify common desktop packaging dependencies are installed.
- If you are testing multiple providers, remember that each provider keeps its own Electron session data under the app data directory.

## License

This project is released under the [MIT License](LICENSE).
