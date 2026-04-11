# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows semantic versioning.

## [Unreleased]

### Added

- Added Gemini as a supported provider across runtime configuration, Linux launchers, and packaging metadata.
- Added a floating provider selector when IAWrapper is launched without `--app`.
- Added provider-specific Debian desktop entries and install/remove scripts for Linux packages.

### Changed

- Reorganized the source tree to separate main-process code from preload code.
- Standardized Linux icon assets and packaging references under `assets/icons`.
- Cleaned up package metadata, Linux build configuration, and release documentation.
- Kept generic IAWrapper branding for taskbar and tray when the app starts without an explicit provider.
- Improved Linux tray icon handling by generating a tray-sized icon from the configured PNG asset.
- Adjusted Gemini navigation handling so Google consent and related internal pages stay inside the embedded app flow.

## [2.0.0] - 2026-04-11

### Added

- Initial public release baseline for the Electron/Linux desktop wrapper.
- Provider support for ChatGPT, Claude, Grok, DeepSeek, and Qwen.
- Linux packaging targets for AppImage, Debian packages, and Flatpak metadata.
