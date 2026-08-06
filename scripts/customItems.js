// customItems.js — Create custom dnd5e items from markdown definitions

const ITEM_TYPE_MAP = {
  weapon:     "weapon",
  armor:      "equipment",
  armour:     "equipment",
  equipment:  "equipment",
  consumable: "consumable",
  potion:     "consumable",
  tool:       "tool",
  loot:       "loot",
  treasure:   "loot",
  feature:    "feat",
  feat:       "feat",
  spell:      "spell",
};

const RARITY_MAP = {
  common:      "common",
  uncommon:    "uncommon",
  rare:        "rare",
  "very rare": "veryRare",
  veryrare:    "veryRare",
  legendary:   "legendary",
  artifact:    "artifact",
};

const TYPE_ICONS = {
  weapon:     "icons/weapons/swords/sword-guard-gold.webp",
  equipment:  "icons/equipment/chest/breastplate-steel-grey.webp",
  consumable: "icons/consumables/potions/potion-flask-round-red.webp",
  tool:       "icons/tools/hand/hammer-claw-steel-grey.webp",
  loot:       "icons/commodities/treasure/coins-plain-stack-gold-large.webp",
  feat:       "icons/magic/symbols/rune-star-triangle.webp",
  spell:      "icons/magic/light/beam-rays-yellow.webp",
};

export async function buildCustomItemData(shopItem) {
  const props      = shopItem.customProps || {};
  const type       = ITEM_TYPE_MAP[props.type?.toLowerCase()] || "loot";
  const rarity     = RARITY_MAP[props.rarity?.toLowerCase()] || "common";
  const weight     = parseFloat(props.weight) || 0;
  const description = props.description || "";
  const icon       = props.icon || TYPE_ICONS[type] || "icons/svg/item-bag.svg";
  const damage     = props.damage || null;
  const damageType = props["damage type"] || props.damagetype || null;
  const range      = props.range || null;
  const acBonus    = parseInt(props.ac) || null;

  const system = {
    description: { value: `<p>${description}</p>` },
    rarity,
    price:    { value: shopItem.price ?? 0, denomination: shopItem.currency ?? "gp" },
    weight:   { value: weight },
    quantity: shopItem.quantity === -1 ? 1 : (shopItem.quantity ?? 1),
  };

  if (type === "weapon" && damage) {
    const dmgParts = damage.match(/(\d+)d(\d+)/i);
    system.damage = {
      base: {
        number:       dmgParts ? parseInt(dmgParts[1]) : 1,
        denomination: dmgParts ? parseInt(dmgParts[2]) : 4,
        types:        damageType ? [damageType.toLowerCase()] : [],
      },
    };
    if (range) {
      const rangeParts = range.match(/(\d+)(?:\/(\d+))?/);
      system.range = {
        value: rangeParts ? parseInt(rangeParts[1]) : 5,
        long:  rangeParts?.[2] ? parseInt(rangeParts[2]) : null,
        units: "ft",
      };
    }
  }

  if (type === "equipment" && acBonus) {
    system.armor = { value: acBonus };
  }

  return {
    name:   shopItem.name,
    type,
    img:    icon,
    system,
  };
}

export async function createCustomItem(shopItem) {
  const data    = await buildCustomItemData(shopItem);
  const created = await Item.create(data);
  ui.notifications.info(`Markdown Importer: Created custom item "${created.name}"`);
  return created;
}

// Attach custom items directly to an actor
export async function attachCustomItems(actor, parsed) {
  const customItems = parsed.customItems || [];
  if (!customItems.length) return;

  const itemsToCreate = [];

  for (const shopItem of customItems) {
    try {
      const data = await buildCustomItemData(shopItem);
      itemsToCreate.push(data);
    } catch(e) {
      console.error(`Markdown Importer: Failed to build custom item "${shopItem.name}":`, e);
    }
  }

  if (itemsToCreate.length) {
    await actor.createEmbeddedDocuments("Item", itemsToCreate);
    ui.notifications.info(`Markdown Importer: Added ${itemsToCreate.length} custom item${itemsToCreate.length !== 1 ? "s" : ""} to ${actor.name}`);
  }
}
