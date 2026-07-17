# Markdown Importer

Drag and drop markdown files onto the Foundry canvas to import them as NPC actors, player characters, or journal entries.

---

## Installation

1. Copy the `lawbrand-importer` folder into your Foundry modules directory:

```
<User Data Path>/Data/modules/lawbrand-importer/
```

Find your User Data Path in Foundry under **Setup > Configuration > User Data Path**.

On a standard Linux install this is usually:

```
~/.local/share/FoundryVTT/Data/modules/
```

2. Enable the module in **Settings > Manage Modules**
3. Save and reload

---

## How to Use

1. Open your Foundry world to any scene
2. Drag one or more `.md` files from your file explorer onto the Foundry canvas
3. A dialog appears for each file with four options:

| Button | Result |
|---|---|
| NPC Actor | Creates a full NPC with stat block, traits, actions, reactions |
| Player Character | Creates a PC sheet with abilities, features, equipment |
| Journal Entry | Creates a formatted journal page |
| Cancel | Skips this file |

4. Optionally tick **Look up ability names online** to match skill and damage type names to their D&D Beyond counterparts before import

---

## What Gets Parsed

### NPC and PC Actors
- Name from the top level heading
- HP, AC, speed, proficiency bonus, CR
- All six ability scores from the stat table
- Saving throws and skills
- Damage resistances, immunities, vulnerabilities, condition immunities
- Senses and languages
- Traits and class features as passive feat items
- Actions: attacks become weapon items, others become feat items
- Reactions as reaction items
- Bonus actions as bonus action items

### PC Only
- Race, background, alignment, level
- Equipment lines become loot items
- Biography from the Lore or Background section
- Saving throw proficiencies inferred from bonus values

### Journal Entry
- Top level heading becomes the entry name
- Full markdown converted to formatted HTML
- Headers, bold, italic, blockquotes, lists, horizontal rules all preserved

---

## Compatibility

- Foundry VTT v12 to v14
- D&D 5e system
