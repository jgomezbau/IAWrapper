#!/bin/sh
set -eu

APP_DIR="/opt/IAWrapper"
DESKTOP_SRC="$APP_DIR/resources/assets/linux/desktop"
MAIN_ICON_SRC="$APP_DIR/resources/assets/icons/iawrapper.png"
ICON_SRC="$APP_DIR/resources/assets/icons/providers"
DESKTOP_DST="/usr/share/applications"
ICON_DST="/usr/share/icons/hicolor/512x512/apps"

install -Dm644 "$MAIN_ICON_SRC" "$ICON_DST/iawrapper.png"

for provider in chatgpt claude gemini grok deepseek qwen; do
  install -Dm644 "$DESKTOP_SRC/iawrapper-$provider.desktop" "$DESKTOP_DST/iawrapper-$provider.desktop"
  install -Dm644 "$ICON_SRC/$provider.png" "$ICON_DST/iawrapper-$provider.png"
done

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$DESKTOP_DST" || true
fi

if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -q /usr/share/icons/hicolor || true
fi
