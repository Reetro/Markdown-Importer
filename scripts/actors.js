// Markdown Importer — actors.js
// Creates NPC and PC actors in Foundry from parsed markdown data

import { attachItems } from "./items.js";
import { findClassInCompendium } from "./compendium.js";

function bio(loreRaw) {
  return loreRaw
    ? { value: loreRaw, public: loreRaw, format: 2 }
    : { value: "", public: "", format: 2 };
}

function abilityObj(abilities) {
  return Object.fromEntries(
    ["str","dex","con","int","wis","cha"].map(ab => [ab, { value: abilities[ab] }])
  );
}

// ─── NPC ─────────────────────────────────────────────────────────────────────

export async function createNPCActor(p) {
  const actor = await Actor.create({
    name: p.title,
    type: "npc",
    system: {
      attributes: {
        hp:       { value: p.hp, max: p.hp, min: 0 },
        ac:       { flat: p.ac, calc: "flat" },
        movement: { walk: p.speedWalk, fly: p.speedFly, hover: p.speedHover },
        prof:     p.profBonus,
      },
      abilities: abilityObj(p.abilities),
      details: {
        cr:        p.cr,
        type:      { value: "humanoid", custom: "" },
        biography: bio(p.loreRaw),
      },
      traits: {
        dr:        { value: [], custom: p.resistances },
        di:        { value: [], custom: p.immunities },
        ci:        { value: [], custom: p.condImmunities },
        dv:        { value: [], custom: p.vulnerabilities },
        senses:    { special: p.senses },
        languages: { custom: p.languages },
      },
    },
    prototypeToken: {
      name: p.title, displayName: 20,
      actorLink: false, disposition: -1,
      displayBars: 20, bar1: { attribute: "attributes.hp" },
    },
  });

  await attachItems(actor, p, "npc");
  return actor;
}

// ─── Player Character ─────────────────────────────────────────────────────────

export async function createPCActor(p) {
  const actor = await Actor.create({
    name: p.title,
    type: "character",
    system: {
      attributes: {
        hp:       { value: p.hp, max: p.hp, min: 0 },
        ac:       { flat: p.ac, calc: p.ac ? "flat" : "default" },
        movement: { walk: p.speedWalk },
        prof:     p.profBonus,
      },
      abilities: abilityObj(p.abilities),
      details: {
        alignment: p.alignment,
        biography: bio(p.loreRaw),
      },
      traits: {
        languages: { custom: p.languages },
        senses:    { special: p.senses },
      },
      personality: {
        trait: "",
        ideal: p.ideals,
        bond:  p.bonds,
        flaw:  p.flaws,
      },
    },
    prototypeToken: {
      name: p.title, displayName: 20,
      actorLink: true, disposition: 1,
      displayBars: 20, bar1: { attribute: "attributes.hp" },
    },
  });

  await attachItems(actor, p, "character");
  await attachClass(actor, p);
  return actor;
}

async function attachClass(actor, p) {
  if (!p.className) return;

  try {
    const classDoc = await findClassInCompendium(p.className);
    if (classDoc) {
      const classData        = classDoc.toObject();
      classData.system.levels = p.level || 1;
      await actor.createEmbeddedDocuments("Item", [classData]);
      ui.notifications.info(`Markdown Importer: Added class "${classDoc.name}" at level ${p.level || 1}`);
    } else {
      ui.notifications.warn(`Markdown Importer: Class "${p.className}" not found in compendium — add it manually`);
    }
  } catch (err) {
    console.warn(`Markdown Importer: Could not look up class "${p.className}" — ${err.message}`);
  }
}
