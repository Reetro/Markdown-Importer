// Markdown Importer — settings.js
// Registers module settings and provides the settings config form

const MODULE_ID = "markdown-importer";

// ─── Default values ───────────────────────────────────────────────────────────

const DEFAULTS = {
  // Section heading keywords — comma separated, case insensitive
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

  // Parsing behaviour
  normaliseNames:      false,
  defaultActorType:    "npc",
  searchHeaderLines:   10,

  // Icon behaviour
  useCompendiumIcons:  true,
};

// ─── Register settings ────────────────────────────────────────────────────────

export function registerSettings() {
  // Hidden data store for all section keywords — accessed via the config form
  game.settings.register(MODULE_ID, "loresections", {
    name: "Lore Section Keywords",
    scope: "world",
    config: false,
    type: String,
    default: DEFAULTS.loreSections,
  });

  game.settings.register(MODULE_ID, "traitSections", {
    name: "Trait Section Keywords",
    scope: "world",
    config: false,
    type: String,
    default: DEFAULTS.traitSections,
  });

  game.settings.register(MODULE_ID, "featureSections", {
    name: "Feature Section Keywords",
    scope: "world",
    config: false,
    type: String,
    default: DEFAULTS.featureSections,
  });

  game.settings.register(MODULE_ID, "actionSections", {
    name: "Action Section Keywords",
    scope: "world",
    config: false,
    type: String,
    default: DEFAULTS.actionSections,
  });

  game.settings.register(MODULE_ID, "reactionSections", {
    name: "Reaction Section Keywords",
    scope: "world",
    config: false,
    type: String,
    default: DEFAULTS.reactionSections,
  });

  game.settings.register(MODULE_ID, "bonusActionSections", {
    name: "Bonus Action Section Keywords",
    scope: "world",
    config: false,
    type: String,
    default: DEFAULTS.bonusActionSections,
  });

  game.settings.register(MODULE_ID, "spellSections", {
    name: "Spell Section Keywords",
    scope: "world",
    config: false,
    type: String,
    default: DEFAULTS.spellSections,
  });

  game.settings.register(MODULE_ID, "equipmentSections", {
    name: "Equipment Section Keywords",
    scope: "world",
    config: false,
    type: String,
    default: DEFAULTS.equipmentSections,
  });

  game.settings.register(MODULE_ID, "idealSections", {
    name: "Ideal Section Keywords",
    scope: "world",
    config: false,
    type: String,
    default: DEFAULTS.idealSections,
  });

  game.settings.register(MODULE_ID, "bondSections", {
    name: "Bond Section Keywords",
    scope: "world",
    config: false,
    type: String,
    default: DEFAULTS.bondSections,
  });

  game.settings.register(MODULE_ID, "flawSections", {
    name: "Flaw Section Keywords",
    scope: "world",
    config: false,
    type: String,
    default: DEFAULTS.flawSections,
  });

  game.settings.register(MODULE_ID, "normaliseNames", {
    name: "Normalise skill and damage names",
    scope: "world",
    config: false,
    type: Boolean,
    default: DEFAULTS.normaliseNames,
  });

  game.settings.register(MODULE_ID, "searchHeaderLines", {
    name: "Header lines to search for class name",
    scope: "world",
    config: false,
    type: Number,
    default: DEFAULTS.searchHeaderLines,
  });

  game.settings.register(MODULE_ID, "useCompendiumIcons", {
    name: "Look up icons from compendium",
    scope: "world",
    config: false,
    type: Boolean,
    default: DEFAULTS.useCompendiumIcons,
  });

  game.settings.register(MODULE_ID, "defaultActorType", {
    name: "Default import type",
    scope: "world",
    config: false,
    type: String,
    default: DEFAULTS.defaultActorType,
  });

  // Register the settings menu button that opens the config form
  game.settings.registerMenu(MODULE_ID, "configMenu", {
    name: "Markdown Importer Settings",
    label: "Configure",
    hint: "Configure how markdown files are parsed and imported into Foundry.",
    icon: "fas fa-file-import",
    type: MarkdownImporterConfig,
    restricted: true,
  });
}

// ─── Helper to read a setting ─────────────────────────────────────────────────

export function getSetting(key) {
  try {
    return game.settings.get(MODULE_ID, key);
  } catch {
    return DEFAULTS[key];
  }
}

// ─── Helper to parse a keyword setting into an array ─────────────────────────

export function getKeywords(key) {
  const raw = getSetting(key) || DEFAULTS[key] || "";
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

// ─── Settings config form ─────────────────────────────────────────────────────

class MarkdownImporterConfig extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id:       "markdown-importer-config",
      title:    "Markdown Importer — Settings",
      template: "modules/markdown-importer/templates/settings.html",
      width:    620,
      height:   "auto",
      closeOnSubmit: true,
    });
  }

  getData() {
    return {
      loresections:        getSetting("loreections") || DEFAULTS.loreections,
      traitSections:       getSetting("traitSections")       || DEFAULTS.traitSections,
      featureSections:     getSetting("featureSections")     || DEFAULTS.featureSections,
      actionSections:      getSetting("actionSections")      || DEFAULTS.actionSections,
      reactionSections:    getSetting("reactionSections")    || DEFAULTS.reactionSections,
      bonusActionSections: getSetting("bonusActionSections") || DEFAULTS.bonusActionSections,
      spellSections:       getSetting("spellSections")       || DEFAULTS.spellSections,
      equipmentSections:   getSetting("equipmentSections")   || DEFAULTS.equipmentSections,
      idealSections:       getSetting("idealSections")       || DEFAULTS.idealSections,
      bondSections:        getSetting("bondSections")        || DEFAULTS.bondSections,
      flawSections:        getSetting("flawSections")        || DEFAULTS.flawSections,
      normaliseNames:      getSetting("normaliseNames"),
      searchHeaderLines:   getSetting("searchHeaderLines")   || DEFAULTS.searchHeaderLines,
      useCompendiumIcons:  getSetting("useCompendiumIcons"),
      defaultActorType:    getSetting("defaultActorType")    || DEFAULTS.defaultActorType,
    };
  }

  async _updateObject(event, formData) {
    for (const [key, value] of Object.entries(formData)) {
      await game.settings.set(MODULE_ID, key, value);
    }
    ui.notifications.info("Markdown Importer: Settings saved.");
  }
}
