// Markdown Importer — items.js
// Builds and attaches embedded Item documents to actors
// Uses dnd5e v3+ system.activities for correct tab placement

import { DAMAGE_TYPE_MAP } from "./constants.js";
import { abilityMod } from "./parser.js";
import { resolveIcon } from "./icons.js";

// ─── dnd5e v3+ Activity system ────────────────────────────────────────────────
// In v3+ items store activities in system.activities
// The activity type controls which tab it appears in:
//   "utility"  → Actions tab (non-attack active abilities)
//   "attack"   → Actions tab (weapon attacks)
// Passive features have NO activities — they appear in Features tab

function makeActivityId() {
  return foundry.utils.randomID();
}

function utilityActivity(activationType) {
  const id = makeActivityId();
  return {
    [id]: {
      _id: id,
      type: "utility",
      activation: {
        type: activationType,
        value: 1,
        condition: "",
        override: false,
      },
    }
  };
}

function attackActivity(atkBonus, dmgParts) {
  const id = makeActivityId();
  return {
    [id]: {
      _id: id,
      type: "attack",
      attack: {
        bonus: String(atkBonus || 0),
        flat: atkBonus !== 0,
        type: { value: "melee", classification: "weapon" },
      },
      damage: { parts: dmgParts },
      activation: {
        type: "action",
        value: 1,
        condition: "",
        override: false,
      },
    }
  };
}

function isAttack(f) {
  if (/^multiattack$/i.test(f.name.trim())) return false;
  return /(?:melee|ranged) weapon attack:/i.test(f.description);
}

// ─── Attach all items ─────────────────────────────────────────────────────────

export async function attachItems(actor, p, actorType) {
  // Passive features — no activities, appear in Features tab
  for (const f of [...p.traits, ...p.features]) {
    await safeCreate(actor, await buildPassiveFeat(f));
  }

  // Actions
  for (const f of p.actions) {
    if (isAttack(f)) {
      await safeCreate(actor, await buildAttackFeat(f, p));
    } else {
      await safeCreate(actor, await buildActiveFeat(f, "action"));
    }
  }

  // Reactions
  for (const f of p.reactions) {
    await safeCreate(actor, await buildActiveFeat(f, "reaction"));
  }

  // Bonus actions
  for (const f of p.bonusActions) {
    await safeCreate(actor, await buildActiveFeat(f, "bonus"));
  }

  // Spells
  for (const sp of p.spells) {
    await safeCreate(actor, await buildSpell(sp));
  }

  // Equipment (PC only)
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

// Passive feature — no activities — lands in Features tab
async function buildPassiveFeat(f) {
  return {
    name: f.name,
    type: "feat",
    img: await resolveIcon(f.name, "feat"),
    system: {
      description: { value: `<p>${f.description}</p>` },
      type: { value: "monster", subtype: "" },
    },
  };
}

// Active feat with a utility activity — lands in Actions tab
async function buildActiveFeat(f, activationType) {
  return {
    name: f.name,
    type: "feat",
    img: await resolveIcon(f.name, "feat"),
    system: {
      description: { value: `<p>${f.description}</p>` },
      type: { value: "monster", subtype: "" },
      activities: utilityActivity(activationType),
    },
  };
}

// Attack feat with an attack activity — lands in Actions tab with roll button
async function buildAttackFeat(f, p) {
  const atkM  = f.description.match(/\+([\d]+) to hit/i);
  const dmgM  = f.description.match(/([\d]+)\s*\(([\ddD+\-\s]+)\)\s+(\w+)\s+damage/i);
  const dmgT  = dmgM ? DAMAGE_TYPE_MAP[dmgM[3].toLowerCase()] || dmgM[3].toLowerCase() : "bludgeoning";
  const bonus = atkM ? +atkM[1] - abilityMod(p.abilities.str) - p.profBonus : 0;

  const dmgParts = dmgM ? [{
    number: null,
    denomination: null,
    bonus: dmgM[2].trim(),
    types: [dmgT],
    custom: { enabled: true, formula: dmgM[2].trim() },
    scaling: { mode: "", number: null, formula: "" },
  }] : [];

  return {
    name: f.name,
    type: "feat",
    img: await resolveIcon(f.name, "feat"),
    system: {
      description: { value: `<p>${f.description}</p>` },
      type: { value: "monster", subtype: "" },
      activities: attackActivity(bonus, dmgParts),
    },
  };
}

async function buildSpell(sp) {
  const actId = makeActivityId();
  return {
    name: sp.name,
    type: "spell",
    img: await resolveIcon(sp.name, "spell"),
    system: {
      description: { value: `<p>${sp.description}</p>` },
      level: sp.level,
      school: sp.school,
      components: sp.components,
      duration: sp.duration,
      range: sp.range,
      preparation: { mode: "prepared", prepared: true },
      activities: {
        [actId]: {
          _id: actId,
          type: "utility",
          activation: { type: sp.activationType, value: 1, condition: "", override: false },
        }
      },
    },
  };
}

async function buildEquipment(name) {
  return {
    name,
    type: "equipment",
    img: await resolveIcon(name, "equipment"),
    system: {
      description: { value: "" },
      quantity: 1,
      weight: 0,
      price: { value: 0, denomination: "gp" },
      equipped: false,
      rarity: "common",
    },
  };
}
EOF
echo "Done"

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
  return {
    name: f.name,
    type: "feat",
    img:  await resolveIcon(f.name, "feat"),
    system: {
      description: { value: `<p>${f.description}</p>` },
      type:        { value: "monster", subtype: "" },
      activation:  {
        type: activationType || "",
        cost: isPassive ? null : 1,
      },
    },
  };
}

async function buildReaction(f) {
  return {
    name: f.name,
    type: "feat",
    img:  await resolveIcon(f.name, "feat"),
    system: {
      description: { value: `<p>${f.description}</p>` },
      type:        { value: "monster", subtype: "reaction" },
      activation:  { type: "reaction", cost: 1 },
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
      duration:    sp.duration,
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
