// Markdown Importer — icons.js
// Looks up icons from the dnd5e compendiums by item name.
// Falls back to type-based defaults if nothing is found.

// ─── Type defaults ────────────────────────────────────────────────────────────

const TYPE_DEFAULTS = {
  weapon:    "systems/dnd5e/icons/svg/items/weapon.svg",
  spell:     "systems/dnd5e/icons/svg/items/spell.svg",
  feat:      "systems/dnd5e/icons/svg/items/feature.svg",
  equipment: "systems/dnd5e/icons/svg/items/equipment.svg",
  loot:      "systems/dnd5e/icons/svg/items/loot.svg",
};

const FALLBACK = "icons/svg/item-bag.svg";

// ─── Compendium index cache ───────────────────────────────────────────────────
// Build once per session, reuse for every item lookup

let _iconCache = null;

async function buildIconCache() {
  if (_iconCache) return _iconCache;

  _iconCache = new Map();

  for (const pack of game.packs) {
    if (pack.metadata.type !== "Item") continue;
    try {
      const index = await pack.getIndex({ fields: ["name", "img", "type"] });
      for (const entry of index) {
        if (!entry.img || !entry.name) continue;
        // Store by lowercase name — first match wins so system packs take priority
        const key = entry.name.toLowerCase().trim();
        if (!_iconCache.has(key)) {
          _iconCache.set(key, entry.img);
        }
      }
    } catch (err) {
      console.warn(`Markdown Importer: Could not index pack "${pack.metadata.label}" for icons — ${err.message}`);
    }
  }

  console.log(`Markdown Importer: Icon cache built — ${_iconCache.size} entries`);
  return _iconCache;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function resolveIcon(name, type) {
  const cache = await buildIconCache();

  // Exact name match
  const exact = cache.get(name.toLowerCase().trim());
  if (exact) return exact;

  // Partial match — item name starts with the search name
  // e.g. "Rage" matches "Rage (3/Day)" in the compendium
  const partial = [...cache.entries()].find(
    ([k]) => k.startsWith(name.toLowerCase().trim()) || name.toLowerCase().trim().startsWith(k)
  );
  if (partial) return partial[1];

  // Type default
  return TYPE_DEFAULTS[type] || FALLBACK;
}

// Call this on module ready to pre-warm the cache in the background
export function prewarmIconCache() {
  buildIconCache().catch(err =>
    console.warn("Markdown Importer: Icon cache pre-warm failed —", err.message)
  );
}
