// Markdown Importer — compendium.js
// Handles all compendium lookups for classes and other documents

export async function findClassInCompendium(className) {
  if (!className) return null;

  const search = className.toLowerCase().trim();

  // Collect all item packs, prioritising ones with "class" in their id/name
  const allItemPacks = game.packs.filter(p => p.metadata.type === "Item");
  const classPacks   = allItemPacks.filter(p =>
    p.metadata.id?.includes("class") ||
    p.metadata.name?.includes("class") ||
    p.metadata.label?.toLowerCase().includes("class")
  );
  const otherPacks   = allItemPacks.filter(p => !classPacks.includes(p));

  // Search class-specific packs first, then broader packs
  for (const pack of [...classPacks, ...otherPacks]) {
    try {
      const index = await pack.getIndex({ fields: ["name", "type"] });
      const entry = index.find(e =>
        e.name.toLowerCase() === search &&
        (pack === classPacks[0] || e.type === "class")
      );
      if (entry) {
        const doc = await pack.getDocument(entry._id);
        return doc;
      }
    } catch (err) {
      console.warn(`Markdown Importer: Error searching pack "${pack.metadata.label}" — ${err.message}`);
    }
  }

  return null;
}
