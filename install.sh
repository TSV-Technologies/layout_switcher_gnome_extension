#!/usr/bin/env bash
set -euo pipefail

REPO="TSV-Technologies/layout_switcher_gnome_extension"
UUID="layout_indicator@tsv-tech"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Fetching latest release info ($REPO)..."
ZIP_URL=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" \
  | grep -oE '"browser_download_url": *"[^"]+\.zip"' \
  | head -n 1 \
  | cut -d '"' -f 4)

if [[ -z "$ZIP_URL" ]]; then
  echo "Error: No .zip archive found in the latest release." >&2
  exit 1
fi

echo "Downloading archive..."
curl -fsSL "$ZIP_URL" -o "$TMP_DIR/extension.zip"

echo "Installing extension $UUID..."
gnome-extensions install --force "$TMP_DIR/extension.zip"

# Try to enable the extension (on Wayland, this works only if the session already knows about it)
if gnome-extensions info "$UUID" &>/dev/null; then
  gnome-extensions enable "$UUID" || true
  echo "Extension installed and enabled."
else
  echo ""
  echo "Extension installed, but GNOME Shell on Wayland will only load it after you log out and back in."
  read -r -p "Log out of the current session now? [y/N]: " REPLY </dev/tty
  if [[ "$REPLY" =~ ^[Yy]$ ]]; then
    gnome-session-quit --logout --no-prompt
  else
    echo "Please log out manually and enable the extension after logging back in:"
    echo "  gnome-extensions enable $UUID"
  fi
fi