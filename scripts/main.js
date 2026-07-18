// Markdown Importer — main.js
// Entry point. Registers settings, toolbar button, and canvas drop handler.

import { parseMarkdown }      from "./parser.js";
import { createNPCActor,
         createPCActor }      from "./actors.js";
import { createJournalEntry } from "./journal.js";
import { askImportType }      from "./dialog.js";
import { prewarmIconCache }   from "./icons.js";
import { registerSettings,
         getSetting }         from "./settings.js";
import { openMarkdownEditor } from "./editor.js";

// ─── Drop handler ─────────────────────────────────────────────────────────────

async function handleFileDrop(files) {
  const mdFiles = [...files].filter(f => f.name.endsWith(".md"));
  if (!mdFiles.length) return;

  for (const file of mdFiles) {
    const text   = await file.text();
    const choice = await askImportType(file.name);
    if (!choice) continue;

    try {
      if (choice.type === "npc") {
        const actor = await createNPCActor(parseMarkdown(text));
        ui.notifications.info(`Markdown Importer: Created NPC "${actor.name}"`);
      } else if (choice.type === "pc") {
        const actor = await createPCActor(parseMarkdown(text));
        ui.notifications.info(`Markdown Importer: Created character "${actor.name}"`);
      } else {
        const journal = await createJournalEntry(text, file.name);
        ui.notifications.info(`Markdown Importer: Created journal "${journal.name}"`);
      }
    } catch (err) {
      console.error("Markdown Importer error:", err);
      ui.notifications.error(`Markdown Importer: Failed — ${err.message}`);
    }
  }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

Hooks.once("init", () => {
  console.log("Markdown Importer | Initialising");
  registerSettings();
});

Hooks.once("ready", () => {
  console.log("Markdown Importer | Ready — drag .md files onto the canvas to import");
  prewarmIconCache();

  // Canvas drag and drop
  document.body.addEventListener("dragover", e => {
    const hasMd = [...(e.dataTransfer?.items || [])].some(
      i => i.kind === "file" && (
        i.type === "text/markdown" ||
        i.type === "text/plain"   ||
        i.type === ""
      )
    );
    if (hasMd) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }
  });

  document.body.addEventListener("drop", e => {
    const files   = e.dataTransfer?.files;
    if (!files?.length) return;
    const mdFiles = [...files].filter(f => f.name.endsWith(".md"));
    if (!mdFiles.length) return;
    e.preventDefault();
    e.stopPropagation();
    handleFileDrop(mdFiles);
  });
});

// ─── Toolbar button ───────────────────────────────────────────────────────────

Hooks.on("getSceneControlButtons", controls => {
  // v14 — controls is an object keyed by group name
  if (controls && !Array.isArray(controls) && typeof controls === "object") {
    // Try to add to the tiles group, fallback to notes group
    const group = controls["tiles"] ?? controls["notes"] ?? Object.values(controls)[0];
    if (group?.tools && typeof group.tools === "object" && !Array.isArray(group.tools)) {
      group.tools["markdown-importer-editor"] = {
        name:    "markdown-importer-editor",
        title:   "Markdown Editor",
        icon:    "fas fa-file-code",
        button:  true,
        order:   999,
        onClick: () => openMarkdownEditor(),
      };
      return;
    }
  }

  // v12 — controls is an array
  if (Array.isArray(controls)) {
    const group = controls.find(g => g.name === "tiles") ?? controls[0];
    if (!group) return;
    if (group.tools.some(t => t.name === "markdown-importer-editor")) return;
    group.tools.push({
      name:    "markdown-importer-editor",
      title:   "Markdown Editor",
      icon:    "fas fa-file-code",
      button:  true,
      onClick: () => openMarkdownEditor(),
    });
  }
});
