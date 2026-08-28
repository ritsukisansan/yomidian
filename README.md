# Yomidian

Yomidian is a native Japanese dictionary plugin for Obsidian.

It uses the **Yomitan dictionary format** but does not require Yomitan, a browser extension, browser APIs, or another host application. The goal is to make Japanese dictionary lookup feel native to Obsidian.

## Current implementation

- Import Yomitan-compatible dictionary ZIP archives directly from Obsidian.
- Store dictionary entries in an IndexedDB database through Dexie.
- Look up selected Japanese text in installed dictionaries.
- Press **Shift** while the cursor is on Japanese text to look up the Japanese word under the cursor.
- Press **Shift** with text selected to look up the selection.
- Resolve common Japanese inflections before dictionary lookup, including polite, negative, past, て-form, progressive, causative, passive/potential, conditional, volitional, and common contracted forms.
- Use the Command Palette for lookup and dictionary import.
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
Yomidian translator
      │
      ├── Japanese deinflection
      │
      └── dictionary search
      │
      ▼
IndexedDB / Dexie
      │
      ▼
Yomitan-format dictionaries
```

The architecture is designed to grow toward richer Yomitan-compatible translation and result processing without coupling the plugin to browser-extension APIs.

## Roadmap

The next translator stages are richer Yomitan-compatible result data, dictionary tags, kanji dictionaries, pitch/frequency metadata, structured glossary rendering, and better Japanese text scanning.

## License

Yomidian is licensed under the GNU General Public License v3.0 or later.
