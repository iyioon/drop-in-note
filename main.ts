/**
 * Drop-in Note for Obsidian
 * ------------------------
 * Palette command that:
 *   • Prompts for a name.
 *   • Creates an adjacent folder and note (unless they exist).
 *   • Inserts a **relative** markdown link
 *     exactly at the cursor and leaves the caret just after the link.
 *
 * @author  iyioon
 * @version 1.0.0 (24 Apr 2025)
 */

import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	normalizePath,
} from "obsidian";

/* ------------------------------------------------------------------------- */
/* Settings                                                                  */
/* ------------------------------------------------------------------------- */

export interface DropInNoteSettings {
	/** Template text for new notes (`{{name}}` placeholder supported). */
	noteTemplate: string;
}

const DEFAULT_SETTINGS: DropInNoteSettings = {
	noteTemplate: "# {{name}}\n",
};

/* ------------------------------------------------------------------------- */

export default class DropInNotePlugin extends Plugin {
	public settings!: DropInNoteSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.addCommand({
			id: "create-folder-note-link",
			name: "Create & link",
			editorCheckCallback: (checking, editor, view) => {
				if (view.file) {
					if (!checking) {
						this.createFolderNote(editor, view.file);
					}
					return true;
				}
				return false;
			},
		});

		this.addSettingTab(new DropInNoteSettingTab(this.app, this));
	}

	/* ----------------------------------------------------------------------- */
	/* Core command                                                            */
	/* ----------------------------------------------------------------------- */

	private async createFolderNote(editor: Editor, file: TFile): Promise<void> {
		/* ---- 1. Save caret via placeholder token (bullet-proof) ------------- */
		const token = `%%dropin_${Date.now()}%%`;
		editor.replaceSelection(token);

		const rawName = await this.promptForName();
		if (!rawName) {
			this.removeToken(editor, token);
			return;
		}

		const name = normalizePath(rawName);

		/* ---- 2. File system operations ------------------------------------- */
		const { vault } = this.app;
		const baseDir = file.parent?.path ?? "";
		const folderPath = normalizePath(baseDir ? `${baseDir}/${name}` : name);
		const notePath = normalizePath(`${folderPath}/${name}.md`);

		try {
			if (vault.getAbstractFileByPath(folderPath)) {
				new Notice(
					`Folder "${name}" already exists – nothing created.`
				);
				this.removeToken(editor, token);
				return;
			}

			await vault.createFolder(folderPath);
			await vault.create(
				notePath,
				this.settings.noteTemplate.replace(/\{\{name}}/g, name)
			);

			/* ---- 3. Generate markdown link using FileManager ------------------ */
			const noteFile = vault.getAbstractFileByPath(notePath) as TFile;
			const link = this.app.fileManager.generateMarkdownLink(
				noteFile,
				file.path
			);

			/* ---- 4. Replace token & move caret ------------------------------- */
			const doc = editor.getValue();
			const idx = doc.indexOf(token);

			if (idx === -1) {
				editor.replaceSelection(link);
			} else {
				const from = editor.offsetToPos(idx);
				const to = editor.offsetToPos(idx + token.length);
				editor.replaceRange(link, from, to);
				editor.setCursor({
					line: from.line,
					ch: from.ch + link.length,
				});
			}
		} catch (err) {
			console.error("Drop-in Note plugin error:", err);
			new Notice(
				"Unable to create folder/note – see console for details."
			);
			this.removeToken(editor, token);
		}
	}

	/* ----------------------------------------------------------------------- */
	/* Helpers                                                                 */
	/* ----------------------------------------------------------------------- */

	private removeToken(editor: Editor, token: string) {
		const doc = editor.getValue();
		const idx = doc.indexOf(token);
		if (idx !== -1) {
			const from = editor.offsetToPos(idx);
			const to = editor.offsetToPos(idx + token.length);
			editor.replaceRange("", from, to);
		}
	}

	private promptForName(): Promise<string | undefined> {
		return new Promise((resolve) =>
			new NamePromptModal(this.app, resolve).open()
		);
	}

	private async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
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
			placeholder: "e.g. Project X",
			cls: "din-input",
		});
		this.inputEl.focus();

		this.inputEl.addEventListener("keydown", (ev: KeyboardEvent) => {
			if (ev.key === "Enter") {
				ev.preventDefault();
				ev.stopPropagation();
				this.submit();
			} else if (ev.key === "Escape") {
				ev.preventDefault();
				ev.stopPropagation();
				this.close();
			}
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
				"Text written to every new note. Use {{name}} for the title."
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
