/**
 * Composable for techtree-related data and constants
 * Based on the original aoe2techtree project by HSZemi
 */

export const TYPES = Object.freeze({
  BUILDING: { colour: '#922602', type: 'BUILDING', name: 'Building' },
  UNIT: { colour: '#3a6a80', type: 'UNIT', name: 'Unit' },
  UNIQUEUNIT: { colour: '#af30a3', type: 'UNIQUEUNIT', name: 'Unique Unit' },
  TECHNOLOGY: { colour: '#2c5729', type: 'TECHNOLOGY', name: 'Technology' },
})

export const PREFIX = Object.freeze({
  BUILDING: 'building_',
  UNIT: 'unit_',
  UNIQUEUNIT: 'unit_',
  TECHNOLOGY: 'tech_',
})

export type CaretType = keyof typeof TYPES
export type TypeInfo = (typeof TYPES)[CaretType]

export interface Caret {
  type: TypeInfo
  name: string
  id: string
  width: number
  height: number
  x: number
  y: number
}

export interface LaneRows {
  dark_1: Caret[]
  dark_2: Caret[]
  feudal_1: Caret[]
  feudal_2: Caret[]
  castle_1: Caret[]
  castle_2: Caret[]
  imperial_1: Caret[]
  imperial_2: Caret[]
}

export interface Lane {
  rows: LaneRows
  x: number
  y: number
  width: number
  padding: number
}

export interface TreeOffsets {
  dark_1: number
  dark_2: number
  feudal_1: number
  feudal_2: number
  castle_1: number
  castle_2: number
  imperial_1: number
  imperial_2: number
}

export interface Tree {
  offsets: TreeOffsets
  height: number
  width: number
  padding: number
  element_height: number
  lanes: Lane[]
  offset_x: number
}

export interface TechtreeData {
  data: {
    units: Record<string, UnitData>
    buildings: Record<string, BuildingData>
    techs: Record<string, TechData>
  }
  strings: Record<string, string>
  age_names: Record<string, string>
  civ_names: Record<string, string>
  techtrees: Record<string, any>
}

export interface UnitData {
  LanguageNameId: string
  LanguageHelpId: string
  tech_cost: number
  Cost: Record<string, number>
  HP?: number
  Attack?: number
  MeleeArmor?: number
  PierceArmor?: number
  Range?: number
  Speed?: number
  TrainTime?: number
  LineOfSight?: number
  GarrisonCapacity?: number
  MinRange?: number
  FrameDelay?: number
  MaxCharge?: number
  RechargeRate?: number
  RechargeDuration?: number
  AttackDelaySeconds?: number
  ReloadTime?: number
  AccuracyPercent?: number
}

export interface BuildingData extends UnitData {
  GarrisonCapacity?: number
}

export interface TechData {
  LanguageNameId: string
  LanguageHelpId: string
  tech_cost: number
  Cost: Record<string, number>
  ResearchTime?: number
}

// Building IDs
export const BARRACKS = 12
export const DOCK = 45
export const SIEGE_WORKSHOP = 49
export const FARM = 50
export const MILL = 68
export const HOUSE = 70
export const PALISADE_WALL = 72
export const WATCH_TOWER = 79
export const CASTLE = 82
export const MARKET = 84
export const ARCHERY_RANGE = 87
export const STABLE = 101
export const BLACKSMITH = 103
export const MONASTERY = 104
export const TOWN_CENTER = 109
export const STONE_WALL = 117
export const FORTIFIED_WALL = 155
export const FISH_TRAP = 199
export const UNIVERSITY = 209
export const GUARD_TOWER = 234
export const KEEP = 235
export const BOMBARD_TOWER = 236
export const WONDER = 276
export const GATE = 487
export const LUMBER_CAMP = 562
export const MINING_CAMP = 584
export const OUTPOST = 598
export const TOWN_CENTER_2 = 621
export const PALISADE_GATE = 792
export const PASTURE = 1889

// Unit IDs
export const ARCHER = 4
export const HAND_CANNONEER = 5
export const ELITE_SKIRMISHER = 6
export const SKIRMISHER = 7
export const FISHING_SHIP = 13
export const TRADE_COG = 17
export const WAR_GALLEY = 21
export const CROSSBOWMAN = 24
export const BOMBARD_CANNON = 36
export const KNIGHT = 38
export const CAVALRY_ARCHER = 39
export const MILITIA = 74
export const MAN_AT_ARMS = 75
export const LONG_SWORDSMAN = 77
export const VILLAGER = 83
export const SPEARMAN = 93
export const MONK = 125
export const TRADE_CART = 128
export const SCORPION = 279
export const MANGONEL = 280
export const CAVALIER = 283
export const CAMEL_RIDER = 329
export const HEAVY_CAMEL_RIDER = 330
export const TREBUCHET = 331
export const PIKEMAN = 358
export const HALBERDIER = 359
export const CANNON_GALLEON = 420
export const CAPPED_RAM = 422
export const PETARD = 440
export const HUSSAR = 441
export const GALLEON = 442
export const SCOUT_CAVALRY = 448
export const TWO_HANDED_SWORDSMAN = 473
export const HEAVY_CAV_ARCHER = 474
export const ARBALESTER = 492
export const DEMOLITION_SHIP = 527
export const HEAVY_DEMO_SHIP = 528
export const FIRE_SHIP = 529
export const FAST_FIRE_SHIP = 532
export const GALLEY = 539
export const HEAVY_SCORPION = 542
export const TRANSPORT_SHIP = 545
export const LIGHT_CAVALRY = 546
export const SIEGE_RAM = 548
export const ONAGER = 550
export const CHAMPION = 567
export const PALADIN = 569
export const SIEGE_ONAGER = 588
export const ELITE_CANNON_GALLEON = 691
export const EAGLE_SCOUT = 751
export const ELITE_EAGLE_WARRIOR = 752
export const EAGLE_WARRIOR = 753
export const ELEPHANT_ARCHER = 873
export const ELITE_ELEPHANT_ARCHER = 875
export const FIRE_GALLEY = 1103
export const DEMOLITION_RAFT = 1104
export const SIEGE_TOWER = 1105
export const BATTLE_ELEPHANT = 1132
export const ELITE_BATTLE_ELEPHANT = 1134
export const BATTERING_RAM = 1258
export const STEPPE_LANCER = 1370
export const ELITE_STEPPE_LANCER = 1372
export const ARMORED_ELEPHANT = 1744
export const SIEGE_ELEPHANT = 1746
export const DROMON = 1795
export const FIRE_LANCER = 1901
export const ELITE_FIRE_LANCER = 1903
export const ROCKET_CART = 1904
export const HEAVY_ROCKET_CART = 1907
export const TRACTION_TREBUCHET = 1942
export const HEI_GUANG_CAVALRY = 1944
export const HEAVY_HEI_GUANG_CAVALRY = 1946
export const LOU_CHUAN = 1948

// Tech IDs
export const TOWN_WATCH = 8
export const CROP_ROTATION = 12
export const HEAVY_PLOW = 13
export const HORSE_COLLAR = 14
export const GUILDS = 15
export const BANKING = 17
export const LOOM = 22
export const COINAGE = 23
export const HUSBANDRY = 39
export const FAITH = 45
export const DEVOTION = 46
export const CHEMISTRY = 47
export const CARAVAN = 48
export const MASONRY = 50
export const ARCHITECTURE = 51
export const TREADMILL_CRANE = 54
export const GOLD_MINING = 55
export const KEEP_TECH = 63
export const BOMBARD_TOWER_TECH = 64
export const GILLNETS = 65
export const FORGING = 67
export const IRON_CASTING = 68
export const SCALE_MAIL_ARMOR = 74
export const BLAST_FURNACE = 75
export const CHAIN_MAIL_ARMOR = 76
export const PLATE_MAIL_ARMOR = 77
export const PLATE_BARDING_ARMOR = 80
export const SCALE_BARDING_ARMOR = 81
export const CHAIN_BARDING_ARMOR = 82
export const BALLISTICS = 93
export const FEUDAL_AGE = 101
export const CASTLE_AGE = 102
export const IMPERIAL_AGE = 103
export const GUARD_TOWER_TECH = 140
export const GOLD_SHAFT_MINING = 182
export const FORTIFIED_WALL_TECH = 194
export const FLETCHING = 199
export const BODKIN_ARROW = 200
export const BRACER = 201
export const DOUBLE_BIT_AXE = 202
export const BOW_SAW = 203
export const PADDED_ARCHER_ARMOR = 211
export const LEATHER_ARCHER_ARMOR = 212
export const WHEELBARROW = 213
export const SQUIRES = 215
export const RING_ARCHER_ARMOR = 219
export const TWO_MAN_SAW = 221
export const BLOCK_PRINTING = 230
export const SANCTITY = 231
export const ILLUMINATION = 233
export const HAND_CART = 249
export const FERVOR = 252
export const STONE_MINING = 278
export const STONE_SHAFT_MINING = 279
export const TOWN_PATROL = 280
export const CONSCRIPTION = 315
export const REDEMPTION = 316
export const ATONEMENT = 319
export const SAPPERS = 321
export const MURDER_HOLES = 322
export const SHIPWRIGHT = 373
export const CAREENING = 374
export const DRY_DOCK = 375
export const SIEGE_ENGINEERS = 377
export const HOARDINGS = 379
export const HEATED_SHOT = 380
export const SPIES_TREASON = 408
export const BLOODLINES = 435
export const PARTHIAN_TACTICS = 436
export const THUMB_RING = 437
export const THEOCRACY = 438
export const HERESY = 439
export const HERBAL_MEDICINE = 441
export const ARSON = 602
export const ARROWSLITS = 608
export const GAMBESONS = 875

// Pasture Tech IDs (for CIV_BONUS_105)
export const TRANSHUMANCE = 1012 // 3. Pastures tech / Grazing Grasslands
export const PASTORALISM = 1013 // 2. Pastures tech / Enclosures
export const DOMESTICATION = 1014 // 1. Pastures tech / Livestock Husbandry

export const locales: Record<string, string> = {
  en: 'English',
  zh: '简体中文',
  tw: '繁體中文',
  fr: 'Français',
  de: 'Deutsch',
  hi: 'हिंदी',
  it: 'Italiano',
  jp: '日本語',
  ko: '한국어',
  ms: 'Bahasa Melayu',
  ru: 'Русский',
  es: 'Español',
  mx: 'Español (México)',
  tr: 'Türkçe',
  vi: 'Tiếng Việt',
  br: 'Português (Brasil)',
}

export const defaultLocale = 'en'

export const unclickableCarets = [
  'unit_83',
  'building_109',
  'building_621',
  'building_584',
  'building_562',
  'building_68',
  'building_1889', // PASTURE - should be enabled by default like Mill
  'tech_408',
]

export const danglingCarets = [
  'tech_436',
  'unit_5',
  'unit_38',
  'unit_17',
  'tech_65',
  'tech_47',
  'tech_377',
  'tech_608',
  'unit_331',
  'tech_233',
  'tech_230',
  'tech_438',
  'tech_8',
  'tech_213',
  'tech_23',
  'tech_15',
  'unit_36',
  'unit_420',
  'unit_1901',
  'unit_1942',
  'unit_1948',
  'unit_1795',
]

export const regionalCarets = [
  'unit_1942',
  'unit_751',
  'unit_752',
  'unit_753',
  'unit_873',
  'unit_875',
  'unit_1901',
  'unit_1903',
  'unit_1904',
  'unit_1907',
  'unit_1944',
  'unit_1946',
  'unit_329',
  'unit_330',
  'unit_1370',
  'unit_1372',
  'unit_1132',
  'unit_1134',
  'unit_1744',
  'unit_1746',
  'unit_1795',
  'unit_1948',
]

export function useTechtreeData() {
  return {
    TYPES,
    PREFIX,
    locales,
    defaultLocale,
    unclickableCarets,
    danglingCarets,
    regionalCarets,
  }
}
