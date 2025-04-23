
/**
 * Drop‑in Note for Obsidian
 * ------------------------
 * One palette command that:
 * 1. Prompts the user for a name.
 * 2. Creates a folder with that name (unless it already exists).
 * 3. Creates a note of the same name inside that folder (unless it exists).
 * 4. Inserts a markdown link to the new note at the current cursor position.
 *
 * If the folder already exists the command simply shows a Notice and exits—
 * nothing is overwritten.  (Added in v1.1.0.)
 *
 * @author  iyioon
 * @version 1.1.0  (24 Apr 2025)
 */

import {
  App,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
} from "obsidian";

/* ------------------------------------------------------------------------- */
/* Settings                                                                  */
/* ------------------------------------------------------------------------- */

export interface DropInNoteSettings {
  /** Template text written into each new note (use `{{name}}` placeholder). */
  noteTemplate: string;
}

const DEFAULT_SETTINGS: DropInNoteSettings = {
  noteTemplate: "# {{name}}\n",
};

/* ------------------------------------------------------------------------- */

export default class DropInNotePlugin extends Plugin {
  public settings!: DropInNoteSettings;

  /* ----------------------------- lifecycle -------------------------------- */

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addCommand({
      id: "dropin-create-folder-note-link",
      name: "Drop‑in note: create & link",
      callback: () => void this.createFolderNote(),
    });

    this.addSettingTab(new DropInNoteSettingTab(this.app, this));
  }

  /* ------------------------------ command --------------------------------- */

  /**
   * Prompt for a name, create folder + note, insert link, with guard against
   * pre‑existing folders.
   */
  private async createFolderNote(): Promise<void> {
    const name = await this.promptForName();
    if (!name) return;

    const { vault, workspace } = this.app;
    const folderPath = `${name}/`;
    const notePath = `${folderPath}${name}.md`;

    try {
      /* ---------- guard: folder already exists ---------- */
      if (vault.getAbstractFileByPath(folderPath)) {
        new Notice(`Folder \"${name}\" already exists – nothing created.`);
        return;
      }

      /* -------------- create folder & note -------------- */
      await vault.createFolder(folderPath);
      const noteFile = (await vault.create(
        notePath,
        this.settings.noteTemplate.replace(/\{\{name}}/g, name)
      )) as TFile;

      /* ------------------ insert link ------------------- */
      const editor = workspace.getActiveViewOfType(MarkdownView)?.editor;
      if (editor) {
        editor.replaceSelection(`[${name}](${noteFile.path})`);
      } else {
        new Notice("No active editor to insert the link into.");
      }
    } catch (err) {
      console.error("Drop‑in Note plugin error:", err);
      new Notice("Unable to create folder/note – see console for details.");
    }
  }

  /* ------------------------------ dialogs --------------------------------- */

  private promptForName(): Promise<string | undefined> {
    return new Promise((resolve) => new NamePromptModal(this.app, resolve).open());
  }

  /* ----------------------------- settings --------------------------------- */

  private async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  public async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}

/* ------------------------------------------------------------------------- */
/* Modal                                                                     */
/* ------------------------------------------------------------------------- */

class NamePromptModal extends Modal {
  private inputEl!: HTMLInputElement;

  constructor(app: App, private onSubmit: (value?: string) => void) {
    super(app);
  }

  onOpen(): void {
    this.titleEl.setText("Folder / note name");

    this.inputEl = this.contentEl.createEl("input", {
      type: "text",
      placeholder: "e.g. Project X",
      cls: "din-input",
    });

    this.inputEl.focus();
    this.inputEl.addEventListener("keydown", (ev: KeyboardEvent) => {
      if (ev.key === "Enter") this.submit();
      else if (ev.key === "Escape") this.close();
    });
  }

  private submit(): void {
    const value = this.inputEl.value.trim();
    this.onSubmit(value || undefined);
    this.close();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

/* ------------------------------------------------------------------------- */
/* Setting tab                                                               */
/* ------------------------------------------------------------------------- */

class DropInNoteSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: DropInNotePlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("New note template")
      .setDesc(
        "Text that will be written to every new note. Use {{name}} where the note name should appear."
      )
      .addTextArea((ta) =>
        ta
          .setPlaceholder("# {{name}}")
          .setValue(this.plugin.settings.noteTemplate)
          .onChange(async (val) => {
            this.plugin.settings.noteTemplate = val;
            await this.plugin.saveSettings();
          })
      );
  }
}

