# Layout Switcher

Расширение GNOME Shell, которое предоставляет небольшой D-Bus API для переключения
раскладок клавиатуры (источников ввода) из скриптов, пользовательских сочетаний
клавиш или других приложений.

GNOME не предоставляет поддерживаемого способа выбрать конкретный источник ввода из
командной строки. Это расширение заполняет этот пробел: вы можете переключиться на
конкретную раскладку вместо того, чтобы перебирать их по кругу.

## Возможности

- Переключение на конкретный источник ввода по его ID
- Получение текущего активного источника ввода
- Получение списка всех настроенных источников ввода
- Работает с раскладками XKB (`us`, `ua`, `us+dvorak`, …) и движками IBus

## Требования

- GNOME Shell 50 или 51

## Быстрая установка

Выполните следующую команду в терминале, чтобы скачать и установить последний релиз:

```bash
curl -fsSL https://raw.githubusercontent.com/TSV-Technologies/layout_switcher_gnome_extension/main/install.sh | bash
```

Примечание: В сессии Wayland после установки необходимо выйти из системы и войти снова, чтобы GNOME Shell подхватил расширение.

## Установка

1. Скопируйте каталог расширения в локальную папку расширений. Имя каталога
   должно совпадать с UUID:

   ```sh
   cp -r layout-switcher@tsv-tech ~/.local/share/gnome-shell/extensions/
   ```

2. Перезапустите GNOME Shell:
   - **Wayland:** выйдите из сеанса и войдите снова.
   - **X11:** нажмите <kbd>Alt</kbd>+<kbd>F2</kbd>, введите `r` и нажмите <kbd>Enter</kbd>.

3. Включите расширение:

   ```sh
   gnome-extensions enable layout-switcher@tsv-tech
   ```

4. Проверьте, что оно работает:

   ```sh
   gnome-extensions info layout-switcher@tsv-tech
   ```

## D-Bus API

| Свойство    | Значение                      |
|-------------|-------------------------------|
| Шина        | Сеансовая (session)           |
| Имя на шине | `com.tsv.LayoutSwitcher`   |
| Путь объекта | `/com/tsv/LayoutSwitcher` |
| Интерфейс   | `com.tsv.LayoutSwitcher`   |

### Методы

| Метод                      | Аргументы      | Возвращает      | Описание                                                           |
|----------------------------|----------------|-----------------|--------------------------------------------------------------------|
| `ListLayouts()`            | —              | `as` (string[]) | ID всех настроенных источников ввода в порядке, заданном в Settings. |
| `GetCurrentLayout()`       | —              | `s` (string)    | ID активного источника ввода или пустая строка, если его нет.      |
| `SetLayout(layout)`        | `s` (string)   | `b` (boolean)   | Активирует источник ввода с точно таким ID. Возвращает `false`, если ни один источник не совпал. |

> **Примечание:** `SetLayout` сравнивает ID **точно**. Сначала выполните `ListLayouts`,
> чтобы увидеть ID, доступные в вашей системе: `us+dvorak` — это не то же самое, что `us`.

## Примеры использования

### gdbus

Получить список настроенных раскладок:

```sh
gdbus call --session \
  --dest com.tsv.LayoutSwitcher \
  --object-path /com/tsv/LayoutSwitcher \
  --method com.tsv.LayoutSwitcher.ListLayouts
```

```
(['us', 'ua', 'us+dvorak'],)
```

Получить текущую раскладку:

```sh
gdbus call --session \
  --dest com.tsv.LayoutSwitcher \
  --object-path /com/tsv/LayoutSwitcher \
  --method com.tsv.LayoutSwitcher.GetCurrentLayout
```

```
('us',)
```

Переключиться на украинскую раскладку:

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

`busctl` выводит результаты в формате, который проще разбирать:

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

### Shell-скрипт: переключение между двумя раскладками

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

### Пользовательские сочетания клавиш

Назначьте сочетание клавиш на конкретную раскладку в
**Settings → Keyboard → View and Customize Shortcuts → Custom Shortcuts**:

| Название               | Команда                                                                                                         | Сочетание                      |
|------------------------|-----------------------------------------------------------------------------------------------------------------|--------------------------------|
| Английская раскладка   | `busctl --user call com.tsv.LayoutSwitcher /com/tsv/LayoutSwitcher com.tsv.LayoutSwitcher SetLayout s us` | <kbd>Super</kbd>+<kbd>1</kbd> |
| Украинская раскладка   | `busctl --user call com.tsv.LayoutSwitcher /com/tsv/LayoutSwitcher com.tsv.LayoutSwitcher SetLayout s ua` | <kbd>Super</kbd>+<kbd>2</kbd> |

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

## Устранение неполадок

**`The name com.tsv.LayoutSwitcher was not provided by any .service files`**
Расширение не запущено. Проверьте `gnome-extensions info layout-switcher@tsv-tech`
и убедитесь, что его состояние — `ACTIVE`.

**`SetLayout` возвращает `false`**
Ни один настроенный источник ввода не имеет точно такого ID. Выполните `ListLayouts`
и используйте одно из возвращённых значений. Чтобы добавить раскладку, перейдите в
**Settings → Keyboard → Input Sources**.

**Просмотр ошибок**

```sh
journalctl -f -o cat /usr/bin/gnome-shell
```

## Структура проекта

```
layout-switcher@tsv-tech/
├── extension.js              # Entry point: enable() / disable()
├── layoutSwitcherService.js  # D-Bus service and input source logic
└── metadata.json
```

## Примечание о безопасности

API доступен на **сеансовой** шине, поэтому любой процесс, запущенный от имени вашего
пользователя, может переключать раскладки. Он не может читать нажатия клавиш или
изменять какие-либо другие настройки.
