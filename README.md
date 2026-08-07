# Markdown Importer

A Foundry VTT module for D&D 5e that imports markdown files as NPC actors, player characters, journal entries, and merchant shops. Drag and drop `.md` files onto the canvas or use the built-in editor to write and import directly.

---

## How to Use

### Drag and Drop

Drag any `.md` file onto the Foundry canvas. A dialog will appear asking what to create — NPC Actor, Player Character, Journal Entry, or Merchant Shop (if the Merchant Sheet module is installed).

### Markdown Editor

Click the **Tiles** group in the scene controls toolbar on the left side of the screen. The **Markdown Editor** button (file-code icon) opens a built-in editor where you can write or paste markdown and import it directly without touching a file.

The editor has three or four save buttons at the bottom depending on which modules are installed:

- **Save as NPC** — creates an NPC actor
- **Save as Player** — creates a player character actor
- **Save as Journal** — creates a journal entry
- **Save as Shop** — creates a merchant shop (only visible if Merchant Sheet is installed)

---

## Markdown Syntax

### Basic Structure

Every file should start with a title as a level-one heading. The title becomes the actor or journal name.

```markdown
# Character Name
*Size Race, Alignment*
```

---

### NPC Stat Block

```markdown
# Goblin Scout
*Small Humanoid (Goblinoid), Neutral Evil*

**Armor Class** 13 (leather armour)
**Hit Points** 10 (3d6)
**Speed** 30 ft.

| STR | DEX | CON | INT | WIS | CHA |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 8 (-1) | 14 (+2) | 10 (+0) | 10 (+0) | 8 (-1) | 8 (-1) |

**Skills** Stealth +6
**Senses** Darkvision 60 ft., Passive Perception 9
**Languages** Common, Goblin
**Challenge** 1/4 (50 XP) | **Proficiency Bonus** +2

---

## Features

**Nimble Escape.**
The goblin can take the Disengage or Hide action as a bonus action on each of its turns.

---

## Actions

**Scimitar.** *Melee Weapon Attack:* +4 to hit, reach 5 ft., one target.
*Hit:* 5 (1d6 + 2) slashing damage.

**Shortbow.** *Ranged Weapon Attack:* +4 to hit, range 80/320 ft., one target.
*Hit:* 5 (1d6 + 2) piercing damage.

---

## Reactions

**Redirect Attack.**
When a creature targets the goblin with an attack it can use its reaction to redirect the attack to an adjacent ally.
```

---

### Player Character

PC sheets support everything above plus class, level, and personality traits.

```markdown
# Seraphine Voss
*Medium Human, Chaotic Good*

**Class** Rogue
**Armor Class** 14 (studded leather)
**Hit Points** 38 (7d8 + 7)
**Speed** 30 ft.

| STR | DEX | CON | INT | WIS | CHA |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 10 (+0) | 18 (+4) | 12 (+1) | 14 (+2) | 12 (+1) | 14 (+2) |

---

## Features

**Sneak Attack.**
Once per turn Seraphine deals an extra 3d6 damage to a creature she hits with a finesse weapon if she has advantage on the attack roll.

---

## Actions

**Shortsword.** *Melee Weapon Attack:* +6 to hit, reach 5 ft.
*Hit:* 7 (1d6 + 4) piercing damage.

---

## Ideals

Freedom is the only thing worth fighting for.

## Bonds

I owe a debt to the thieves guild that I am not sure I can repay.

## Flaws

I never back down from a bet even when I should.
```

---

### Spells

Add a `## Spells` section. Each spell needs its level, school, casting time, range, components, and duration on the first line.

```markdown
## Spells

**Fireball.** 3rd-level evocation. Casting Time: 1 action. Range: 150 ft. Components: V, S, M. Duration: Instantaneous. Each creature in a 20-foot radius must make a DC 14 Dexterity saving throw, taking 28 (8d6) fire damage on a failed save.

**Mage Hand.** Cantrip, conjuration. Casting Time: 1 action. Range: 30 ft. Components: V, S. Duration: 1 minute. A spectral hand appears at a point you choose.

**Shield.** 1st-level abjuration. Casting Time: 1 reaction. Range: Self. Components: V, S. Duration: 1 round. An invisible barrier of magical force appears and protects you.
```

**Supported spell keywords:**
- Level: `Cantrip`, `1st-level`, `2nd-level`, `3rd-level` etc.
- School: `abjuration`, `conjuration`, `divination`, `enchantment`, `evocation`, `illusion`, `necromancy`, `transmutation`
- Duration: `Instantaneous`, `1 round`, `1 minute`, `1 hour`, `Concentration, up to 1 minute` etc.
- Saves: `DC 14 Dexterity saving throw`, `DC 16 Wisdom saving throw` etc.
- Damage: `8d6 fire damage`, `3d8 + 5 radiant damage` etc.

---

### Custom Items

Add a `## Custom Items` section to create real dnd5e items and attach them to the actor automatically.

```markdown
## Custom Items

- Serpent Fang Dagger
  - type: weapon
  - rarity: rare
  - weight: 1
  - damage: 1d4
  - damage type: piercing
  - range: 20/60
  - description: A curved dagger carved from a desert serpent fang. On a hit the target must make a DC 14 Constitution saving throw or take 2d6 poison damage.
  - icon: icons/weapons/daggers/dagger-curved-black.webp

- Shadowcloak
  - type: equipment
  - rarity: uncommon
  - weight: 2
  - description: While worn in dim light or darkness the wearer has advantage on Stealth checks.
  - icon: icons/equipment/back/cape-layered-blue-grey.webp
```

**Supported types:** `weapon`, `armor` / `armour`, `equipment`, `consumable`, `potion`, `tool`, `loot`, `treasure`, `feature`, `feat`, `spell`

**Supported rarities:** `common`, `uncommon`, `rare`, `very rare`, `legendary`, `artifact`

**Supported sub-properties:**
| Property | Description | Example |
|---|---|---|
| `type` | Item type | `weapon` |
| `rarity` | Item rarity | `rare` |
| `weight` | Weight in lbs | `3` |
| `description` | Item description | `A curved blade...` |
| `icon` | Path to icon image | `icons/weapons/swords/sword-guard-gold.webp` |
| `damage` | Damage dice (weapons) | `1d8` |
| `damage type` | Damage type (weapons) | `slashing` |
| `range` | Range in feet (weapons) | `5` or `20/60` |
| `ac` | Armour class value (armour) | `15` |

---

### Merchant Shop

Add a `## Shop` section to import as a merchant. Use with the **Merchant Sheet module**.

```markdown
# Aldric's Arms & Armour
*Weapons and equipment merchant*

## Lore

Aldric has run his smithy on the waterfront for thirty years. He does not haggle.

---

## Shop

- Longsword | 15 gp
- Dagger | 2 gp | qty: 5
- Health Potion | 50 gp | qty: 3
- Chain Mail | 75 gp | qty: 1
- Rope, Hempen (50 ft.) | 1 gp | qty: unlimited
- Torch | 1 cp | qty: unlimited
```

**Shop item format:** `- Item Name | price currency | qty: amount`

- Currency options: `cp`, `sp`, `ep`, `gp`, `pp`
- Quantity: a number, `unlimited`, or `∞`
- Omit quantity for unlimited stock

**Custom shop items** — add `| custom` to the line then define properties on indented lines below:

```markdown
- Auroboros Shard | 50 gp | qty: 3 | custom
  - type: loot
  - rarity: uncommon
  - description: A fragment of crystallised Auroboros energy. Faintly warm to the touch.
  - icon: systems/dnd5e/icons/items/treasure/crystal.webp
```

Custom shop items are created as real world items with a compendium UUID so they can be linked and opened from the merchant sheet.

---

## Settings

Open the settings menu via **Settings > Module Settings > Markdown Importer > Configure**.

### Section Keywords

These settings control which markdown headings the parser looks for. Each is a comma-separated list of heading names. Matching is case insensitive.

| Setting | Default | Purpose |
|---|---|---|
| **Lore / Biography** | `Lore, Who He Is, Who She Is, Who They Are, Biography, Details, Public` | Populates the actor's biography field |
| **Traits** | `Racial Traits, Traits` | Creates passive feat items |
| **Class Features** | `Class Features, Features` | Creates class feature items |
| **Actions** | `Actions` | Creates weapon and active ability items |
| **Reactions** | `Reactions` | Creates reaction items |
| **Bonus Actions** | `Bonus Actions` | Creates bonus action items |
| **Spells** | `Spells, Spell List` | Creates spell items |
| **Equipment** | `Equipment` | Creates equipment items for PC actors |
| **Ideals** | `Ideals` | Populates the PC ideals field |
| **Bonds** | `Bonds` | Populates the PC bonds field |
| **Flaws** | `Flaws` | Populates the PC flaws field |

### Parsing Behaviour

| Setting | Default | Purpose |
|---|---|---|
| **Class name search depth** | `10` | How many lines from the top of the file the parser searches for a class name when importing a PC |
| **Normalise skill and damage names** | Off | Formats skill and damage type names to match Foundry's internal naming conventions before importing. Useful if items are not appearing in the correct tabs. |
| **Look up icons from compendium** | On | Searches installed compendium packs to find matching icons for imported items by name. Disable if imports are slow due to large compendium collections. |

---

## Compatibility

- Foundry VTT v12 to v14
- D&D 5e system v3.0+
- **Optional:** Merchant Sheet module — enables the Merchant Shop import option

---

## License

MIT License
