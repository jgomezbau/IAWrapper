# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows semantic versioning.

## [Unreleased]

### Added

- Added Gemini as a supported assistant across runtime configuration, Linux launchers, and Flatpak metadata.
- Added a generic IAWrapper launch mode for starts without `--app=<assistant>`.
- Added an initial chooser window labeled `Elegi un Asistente` for first use in generic mode.
- Added persistence for the last assistant selected in generic mode.
- Added assistant switching from the tray menu in generic mode.
- Added assistant-specific Debian desktop entries and Debian install/remove scripts.

### Changed

- Reorganized the source tree to keep main-process, preload, assets, and packaging concerns cleaner and easier to maintain.
- Standardized Linux icon assets under `assets/icons` and clarified the split between packaging icons and runtime assistant icons.
- Kept IAWrapper branding for taskbar, tray, and window identity when the app is launched without an explicit assistant.
- Preserved assistant-specific launch behavior when the app is started with `--app=<assistant>`.
- Improved Gemini navigation handling so Google consent and related internal pages stay inside the embedded app flow.
- Updated packaging metadata, release documentation, and Linux release structure for public distribution.

### Removed

- Removed the old injected in-page assistant switcher approach in favor of a tray-based assistant menu.
- Removed legacy Linux-unused icon formats from the repository release flow.

## [2.0.0] - 2026-04-11

### Added

- Initial public release baseline for the Linux-first Electron desktop wrapper.
- Support for ChatGPT, Claude, Grok, DeepSeek, and Qwen.
- Linux packaging targets for AppImage, Debian packages, and `tar.gz`.
- Flatpak metadata and launcher files in the repository.
