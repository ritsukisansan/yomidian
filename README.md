# Yomidian

Yomidian is a native Japanese dictionary plugin for Obsidian.

It uses the **Yomitan dictionary format** but does not require Yomitan, a browser extension, browser APIs, or another host application. The goal is to make Japanese dictionary lookup feel native to Obsidian.

## Current implementation

- Import Yomitan-compatible dictionary ZIP archives directly from Obsidian.
- Persist imported dictionaries using Obsidian plugin data storage.
- Look up the selected text in installed dictionaries.
- Press **Shift** after selecting text to open the lookup window.
- Use the Command Palette for the same lookup and dictionary-import operations.
- Manage installed dictionaries from Yomidian settings.

## Development

Yomidian uses **pnpm**.

```bash
pnpm install
pnpm run dev
```

For a production build:

```bash
pnpm run build
```

## Architecture

Yomidian intentionally does not embed Yomitan's browser-extension runtime. Instead, it implements an Obsidian-native host around the portable parts of the Yomitan dictionary format:

```text
Obsidian editor
      │
      ├── Shift / Command Palette
      │
      ▼
Yomidian lookup UI
      │
      ▼
Dictionary engine
      │
      ▼
Yomitan-format dictionaries
      │
      ▼
Obsidian plugin storage
```

The architecture is designed so the dictionary engine can later grow into a proper indexed database and richer Yomitan-compatible translator without coupling the plugin to browser-extension APIs.

## License

Yomidian is licensed under the GNU General Public License v3.0 or later.
