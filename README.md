# Layout Switcher

A GNOME Shell extension that exposes a small D-Bus API for switching keyboard
layouts (input sources) from scripts, custom keyboard shortcuts, or other
applications.

GNOME does not provide a supported way to select a specific input source from the
command line. This extension fills that gap: you can switch to an exact layout
instead of cycling through them.

## Features

- Switch to a specific input source by its ID
- Query the currently active input source
- List all configured input sources
- Works with XKB layouts (`us`, `ua`, `us+dvorak`, …) and IBus engines

## Requirements

- GNOME Shell 50 or 51

## Quick Installation

Run the following command in your terminal to download and install the latest release:

```bash
curl -fsSL https://raw.githubusercontent.com/TSV-Technologies/layout_switcher_gnome_extension/main/install.sh | bash
```

Note: On Wayland, log out and log back in after installation so GNOME Shell can load the extension.

## Installation

1. Copy the extension directory to your local extensions folder. The directory
   name must match the UUID:

   ```sh
   cp -r layout-switcher@tsv-tech ~/.local/share/gnome-shell/extensions/
   ```

2. Restart GNOME Shell:
   - **Wayland:** log out and log back in.
   - **X11:** press <kbd>Alt</kbd>+<kbd>F2</kbd>, type `r`, and press <kbd>Enter</kbd>.

3. Enable the extension:

   ```sh
   gnome-extensions enable layout-switcher@tsv-tech
   ```

4. Check that it is running:

   ```sh
   gnome-extensions info layout-switcher@tsv-tech
   ```

## D-Bus API

| Property    | Value                         |
|-------------|-------------------------------|
| Bus         | Session                       |
| Bus name    | `com.tsv.LayoutSwitcher`   |
| Object path | `/com/tsv/LayoutSwitcher`  |
| Interface   | `com.tsv.LayoutSwitcher`   |

### Methods

| Method                     | Arguments      | Returns         | Description                                                        |
|----------------------------|----------------|-----------------|--------------------------------------------------------------------|
| `ListLayouts()`            | —              | `as` (string[]) | IDs of all configured input sources, in the order set in Settings. |
| `GetCurrentLayout()`       | —              | `s` (string)    | ID of the active input source, or an empty string if there is none. |
| `SetLayout(layout)`        | `s` (string)   | `b` (boolean)   | Activates the input source with exactly this ID. Returns `false` if no source matches. |

> **Note:** `SetLayout` matches the ID **exactly**. Run `ListLayouts` first to see
> the IDs available on your system: `us+dvorak` is not the same as `us`.

## Usage examples

### gdbus

List the configured layouts:

```sh
gdbus call --session \
  --dest com.tsv.LayoutSwitcher \
  --object-path /com/tsv/LayoutSwitcher \
  --method com.tsv.LayoutSwitcher.ListLayouts
```

```
(['us', 'ua', 'us+dvorak'],)
```

Get the current layout:

```sh
gdbus call --session \
  --dest com.tsv.LayoutSwitcher \
  --object-path /com/tsv/LayoutSwitcher \
  --method com.tsv.LayoutSwitcher.GetCurrentLayout
```

```
('us',)
```

Switch to the Ukrainian layout:

```sh
gdbus call --session \
  --dest com.tsv.LayoutSwitcher \
  --object-path /com/tsv/LayoutSwitcher \
  --method com.tsv.LayoutSwitcher.SetLayout "ua"
```

```
(true,)
```

### busctl

`busctl` prints results in a format that is easier to parse:

```sh
busctl --user call com.tsv.LayoutSwitcher /com/tsv/LayoutSwitcher \
  com.tsv.LayoutSwitcher SetLayout s "us"
```

```
b true
```

```sh
busctl --user call com.tsv.LayoutSwitcher /com/tsv/LayoutSwitcher \
  com.tsv.LayoutSwitcher GetCurrentLayout
```

```
s "us"
```

### dbus-send

```sh
dbus-send --session --print-reply \
  --dest=com.tsv.LayoutSwitcher \
  /com/tsv/LayoutSwitcher \
  com.tsv.LayoutSwitcher.SetLayout string:"ua"
```

### Shell script: toggle between two layouts

```sh
#!/bin/sh
# toggle-layout.sh — switch between two layouts

FIRST="us"
SECOND="ua"

call() {
    busctl --user call com.tsv.LayoutSwitcher /com/tsv/LayoutSwitcher \
        com.tsv.LayoutSwitcher "$@"
}

current=$(call GetCurrentLayout | cut -d'"' -f2)

if [ "$current" = "$FIRST" ]; then
    call SetLayout s "$SECOND" > /dev/null
else
    call SetLayout s "$FIRST" > /dev/null
fi
```

### Custom keyboard shortcuts

Bind a key combination to a specific layout in
**Settings → Keyboard → View and Customize Shortcuts → Custom Shortcuts**:

| Name             | Command                                                                                                         | Shortcut                       |
|------------------|-----------------------------------------------------------------------------------------------------------------|--------------------------------|
| English layout   | `busctl --user call com.tsv.LayoutSwitcher /com/tsv/LayoutSwitcher com.tsv.LayoutSwitcher SetLayout s us` | <kbd>Super</kbd>+<kbd>1</kbd> |
| Ukrainian layout | `busctl --user call com.tsv.LayoutSwitcher /com/tsv/LayoutSwitcher com.tsv.LayoutSwitcher SetLayout s ua` | <kbd>Super</kbd>+<kbd>2</kbd> |

### Python

```python
from gi.repository import Gio, GLib

proxy = Gio.DBusProxy.new_for_bus_sync(
    Gio.BusType.SESSION,
    Gio.DBusProxyFlags.NONE,
    None,
    "com.tsv.LayoutSwitcher",
    "/com/tsv/LayoutSwitcher",
    "com.tsv.LayoutSwitcher",
    None,
)

print(proxy.call_sync("ListLayouts", None, Gio.DBusCallFlags.NONE, -1, None).unpack()[0])

ok = proxy.call_sync(
    "SetLayout", GLib.Variant("(s)", ("ua",)), Gio.DBusCallFlags.NONE, -1, None
).unpack()[0]
print("Switched" if ok else "Layout not found")
```

## Troubleshooting

**`The name com.tsv.LayoutSwitcher was not provided by any .service files`**
The extension is not running. Check `gnome-extensions info layout-switcher@tsv-tech`
and make sure its state is `ACTIVE`.

**`SetLayout` returns `false`**
No configured input source has that exact ID. Run `ListLayouts` and use one of the
returned values. To add a layout, go to **Settings → Keyboard → Input Sources**.

**Viewing errors**

```sh
journalctl -f -o cat /usr/bin/gnome-shell
```

## Project structure

```
layout-switcher@tsv-tech/
├── extension.js              # Entry point: enable() / disable()
├── layoutSwitcherService.js  # D-Bus service and input source logic
└── metadata.json
```

## Security note

The API is available on the **session** bus, so any process running as your user
can switch layouts. It cannot read keystrokes or change any other settings.
