/**
 * Techtree utility functions
 * Based on the original aoe2techtree project by HSZemi
 */

import {
  type Caret,
  type Lane,
  type LaneRows,
  type Tree,
  type TreeOffsets,
  type TechtreeData,
  TYPES,
  PREFIX,
  // Building IDs
  BARRACKS,
  DOCK,
  SIEGE_WORKSHOP,
  FARM,
  MILL,
  HOUSE,
  PALISADE_WALL,
  WATCH_TOWER,
  CASTLE,
  MARKET,
  ARCHERY_RANGE,
  STABLE,
  BLACKSMITH,
  MONASTERY,
  TOWN_CENTER,
  STONE_WALL,
  FORTIFIED_WALL,
  FISH_TRAP,
  UNIVERSITY,
  GUARD_TOWER,
  KEEP,
  BOMBARD_TOWER,
  WONDER,
  GATE,
  LUMBER_CAMP,
  MINING_CAMP,
  OUTPOST,
  TOWN_CENTER_2,
  PALISADE_GATE,
  // Unit IDs
  ARCHER,
  HAND_CANNONEER,
  ELITE_SKIRMISHER,
  SKIRMISHER,
  FISHING_SHIP,
  TRADE_COG,
  CROSSBOWMAN,
  BOMBARD_CANNON,
  KNIGHT,
  CAVALRY_ARCHER,
  MILITIA,
  MAN_AT_ARMS,
  LONG_SWORDSMAN,
  VILLAGER,
  SPEARMAN,
  MONK,
  TRADE_CART,
  SCORPION,
  MANGONEL,
  CAVALIER,
  CAMEL_RIDER,
  HEAVY_CAMEL_RIDER,
  TREBUCHET,
  PIKEMAN,
  HALBERDIER,
  CANNON_GALLEON,
  CAPPED_RAM,
  PETARD,
  HUSSAR,
  GALLEON,
  SCOUT_CAVALRY,
  TWO_HANDED_SWORDSMAN,
  HEAVY_CAV_ARCHER,
  ARBALESTER,
  DEMOLITION_SHIP,
  HEAVY_DEMO_SHIP,
  FIRE_SHIP,
  FAST_FIRE_SHIP,
  GALLEY,
  HEAVY_SCORPION,
  TRANSPORT_SHIP,
  LIGHT_CAVALRY,
  SIEGE_RAM,
  ONAGER,
  CHAMPION,
  PALADIN,
  SIEGE_ONAGER,
  ELITE_CANNON_GALLEON,
  EAGLE_SCOUT,
  ELITE_EAGLE_WARRIOR,
  EAGLE_WARRIOR,
  ELEPHANT_ARCHER,
  ELITE_ELEPHANT_ARCHER,
  FIRE_GALLEY,
  DEMOLITION_RAFT,
  SIEGE_TOWER,
  BATTLE_ELEPHANT,
  ELITE_BATTLE_ELEPHANT,
  BATTERING_RAM,
  STEPPE_LANCER,
  ELITE_STEPPE_LANCER,
  ARMORED_ELEPHANT,
  SIEGE_ELEPHANT,
  DROMON,
  FIRE_LANCER,
  ELITE_FIRE_LANCER,
  ROCKET_CART,
  HEAVY_ROCKET_CART,
  TRACTION_TREBUCHET,
  HEI_GUANG_CAVALRY,
  HEAVY_HEI_GUANG_CAVALRY,
  LOU_CHUAN,
  // Tech IDs
  TOWN_WATCH,
  CROP_ROTATION,
  HEAVY_PLOW,
  HORSE_COLLAR,
  GUILDS,
  BANKING,
  LOOM,
  COINAGE,
  HUSBANDRY,
  FAITH,
  DEVOTION,
  CHEMISTRY,
  CARAVAN,
  MASONRY,
  ARCHITECTURE,
  TREADMILL_CRANE,
  GOLD_MINING,
  KEEP_TECH,
  BOMBARD_TOWER_TECH,
  GILLNETS,
  FORGING,
  IRON_CASTING,
  SCALE_MAIL_ARMOR,
  BLAST_FURNACE,
  CHAIN_MAIL_ARMOR,
  PLATE_MAIL_ARMOR,
  PLATE_BARDING_ARMOR,
  SCALE_BARDING_ARMOR,
  CHAIN_BARDING_ARMOR,
  BALLISTICS,
  FEUDAL_AGE,
  CASTLE_AGE,
  IMPERIAL_AGE,
  GUARD_TOWER_TECH,
  GOLD_SHAFT_MINING,
  FORTIFIED_WALL_TECH,
  FLETCHING,
  BODKIN_ARROW,
  BRACER,
  DOUBLE_BIT_AXE,
  BOW_SAW,
  PADDED_ARCHER_ARMOR,
  LEATHER_ARCHER_ARMOR,
  WHEELBARROW,
  SQUIRES,
  RING_ARCHER_ARMOR,
  TWO_MAN_SAW,
  BLOCK_PRINTING,
  SANCTITY,
  ILLUMINATION,
  HAND_CART,
  FERVOR,
  STONE_MINING,
  STONE_SHAFT_MINING,
  TOWN_PATROL,
  CONSCRIPTION,
  REDEMPTION,
  ATONEMENT,
  SAPPERS,
  MURDER_HOLES,
  SHIPWRIGHT,
  CAREENING,
  DRY_DOCK,
  SIEGE_ENGINEERS,
  HOARDINGS,
  HEATED_SHOT,
  SPIES_TREASON,
  BLOODLINES,
  PARTHIAN_TACTICS,
  THUMB_RING,
  THEOCRACY,
  HERESY,
  HERBAL_MEDICINE,
  ARSON,
  ARROWSLITS,
  GAMBESONS,
} from './useTechtreeData'

let techtreeData: TechtreeData | null = null

export function formatId(value: string | number): string {
  return value.toString().replace(/\s/g, '_').replace(/\//g, '_').toLowerCase()
}

export function formatName(originalname: string): string {
  let name = originalname.toString().replace(/<br>/g, '\n').replace(/\n+/g, '\n')
  const items = name.split('\n')
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (items[i].length > 10) {
      const space = item.indexOf(' ')
      if (space !== -1) {
        items[i] = item.slice(0, space) + '\n' + item.slice(space + 1)
        const alternativeSpace = space + 1 + item.slice(space + 1).indexOf(' ')
        if (alternativeSpace !== -1) {
          if (Math.abs(item.length / 2 - alternativeSpace) < Math.abs(item.length / 2 - space)) {
            items[i] = item.slice(0, alternativeSpace) + '\n' + item.slice(alternativeSpace + 1)
          }
        }
      } else {
        const hyphen = item.indexOf('-')
        if (hyphen !== -1) {
          items[i] = item.slice(0, hyphen) + '-\n' + item.slice(hyphen + 1)
          const alternativeHyphen = hyphen + 1 + item.slice(hyphen + 1).indexOf('-')
          if (alternativeHyphen !== -1) {
            if (Math.abs(item.length / 2 - alternativeHyphen) < Math.abs(item.length / 2 - hyphen)) {
              items[i] = item.slice(0, alternativeHyphen) + '-\n' + item.slice(alternativeHyphen + 1)
            }
          }
        }
      }
    }
  }
  return items.join('\n')
}

function getName(id: number, itemtype: 'units' | 'buildings' | 'techs'): string {
  if (!techtreeData) return String(id)
  if (!techtreeData.strings) return String(id)
  const languageNameId = techtreeData.data[itemtype]?.[id]?.LanguageNameId
  if (!languageNameId) return String(id)
  return techtreeData.strings[languageNameId] || String(id)
}

function createCaret(
  type: (typeof TYPES)[keyof typeof TYPES],
  name: string,
  id: number
): Caret {
  return {
    type,
    name,
    id: PREFIX[type.type as keyof typeof PREFIX] + formatId(id),
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  }
}

export function building(id: number): Caret {
  return createCaret(TYPES.BUILDING, getName(id, 'buildings'), id)
}

export function unit(id: number): Caret {
  return createCaret(TYPES.UNIT, getName(id, 'units'), id)
}

export function tech(id: number): Caret {
  return createCaret(TYPES.TECHNOLOGY, getName(id, 'techs'), id)
}

function createLane(): Lane {
  return {
    rows: {
      dark_1: [],
      dark_2: [],
      feudal_1: [],
      feudal_2: [],
      castle_1: [],
      castle_2: [],
      imperial_1: [],
      imperial_2: [],
    },
    x: 0,
    y: 0,
    width: 0,
    padding: 10,
  }
}

function getLaneCaretIds(lane: Lane): string[] {
  const idList: string[] = []
  for (const r of Object.keys(lane.rows) as (keyof LaneRows)[]) {
    for (const caret of lane.rows[r]) {
      idList.push(caret.id)
    }
  }
  return idList
}

function getNonBuildingCarets(lane: Lane): Map<string, Caret> {
  const c = new Map<string, Caret>()
  for (const r of Object.keys(lane.rows) as (keyof LaneRows)[]) {
    for (const caret of lane.rows[r]) {
      if (caret.type !== TYPES.BUILDING) {
        c.set(caret.id, caret)
      }
    }
  }
  return c
}

function updateLanePositions(
  lane: Lane,
  offsets: TreeOffsets,
  element_height: number,
  connections: [string, string][]
): void {
  let lane_width = 0
  for (const r of Object.keys(lane.rows) as (keyof LaneRows)[]) {
    let x = lane.x
    let row_width = 0
    for (let i = 0; i < lane.rows[r].length; i++) {
      lane.rows[r][i].y = offsets[r]
      lane.rows[r][i].x = x
      lane.rows[r][i].width = element_height
      lane.rows[r][i].height = element_height
      x = x + lane.rows[r][i].width + lane.padding
      row_width = row_width + lane.rows[r][i].width + lane.padding
    }
    lane_width = Math.max(lane_width, row_width)
  }
  lane.width = lane_width

  // Center buildings
  for (const r of Object.keys(lane.rows) as (keyof LaneRows)[]) {
    for (let i = 0; i < lane.rows[r].length; i++) {
      if (lane.rows[r][i].type === TYPES.BUILDING) {
        lane.rows[r][i].x = lane.x + (lane.width - lane.padding) / 2 - lane.rows[r][i].width / 2
      }
    }
  }

  // Align connected carets
  const carets = getNonBuildingCarets(lane)
  for (const connection of connections) {
    const from = connection[0]
    const to = connection[1]
    if (carets.has(from) && carets.has(to)) {
      const from_x = carets.get(from)!.x
      const to_x = carets.get(to)!.x
      carets.get(from)!.x = Math.max(from_x, to_x)
      carets.get(to)!.x = Math.max(from_x, to_x)
    }
  }
}

function u(unitId: number): string {
  return 'unit_' + unitId
}

function b(buildingId: number): string {
  return 'building_' + buildingId
}

function t(techId: number): string {
  return 'tech_' + techId
}

export function getConnections(): [string, string][] {
  const connections: [string, string][] = [
    [b(ARCHERY_RANGE), u(ARCHER)],
    [u(ARCHER), u(CROSSBOWMAN)],
    [u(CROSSBOWMAN), u(ARBALESTER)],
    [b(ARCHERY_RANGE), u(SKIRMISHER)],
    [u(SKIRMISHER), u(ELITE_SKIRMISHER)],
    [b(ARCHERY_RANGE), u(CAVALRY_ARCHER)],
    [u(CAVALRY_ARCHER), u(HEAVY_CAV_ARCHER)],
    [b(ARCHERY_RANGE), u(ELEPHANT_ARCHER)],
    [u(ELEPHANT_ARCHER), u(ELITE_ELEPHANT_ARCHER)],
    [b(ARCHERY_RANGE), t(THUMB_RING)],
    [b(BARRACKS), b(ARCHERY_RANGE)],
    [b(BARRACKS), b(STABLE)],
    [b(BARRACKS), u(MILITIA)],
    [u(MILITIA), u(MAN_AT_ARMS)],
    [u(MAN_AT_ARMS), u(LONG_SWORDSMAN)],
    [u(LONG_SWORDSMAN), u(TWO_HANDED_SWORDSMAN)],
    [u(TWO_HANDED_SWORDSMAN), u(CHAMPION)],
    [b(BARRACKS), u(SPEARMAN)],
    [u(SPEARMAN), u(PIKEMAN)],
    [u(PIKEMAN), u(HALBERDIER)],
    [b(BARRACKS), u(EAGLE_SCOUT)],
    [u(EAGLE_SCOUT), u(EAGLE_WARRIOR)],
    [u(EAGLE_WARRIOR), u(ELITE_EAGLE_WARRIOR)],
    [b(BARRACKS), u(FIRE_LANCER)],
    [u(FIRE_LANCER), u(ELITE_FIRE_LANCER)],
    [b(BARRACKS), t(GAMBESONS)],
    [b(BARRACKS), t(ARSON)],
    [b(STABLE), u(SCOUT_CAVALRY)],
    [u(SCOUT_CAVALRY), u(LIGHT_CAVALRY)],
    [u(LIGHT_CAVALRY), u(HUSSAR)],
    [b(STABLE), t(BLOODLINES)],
    [b(STABLE), u(CAMEL_RIDER)],
    [u(CAMEL_RIDER), u(HEAVY_CAMEL_RIDER)],
    [b(STABLE), u(BATTLE_ELEPHANT)],
    [u(BATTLE_ELEPHANT), u(ELITE_BATTLE_ELEPHANT)],
    [b(STABLE), u(STEPPE_LANCER)],
    [u(STEPPE_LANCER), u(ELITE_STEPPE_LANCER)],
    [b(STABLE), u(HEI_GUANG_CAVALRY)],
    [u(HEI_GUANG_CAVALRY), u(HEAVY_HEI_GUANG_CAVALRY)],
    [b(STABLE), t(HUSBANDRY)],
    [u(KNIGHT), u(CAVALIER)],
    [u(CAVALIER), u(PALADIN)],
    [b(DOCK), u(FISHING_SHIP)],
    [b(DOCK), u(TRANSPORT_SHIP)],
    [b(DOCK), u(DROMON)],
    [b(DOCK), u(DEMOLITION_RAFT)],
    [b(DOCK), u(TRADE_COG)],
    [u(DEMOLITION_RAFT), u(DEMOLITION_SHIP)],
    [u(DEMOLITION_SHIP), u(HEAVY_DEMO_SHIP)],
    [b(DOCK), u(GALLEY)],
    [u(GALLEY), u(WAR_GALLEY)],
    [u(WAR_GALLEY), u(GALLEON)],
    [b(DOCK), t(CAREENING)],
    [t(CAREENING), t(DRY_DOCK)],
    [b(DOCK), t(SHIPWRIGHT)],
    [b(DOCK), b(FISH_TRAP)],
    [u(FIRE_GALLEY), u(FIRE_SHIP)],
    [u(FIRE_SHIP), u(FAST_FIRE_SHIP)],
    [u(CANNON_GALLEON), u(ELITE_CANNON_GALLEON)],
    [b(DOCK), u(LOU_CHUAN)],
    [b(WATCH_TOWER), b(GUARD_TOWER)],
    [b(GUARD_TOWER), b(KEEP)],
    [b(STONE_WALL), b(FORTIFIED_WALL)],
    [b(MONASTERY), u(MONK)],
    [b(MONASTERY), t(REDEMPTION)],
    [b(MONASTERY), t(ATONEMENT)],
    [b(MONASTERY), t(HERBAL_MEDICINE)],
    [b(MONASTERY), t(HERESY)],
    [b(MONASTERY), t(SANCTITY)],
    [b(MONASTERY), t(FERVOR)],
    [b(CASTLE), u(PETARD)],
    [b(CASTLE), t(HOARDINGS)],
    [b(CASTLE), t(SAPPERS)],
    [b(CASTLE), t(CONSCRIPTION)],
    [b(CASTLE), t(SPIES_TREASON)],
    [b(TOWN_CENTER), u(VILLAGER)],
    [b(TOWN_CENTER), t(FEUDAL_AGE)],
    [t(FEUDAL_AGE), t(CASTLE_AGE)],
    [t(CASTLE_AGE), t(IMPERIAL_AGE)],
    [b(TOWN_CENTER), t(LOOM)],
    [t(TOWN_WATCH), t(TOWN_PATROL)],
    [t(WHEELBARROW), t(HAND_CART)],
    [b(SIEGE_WORKSHOP), u(MANGONEL)],
    [u(MANGONEL), u(ONAGER)],
    [u(ONAGER), u(SIEGE_ONAGER)],
    [b(SIEGE_WORKSHOP), u(ROCKET_CART)],
    [u(ROCKET_CART), u(HEAVY_ROCKET_CART)],
    [b(SIEGE_WORKSHOP), u(BATTERING_RAM)],
    [u(BATTERING_RAM), u(CAPPED_RAM)],
    [u(CAPPED_RAM), u(SIEGE_RAM)],
    [b(SIEGE_WORKSHOP), u(ARMORED_ELEPHANT)],
    [u(ARMORED_ELEPHANT), u(SIEGE_ELEPHANT)],
    [b(SIEGE_WORKSHOP), u(SCORPION)],
    [u(SCORPION), u(HEAVY_SCORPION)],
    [b(SIEGE_WORKSHOP), u(SIEGE_TOWER)],
    [b(BLACKSMITH), b(SIEGE_WORKSHOP)],
    [b(BLACKSMITH), t(PADDED_ARCHER_ARMOR)],
    [t(PADDED_ARCHER_ARMOR), t(LEATHER_ARCHER_ARMOR)],
    [t(LEATHER_ARCHER_ARMOR), t(RING_ARCHER_ARMOR)],
    [b(BLACKSMITH), t(FLETCHING)],
    [t(FLETCHING), t(BODKIN_ARROW)],
    [t(BODKIN_ARROW), t(BRACER)],
    [b(BLACKSMITH), t(FORGING)],
    [t(FORGING), t(IRON_CASTING)],
    [t(IRON_CASTING), t(BLAST_FURNACE)],
    [b(BLACKSMITH), t(SCALE_BARDING_ARMOR)],
    [t(SCALE_BARDING_ARMOR), t(CHAIN_BARDING_ARMOR)],
    [t(CHAIN_BARDING_ARMOR), t(PLATE_BARDING_ARMOR)],
    [b(BLACKSMITH), t(SCALE_MAIL_ARMOR)],
    [t(SCALE_MAIL_ARMOR), t(CHAIN_MAIL_ARMOR)],
    [t(CHAIN_MAIL_ARMOR), t(PLATE_MAIL_ARMOR)],
    [b(UNIVERSITY), t(MASONRY)],
    [t(MASONRY), t(ARCHITECTURE)],
    [b(UNIVERSITY), t(FORTIFIED_WALL_TECH)],
    [b(UNIVERSITY), t(BALLISTICS)],
    [b(UNIVERSITY), t(GUARD_TOWER_TECH)],
    [t(GUARD_TOWER_TECH), t(KEEP_TECH)],
    [b(UNIVERSITY), t(HEATED_SHOT)],
    [b(UNIVERSITY), t(MURDER_HOLES)],
    [b(UNIVERSITY), t(TREADMILL_CRANE)],
    [t(CHEMISTRY), t(BOMBARD_TOWER_TECH)],
    [b(MINING_CAMP), t(STONE_MINING)],
    [t(STONE_MINING), t(STONE_SHAFT_MINING)],
    [b(MINING_CAMP), t(GOLD_MINING)],
    [t(GOLD_MINING), t(GOLD_SHAFT_MINING)],
    [b(LUMBER_CAMP), t(DOUBLE_BIT_AXE)],
    [t(DOUBLE_BIT_AXE), t(BOW_SAW)],
    [t(BOW_SAW), t(TWO_MAN_SAW)],
    [b(MARKET), t(CARAVAN)],
    [t(COINAGE), t(BANKING)],
    [b(MARKET), u(TRADE_CART)],
    [b(MILL), b(MARKET)],
    [b(MILL), t(HORSE_COLLAR)],
    [t(HORSE_COLLAR), t(HEAVY_PLOW)],
    [t(HEAVY_PLOW), t(CROP_ROTATION)],
    [b(MILL), b(FARM)],
    [b(ARCHERY_RANGE), t(PARTHIAN_TACTICS)],
    [b(ARCHERY_RANGE), u(HAND_CANNONEER)],
    [b(BARRACKS), t(SQUIRES)],
    [b(STABLE), u(KNIGHT)],
    [b(DOCK), t(GILLNETS)],
    [b(UNIVERSITY), t(CHEMISTRY)],
    [b(UNIVERSITY), t(SIEGE_ENGINEERS)],
    [b(UNIVERSITY), t(ARROWSLITS)],
    [b(CASTLE), u(TREBUCHET)],
    [b(MONASTERY), t(DEVOTION)],
    [t(DEVOTION), t(FAITH)],
    [b(MONASTERY), t(ILLUMINATION)],
    [b(MONASTERY), t(BLOCK_PRINTING)],
    [b(MONASTERY), t(THEOCRACY)],
    [b(TOWN_CENTER), t(TOWN_WATCH)],
    [b(TOWN_CENTER), t(WHEELBARROW)],
    [b(MARKET), t(COINAGE)],
    [b(MARKET), t(GUILDS)],
    [b(SIEGE_WORKSHOP), u(BOMBARD_CANNON)],
    [b(SIEGE_WORKSHOP), u(TRACTION_TREBUCHET)],
    [b(DOCK), u(CANNON_GALLEON)],
  ]

  return connections.map(([from, to]) => [formatId(from), formatId(to)])
}

export function getConnectionPoints(tree: Tree): Map<string, { x: number; y: number }> {
  const points = new Map<string, { x: number; y: number }>()
  for (const lane of tree.lanes) {
    for (const r of Object.keys(lane.rows) as (keyof LaneRows)[]) {
      for (const caret of lane.rows[r]) {
        points.set(caret.id, {
          x: caret.x + caret.width / 2,
          y: caret.y + caret.height / 2,
        })
      }
    }
  }
  return points
}

export function setTechtreeData(data: TechtreeData): void {
  techtreeData = data
}

export function getDefaultTree(windowHeight: number = 600): Tree {
  const tree: Tree = {
    offsets: {
      dark_1: 0,
      dark_2: 0,
      feudal_1: 0,
      feudal_2: 0,
      castle_1: 0,
      castle_2: 0,
      imperial_1: 0,
      imperial_2: 0,
    },
    height: Math.max(windowHeight - 80, 100),
    width: 0,
    padding: 20,
    element_height: 0,
    lanes: [],
    offset_x: 150,
  }

  // Update offsets
  tree.element_height = tree.height / 4 / 3
  const element_offset = tree.element_height / 2

  tree.offsets.dark_1 = tree.padding
  tree.offsets.dark_2 = tree.offsets.dark_1 + tree.element_height + element_offset
  tree.offsets.feudal_1 = tree.offsets.dark_2 + tree.element_height + element_offset
  tree.offsets.feudal_2 = tree.offsets.feudal_1 + tree.element_height + element_offset
  tree.offsets.castle_1 = tree.offsets.feudal_2 + tree.element_height + element_offset
  tree.offsets.castle_2 = tree.offsets.castle_1 + tree.element_height + element_offset
  tree.offsets.imperial_1 = tree.offsets.castle_2 + tree.element_height + element_offset
  tree.offsets.imperial_2 = tree.offsets.imperial_1 + tree.element_height + element_offset

  // Create lanes
  const archerylane = createLane()
  archerylane.rows.feudal_1.push(building(ARCHERY_RANGE))
  archerylane.rows.feudal_2.push(unit(ARCHER))
  archerylane.rows.feudal_2.push(unit(SKIRMISHER))
  archerylane.rows.castle_1.push(unit(CROSSBOWMAN))
  archerylane.rows.castle_1.push(unit(ELITE_SKIRMISHER))
  archerylane.rows.castle_1.push(unit(CAVALRY_ARCHER))
  archerylane.rows.castle_1.push(unit(ELEPHANT_ARCHER))
  archerylane.rows.castle_1.push(tech(THUMB_RING))
  archerylane.rows.imperial_1.push(unit(ARBALESTER))
  archerylane.rows.imperial_1.push(unit(HAND_CANNONEER))
  archerylane.rows.imperial_1.push(unit(HEAVY_CAV_ARCHER))
  archerylane.rows.imperial_1.push(unit(ELITE_ELEPHANT_ARCHER))
  archerylane.rows.imperial_1.push(tech(PARTHIAN_TACTICS))
  tree.lanes.push(archerylane)

  const barrackslane = createLane()
  barrackslane.rows.dark_1.push(building(BARRACKS))
  barrackslane.rows.dark_2.push(unit(MILITIA))
  barrackslane.rows.feudal_1.push(unit(MAN_AT_ARMS))
  barrackslane.rows.feudal_1.push(unit(SPEARMAN))
  barrackslane.rows.feudal_1.push(unit(EAGLE_SCOUT))
  barrackslane.rows.feudal_1.push(tech(ARSON))
  barrackslane.rows.castle_1.push(unit(LONG_SWORDSMAN))
  barrackslane.rows.castle_1.push(unit(PIKEMAN))
  barrackslane.rows.castle_1.push(unit(EAGLE_WARRIOR))
  barrackslane.rows.castle_1.push(unit(FIRE_LANCER))
  barrackslane.rows.castle_1.push(tech(GAMBESONS))
  barrackslane.rows.castle_1.push(tech(SQUIRES))
  barrackslane.rows.imperial_1.push(unit(TWO_HANDED_SWORDSMAN))
  barrackslane.rows.imperial_2.push(unit(CHAMPION))
  barrackslane.rows.imperial_1.push(unit(HALBERDIER))
  barrackslane.rows.imperial_1.push(unit(ELITE_EAGLE_WARRIOR))
  barrackslane.rows.imperial_1.push(unit(ELITE_FIRE_LANCER))
  tree.lanes.push(barrackslane)

  const stablelane = createLane()
  stablelane.rows.feudal_1.push(building(STABLE))
  stablelane.rows.feudal_2.push(unit(SCOUT_CAVALRY))
  stablelane.rows.feudal_2.push(tech(BLOODLINES))
  stablelane.rows.castle_1.push(unit(LIGHT_CAVALRY))
  stablelane.rows.castle_1.push(unit(KNIGHT))
  stablelane.rows.castle_1.push(unit(CAMEL_RIDER))
  stablelane.rows.castle_1.push(unit(BATTLE_ELEPHANT))
  stablelane.rows.castle_1.push(unit(STEPPE_LANCER))
  stablelane.rows.castle_1.push(unit(HEI_GUANG_CAVALRY))
  stablelane.rows.castle_1.push(tech(HUSBANDRY))
  stablelane.rows.imperial_1.push(unit(HUSSAR))
  stablelane.rows.imperial_1.push(unit(CAVALIER))
  stablelane.rows.imperial_1.push(unit(HEAVY_CAMEL_RIDER))
  stablelane.rows.imperial_1.push(unit(ELITE_BATTLE_ELEPHANT))
  stablelane.rows.imperial_1.push(unit(ELITE_STEPPE_LANCER))
  stablelane.rows.imperial_1.push(unit(HEAVY_HEI_GUANG_CAVALRY))
  stablelane.rows.imperial_2.push(unit(PALADIN))
  tree.lanes.push(stablelane)

  const siegeworkshoplane = createLane()
  siegeworkshoplane.rows.castle_1.push(building(SIEGE_WORKSHOP))
  siegeworkshoplane.rows.castle_2.push(unit(BATTERING_RAM))
  siegeworkshoplane.rows.castle_2.push(unit(ARMORED_ELEPHANT))
  siegeworkshoplane.rows.castle_2.push(unit(MANGONEL))
  siegeworkshoplane.rows.castle_2.push(unit(ROCKET_CART))
  siegeworkshoplane.rows.castle_2.push(unit(SCORPION))
  siegeworkshoplane.rows.castle_2.push(unit(SIEGE_TOWER))
  siegeworkshoplane.rows.imperial_1.push(unit(CAPPED_RAM))
  siegeworkshoplane.rows.imperial_1.push(unit(SIEGE_ELEPHANT))
  siegeworkshoplane.rows.imperial_1.push(unit(ONAGER))
  siegeworkshoplane.rows.imperial_1.push(unit(HEAVY_ROCKET_CART))
  siegeworkshoplane.rows.imperial_1.push(unit(HEAVY_SCORPION))
  siegeworkshoplane.rows.imperial_1.push(unit(BOMBARD_CANNON))
  siegeworkshoplane.rows.imperial_2.push(unit(SIEGE_RAM))
  siegeworkshoplane.rows.imperial_2.push(unit(TRACTION_TREBUCHET))
  siegeworkshoplane.rows.imperial_2.push(unit(SIEGE_ONAGER))
  tree.lanes.push(siegeworkshoplane)

  const blacksmithlane = createLane()
  blacksmithlane.rows.feudal_1.push(building(BLACKSMITH))
  blacksmithlane.rows.feudal_2.push(tech(PADDED_ARCHER_ARMOR))
  blacksmithlane.rows.feudal_2.push(tech(FLETCHING))
  blacksmithlane.rows.feudal_2.push(tech(FORGING))
  blacksmithlane.rows.feudal_2.push(tech(SCALE_BARDING_ARMOR))
  blacksmithlane.rows.feudal_2.push(tech(SCALE_MAIL_ARMOR))
  blacksmithlane.rows.castle_1.push(tech(LEATHER_ARCHER_ARMOR))
  blacksmithlane.rows.castle_1.push(tech(BODKIN_ARROW))
  blacksmithlane.rows.castle_1.push(tech(IRON_CASTING))
  blacksmithlane.rows.castle_1.push(tech(CHAIN_BARDING_ARMOR))
  blacksmithlane.rows.castle_1.push(tech(CHAIN_MAIL_ARMOR))
  blacksmithlane.rows.imperial_1.push(tech(RING_ARCHER_ARMOR))
  blacksmithlane.rows.imperial_1.push(tech(BRACER))
  blacksmithlane.rows.imperial_1.push(tech(BLAST_FURNACE))
  blacksmithlane.rows.imperial_1.push(tech(PLATE_BARDING_ARMOR))
  blacksmithlane.rows.imperial_1.push(tech(PLATE_MAIL_ARMOR))
  tree.lanes.push(blacksmithlane)

  const docklane = createLane()
  docklane.rows.dark_1.push(building(DOCK))
  docklane.rows.dark_2.push(unit(FISHING_SHIP))
  docklane.rows.dark_2.push(unit(TRANSPORT_SHIP))
  docklane.rows.feudal_1.push(unit(FIRE_GALLEY))
  docklane.rows.feudal_1.push(unit(TRADE_COG))
  docklane.rows.feudal_1.push(unit(DEMOLITION_RAFT))
  docklane.rows.feudal_1.push(unit(GALLEY))
  docklane.rows.castle_1.push(unit(FIRE_SHIP))
  docklane.rows.castle_1.push(tech(GILLNETS))
  docklane.rows.castle_1.push(unit(DEMOLITION_SHIP))
  docklane.rows.castle_1.push(unit(WAR_GALLEY))
  docklane.rows.castle_1.push(tech(CAREENING))
  docklane.rows.imperial_1.push(unit(FAST_FIRE_SHIP))
  docklane.rows.imperial_1.push(unit(CANNON_GALLEON))
  docklane.rows.imperial_1.push(unit(HEAVY_DEMO_SHIP))
  docklane.rows.imperial_1.push(unit(GALLEON))
  docklane.rows.imperial_2.push(unit(LOU_CHUAN))
  docklane.rows.imperial_2.push(unit(ELITE_CANNON_GALLEON))
  docklane.rows.imperial_2.push(unit(DROMON))
  docklane.rows.imperial_1.push(tech(DRY_DOCK))
  docklane.rows.imperial_1.push(tech(SHIPWRIGHT))
  tree.lanes.push(docklane)

  const fishtraplane = createLane()
  fishtraplane.rows.feudal_1.push(building(FISH_TRAP))
  tree.lanes.push(fishtraplane)

  const universitylane = createLane()
  universitylane.rows.castle_1.push(building(UNIVERSITY))
  universitylane.rows.castle_2.push(tech(MASONRY))
  universitylane.rows.castle_2.push(tech(FORTIFIED_WALL_TECH))
  universitylane.rows.castle_2.push(tech(BALLISTICS))
  universitylane.rows.castle_2.push(tech(GUARD_TOWER_TECH))
  universitylane.rows.castle_2.push(tech(HEATED_SHOT))
  universitylane.rows.castle_2.push(tech(MURDER_HOLES))
  universitylane.rows.castle_2.push(tech(TREADMILL_CRANE))
  universitylane.rows.imperial_1.push(tech(ARCHITECTURE))
  universitylane.rows.imperial_1.push(tech(CHEMISTRY))
  universitylane.rows.imperial_1.push(tech(SIEGE_ENGINEERS))
  universitylane.rows.imperial_1.push(tech(KEEP_TECH))
  universitylane.rows.imperial_1.push(tech(ARROWSLITS))
  universitylane.rows.imperial_2.push(tech(BOMBARD_TOWER_TECH))
  tree.lanes.push(universitylane)

  const towerlane = createLane()
  towerlane.rows.dark_1.push(building(OUTPOST))
  towerlane.rows.feudal_1.push(building(WATCH_TOWER))
  towerlane.rows.castle_1.push(building(GUARD_TOWER))
  towerlane.rows.imperial_1.push(building(KEEP))
  towerlane.rows.imperial_2.push(building(BOMBARD_TOWER))
  tree.lanes.push(towerlane)

  const walllane = createLane()
  walllane.rows.dark_1.push(building(PALISADE_WALL))
  walllane.rows.dark_2.push(building(PALISADE_GATE))
  walllane.rows.feudal_1.push(building(GATE))
  walllane.rows.feudal_2.push(building(STONE_WALL))
  walllane.rows.castle_1.push(building(FORTIFIED_WALL))
  tree.lanes.push(walllane)

  const castlelane = createLane()
  castlelane.rows.castle_1.push(building(CASTLE))
  castlelane.rows.castle_2.push(unit(PETARD))
  castlelane.rows.imperial_1.push(unit(TREBUCHET))
  castlelane.rows.imperial_1.push(tech(HOARDINGS))
  castlelane.rows.imperial_1.push(tech(SAPPERS))
  castlelane.rows.imperial_1.push(tech(CONSCRIPTION))
  castlelane.rows.imperial_1.push(tech(SPIES_TREASON))
  tree.lanes.push(castlelane)

  const monasterylane = createLane()
  monasterylane.rows.castle_1.push(building(MONASTERY))
  monasterylane.rows.castle_2.push(unit(MONK))
  monasterylane.rows.castle_2.push(tech(REDEMPTION))
  monasterylane.rows.castle_2.push(tech(DEVOTION))
  monasterylane.rows.castle_2.push(tech(ATONEMENT))
  monasterylane.rows.castle_2.push(tech(HERBAL_MEDICINE))
  monasterylane.rows.castle_2.push(tech(HERESY))
  monasterylane.rows.castle_2.push(tech(SANCTITY))
  monasterylane.rows.castle_2.push(tech(FERVOR))
  monasterylane.rows.imperial_1.push(tech(ILLUMINATION))
  monasterylane.rows.imperial_1.push(tech(BLOCK_PRINTING))
  monasterylane.rows.imperial_1.push(tech(FAITH))
  monasterylane.rows.imperial_1.push(tech(THEOCRACY))
  tree.lanes.push(monasterylane)

  const houselane = createLane()
  houselane.rows.dark_1.push(building(HOUSE))
  tree.lanes.push(houselane)

  const towncenterlane = createLane()
  towncenterlane.rows.dark_1.push(building(TOWN_CENTER))
  towncenterlane.rows.dark_2.push(unit(VILLAGER))
  towncenterlane.rows.dark_2.push(tech(FEUDAL_AGE))
  towncenterlane.rows.dark_2.push(tech(LOOM))
  towncenterlane.rows.feudal_1.push(tech(TOWN_WATCH))
  towncenterlane.rows.feudal_1.push(tech(CASTLE_AGE))
  towncenterlane.rows.feudal_1.push(tech(WHEELBARROW))
  towncenterlane.rows.castle_1.push(tech(TOWN_PATROL))
  towncenterlane.rows.castle_1.push(tech(IMPERIAL_AGE))
  towncenterlane.rows.castle_1.push(tech(HAND_CART))
  tree.lanes.push(towncenterlane)

  const additionaltowncenterlane = createLane()
  additionaltowncenterlane.rows.castle_1.push(building(TOWN_CENTER_2))
  tree.lanes.push(additionaltowncenterlane)

  const wonderlane = createLane()
  wonderlane.rows.imperial_1.push(building(WONDER))
  tree.lanes.push(wonderlane)

  const miningcamplane = createLane()
  miningcamplane.rows.dark_1.push(building(MINING_CAMP))
  miningcamplane.rows.feudal_1.push(tech(GOLD_MINING))
  miningcamplane.rows.feudal_1.push(tech(STONE_MINING))
  miningcamplane.rows.castle_1.push(tech(GOLD_SHAFT_MINING))
  miningcamplane.rows.castle_1.push(tech(STONE_SHAFT_MINING))
  tree.lanes.push(miningcamplane)

  const lumbercamplane = createLane()
  lumbercamplane.rows.dark_1.push(building(LUMBER_CAMP))
  lumbercamplane.rows.feudal_1.push(tech(DOUBLE_BIT_AXE))
  lumbercamplane.rows.castle_1.push(tech(BOW_SAW))
  lumbercamplane.rows.imperial_1.push(tech(TWO_MAN_SAW))
  tree.lanes.push(lumbercamplane)

  const marketlane = createLane()
  marketlane.rows.feudal_1.push(building(MARKET))
  marketlane.rows.feudal_2.push(unit(TRADE_CART))
  marketlane.rows.castle_1.push(tech(COINAGE))
  marketlane.rows.castle_1.push(tech(CARAVAN))
  marketlane.rows.imperial_1.push(tech(BANKING))
  marketlane.rows.imperial_1.push(tech(GUILDS))
  tree.lanes.push(marketlane)

  const farmlane = createLane()
  farmlane.rows.dark_2.push(building(FARM))
  tree.lanes.push(farmlane)

  const milllane = createLane()
  milllane.rows.dark_1.push(building(MILL))
  milllane.rows.feudal_1.push(tech(HORSE_COLLAR))
  milllane.rows.castle_1.push(tech(HEAVY_PLOW))
  milllane.rows.imperial_1.push(tech(CROP_ROTATION))
  tree.lanes.push(milllane)

  // Update positions
  const connections = getConnections()
  let x = tree.padding + tree.offset_x
  for (let i = 0; i < tree.lanes.length; i++) {
    tree.lanes[i].x = x
    updateLanePositions(tree.lanes[i], tree.offsets, tree.element_height, connections)
    x = x + tree.lanes[i].width + tree.padding
  }
  tree.width = x

  // Update positions again after width calculation
  for (const lane of tree.lanes) {
    updateLanePositions(lane, tree.offsets, tree.element_height, connections)
  }

  return tree
}

export function idType(id: string): number {
  const index = id.indexOf('_')
  const type = id.substring(0, index)
  if (type === 'unit') return 0
  if (type === 'building') return 1
  if (type === 'tech') return 2
  return -1
}

export function idID(id: string): number {
  const index = id.indexOf('_')
  return parseInt(id.substring(index + 1), 10)
}

export function caretType(caretId: string): 'units' | 'buildings' | 'techs' {
  const index = caretId.indexOf('_')
  const type = caretId.substring(0, index)
  return (type + 's') as 'units' | 'buildings' | 'techs'
}

export function imagePrefix(name: string): string {
  return name
    .replace('_copy', '')
    .replace('building_', 'Buildings/')
    .replace('unit_', 'Units/')
    .replace('tech_', 'Techs/')
}

export function cost(cost_object: Record<string, number>): string {
  let value = ''
  if ('Food' in cost_object) {
    value += ' ' + cost_object.Food + 'F'
  }
  if ('Wood' in cost_object) {
    value += ' ' + cost_object.Wood + 'W'
  }
  if ('Gold' in cost_object) {
    value += ' ' + cost_object.Gold + 'G'
  }
  if ('Stone' in cost_object) {
    value += ' ' + cost_object.Stone + 'S'
  }
  return value.trim()
}
