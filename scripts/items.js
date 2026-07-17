// Markdown Importer — items.js
// Builds and attaches embedded Item documents to actors

import { DAMAGE_TYPE_MAP } from "./constants.js";
import { abilityMod } from "./parser.js";
import { resolveIcon } from "./icons.js";

// ─── Tab placement in dnd5e v3+ ───────────────────────────────────────────────
// type.value controls which Features section an item appears in
// activation.type controls whether it shows in Actions tab
//
// Passive traits:          type.value="monster", activation.type=""  → Features tab
// Active NPC actions:      type.value="monster", activation.type="action" → Actions tab
// Reactions:               type.value="monster", activation.type="reaction" → Actions tab
// Bonus actions:           type.value="monster", activation.type="bonus" → Actions tab
// Weapons:                 type="weapon", activation.type="action" → Actions tab

function isAttack(f) {
  if (/^multiattack$/i.test(f.name.trim())) return false;
  return /(?:melee|ranged) weapon attack:/i.test(f.description);
}

export async function attachItems(actor, p, actorType) {
  const allFeatures = [...p.traits, ...p.features];

  // Passive features — Features tab
  for (const f of allFeatures) {
    await safeCreate(actor, await buildFeat(f, ""));
  }

  // Actions — Actions tab
  for (const f of p.actions) {
    if (isAttack(f)) {
      await safeCreate(actor, await buildWeapon(f, p));
    } else {
      await safeCreate(actor, await buildFeat(f, "action"));
    }
  }

  // Reactions — Actions tab
  for (const f of p.reactions) {
    await safeCreate(actor, await buildReaction(f));
  }

  // Bonus actions — Actions tab
  for (const f of p.bonusActions) {
    await safeCreate(actor, await buildFeat(f, "bonus"));
  }

  // Spells — Spells tab
  for (const sp of p.spells) {
    await safeCreate(actor, await buildSpell(sp));
  }

  // Equipment — Gear tab (PC only)
  if (actorType === "character") {
    for (const eq of p.equipment) {
      await safeCreate(actor, await buildEquipment(eq));
    }
  }
}

async function safeCreate(actor, itemData) {
  try {
    await actor.createEmbeddedDocuments("Item", [itemData]);
  } catch (err) {
    console.warn(`Markdown Importer: Skipped item "${itemData.name}" — ${err.message}`);
  }
}

// ─── Item builders ────────────────────────────────────────────────────────────

async function buildFeat(f, activationType) {
  const isPassive = !activationType;

  // Active abilities use weapon type — this is what places them in the Actions tab
  // in dnd5e v3+. Passive traits use feat type which places them in Features tab.
  if (!isPassive) {
    return {
      name: f.name,
      type: "weapon",
      img:  await resolveIcon(f.name, "weapon"),
      system: {
        description: { value: `<p>${f.description}</p>` },
        activation:  { type: activationType, cost: 1 },
        actionType:  "other",
        damage:      { parts: [] },
        equipped:    true,
        proficient:  false,
        properties:  [],
      },
    };
  }

  return {
    name: f.name,
    type: "feat",
    img:  await resolveIcon(f.name, "feat"),
    system: {
      description: { value: `<p>${f.description}</p>` },
      type:        { value: "monster", subtype: "" },
      activation:  { type: "", cost: null },
    },
  };
}

async function buildReaction(f) {
  return {
    name: f.name,
    type: "weapon",
    img:  await resolveIcon(f.name, "weapon"),
    system: {
      description: { value: `<p>${f.description}</p>` },
      activation:  { type: "reaction", cost: 1 },
      actionType:  "other",
      damage:      { parts: [] },
      equipped:    true,
      proficient:  false,
      properties:  [],
    },
  };
}

async function buildWeapon(f, p) {
  const atkM = f.description.match(/\+([\d]+) to hit/i);
  const dmgM = f.description.match(/([\d]+)\s*\(([\ddD+\-\s]+)\)\s+(\w+)\s+damage/i);
  const dmgT = dmgM ? DAMAGE_TYPE_MAP[dmgM[3].toLowerCase()] || dmgM[3].toLowerCase() : "bludgeoning";

  return {
    name: f.name,
    type: "weapon",
    img:  await resolveIcon(f.name, "weapon"),
    system: {
      description: { value: `<p>${f.description}</p>` },
      activation:  { type: "action", cost: 1 },
      actionType:  "mwak",
      attackBonus: atkM
        ? +atkM[1] - abilityMod(p.abilities.str) - p.profBonus
        : 0,
      damage:     { parts: dmgM ? [[dmgM[2].trim(), dmgT]] : [["1d6", "bludgeoning"]] },
      equipped:   true,
      proficient: true,
    },
  };
}

async function buildSpell(sp) {
  return {
    name: sp.name,
    type: "spell",
    img:  await resolveIcon(sp.name, "spell"),
    system: {
      description: { value: `<p>${sp.description}</p>` },
      level:       sp.level,
      school:      sp.school,
      activation:  { type: sp.activationType, cost: 1 },
      range:       sp.range,
      components:  sp.components,
      duration:    sp.duration || { value: "", units: "inst" },
      damage:      sp.damage || { parts: [] },
      save:        sp.save || { ability: "", dc: null, scaling: "spell" },
      preparation: { mode: "prepared", prepared: true },
    },
  };
}

async function buildEquipment(name) {
  return {
    name,
    type: "equipment",
    img:  await resolveIcon(name, "equipment"),
    system: {
      description: { value: "" },
      quantity:    1,
      weight:      0,
      price:       { value: 0, denomination: "gp" },
      equipped:    false,
      rarity:      "common",
    },
  };
}
