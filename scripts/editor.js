// Markdown Importer — editor.js
// A markdown editor window accessible from the scene controls toolbar

import { parseMarkdown }      from "./parser.js";
import { createNPCActor,
         createPCActor }      from "./actors.js";
import { createJournalEntry } from "./journal.js";

const MODULE_ID = "markdown-importer";

// ─── Editor Application ───────────────────────────────────────────────────────

export class MarkdownEditorApp extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id:    "markdown-importer-editor",
    window: {
      title:     "Markdown Importer — Editor",
      resizable: true,
      minimizable: true,
    },
    position: {
      width:  780,
      height: 600,
    },
    classes: ["markdown-importer-editor"],
  };

  static PARTS = {
    main: { template: false },
  };

  _content  = "";
  _filename = "untitled.md";

  async _renderHTML(context, options) {
    const el = document.createElement("div");
    el.style.cssText = "display:flex; flex-direction:column; height:100%; padding:0; overflow:hidden;";
    el.innerHTML = `
      <textarea
        id="md-editor-area"
        spellcheck="false"
        placeholder="Paste or write your markdown here..."
        style="
          flex:1; resize:none; border:none; outline:none;
          background:var(--color-bg-primary, #1a1a1a);
          color:var(--color-text-primary, #e0e0e0);
          font-family:'Courier New', Courier, monospace;
          font-size:13px; line-height:1.6;
          padding:12px 16px;
          tab-size:2;
        "
      >${this._content}</textarea>

      <div style="
        display:flex; align-items:center; gap:8px;
        padding:10px 12px; border-top:1px solid var(--color-border-dark, #444);
        background:var(--color-bg-option, rgba(0,0,0,0.2));
        flex-shrink:0;
      ">
        <span style="font-size:12px; opacity:0.5; flex:1;" id="md-editor-status">Ready</span>

        <button type="button" id="md-save-npc" style="
          background:#5a2020; border:1px solid #8b3333; color:#ffcccc;
          padding:6px 14px; border-radius:4px; cursor:pointer; font-size:13px;
          display:flex; align-items:center; gap:6px;
        ">
          <i class="fas fa-dragon"></i> Save as NPC
        </button>

        <button type="button" id="md-save-pc" style="
          background:#1a3a20; border:1px solid #2d6b35; color:#ccffcc;
          padding:6px 14px; border-radius:4px; cursor:pointer; font-size:13px;
          display:flex; align-items:center; gap:6px;
        ">
          <i class="fas fa-user"></i> Save as Player
        </button>

        <button type="button" id="md-save-journal" style="
          background:#1a2540; border:1px solid #2d4480; color:#ccd9ff;
          padding:6px 14px; border-radius:4px; cursor:pointer; font-size:13px;
          display:flex; align-items:center; gap:6px;
        ">
          <i class="fas fa-book-open"></i> Save as Journal
        </button>
      </div>
    `;
    return el;
  }

  _replaceHTML(result, content, options) {
    content.replaceChildren(result);
  }

  _onRender(context, options) {
    const area   = this.element.querySelector("#md-editor-area");
    const status = this.element.querySelector("#md-editor-status");

    if (this._content) area.value = this._content;

    area.addEventListener("input", () => {
      this._content = area.value;
      const lines = area.value.split("\n").length;
      const words = area.value.trim() ? area.value.trim().split(/\s+/).length : 0;
      status.textContent = `${lines} lines · ${words} words`;
    });

    // Tab key inserts 2 spaces
    area.addEventListener("keydown", e => {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = area.selectionStart;
        const end   = area.selectionEnd;
        area.value  = area.value.substring(0, start) + "  " + area.value.substring(end);
        area.selectionStart = area.selectionEnd = start + 2;
        this._content = area.value;
      }
    });

    // Save buttons
    this.element.querySelector("#md-save-npc").addEventListener("click", () =>
      this._doImport("npc", area, status));
    this.element.querySelector("#md-save-pc").addEventListener("click", () =>
      this._doImport("pc", area, status));
    this.element.querySelector("#md-save-journal").addEventListener("click", () =>
      this._doImport("journal", area, status));
  }

  async _doImport(type, area, status) {
    const text = area?.value ?? this._content;
    if (!text.trim()) {
      ui.notifications.warn("Markdown Importer: Nothing to import — editor is empty.");
      return;
    }

    const fname = this._filename || "untitled.md";
    status.textContent = "Importing...";

    try {
      if (type === "npc") {
        const actor = await createNPCActor(parseMarkdown(text));
        ui.notifications.info(`Markdown Importer: Created NPC "${actor.name}"`);
        status.textContent = `Saved as NPC: ${actor.name}`;

      } else if (type === "pc") {
        const actor = await createPCActor(parseMarkdown(text));
        ui.notifications.info(`Markdown Importer: Created character "${actor.name}"`);
        status.textContent = `Saved as character: ${actor.name}`;

      } else {
        const journal = await createJournalEntry(text, fname);
        ui.notifications.info(`Markdown Importer: Created journal "${journal.name}"`);
        status.textContent = `Saved as journal: ${journal.name}`;
      }
    } catch (err) {
      console.error("Markdown Importer editor error:", err);
      ui.notifications.error(`Markdown Importer: Failed — ${err.message}`);
      status.textContent = `Error: ${err.message}`;
      return;
    }

    // Close the editor after a successful save
    this.close();
  }
}

// Singleton — reuse the same window if already open
let _editorInstance = null;

export function openMarkdownEditor() {
  if (_editorInstance && !_editorInstance.closed) {
    _editorInstance.bringToTop?.();
    return;
  }
  _editorInstance = new MarkdownEditorApp();
  _editorInstance.render(true);
  // Clear reference when the window is closed so it can be reopened
  _editorInstance.addEventListener("close", () => {
    _editorInstance = null;
  });
}
