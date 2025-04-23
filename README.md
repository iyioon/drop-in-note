# Drop In Note

Create a folder, a note inside it, and an inline markdown link ­— all in one command.

Drop In Note is for users who prefer organizing their notes within individual folders for better file management. This is especially useful when you want associated attachments to live in the same directory as the note itself, or in the Attachments folder.

To streamline this workflow, make sure your Obsidian settings for attachments are configured to save images either:

• In the same folder as the current file, or
• In the Attachments folder in the same directory as the current file.

---

## Features

- **One-shot command**: Press <kbd>Ctrl/Cmd</kbd> + <kbd>P</kbd> → “Folder & file: create and link”.
- **Name prompt** → creates and inserts `[MyTopic](MyTopic/MyTopic.md)` at the cursor.

* **Template support** – define default front-matter or headers in _Settings → Folder Note Creator_.

---

## Installation

1. **Automatic (Community Plugins)**  
   _Pending approval – search for “Folder Note Creator” once accepted._

2. **Manual**

- Download the latest `folder-note-creator.zip` from [Releases](../../releases).
- Unzip so that `main.js`, `manifest.json`, and (optionally) `styles.css` sit in  
  `.obsidian/plugins/folder-note-creator/`.
- Restart Obsidian and enable the plugin in **Settings → Community plugins**.

---

## Usage

| Action                                       | Result                                                       |
| -------------------------------------------- | ------------------------------------------------------------ |
| Run command                                  | Shows an input modal.                                        |
| Enter `Project X`                            | Creates `Project X/Project X.md` & inserts link.             |
| Enter a name that matches an existing folder | Nothing is created; a Notice says the folder already exists. |

### Settings

- **New note template** – Text (supports `{{name}}` placeholder) written into every new note.

---

## Roadmap

- [ ] Option to open the new note automatically
- [ ] “Link format” setting (wiki-link vs markdown)

---

## Known limitations

- Names containing `/` or illegal file-system characters are not yet validated.

---

## Changelog

| Version   | Date       | Notes                                                       |
| --------- | ---------- | ----------------------------------------------------------- |
| **1.1.0** | 2025-04-24 | First public release – folder-exists guard, settings panel. |

---

MIT © 2025 iyioon
