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

// ─── Merchant Sheet integration ───────────────────────────────────────────────

export async function createMerchantSheet(parsed) {
  // Create a basic NPC actor to hold the merchant data
  const actor = await Actor.create({
    name:  parsed.title || "Merchant",
    type:  "npc",
    img:   "icons/svg/item-bag.svg",
    system: {
      attributes: { hp: { value: 1, max: 1 } },
      details:    { biography: { value: parsed.loreRaw || "" } },
    },
    prototypeToken: {
      name:        parsed.title || "Merchant",
      displayName: 20,
      actorLink:   false,
      disposition: 1,
    },
  });

  const MODULE_ID = "merchant-sheet";

  // Build shop items from the ## Shop section
  // Try to look up each item in the compendium for proper icons and data
  const items = await Promise.all((parsed.shopItems || []).map(async shopItem => {
    // Search all item packs for a matching name
    let img  = "icons/svg/item-bag.svg";
    let type = "loot";
    let uuid = null;

    for (const pack of game.packs.filter(p => p.metadata.type === "Item")) {
      try {
        const index = await pack.getIndex({ fields: ["name", "img", "type"] });
        const entry = index.find(e => e.name.toLowerCase() === shopItem.name.toLowerCase());
        if (entry) {
          img  = entry.img  || img;
          type = entry.type || type;
          uuid = `${pack.collection}.${entry._id}`;
          break;
        }
      } catch { /* skip pack */ }
    }

    return {
      id:       foundry.utils.randomID(),
      uuid,
      name:     shopItem.name,
      img,
      type,
      category: getCategoryFromType(type),
      price:    shopItem.price,
      currency: shopItem.currency,
      quantity: shopItem.quantity,
    };
  }));

  await actor.setFlag(MODULE_ID, "inventory", {
    items,
    name: parsed.title || "Merchant",
    img:  actor.img,
  });

  // Open the merchant sheet
  const { MerchantSheet } = await import("/modules/merchant-sheet/scripts/main.js");
  const sheet = new MerchantSheet(actor);
  sheet.render(true);

  ui.notifications.info(`Markdown Importer: Created merchant "${actor.name}" with ${items.length} item${items.length !== 1 ? "s" : ""}`);
}

function getCategoryFromType(type) {
  const map = {
    weapon:    "Weapons",
    equipment: "Armor & Equipment",
    consumable:"Consumables",
    tool:      "Tools",
    loot:      "Loot",
    spell:     "Spells",
    feat:      "Features",
  };
  return map[type] || "Miscellaneous";
}

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
      } else if (choice.type === "merchant") {
        await createMerchantSheet(parseMarkdown(text));
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

// ─── Inject Merchant Sheet into Create Actor dialog ───────────────────────────

Hooks.on("renderDialog", (dialog, html) => {
  // Only target the Create Actor dialog and only if Merchant Sheet is active
  if (!dialog.title?.includes("Create Actor")) return;
  if (!game.modules.get("merchant-sheet")?.active) return;

  const list = html.querySelector ? html.querySelector(".document-create ul") : html[0]?.querySelector(".document-create ul");
  if (!list) return;

  const li = document.createElement("li");
  li.style.cssText = "display:flex; align-items:center; gap:12px; padding:8px 10px; cursor:pointer; border-radius:4px;";
  li.innerHTML = `
    <img src="icons/svg/item-bag.svg" style="width:40px; height:40px; border-radius:4px; border:1px solid #555;">
    <span style="font-size:14px;">Merchant Sheet</span>
    <input type="radio" name="type" value="merchant-sheet" style="margin-left:auto;">
  `;

  li.addEventListener("click", () => {
    li.querySelector("input").checked = true;
    list.querySelectorAll("li").forEach(l => l.style.background = "");
    li.style.background = "rgba(255,255,255,0.08)";
  });

  list.appendChild(li);

  // Intercept the Create button
  const createBtn = html.querySelector ? html.querySelector("[data-action='create'], .create-document") : html[0]?.querySelector("[data-action='create'], .create-document");
  if (createBtn) {
    createBtn.addEventListener("click", async e => {
      const selected = list.querySelector("input[name='type']:checked");
      if (selected?.value !== "merchant-sheet") return;
      e.preventDefault();
      e.stopPropagation();
      dialog.close();

      const actor = await Actor.create({
        name:  "New Merchant",
        type:  "npc",
        img:   "icons/svg/item-bag.svg",
        system: { attributes: { hp: { value: 1, max: 1 } } },
        prototypeToken: { name: "Merchant", disposition: 1 },
      });

      const { MerchantSheet } = await import("/modules/merchant-sheet/scripts/main.js");
      new MerchantSheet(actor).render(true);
    }, true);
  }
});

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
