// Markdown Importer — settings.js

const MODULE_ID = "markdown-importer";

const DEFAULTS = {
  loresections:        "Lore, Who He Is, Who She Is, Who They Are, Biography, Details, Public",
  traitSections:       "Racial Traits, Traits",
  featureSections:     "Class Features, Features",
  actionSections:      "Actions",
  reactionSections:    "Reactions",
  bonusActionSections: "Bonus Actions",
  spellSections:       "Spells, Spell List",
  equipmentSections:   "Equipment",
  idealSections:       "Ideals",
  bondSections:        "Bonds",
  flawSections:        "Flaws",
  normaliseNames:      false,
  defaultActorType:    "npc",
  searchHeaderLines:   10,
  useCompendiumIcons:  true,
};

export function registerSettings() {
  const keys = [
    "loresections","traitSections","featureSections","actionSections",
    "reactionSections","bonusActionSections","spellSections",
    "equipmentSections","idealSections","bondSections","flawSections",
    "defaultActorType",
  ];

  for (const key of keys) {
    game.settings.register(MODULE_ID, key, {
      scope: "world", config: false,
      type: String, default: DEFAULTS[key] ?? "",
    });
  }

  game.settings.register(MODULE_ID, "normaliseNames", {
    scope: "world", config: false,
    type: Boolean, default: false,
  });

  game.settings.register(MODULE_ID, "useCompendiumIcons", {
    scope: "world", config: false,
    type: Boolean, default: true,
  });

  game.settings.register(MODULE_ID, "searchHeaderLines", {
    scope: "world", config: false,
    type: Number, default: 10,
  });

  game.settings.registerMenu(MODULE_ID, "configMenu", {
    name:     "Markdown Importer Settings",
    label:    "Configure",
    hint:     "Configure how markdown files are parsed and imported into Foundry.",
    icon:     "fas fa-file-import",
    type:     MarkdownImporterConfig,
    restricted: true,
  });
}

export function getSetting(key) {
  try { return game.settings.get(MODULE_ID, key); }
  catch { return DEFAULTS[key]; }
}

export function getKeywords(key) {
  const raw = getSetting(key) || DEFAULTS[key] || "";
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

// ─── Settings form — uses plain FormApplication (works v12-v16) ───────────────
class MarkdownImporterConfig extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id:    "markdown-importer-config",
      title: "Markdown Importer — Settings",
      width: 620,
      height: "auto",
      closeOnSubmit: true,
      template: false,
    });
  }

  async _renderInner() {
    const d = getSetting;
    const html = `
      <form style="padding:8px">
        <p style="margin:0 0 12px 0; font-size:13px; opacity:0.7">
          Define the section headings the importer looks for in your markdown files.
          Separate multiple keywords with commas. Matching is case insensitive.
        </p>

        <fieldset style="border:1px solid var(--border); border-radius:4px; padding:10px; margin-bottom:12px">
          <legend style="padding:0 6px; font-size:12px; font-weight:500">Section Keywords</legend>
          ${field("loresections",        "Lore / Biography",   d("loresections"))}
          ${field("traitSections",       "Traits",             d("traitSections"))}
          ${field("featureSections",     "Class Features",     d("featureSections"))}
          ${field("actionSections",      "Actions",            d("actionSections"))}
          ${field("reactionSections",    "Reactions",          d("reactionSections"))}
          ${field("bonusActionSections", "Bonus Actions",      d("bonusActionSections"))}
          ${field("spellSections",       "Spells",             d("spellSections"))}
          ${field("equipmentSections",   "Equipment",          d("equipmentSections"))}
        </fieldset>

        <fieldset style="border:1px solid var(--border); border-radius:4px; padding:10px; margin-bottom:12px">
          <legend style="padding:0 6px; font-size:12px; font-weight:500">Personality Fields (PC only)</legend>
          ${field("idealSections", "Ideals", d("idealSections"))}
          ${field("bondSections",  "Bonds",  d("bondSections"))}
          ${field("flawSections",  "Flaws",  d("flawSections"))}
        </fieldset>

        <fieldset style="border:1px solid var(--border); border-radius:4px; padding:10px; margin-bottom:12px">
          <legend style="padding:0 6px; font-size:12px; font-weight:500">Parsing Behaviour</legend>
          ${number("searchHeaderLines", "Class name search depth (lines)", d("searchHeaderLines"))}
          ${checkbox("normaliseNames",   "Normalise skill and damage names", d("normaliseNames"))}
          ${checkbox("useCompendiumIcons","Look up icons from compendium",   d("useCompendiumIcons"))}
        </fieldset>

        <div style="text-align:right; margin-top:8px">
          <button type="button" id="md-reset" style="margin-right:8px">
            <i class="fas fa-undo"></i> Reset to Defaults
          </button>
          <button type="submit">
            <i class="fas fa-save"></i> Save
          </button>
        </div>
      </form>
    `;
    const el = document.createElement("div");
    el.innerHTML = html;
    el.querySelector("#md-reset")?.addEventListener("click", () => this._reset(el));
    return $(el);
  }

  _reset(el) {
    for (const [key, val] of Object.entries(DEFAULTS)) {
      const input = el.querySelector(`[name="${key}"]`);
      if (!input) continue;
      if (input.type === "checkbox") input.checked = !!val;
      else input.value = val;
    }
  }

  getData() { return {}; }

  async _updateObject(event, formData) {
    for (const [key, value] of Object.entries(formData)) {
      await game.settings.set(MODULE_ID, key, value);
    }
    ui.notifications.info("Markdown Importer: Settings saved.");
  }
}

function field(name, label, value) {
  return `
    <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px">
      <label style="min-width:160px; font-size:13px">${label}</label>
      <input type="text" name="${name}" value="${value ?? ""}" style="flex:1; font-size:13px">
    </div>`;
}

function number(name, label, value) {
  return `
    <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px">
      <label style="min-width:220px; font-size:13px">${label}</label>
      <input type="number" name="${name}" value="${value ?? 10}" min="1" max="30" style="width:60px; font-size:13px">
    </div>`;
}

function checkbox(name, label, value) {
  return `
    <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px">
      <input type="checkbox" name="${name}" ${value ? "checked" : ""} style="width:16px; height:16px">
      <label style="font-size:13px; cursor:pointer">${label}</label>
    </div>`;
}
