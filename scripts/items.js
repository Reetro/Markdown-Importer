// Markdown Importer — items.js
// Builds and attaches embedded Item documents to actors

import { DAMAGE_TYPE_MAP } from "./constants.js";
import { abilityMod } from "./parser.js";
import { resolveIcon } from "./icons.js";

function isAttack(f) {
  // Exclude Multiattack by name — it describes attacks but is not itself an attack roll
  if (/^multiattack$/i.test(f.name.trim())) return false;
  // Must contain the exact DnD attack notation with a colon
  // e.g. "Melee Weapon Attack: +8 to hit"
  return /(?:melee|ranged) weapon attack:/i.test(f.description);
}

export async function attachItems(actor, p, actorType) {
  const allFeatures = [...p.traits, ...p.features];

  for (const f of allFeatures)    await safeCreate(actor, await featItem(f, "passive"));
  for (const f of p.actions)      await safeCreate(actor, await (isAttack(f) ? attackItem(f, p) : featItem(f, "action")));
  for (const f of p.reactions)    await safeCreate(actor, await featItem(f, "reaction"));
  for (const f of p.bonusActions) await safeCreate(actor, await featItem(f, "bonus"));
  for (const sp of p.spells)      await safeCreate(actor, await spellItem(sp));

  if (actorType === "character") {
    for (const eq of p.equipment) await safeCreate(actor, await equipmentItem(eq));
  }
}

async function safeCreate(actor, itemData) {
  try {
    await actor.createEmbeddedDocuments("Item", [itemData]);
  } catch (err) {
    console.warn(`Markdown Importer: Skipped item "${itemData.name}" — ${err.message}`);
  }
}

async function featItem(f, activation) {
  // In dnd5e v3+ feat type.value controls which tab the item appears in
  // "class" = Features tab (passive)
  // "monster" = Features tab (NPC abilities)
  // "feat" = Feats tab
  // Setting it to "monster" for NPC abilities and "class" for passive PC features
  const featType = activation === "passive" ? "monster" : "monster";

  return {
    name: f.name,
    type: "feat",
    img:  await resolveIcon(f.name, "feat"),
    system: {
      description: { value: `<p>${f.description}</p>` },
      type:        { value: featType, subtype: "" },
      activation:  {
        type:  activation === "passive" ? "" : activation,
        cost:  activation === "passive" ? null : 1,
      },
    },
  };
}

async function attackItem(f, p) {
  const atkM  = f.description.match(/\+([\d]+) to hit/i);
  const dmgM  = f.description.match(/([\d]+)\s*\(([\ddD+\-\s]+)\)\s+(\w+)\s+damage/i);
  const dmgT  = dmgM ? DAMAGE_TYPE_MAP[dmgM[3].toLowerCase()] || dmgM[3].toLowerCase() : "bludgeoning";

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
      damage:    { parts: dmgM ? [[dmgM[2].trim(), dmgT]] : [["1d6", "bludgeoning"]] },
      equipped:  true,
      proficient: true,
    },
  };
}

async function spellItem(sp) {
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

async function equipmentItem(name) {
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
