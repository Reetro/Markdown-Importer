// Markdown Importer — parser.js
// Reads raw markdown text and returns a structured data object

import { ABILITY_MAP, DAMAGE_TYPE_MAP, SPELL_SCHOOL_MAP, CLASS_NAMES } from "./constants.js";
import { getKeywords, getSetting } from "./settings.js";

// ─── Low level helpers ────────────────────────────────────────────────────────

export function extractNumber(str) {
  const m = String(str || "").match(/\d+/);
  return m ? parseInt(m[0]) : 0;
}

export function abilityMod(score) {
  return Math.floor((score - 10) / 2);
}

function getText(text, ...patterns) {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].replace(/\*\*/g, "").trim();
  }
  return "";
}

// Matches "## Section Name" AND "## Section Name (extra stuff)"
function getSectionText(text, ...names) {
  for (const name of names) {
    const re = new RegExp(`##\\s+${name}[^\\n]*\\n([\\s\\S]+?)(?=\\n##|$)`, "i");
    const m = text.match(re);
    if (m) return m[1].replace(/^---+\s*$/gm, "").trim();
  }
  return "";
}

function sectionToPlain(raw) {
  if (!raw) return "";
  return raw
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^[>\-]\s*/gm, "")
    .replace(/\n/g, " ")
    .trim();
}

function parseFeatures(raw) {
  const out = [];

  // Split on either a new **Name** line OR a --- divider followed by a **Name** line
  // This handles stat blocks where features are separated by horizontal rules
  const normalized = raw.replace(/\n---+\n/g, "\n");
  const blocks = normalized.split(/\n(?=\*\*[^*\n]+\*\*)/);

  for (const block of blocks) {
    const nm = block.match(/^\*\*([^*]+)\*\*/);
    if (!nm) continue;

    const name = nm[1].trim();

    // Build description from only this block's content — do not bleed into next block
    const desc = block
      .replace(/^\*\*[^*]+\*\*\.?\s*/, "")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/^>\s+/gm, "")
      .replace(/^-\s+/gm, "• ")
      .replace(/\n/g, " ")
      .trim();

    if (name && desc) out.push({ name, description: desc });
  }
  return out;
}

// Matches "## Section Name" AND "## Section Name (extra stuff)"
// Stops at the next ## heading
function getSection(text, ...names) {
  for (const name of names) {
    const re = new RegExp(
      `##\\s+${name}[^\\n]*\\n([\\s\\S]+?)(?=\\n##|$)`,
      "i"
    );
    const m = text.match(re);
    if (m) {
      const cleaned = m[1].replace(/^---+\s*$/gm, "").trim();
      return parseFeatures(cleaned);
    }
  }
  return [];
}

// ─── Field extractors ─────────────────────────────────────────────────────────

function extractAbilities(text) {
  const m = text.match(
    /\|\s*STR\s*\|[\s\S]*?\n\|[\s:|-]+\|\n\|\s*(\d+)[^|]*\|\s*(\d+)[^|]*\|\s*(\d+)[^|]*\|\s*(\d+)[^|]*\|\s*(\d+)[^|]*\|\s*(\d+)[^|]*/i
  );
  return m
    ? { str:+m[1], dex:+m[2], con:+m[3], int:+m[4], wis:+m[5], cha:+m[6] }
    : { str:10, dex:10, con:10, int:10, wis:10, cha:10 };
}

function extractSaves(text) {
  const line = text.match(/\*\*Saving Throws\*\*\s+([^\n]+)/i);
  if (!line) return {};
  const saves = {};
  for (const part of line[1].split(",")) {
    const m = part.trim().match(/(\w+)\s+\+?([-\d]+)/);
    if (m) saves[ABILITY_MAP[m[1].toLowerCase()] || m[1].toLowerCase().slice(0, 3)] = +m[2];
  }
  return saves;
}

function extractCR(text) {
  const raw = getText(text, /\*\*Challenge\*\*\s+([\d/]+)/i);
  if (!raw) return 0;
  if (raw.includes("/")) { const [a, b] = raw.split("/").map(Number); return a / b; }
  return parseFloat(raw);
}

function extractLevel(text) {
  // Try explicit bold field first: **Level** 5 or **Barbarian Level** 5
  const fromField = getText(text,
    /\*\*(?:Level|Barbarian Level|Class Level|Fighter Level|Wizard Level|Rogue Level|Cleric Level|Ranger Level|Paladin Level|Druid Level|Bard Level|Monk Level|Warlock Level|Sorcerer Level)\*\*\s+(\d+)/i
  );
  if (fromField) return extractNumber(fromField);

  // Try italic subtitle line: *Barbarian Level 5* or *Level 5 Barbarian*
  const fromSubtitle = text.match(/\*(?:[A-Za-z\s]+Level\s+(\d+)|Level\s+(\d+)\s+[A-Za-z\s]+)\*/);
  if (fromSubtitle) return +(fromSubtitle[1] || fromSubtitle[2]);

  return 1;
}

function extractClassName(text, headerLines = 10) {
  const fromField = getText(text, /\*\*Class\*\*\s*:?\s*([^\n]+)/i);
  if (fromField) return fromField;

  const headerText = text.split("\n").slice(0, headerLines).join("\n");
  for (const cls of CLASS_NAMES) {
    if (new RegExp(`\\b${cls}\\b`, "i").test(headerText)) return cls;
  }
  return "";
}

function extractLore(text, keys = ["Lore", "Who He Is", "Who She Is", "Who They Are", "Biography", "Details", "Public"]) {
  return keys.map(k => getSectionText(text, k)).filter(Boolean).join("\n\n");
}

function extractEquipment(text, keys = ["Equipment"]) {
  const raw = getSectionText(text, ...keys);
  if (!raw) return [];
  return raw.split("\n")
    .filter(l => l.trim().startsWith("-"))
    .map(l => l.replace(/^-\s*/, "").trim())
    .filter(Boolean);
}

// ─── Shop item parser ─────────────────────────────────────────────────────────
// Parses ## Shop sections with format:
// - Item Name | 15 gp
// - Item Name | 50 gp | qty: 5
// - Item Name | 1 cp | qty: unlimited

function extractShopItems(text, keys = ["Shop", "Shop Inventory", "Wares"]) {
  const raw = getSectionText(text, ...keys);
  if (!raw) return [];

  const CURRENCIES = ["cp", "sp", "ep", "gp", "pp"];
  const items = [];

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("-")) continue;

    const clean  = trimmed.replace(/^-\s*/, "").trim();
    const parts  = clean.split("|").map(p => p.trim());

    const name = parts[0];
    if (!name) continue;

    // Parse price — look for a number followed by a currency code
    let price    = 0;
    let currency = "gp";
    let quantity = -1; // -1 = unlimited

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].toLowerCase();

      // Quantity — "qty: 5" or "qty: unlimited" or "x5"
      if (/qty\s*:/i.test(parts[i])) {
        const qVal = parts[i].replace(/qty\s*:\s*/i, "").trim().toLowerCase();
        quantity = qVal === "unlimited" || qVal === "∞" ? -1 : parseInt(qVal) || -1;
        continue;
      }

      // Price — "15 gp" or "15gp"
      const priceMatch = part.match(/^([\d,]+)\s*(cp|sp|ep|gp|pp)?$/);
      if (priceMatch) {
        price    = parseInt(priceMatch[1].replace(/,/g, "")) || 0;
        currency = priceMatch[2] || "gp";
        continue;
      }
    }

    items.push({ name, price, currency, quantity });
  }

  return items;
}

function parseDuration(raw) {
  if (!raw) return { value: "", units: "inst" };
  const lower = raw.toLowerCase().trim();
  if (/instant/i.test(lower)) return { value: "", units: "inst" };
  if (/concentration/i.test(lower)) {
    const num = lower.match(/(\d+)/);
    const unit = /hour/i.test(lower) ? "hour" : /minute/i.test(lower) ? "minute" : "round";
    return { value: num ? num[1] : "1", units: unit, concentration: true };
  }
  if (/until dispelled/i.test(lower)) return { value: "", units: "disp" };
  if (/permanent/i.test(lower))       return { value: "", units: "perm" };
  const num  = lower.match(/(\d+)/);
  const unit = /hour/i.test(lower)   ? "hour"
             : /minute/i.test(lower) ? "minute"
             : /round/i.test(lower)  ? "round"
             : /day/i.test(lower)    ? "day"
             : "round";
  return { value: num ? num[1] : "1", units: unit };
}

function extractSpells(text, keys = ["Spells", "Spell List"]) {
  const raw = getSectionText(text, ...keys);
  if (!raw) return [];

  const out = [];
  for (const block of raw.split(/\n(?=\*\*[^*\n]+\*\*)/)) {
    const nm = block.match(/^\*\*([^*]+)\*\*/);
    if (!nm) continue;
    const body = block.replace(/^\*\*[^*]+\*\*\.?\s*/, "");

    const lvlM  = body.match(/(\d+)(?:st|nd|rd|th)[- ]level/i) || body.match(/Level\s+(\d+)/i) || body.match(/cantrip/i);
    const level = lvlM ? (lvlM[0].toLowerCase().includes("cantrip") ? 0 : +lvlM[1]) : 1;

    const schM   = body.match(/\b(abjuration|conjuration|divination|enchantment|evocation|illusion|necromancy|transmutation)\b/i);
    const school = schM ? SPELL_SCHOOL_MAP[schM[1].toLowerCase()] || "evo" : "evo";

    const castM          = body.match(/casting time[:\s]+([^\n.]+)/i);
    const castRaw        = castM ? castM[1].toLowerCase() : "action";
    const activationType = /bonus/.test(castRaw) ? "bonus" : /reaction/.test(castRaw) ? "reaction" : "action";

    const rngM   = body.match(/range[:\s]+([\w\s]+?)(?:\n|,|\.)/i);
    const rngRaw = rngM ? rngM[1].toLowerCase().trim() : "self";

    const durM  = body.match(/duration[:\s]+([^\n.]+)/i);
    const cmpM  = body.match(/components?[:\s]+([^\n]+)/i);
    const cmp   = cmpM ? cmpM[1] : "";
    const matM  = cmp.match(/M\s*\(([^)]+)\)/);

    const dmgM  = body.match(/([\d]+d[\d]+(?:\s*\+\s*[\d]+)?)\s+(\w+)\s+damage/i);
    const saveM = body.match(/DC\s+(\d+)\s+(\w+)\s+saving throw/i);

    out.push({
      name: nm[1].trim(),
      level, school, activationType,
      range: {
        value: extractNumber(rngRaw),
        units: /touch/.test(rngRaw) ? "touch" : /self/.test(rngRaw) ? "self" : "ft",
      },
      components: {
        vocal: /\bV\b/.test(cmp), somatic: /\bS\b/.test(cmp),
        material: /\bM\b/.test(cmp), value: matM?.[1] || "",
      },
      duration: parseDuration(durM ? durM[1] : null),
      damage: dmgM
        ? { parts: [[dmgM[1], DAMAGE_TYPE_MAP[dmgM[2].toLowerCase()] || dmgM[2].toLowerCase()]] }
        : null,
      save: saveM
        ? { ability: ABILITY_MAP[saveM[2].toLowerCase()] || saveM[2].toLowerCase().slice(0, 3), dc: +saveM[1], scaling: "flat" }
        : null,
      description: body
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        .replace(/\n/g, " ").trim(),
    });
  }
  return out;
}

// ─── Main parse function ──────────────────────────────────────────────────────

export function parseMarkdown(text) {
  const speedRaw = getText(text, /\*\*Speed\*\*\s+([^\n]+)/i) || "30 ft.";
  const flyMatch = speedRaw.match(/fly\s+(\d+)/i);

  // Read section keywords from settings
  const loreKeys        = getKeywords("loresections");
  const traitKeys       = getKeywords("traitSections");
  const featureKeys     = getKeywords("featureSections");
  const actionKeys      = getKeywords("actionSections");
  const reactionKeys    = getKeywords("reactionSections");
  const bonusKeys       = getKeywords("bonusActionSections");
  const spellKeys       = getKeywords("spellSections");
  const equipmentKeys   = getKeywords("equipmentSections");
  const idealKeys       = getKeywords("idealSections");
  const bondKeys        = getKeywords("bondSections");
  const flawKeys        = getKeywords("flawSections");
  const headerLines     = getSetting("searchHeaderLines") || 10;

  return {
    title:          getText(text, /^#\s+(.+)$/m, /^\*\*([^*\n]+)\*\*/m) || "Unknown",
    className:      extractClassName(text, headerLines),
    race:           getText(text, /\*\*Race\*\*\s*:?\s*([^\n]+)/i),
    background:     getText(text, /\*\*Background\*\*\s*:?\s*([^\n]+)/i),
    alignment:      getText(text, /\*\*Alignment\*\*\s*:?\s*([^\n]+)/i),
    level:          extractLevel(text),
    hp:             extractNumber(getText(text, /\*\*Hit Points\*\*\s+([\d]+)/i)) || 10,
    ac:             extractNumber(getText(text, /\*\*Armor Class\*\*\s+([\d]+)/i)) || 10,
    speedWalk:      extractNumber(speedRaw) || 30,
    speedFly:       flyMatch ? +flyMatch[1] : 0,
    speedHover:     /hover/i.test(speedRaw),
    cr:             extractCR(text),
    profBonus:      extractNumber(getText(text, /\*\*Proficiency Bonus\*\*\s+\+?([\d]+)/i)) || 2,
    abilities:      extractAbilities(text),
    saves:          extractSaves(text),
    resistances:    getText(text, /\*\*Damage Resistances\*\*\s+([^\n]+)/i),
    immunities:     getText(text, /\*\*Damage Immunities\*\*\s+([^\n]+)/i),
    condImmunities: getText(text, /\*\*Condition Immunities\*\*\s+([^\n]+)/i),
    vulnerabilities:getText(text, /\*\*Damage Vulnerabilities\*\*\s+([^\n]+)/i),
    senses:         getText(text, /\*\*Senses\*\*\s+([^\n]+)/i),
    languages:      getText(text, /\*\*Languages\*\*\s+([^\n]+)/i),
    ideals:         sectionToPlain(getSectionText(text, ...idealKeys)),
    bonds:          sectionToPlain(getSectionText(text, ...bondKeys)),
    flaws:          sectionToPlain(getSectionText(text, ...flawKeys)),
    loreRaw:        extractLore(text, loreKeys),
    traits:         getSection(text, ...traitKeys),
    features:       getSection(text, ...featureKeys),
    actions:        getSection(text, ...actionKeys),
    reactions:      getSection(text, ...reactionKeys),
    bonusActions:   getSection(text, ...bonusKeys),
    spells:         extractSpells(text, spellKeys),
    equipment:      extractEquipment(text, equipmentKeys),
    shopItems:      extractShopItems(text),
  };
}
