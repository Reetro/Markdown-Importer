// Markdown Importer — main.js
// Entry point. Registers settings, toolbar button, and canvas drop handler.

import { parseMarkdown }      from "./parser.js";
import { createCustomItem }  from "./customItems.js";
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
    // Handle custom items — create them as real world items
    if (shopItem.custom) {
      try {
        const created = await createCustomItem(shopItem);
        return {
          id:       foundry.utils.randomID(),
          uuid:     created.uuid,
          name:     created.name,
          img:      created.img,
          type:     created.type,
          category: getCategoryFromType(created.type),
          price:    shopItem.price,
          currency: shopItem.currency,
          quantity: shopItem.quantity,
        };
      } catch(e) {
        console.error(`Markdown Importer: Failed to create custom item "${shopItem.name}":`, e);
        return null;
      }
    }

    // Standard compendium lookup for non-custom items

    // Standard compendium lookup for non-custom items
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

  // Filter out any failed custom items
  const validItems = items.filter(Boolean);

  await actor.setFlag(MODULE_ID, "inventory", {
    items:  validItems,
    name:   parsed.title || "Merchant",
    img:    actor.img,
  });

  // Open the merchant sheet
  const { MerchantSheet } = await import("/modules/merchant-sheet/scripts/sheet.js");
  const sheet = new MerchantSheet(actor);
  sheet.render(true);

  ui.notifications.info(`Markdown Importer: Created merchant "${actor.name}" with ${validItems.length} item${validItems.length !== 1 ? "s" : ""}`);
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
    // Add as a top-level group with a single button so it appears in the main bar
    controls["markdown-importer"] = {
      name:    "markdown-importer",
      title:   "Markdown Importer",
      icon:    "fas fa-file-import",
      layer:   "controls",
      visible: true,
      tools:   {
        "markdown-editor": {
          name:    "markdown-editor",
          title:   "Markdown Editor",
          icon:    "fas fa-file-code",
          button:  true,
          onClick: () => openMarkdownEditor(),
        },
      },
    };
    return;
  }

  // v12 — controls is an array
  if (Array.isArray(controls)) {
    controls.push({
      name:    "markdown-importer",
      title:   "Markdown Importer",
      icon:    "fas fa-file-import",
      layer:   "controls",
      tools: [{
        name:    "markdown-editor",
        title:   "Markdown Editor",
        icon:    "fas fa-file-code",
        button:  true,
        onClick: () => openMarkdownEditor(),
      }],
    });
  }
});
