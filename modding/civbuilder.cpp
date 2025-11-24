#include "civbuilder.h"

Civbuilder::Civbuilder(DatFile *df, Value config, string logpath, string aipath) {
    this->df = df;
    this->config = config;
    this->logfile.open(logpath);
    this->aipath = aipath;
    this->initialize();
}

Civbuilder::~Civbuilder() {
    this->logfile.close();
    ofstream aifile;
    aifile.open(this->aipath);
    aifile << this->ai << endl;
    aifile.close();
}

// Helper methods for TrainLocation manipulation
void Civbuilder::ensureTrainLocation(unit::Creatable& creatable) {
    if (creatable.TrainLocations.empty()) {
        creatable.TrainLocations.emplace_back();
    }
}

void Civbuilder::setTrainLocationID(unit::Creatable& creatable, int16_t unitID) {
    ensureTrainLocation(creatable);
    creatable.TrainLocations[0].UnitID = unitID;
}

void Civbuilder::setTrainButtonID(unit::Creatable& creatable, uint8_t buttonID) {
    ensureTrainLocation(creatable);
    creatable.TrainLocations[0].ButtonID = buttonID;
}

void Civbuilder::setTrainLocation(unit::Creatable& creatable, int16_t unitID, uint8_t buttonID, int32_t HotKeyID) {
    ensureTrainLocation(creatable);
    creatable.TrainLocations[0].UnitID = unitID;
    creatable.TrainLocations[0].ButtonID = buttonID;
    creatable.TrainLocations[0].HotKeyID = HotKeyID;
}

void Civbuilder::setTrainTime(unit::Creatable& creatable, int16_t trainTime) {
    ensureTrainLocation(creatable);
    creatable.TrainLocations[0].TrainTime = trainTime;
}

// Helper methods for ResearchLocation manipulation
void Civbuilder::ensureResearchLocation(Tech& tech) {
    if (tech.ResearchLocations.empty()) {
        tech.ResearchLocations.emplace_back();
    }
}

void Civbuilder::setResearchLocation(Tech& tech, int16_t locationID, int16_t researchTime, uint8_t buttonID) {
    ensureResearchLocation(tech);
    tech.ResearchLocations[0].LocationID = locationID;
    tech.ResearchLocations[0].ResearchTime = researchTime;
    tech.ResearchLocations[0].ButtonID = buttonID;
    // Also set the old fields for backwards compatibility
    tech.ResearchLocation = locationID;
    tech.ResearchTime = researchTime;
    tech.ButtonID = buttonID;
}

int16_t Civbuilder::getResearchLocation(const Tech& tech) {
    // Prefer reading from the vector if available
    if (!tech.ResearchLocations.empty()) {
        return tech.ResearchLocations[0].LocationID;
    }
    // Fall back to the old field
    return tech.ResearchLocation;
}


void Civbuilder::initialize() {
    // Log loaded dat file information
    cout << "[C++]: Dat file loaded with " << df->Civs.size() << " civilization slots" << endl;
    
    // Use actual civ count from dat file instead of hardcoded value
    // Civ[0] is Gaia/template, player civs are Civ[1] through Civ[df->Civs.size()-1]
    // So numPlayerCivs represents the number of player civs (not including Gaia)
    this->numPlayerCivs = df->Civs.size() - 1;
    cout << "[C++]: Using numPlayerCivs = " << this->numPlayerCivs << " (player civs, Civ[0] is Gaia)" << endl;
    
    // Validate civ count is reasonable
    if (this->numPlayerCivs < 1 || this->numPlayerCivs > 100) {
        cerr << "[C++]: WARNING - Unusual player civ count: " << this->numPlayerCivs << endl;
        cerr << "[C++]: Expected range: 1-100. Dat file may be corrupted." << endl;
    }

    this->duplicationUnits = {};

    this->unitClasses["barracks"] = {UNIT_MILITIA, UNIT_MAN_AT_ARMS, UNIT_LONG_SWORDSMAN, UNIT_TWO_HANDED_SWORDSMAN, UNIT_CHAMPION, UNIT_SPEARMAN, UNIT_PIKEMAN, UNIT_HALBERDIER,
                                   UNIT_EAGLE_SCOUT, UNIT_EAGLE_WARRIOR, UNIT_ELITE_EAGLE_WARRIOR, UNIT_CONDOTTIERO_1, UNIT_LEGIONARY, UNIT_FLEMISH_MILITIA, UNIT_JIAN_SWORDSMAN, UNIT_JIAN_SWORDSMAN_1,
                                   UNIT_FIRE_LANCER, UNIT_ELITE_FIRE_LANCER};
    this->unitClasses["stable"] = {UNIT_SCOUT_CAVALRY, UNIT_LIGHT_CAVALRY, UNIT_HUSSAR, UNIT_WINGED_HUSSAR, UNIT_KNIGHT, UNIT_CAVALIER, UNIT_PALADIN, UNIT_CAMEL_RIDER,
                                   UNIT_HEAVY_CAMEL_RIDER, UNIT_IMPERIAL_CAMEL_RIDER, UNIT_BATTLE_ELEPHANT, UNIT_ELITE_BATTLE_ELEPHANT, UNIT_STEPPE_LANCER, UNIT_ELITE_STEPPE_LANCER, UNIT_HLETRIEN, UNIT_CAMEL_SCOUT,
                                   UNIT_SHRIVAMSHA_RIDER, UNIT_ELITE_SHRIVAMSHA_RIDER, UNIT_SAVAR, UNIT_HEI_GUANG_CAVALRY, UNIT_HEAVY_HEI_GUANG_CAVALRY};
    this->unitClasses["archery"] = {UNIT_ARCHER, UNIT_CROSSBOWMAN, UNIT_ARBALESTER, UNIT_HAND_CANNONEER, UNIT_SKIRMISHER, UNIT_ELITE_SKIRMISHER, UNIT_IMPERIAL_SKIRMISHER, UNIT_CAVALRY_ARCHER,
                                   UNIT_HEAVY_CAVALRY_ARCHER, UNIT_SLINGER, UNIT_GENITOUR, UNIT_ELITE_GENITOUR, UNIT_GRENADIER, UNIT_XIANBEI_RAIDER};
    this->unitClasses["workshop"] = {UNIT_BATTERING_RAM, UNIT_BATTERING_RAM_1, UNIT_CAPPED_RAM, UNIT_SIEGE_RAM, UNIT_MANGONEL, UNIT_ONAGER, UNIT_SIEGE_ONAGER, UNIT_SIEGE_TOWER,
                                   UNIT_SIEGE_TOWER_1, UNIT_BOMBARD_CANNON, UNIT_SCORPION, UNIT_HEAVY_SCORPION, UNIT_HOUFNICE, UNIT_ARMORED_ELEPHANT, UNIT_SIEGE_ELEPHANT, UNIT_WAR_CHARIOT_FOCUS_FIRE,
                                   UNIT_WAR_CHARIOT_BARRAGE, UNIT_MOUNTED_TREBUCHET, UNIT_TRACTION_TREBUCHET, UNIT_FLAMING_CAMEL, UNIT_ROCKET_CART, UNIT_HEAVY_ROCKET_CART};
    this->unitClasses["elephant"] = {UNIT_WAR_ELEPHANT, UNIT_ELITE_WAR_ELEPHANT, UNIT_ELEPHANT_ARCHER, UNIT_ELITE_ELEPHANT_ARCHER, UNIT_BALLISTA_ELEPHANT, UNIT_ELITE_BALLISTA_ELEPHANT, UNIT_BATTLE_ELEPHANT, UNIT_ELITE_BATTLE_ELEPHANT,
                                   UNIT_ARMORED_ELEPHANT, UNIT_SIEGE_ELEPHANT};
    this->unitClasses["gunpowder"] = {UNIT_HAND_CANNONEER, UNIT_BOMBARD_CANNON, UNIT_CANNON_GALLEON, UNIT_ELITE_CANNON_GALLEON, UNIT_JANISSARY, UNIT_ELITE_JANISSARY, UNIT_ORGAN_GUN, UNIT_ELITE_ORGAN_GUN,
                                   UNIT_CONQUISTADOR, UNIT_ELITE_CONQUISTADOR, UNIT_HOUFNICE, UNIT_HUSSITE_WAGON, UNIT_ELITE_HUSSITE_WAGON, UNIT_GRENADIER, UNIT_TURTLE_SHIP, UNIT_ELITE_TURTLE_SHIP,
                                   UNIT_ROCKET_CART, UNIT_HEAVY_ROCKET_CART};
    this->unitClasses["camel"] = {UNIT_CAMEL_RIDER, UNIT_HEAVY_CAMEL_RIDER, UNIT_IMPERIAL_CAMEL_RIDER, UNIT_CAMEL_ARCHER, UNIT_ELITE_CAMEL_ARCHER, UNIT_FLAMING_CAMEL, UNIT_MAMELUKE, UNIT_ELITE_MAMELUKE,
                                   UNIT_CAMEL_SCOUT, UNIT_MOUNTED_TREBUCHET};
    this->unitClasses["explosive"] = {UNIT_DEMOLITION_SHIP, UNIT_HEAVY_DEMOLITION_SHIP, UNIT_DEMOLITION_RAFT, UNIT_PETARD, UNIT_FLAMING_CAMEL, UNIT_HDSQD, UNIT_GRENADIER};
    this->unitClasses["scorpion"] = {UNIT_SCORPION, UNIT_PROJECTILE_SGY_FIRE};
    this->unitClasses["unique"] = {UNIT_LONGBOWMAN, UNIT_ELITE_LONGBOWMAN, UNIT_THROWING_AXEMAN, UNIT_ELITE_THROWING_AXEMAN, UNIT_HUSKARL, UNIT_ELITE_HUSKARL, UNIT_TEUTONIC_KNIGHT, UNIT_ELITE_TEUTONIC_KNIGHT,
                                   UNIT_SAMURAI, UNIT_ELITE_SAMURAI, UNIT_CHU_KO_NU, UNIT_ELITE_CHU_KO_NU, UNIT_CATAPHRACT, UNIT_ELITE_CATAPHRACT, UNIT_MAMELUKE, UNIT_ELITE_MAMELUKE,
                                   UNIT_WAR_ELEPHANT, UNIT_ELITE_WAR_ELEPHANT, UNIT_JANISSARY, UNIT_ELITE_JANISSARY, UNIT_BERSERK, UNIT_ELITE_BERSERK, UNIT_MANGUDAI, UNIT_ELITE_MANGUDAI,
                                   UNIT_WOAD_RAIDER, UNIT_ELITE_WOAD_RAIDER, UNIT_CONQUISTADOR, UNIT_ELITE_CONQUISTADOR, UNIT_JAGUAR_WARRIOR, UNIT_ELITE_JAGUAR_WARRIOR, UNIT_PLUMED_ARCHER, UNIT_ELITE_PLUMED_ARCHER,
                                   UNIT_TARKAN, UNIT_ELITE_TARKAN, UNIT_WAR_WAGON, UNIT_ELITE_WAR_WAGON, UNIT_GENOESE_CROSSBOWMAN, UNIT_ELITE_GENOESE_CROSSBOWMAN, UNIT_GHULAM, UNIT_ELITE_GHULAM,
                                   UNIT_KAMAYUK, UNIT_ELITE_KAMAYUK, UNIT_MAGYAR_HUSZAR, UNIT_ELITE_MAGYAR_HUSZAR, UNIT_BOYAR, UNIT_ELITE_BOYAR, UNIT_ORGAN_GUN, UNIT_ELITE_ORGAN_GUN,
                                   UNIT_SHOTEL_WARRIOR, UNIT_ELITE_SHOTEL_WARRIOR, UNIT_GBETO, UNIT_ELITE_GBETO, UNIT_CAMEL_ARCHER, UNIT_ELITE_CAMEL_ARCHER, UNIT_BALLISTA_ELEPHANT, UNIT_ELITE_BALLISTA_ELEPHANT,
                                   UNIT_KARAMBIT_WARRIOR, UNIT_ELITE_KARAMBIT_WARRIOR, UNIT_ARAMBAI, UNIT_ELITE_ARAMBAI, UNIT_RATTAN_ARCHER, UNIT_ELITE_RATTAN_ARCHER, UNIT_KONNIK, UNIT_ELITE_KONNIK,
                                   UNIT_KONNIK_DISMOUNTED, UNIT_ELITE_KONNIK_DISMOUNTED, UNIT_KESHIK, UNIT_ELITE_KESHIK, UNIT_KIPCHAK, UNIT_ELITE_KIPCHAK, UNIT_LEITIS, UNIT_ELITE_LEITIS,
                                   UNIT_COUSTILLIER, UNIT_ELITE_COUSTILLIER, UNIT_SERJEANT, UNIT_ELITE_SERJEANT, UNIT_OBUCH, UNIT_OBUCH_D, UNIT_HUSSITE_WAGON, UNIT_ELITE_HUSSITE_WAGON,
                                   UNIT_URUMI_SWORDSMAN, UNIT_ELITE_URUMI_SWORDSMAN, UNIT_RATHA_MELEE, UNIT_ELITE_RATHA_MELEE, UNIT_CHAKRAM_THROWER, UNIT_ELITE_CHAKRAM_THROWER, UNIT_RATHA, UNIT_ELITE_RATHA,
                                   UNIT_COMPOSITE_BOWMAN, UNIT_ELITE_COMPOSITE_BOWMAN, UNIT_MONASPA, UNIT_ELITE_MONASPA, UNIT_WHITE_FEATHER_GUARD, UNIT_ELITE_WHITE_FEATHER_GUARD, UNIT_FIRE_ARCHER, UNIT_ELITE_FIRE_ARCHER,
                                   UNIT_TIGER_CAVALRY, UNIT_ELITE_TIGER_CAVALRY, UNIT_IRON_PAGODA, UNIT_ELITE_IRON_PAGODA, UNIT_LIAO_DAO, UNIT_ELITE_LIAO_DAO};
    this->unitClasses["steppe"] = {UNIT_STEPPE_LANCER, UNIT_ELITE_STEPPE_LANCER};
    this->unitClasses["shock"] = {UNIT_EAGLE_SCOUT, UNIT_ELITE_EAGLE_WARRIOR, UNIT_EAGLE_WARRIOR, UNIT_JIAN_SWORDSMAN, UNIT_JIAN_SWORDSMAN_1, UNIT_FIRE_LANCER, UNIT_ELITE_FIRE_LANCER};
    this->unitClasses["ram"] = {UNIT_BATTERING_RAM, UNIT_BATTERING_RAM_1, UNIT_CAPPED_RAM, UNIT_SIEGE_RAM};
    this->unitClasses["footArcher"] = {UNIT_ARCHER, UNIT_LONGBOWMAN, UNIT_CROSSBOWMAN, UNIT_CHU_KO_NU, UNIT_SLINGER, UNIT_ARBALESTER, UNIT_ELITE_LONGBOWMAN, UNIT_ELITE_CHU_KO_NU,
                                   UNIT_PLUMED_ARCHER, UNIT_ELITE_PLUMED_ARCHER, UNIT_GENOESE_CROSSBOWMAN, UNIT_ELITE_GENOESE_CROSSBOWMAN, UNIT_RATTAN_ARCHER, UNIT_ELITE_RATTAN_ARCHER, UNIT_COMPOSITE_BOWMAN, UNIT_ELITE_COMPOSITE_BOWMAN,
                                   UNIT_FIRE_ARCHER, UNIT_ELITE_FIRE_ARCHER};
    this->unitClasses["archerLine"] = {UNIT_ARCHER, UNIT_LONGBOWMAN, UNIT_ARBALESTER};
    this->unitClasses["spear"] = {UNIT_SPEARMAN, UNIT_PIKEMAN, UNIT_HALBERDIER, UNIT_SPEARMAN_1, UNIT_PIKEMAN_1, UNIT_HALBERDIER_1};
    this->unitClasses["skirmisher"] = {UNIT_ELITE_SKIRMISHER, UNIT_SKIRMISHER, UNIT_IMPERIAL_SKIRMISHER, UNIT_GENIT, UNIT_GENITX, UNIT_GENITOUR, UNIT_ELITE_GENITOUR};
    this->unitClasses["lightCav"] = {UNIT_SCOUT_CAVALRY, UNIT_LIGHT_CAVALRY, UNIT_HUSSAR, UNIT_WINGED_HUSSAR};
    this->unitClasses["uniqueShip"] = {UNIT_LONGBOAT, UNIT_ELITE_LONGBOAT, UNIT_CARAVEL, UNIT_ELITE_CARAVEL, UNIT_THIRISADAI, UNIT_TURTLE_SHIP, UNIT_ELITE_TURTLE_SHIP, UNIT_CANOE,
                                   UNIT_DRAGON_SHIP, UNIT_DRAGON_SHIP_1};
    this->unitClasses["trebuchet"] = {UNIT_TREBUCHET, UNIT_PTREB, UNIT_TREBU, UNIT_PTREB_1, UNIT_MOUNTED_TREBUCHET, UNIT_TRACTION_TREBUCHET, UNIT_HGOS, UNIT_HGOSP,
                                   UNIT_LOU_CHUAN};

    this->civBonuses[CIV_BONUS_0_TOWN_CENTERS_COST_50_WOOD_STARTING_IN] = {381};
    this->civBonuses[CIV_BONUS_1_FOOT_ARCHERS_EXCEPT_SKIRMISHERS_1_RANGE_IN] = {382, 403};
    this->civBonuses[CIV_BONUS_2_SHEPHERDS_WORK_25_FASTER] = {383};
    this->civBonuses[CIV_BONUS_3_CASTLES_COST_15_IN_CASTLE_25_IN_IMPERIAL_AGE] = {325, 330};
    this->civBonuses[CIV_BONUS_4_MOUNTED_UNITS_20_HIT_POINTS_STARTING_IN_FEUDAL_AGE] = {290};
    this->civBonuses[CIV_BONUS_5_FORAGERS_WORK_10_FASTER] = {524};
    this->civBonuses[CIV_BONUS_6_LOOM_CAN_BE_RESEARCHED_INSTANTLY] = {343};
    this->civBonuses[CIV_BONUS_7_VILLAGERS_5_ATTACK_VS_WILD_BOAR_HUNTERS] = {402};
    this->civBonuses[CIV_BONUS_8_10_POPULATION_IN_IMPERIAL_AGE] = {406};
    this->civBonuses[CIV_BONUS_9_INFANTRY_1_ATTACK_VS_BUILDINGS_PER_AGE] = {327, 328, 329};
    this->civBonuses[CIV_BONUS_10_INFANTRY_COST_15_IN_DARK_20_IN] = {344, 731, 732, 733};
    this->civBonuses[CIV_BONUS_11_MONKS_DOUBLE_HEALING_RANGE] = {347};
    this->civBonuses[CIV_BONUS_12_TOWERS_GARRISON_2X_UNITS_TOWN_CENTERS_GARRISON_10] = {336, 353};
    this->civBonuses[CIV_BONUS_13_FARMS_COST_40] = {314};
    this->civBonuses[CIV_BONUS_14_BARRACKS_AND_STABLE_UNITS_1_ARMOR_IN] = {334, 335};
    this->civBonuses[CIV_BONUS_15_ECONOMIC_DROP_OFF_BUILDINGS_COST_50] = {340};
    this->civBonuses[CIV_BONUS_16_FISHING_SHIPS_2X_HIT_POINTS_2P_ARMOR] = {306, 422, 423, 424};
    this->civBonuses[CIV_BONUS_17_INFANTRY_ATTACK_33_FASTER_STARTING_IN_FEUDAL_AGE] = {341};
    this->civBonuses[CIV_BONUS_18_START_WITH_3_VILLAGERS_50_WOOD_200] = {302, 226, 425};
    this->civBonuses[CIV_BONUS_19_DEMOLITION_SHIPS_50_HIT_POINTS] = {396};
    this->civBonuses[CIV_BONUS_20_TECHNOLOGIES_COST_5_FEUDAL_10_CASTLE_15] = {304, 350, 351, 352};
    this->civBonuses[CIV_BONUS_21_BUILDINGS_10_HP_DARK_20_FEUDAL_30] = {283, 417, 418, 419};
    this->civBonuses[CIV_BONUS_22_FIRE_SHIPS_ATTACK_25_FASTER] = {397};
    this->civBonuses[CIV_BONUS_23_CAMEL_RIDERS_SKIRMISHERS_PIKEMEN_HALBERDIERS_COST_25] = {284};
    this->civBonuses[CIV_BONUS_24_START_WITH_50_WOOD_FOOD] = {223};
    this->civBonuses[CIV_BONUS_25_TOWN_CENTER_DOCK_2X_HIT_POINTS] = {342};
    this->civBonuses[CIV_BONUS_26_TOWN_CENTER_DOCK_WORK_RATE_5_DARK] = {409, 412};
    this->civBonuses[CIV_BONUS_27_MARKET_COSTS_100_WOOD_MARKET_TRADE_COST_ONLY_5] = {355};
    this->civBonuses[CIV_BONUS_28_TRANSPORT_SHIPS_2X_HIT_POINTS_20_CARRY_CAPACITY] = {337};
    this->civBonuses[CIV_BONUS_29_GALLEYS_ATTACK_25_FASTER] = {404};
    this->civBonuses[CIV_BONUS_30_CAMEL_UNITS_25_HIT_POINTS] = {312};
    this->civBonuses[CIV_BONUS_31_GUNPOWDER_UNITS_25_HIT_POINTS] = {301};
    this->civBonuses[CIV_BONUS_32_GOLD_MINERS_WORK_20_FASTER] = {300};
    this->civBonuses[CIV_BONUS_33_SCOUT_CAVALRY_LIGHT_CAVALRY_HUSSAR_1_PIERCE_ARMOR] = {452};
    this->civBonuses[CIV_BONUS_34_WARSHIPS_COST_15_FEUDAL_AGE_15_CASTLE] = {395, 501, 502};
    this->civBonuses[CIV_BONUS_35_INFANTRY_20_HIT_POINTS_STARTING_IN_FEUDAL_AGE] = {416, 415, 391};
    this->civBonuses[CIV_BONUS_36_CAVALRY_ARCHERS_FIRE_25_FASTER] = {394};
    this->civBonuses[CIV_BONUS_37_HUNTERS_WORK_40_FASTER] = {389};
    this->civBonuses[CIV_BONUS_38_LIGHT_CAVALRY_HUSSARS_STEPPE_LANCERS_20_30] = {286, 287, 288, 388};
    this->civBonuses[CIV_BONUS_39_INFANTRY_MOVES_5_10_15_20_FASTER] = {393, 898, 899, 900};
    this->civBonuses[CIV_BONUS_40_LUMBERJACKS_WORK_15_FASTER] = {385};
    this->civBonuses[CIV_BONUS_41_SIEGE_UNITS_FIRE_25_FASTER] = {386};
    this->civBonuses[CIV_BONUS_42_CAN_STEAL_SHEEP_AND_SHEEP_WITHIN_ONE] = {405};
    this->civBonuses[CIV_BONUS_43_MISSIONARIES_CAN_BE_TRAINED_IN_MONASTERIES] = {84};
    this->civBonuses[CIV_BONUS_44_START_WITH_50_GOLD] = {224};
    this->civBonuses[CIV_BONUS_45_5_MONK_HIT_POINTS_FOR_EACH_MONASTERY_TECHNOLOGY] = {29, 30, 31, 32, 33, 36, 38, 40, 41, 66, 456};
    this->civBonuses[CIV_BONUS_46_START_WITH_1_VILLAGER_BUT_50_FOOD] = {554, 227};
    this->civBonuses[CIV_BONUS_47_CAVALRY_ARCHERS_COST_10_CASTLE_20_IMPERIAL_AGE] = {458, 459};
    this->civBonuses[CIV_BONUS_48_RANGED_SOLDIERS_AND_INFANTRY_COST_50_WOOD] = {390};
    this->civBonuses[CIV_BONUS_49_ARCHER_ARMOR_UPGRADES_FREE] = {451};
    this->civBonuses[CIV_BONUS_50_CAN_TRAIN_TURTLE_SHIPS_IN_DOCKS] = {447, 448};
    this->civBonuses[CIV_BONUS_51_CAN_RECRUIT_LONGBOATS_FROM_DOCKS] = {272, 372};
    this->civBonuses[CIV_BONUS_52_GUNPOWDER_UNITS_COST_20] = {500};
    this->civBonuses[CIV_BONUS_53_CAN_UPGRADE_HEAVY_CAMEL_RIDERS_TO_IMPERIAL] = {521};
    this->civBonuses[CIV_BONUS_54_FISHERMEN_WORK_10_FASTER] = {469};
    this->civBonuses[CIV_BONUS_55_STABLE_UNITS_1P_ARMOR_IN_CASTLE_AND] = {338, 552};
    this->civBonuses[CIV_BONUS_56_VILLAGERS_COST_8_DARK_13_FEUDAL_18] = {496, 497, 498, 553};
    this->civBonuses[CIV_BONUS_57_MILITARY_UNITS_COST_10_15_20_25] = {152, 153, 154, 155};
    this->civBonuses[CIV_BONUS_58_BUILDINGS_COST_15_STONE] = {519};
    this->civBonuses[CIV_BONUS_59_HOUSES_SUPPORT_10_POPULATION] = {495};
    this->civBonuses[CIV_BONUS_60_VILLAGERS_AFFECTED_BY_BLACKSMITH_UPGRADES_STARTING_IN] = {474, 475, 476, 477, 478, 479};
    this->civBonuses[CIV_BONUS_61_CAN_RECRUIT_SLINGERS_FROM_ARCHERY_RANGES] = {528};
    this->civBonuses[CIV_BONUS_62_VILLAGERS_KILL_WOLVES_WITH_1_STRIKE] = {69};
    this->civBonuses[CIV_BONUS_63_SCOUT_CAVALRY_LIGHT_CAVALRY_HUSSAR_COST_15] = {473};
    this->civBonuses[CIV_BONUS_64_SIEGE_WORKSHOP_UNITS_15_CHEAPER] = {511};
    this->civBonuses[CIV_BONUS_65_ALL_UNITS_COST_20_GOLD] = {559};
    this->civBonuses[CIV_BONUS_66_FORAGERS_GENERATE_A_TRICKLE_OF_WOOD_33] = {453};
    this->civBonuses[CIV_BONUS_67_SHIPS_10_HP] = {560};
    this->civBonuses[CIV_BONUS_68_CAN_BUILD_FEITORIA_IN_IMPERIAL_AGE] = {570};
    this->civBonuses[CIV_BONUS_69_CAN_BUILD_CARAVELS_IN_DOCKS] = {596, 597};
    this->civBonuses[CIV_BONUS_70_FOOT_ARCHERS_FIRE_18_FASTER] = {607};
    this->civBonuses[CIV_BONUS_71_RECEIVE_100_GOLD_100_FOOD_WHEN_ADVANCING] = {587, 588, 589};
    this->civBonuses[CIV_BONUS_72_PIKEMAN_UPGRADE_FREE] = {590};
    this->civBonuses[CIV_BONUS_73_BUILDINGS_COST_15_WOOD] = {595};
    this->civBonuses[CIV_BONUS_74_BARRACKS_UNITS_1_PIERCE_ARMOR_PER_AGE] = {591, 592, 593};
    this->civBonuses[CIV_BONUS_75_VILLAGERS_DROP_OFF_10_MORE_GOLD] = {594};
    this->civBonuses[CIV_BONUS_76_VILLAGERS_MOVE_5_FASTER_IN_DARK_AGE] = {584};
    this->civBonuses[CIV_BONUS_77_SHIPS_MOVE_10_FASTER] = {585};
    this->civBonuses[CIV_BONUS_78_STABLE_UNITS_COST_15_IN_CASTLE_20_IN_IMPERIAL_AGE] = {586, 613};
    this->civBonuses[CIV_BONUS_79_MELEE_ELEPHANT_UNITS_MOVE_10_FASTER] = {672};
    this->civBonuses[CIV_BONUS_80_VILLAGERS_CAN_GARRISON_IN_HOUSES] = {657};
    this->civBonuses[CIV_BONUS_81_NO_BUILDINGS_REQUIRED_TO_ADVANCE_TO_THE] = {638};
    this->civBonuses[CIV_BONUS_82_ADVANCE_TO_THE_NEXT_AGE_66_FASTER] = {634};
    this->civBonuses[CIV_BONUS_83_ELEPHANT_UNITS_COST_25_CASTLE_35_IN_IMPERIAL_AGE] = {662, 663};
    this->civBonuses[CIV_BONUS_84_FISH_TRAPS_COST_33_AND_PROVIDE_200_FOOD] = {635, 637};
    this->civBonuses[CIV_BONUS_85_FOOT_ARCHERS_AND_CONDOTTIERI_1_MELEE_1] = {901};
    this->civBonuses[CIV_BONUS_86_LUMBER_CAMP_UPGRADES_FREE] = {645};
    this->civBonuses[CIV_BONUS_87_INFANTRY_1_ATTACK_PER_AGE_STARTING_IN] = {646, 647, 648};
    this->civBonuses[CIV_BONUS_88_MONASTERY_TECHNOLOGIES_COST_50] = {649};
    this->civBonuses[CIV_BONUS_89_ENEMY_POSITIONS_ARE_REVEALED_AT_THE_START] = {665};
    this->civBonuses[CIV_BONUS_90_ARCHERY_RANGE_UNITS_AND_FIRE_LANCERS_20_HP] = {632};
    this->civBonuses[CIV_BONUS_91_MILITIA_LINE_UPGRADES_FREE] = {693};
    this->civBonuses[CIV_BONUS_92_TOWN_CENTERS_COST_50_STONE_STARTING_IN] = {694};
    this->civBonuses[CIV_BONUS_93_CAN_BUILD_KREPOST] = {695};
    this->civBonuses[CIV_BONUS_94_LIVESTOCK_ANIMALS_LAST_50_LONGER] = {704};
    this->civBonuses[CIV_BONUS_95_UNITS_DEAL_25_DAMAGE_WHEN_FIGHTING_FROM] = {696};
    this->civBonuses[CIV_BONUS_96_THUMB_RING_PARTHIAN_TACTICS_FREE] = {698};
    this->civBonuses[CIV_BONUS_97_MOUNTED_UNITS_5_FASTER_EACH_AGE_STARTING] = {711, 727, 728};
    this->civBonuses[CIV_BONUS_98_ADDITIONAL_TOWN_CENTER_CAN_BE_BUILT_IN] = {709, 723, 724};
    this->civBonuses[CIV_BONUS_99_SIEGE_WORKSHOP_AND_BATTERING_RAM_AVAILABLE_IN] = {295, 705, 706};
    this->civBonuses[CIV_BONUS_100_RECEIVE_100_FOOD_PER_TOWN_CENTER] = {697};
    this->civBonuses[CIV_BONUS_101_SPEARMEN_AND_SKIRMISHERS_MOVE_10_FASTER] = {710};
    this->civBonuses[CIV_BONUS_102_EACH_GARRISONED_RELIC_GIVES_1_ATTACK_TO] = {699, 700, 701, 702};
    this->civBonuses[CIV_BONUS_103_CAVALIER_UPGRADE_AVAILABLE_IN_CASTLE_AGE] = {768};
    this->civBonuses[CIV_BONUS_104_GUNPOWDER_UNITS_25_ATTACK] = {769};
    this->civBonuses[CIV_BONUS_105_ECONOMIC_UPGRADES_COST_33_FOOD_AND_AVAILABLE] = {758, 759, 760, 761, 762, 763, 764, 765, 766, 767};
    this->civBonuses[CIV_BONUS_106_FORTIFICATIONS_BUILT_50_TOWN_CENTERS_BUILT_100] = {770};
    this->civBonuses[CIV_BONUS_107_SOLDIERS_RECEIVE_33_LESS_BONUS_DAMAGE] = {771};
    this->civBonuses[CIV_BONUS_108_FARM_UPGRADES_PROVIDE_125_ADDITIONAL_FOOD] = {772, 773, 774, 815, 816, 817};
    this->civBonuses[CIV_BONUS_109_CAN_BUILD_DONJON] = {775};

    this->teamBonuses[0] = TECH_KAMANDARAN;
    this->teamBonuses[1] = TECH_C_BONUS_PLUS_5_MONK_HP_6;
    this->teamBonuses[2] = TECH_BERSERK;
    this->teamBonuses[3] = TECH_CUMAN_MERC_PART2;
    this->teamBonuses[4] = TECH_LECHITIC_LEGACY;
    this->teamBonuses[5] = TECH_MALAY;
    this->teamBonuses[6] = TECH_C_BONUS_FREE_HAND_CART;
    this->teamBonuses[7] = TECH_C_BONUS_PLUS_15_PERCENT_FARMERS;
    this->teamBonuses[8] = TECH_C_BONUS_HUNTING_BONUSES;
    this->teamBonuses[9] = TECH_C_BONUS_CAVALRY_PLUS_5_PERCENT_SPEED_AGE2;
    this->teamBonuses[10] = TECH_BOGSVEIGAR;
    this->teamBonuses[11] = TECH_C_BONUS_ARCHER_RANGE_PLUS_1;
    this->teamBonuses[12] = TECH_C_BONUS_DOMINANT_LOS;
    this->teamBonuses[13] = TECH_YASAMA;
    this->teamBonuses[14] = TECH_EL_DORADO;
    this->teamBonuses[15] = TECH_ELITE_TARKAN;
    this->teamBonuses[16] = TECH_CRENELLATIONS;
    this->teamBonuses[17] = TECH_C_BONUS_PLUS_10_POP;
    this->teamBonuses[18] = TECH_C_BONUS_INF_PLUS_1_ATTACK_CASTLE;
    this->teamBonuses[19] = TECH_C_BONUS_CAMEL_RIDER_ATTACK_SPEED;
    this->teamBonuses[20] = TECH_RENAME_UNITS;
    this->teamBonuses[21] = TECH_DRILL;
    this->teamBonuses[22] = TECH_C_BONUS_MONASTERY_TECHS_50_PERCENT_COST;
    this->teamBonuses[23] = TECH_C_BONUS_PLUS_1_INF_ATTK_1;
    this->teamBonuses[24] = TECH_IRONCLAD;
    this->teamBonuses[25] = TECH_MONK_RANGED_HEAL;
    this->teamBonuses[26] = TECH_SPIES_AND_TREASON;
    this->teamBonuses[27] = TECH_C_BONUS_PLUS_5_MONK_HP_3;
    this->teamBonuses[28] = TECH_C_BONUS_TC_AND_DOCK_WORK_RATE;
    this->teamBonuses[29] = TECH_HUSSITE_REFORMS;
    this->teamBonuses[30] = TECH_SARACEN_ZEALOTRY;
    this->teamBonuses[31] = TECH_SARACENS_UT;
    this->teamBonuses[32] = TECH_C_BONUS_FEUDAL_TC;
    this->teamBonuses[33] = TECH_C_BONUS_GALLEY_PLUS_20_PERCENT_FIRE;
    this->teamBonuses[34] = TECH_C_BONUS_TC_PLUS_15_PERCENT;
    this->teamBonuses[35] = TECH_VIETNAMESE;
    this->teamBonuses[36] = TECH_C_BONUS_TC_PLUS_20_PERCENT;

    this->castleUniqueTechIDs[0] = TECH_ATLATL;
    this->castleUniqueTechIDs[1] = TECH_KASBAH;
    this->castleUniqueTechIDs[2] = TECH_YEOMEN;
    this->castleUniqueTechIDs[3] = TECH_STIRRUPS;
    this->castleUniqueTechIDs[4] = TECH_BURGUNDIAN_VINEYARDS;
    this->castleUniqueTechIDs[5] = TECH_MANIPUR_CAVALRY;
    this->castleUniqueTechIDs[6] = TECH_GREEK_FIRE;
    this->castleUniqueTechIDs[7] = TECH_STRONGHOLD;
    this->castleUniqueTechIDs[8] = TECH_GREAT_WALL;
    this->castleUniqueTechIDs[9] = TECH_STEPPE_HUSBANDRY;
    this->castleUniqueTechIDs[10] = TECH_ROYAL_HEIRS;
    this->castleUniqueTechIDs[11] = TECH_BEARDED_AXE;
    this->castleUniqueTechIDs[12] = TECH_ANARCHY;
    this->castleUniqueTechIDs[13] = TECH_MARAUDERS;
    this->castleUniqueTechIDs[14] = TECH_ANDEAN_SLING;
    this->castleUniqueTechIDs[15] = TECH_GRAND_TRUNK_ROAD;
    this->castleUniqueTechIDs[16] = TECH_PAVISE;
    this->castleUniqueTechIDs[17] = TECH_YASAMA;
    this->castleUniqueTechIDs[18] = TECH_TUSK_SWORDS;
    this->castleUniqueTechIDs[19] = TECH_EUPSEONG;
    this->castleUniqueTechIDs[20] = TECH_HILL_FORTS;
    this->castleUniqueTechIDs[21] = TECH_CORVINIAN_ARMY;
    this->castleUniqueTechIDs[22] = TECH_THALASSOCRACY;
    this->castleUniqueTechIDs[23] = TECH_TIGUI;
    this->castleUniqueTechIDs[24] = TECH_HUL_CHE_JAVELINEERS;
    this->castleUniqueTechIDs[25] = TECH_NOMADS;
    this->castleUniqueTechIDs[26] = TECH_KAMANDARAN;
    this->castleUniqueTechIDs[27] = TECH_CARRACK;
    this->castleUniqueTechIDs[28] = TECH_SARACENS_UT;
    this->castleUniqueTechIDs[29] = TECH_FIRST_CRUSADE;
    this->castleUniqueTechIDs[30] = TECH_SLAVS_UT;
    this->castleUniqueTechIDs[31] = TECH_INQUISITION;
    this->castleUniqueTechIDs[32] = TECH_SILK_ARMOR;
    this->castleUniqueTechIDs[33] = TECH_IRONCLAD;
    this->castleUniqueTechIDs[34] = TECH_SIPAHI;
    this->castleUniqueTechIDs[35] = TECH_CHATRAS;
    this->castleUniqueTechIDs[36] = TECH_CHIEFTAINS;
    this->castleUniqueTechIDs[37] = TECH_SZLACHTA_PRIVILEGES;
    this->castleUniqueTechIDs[38] = TECH_WAGENBURG_TACTICS;
    this->castleUniqueTechIDs[44] = TECH_MEDICAL_CORPS;
    this->castleUniqueTechIDs[45] = TECH_PAIKS;
    this->castleUniqueTechIDs[46] = TECH_KSHATRIYAS;
    this->castleUniqueTechIDs[47] = TECH_DETINETS;
    this->castleUniqueTechIDs[48] = TECH_SARACEN_ZEALOTRY;
    this->castleUniqueTechIDs[49] = TECH_BALLISTAS;
    this->castleUniqueTechIDs[50] = TECH_BIMARISTAN;
    this->castleUniqueTechIDs[51] = TECH_CILICIAN_FLEET;
    this->castleUniqueTechIDs[52] = TECH_SVAN_TOWERS;
    this->castleUniqueTechIDs[54] = TECH_SILK_ROAD;
    this->castleUniqueTechIDs[55] = TECH_COILED_SERPENT_ARRAY;
    this->castleUniqueTechIDs[56] = TECH_RED_CLIFFS_TACTICS;
    this->castleUniqueTechIDs[57] = TECH_TUNTIAN;
    this->castleUniqueTechIDs[58] = TECH_FORTIFIED_BASTIONS;
    this->castleUniqueTechIDs[59] = TECH_LAMELLAR_ARMOR;

    this->impUniqueTechIDs[0] = TECH_GARLAND_WARS;
    this->impUniqueTechIDs[1] = TECH_MAGHREBI_CAMELS;
    this->impUniqueTechIDs[2] = TECH_WARWOLF;
    this->impUniqueTechIDs[3] = TECH_BAGAINS;
    this->impUniqueTechIDs[4] = TECH_FLEMISH_REVOLUTION;
    this->impUniqueTechIDs[5] = TECH_HOWDAH;
    this->impUniqueTechIDs[6] = TECH_LOGISTICA;
    this->impUniqueTechIDs[7] = TECH_FUROR_CELTICA;
    this->impUniqueTechIDs[8] = TECH_ROCKETRY;
    this->impUniqueTechIDs[9] = TECH_CUMAN_MERCENARIES;
    this->impUniqueTechIDs[10] = TECH_TORSION_ENGINES;
    this->impUniqueTechIDs[11] = TECH_CHIVALRY;
    this->impUniqueTechIDs[12] = TECH_PERFUSION;
    this->impUniqueTechIDs[13] = TECH_ATHEISM;
    this->impUniqueTechIDs[14] = TECH_FABRIC_SHIELDS;
    this->impUniqueTechIDs[15] = TECH_SHATAGNI;
    this->impUniqueTechIDs[16] = TECH_PIROTECHNIA;
    this->impUniqueTechIDs[17] = TECH_KATAPARUTO;
    this->impUniqueTechIDs[18] = TECH_DOUBLE_CROSSBOW;
    this->impUniqueTechIDs[19] = TECH_SHINKICHON;
    this->impUniqueTechIDs[20] = TECH_TOWER_SHIELDS;
    this->impUniqueTechIDs[21] = TECH_RECURVE_BOW;
    this->impUniqueTechIDs[22] = TECH_FORCED_LEVY;
    this->impUniqueTechIDs[23] = TECH_FARIMBA;
    this->impUniqueTechIDs[24] = TECH_EL_DORADO;
    this->impUniqueTechIDs[25] = TECH_DRILL;
    this->impUniqueTechIDs[26] = TECH_CITADELS;
    this->impUniqueTechIDs[27] = TECH_ARQUEBUS;
    this->impUniqueTechIDs[28] = TECH_COUNTERWEIGHTS;
    this->impUniqueTechIDs[29] = TECH_HAUBERK;
    this->impUniqueTechIDs[30] = TECH_DRUZHINA;
    this->impUniqueTechIDs[31] = TECH_SUPREMACY;
    this->impUniqueTechIDs[32] = TECH_TIMURID_SIEGECRAFT;
    this->impUniqueTechIDs[33] = TECH_CRENELLATIONS;
    this->impUniqueTechIDs[34] = TECH_ARTILLERY;
    this->impUniqueTechIDs[35] = TECH_PAPER_MONEY;
    this->impUniqueTechIDs[36] = TECH_BOGSVEIGAR;
    this->impUniqueTechIDs[37] = TECH_LECHITIC_LEGACY;
    this->impUniqueTechIDs[38] = TECH_HUSSITE_REFORMS;
    this->impUniqueTechIDs[44] = TECH_WOOTZ_STEEL;
    this->impUniqueTechIDs[45] = TECH_MAHAYANA;
    this->impUniqueTechIDs[46] = TECH_FRONTIER_GUARDS;
    this->impUniqueTechIDs[47] = TECH_COMITATENSES;
    this->impUniqueTechIDs[48] = TECH_FERETERS;
    this->impUniqueTechIDs[49] = TECH_AZNAURI_CAVALRY;
    this->impUniqueTechIDs[54] = TECH_BOLT_MAGAZINE;
    this->impUniqueTechIDs[55] = TECH_SITTING_TIGER;
    this->impUniqueTechIDs[56] = TECH_MING_GUANG_ARMOR;
    this->impUniqueTechIDs[57] = TECH_THUNDERCLAP_BOMBS;
    this->impUniqueTechIDs[58] = TECH_ORDO_CAVALRY;

    this->uuTechIDs[0] = {TECH_LONGBOW_MAKE_AVAIL, TECH_ELITE_LONGBOW};
    this->uuTechIDs[1] = {TECH_THROWING_AXEMEN_MAKE_AVAIL, TECH_ELITE_THROWING_AXEMEN};
    this->uuTechIDs[2] = {TECH_HUSKARL_MAKE_AVAIL, TECH_ELITE_HUSKARL};
    this->uuTechIDs[3] = {TECH_TEUTONIC_KNIGHT_MAKE_AVAIL, TECH_ELITE_TEUTONIC_KNIGHT};
    this->uuTechIDs[4] = {TECH_SAMURAI_MAKE_AVAIL, TECH_ELITE_SAMURAI};
    this->uuTechIDs[5] = {TECH_CHU_KO_NU_MAKE_AVAIL, TECH_ELITE_CHU_KO_NU};
    this->uuTechIDs[6] = {TECH_CATAPHRACT_MAKE_AVAIL, TECH_ELITE_CATAPHRACT};
    this->uuTechIDs[7] = {TECH_MAMELUKE_MAKE_AVAIL, TECH_ELITE_MAMELUKE};
    this->uuTechIDs[8] = {TECH_WAR_ELEPHANT_MAKE_AVAIL, TECH_ELITE_WAR_ELEPHANT};
    this->uuTechIDs[9] = {TECH_JANNISARY_MAKE_AVAIL, TECH_ELITE_JANNISARY};
    this->uuTechIDs[10] = {TECH_BERSERK, TECH_ELITE_BERSERK};
    this->uuTechIDs[11] = {TECH_MOBILE_SIEGE_UNIT_MAKE_AVAIL, TECH_ELITE_MANGUDAI};
    this->uuTechIDs[12] = {TECH_WOAD_BERSERKER_MAKE_AVAIL, TECH_ELITE_WOAD_RAIDER};
    this->uuTechIDs[13] = {TECH_CONQUISTADOR_MAKE_AVAIL, TECH_ELITE_CONQUISTADOR};
    this->uuTechIDs[14] = {TECH_JAGUAR_MAN, TECH_ELITE_JAGUAR_MAN};
    this->uuTechIDs[15] = {TECH_PLUMED_ARCHER_MAKE_AVAIL, TECH_ELITE_PLUMED_ARCHER};
    this->uuTechIDs[16] = {TECH_TARKAN_MAKE_AVAIL, TECH_ELITE_TARKAN};
    this->uuTechIDs[17] = {TECH_WAR_WAGON, TECH_ELITE_WAR_WAGON};
    this->uuTechIDs[18] = {TECH_GENOESE_BOW_MAKE_AVAIL, TECH_ELITE_GENOESE_BOW};
    this->uuTechIDs[19] = {TECH_GHULAM_MAKE_AVAIL, TECH_ELITE_GHULAM};
    this->uuTechIDs[20] = {TECH_KAMAYUK_MAKE_AVAIL, TECH_ELITE_KAMAYUK};
    this->uuTechIDs[21] = {TECH_MAGYAR_HUSZAR_MAKE_AVAIL, TECH_ELITE_MAGYAR_HUSZAR};
    this->uuTechIDs[22] = {TECH_BOYAR_MAKE_AVAIL, TECH_ELITE_SIEGE_TOWER};
    this->uuTechIDs[23] = {TECH_ORGAN_GUN_MAKE_AVAIL, TECH_ELITE_ORGAN_GUN};
    this->uuTechIDs[24] = {TECH_SHOTEL_WARRIOR_MAKE_AVAIL, TECH_ELITE_ETHIOPIA_UNIT};
    this->uuTechIDs[25] = {TECH_GBETO_MAKE_AVAIL, TECH_ELITE_MALI_UNIT};
    this->uuTechIDs[26] = {TECH_CAMEL_ARCHER_MAKE_AVAIL, TECH_ELITE_CAMEL_ARCHER};
    this->uuTechIDs[27] = {TECH_BALLISTA_ELEPHANT_MAKE_AVAIL, TECH_ELITE_BALLISTA_ELEPHANT};
    this->uuTechIDs[28] = {TECH_KARAMBIT_WARRIOR_MAKE_AVAIL, TECH_ELITE_KARAMBIT_WARRIOR};
    this->uuTechIDs[29] = {TECH_ARAMBAI_MAKE_AVAIL, TECH_ELITE_ARAMBAI};
    this->uuTechIDs[30] = {TECH_RATTAN_ARCHER_MAKE_AVAIL, TECH_ELITE_RATTAN_ARCHER};
    this->uuTechIDs[31] = {TECH_KONNIK_MAKE_AVAIL, TECH_ELITE_KONNIK};
    this->uuTechIDs[32] = {TECH_KESHIK_MAKE_AVAIL, TECH_ELITE_KESHIK};
    this->uuTechIDs[33] = {TECH_KIPCHAK_MAKE_AVAIL, TECH_ELITE_KIPCHAK};
    this->uuTechIDs[34] = {TECH_LEITIS_MAKE_AVAIL, TECH_ELITE_LEITIS};
    this->uuTechIDs[35] = {TECH_COUSTILLIER_MAKE_AVAIL, TECH_ELITE_COUSTILLIER};
    this->uuTechIDs[36] = {TECH_SERJEANT_MAKE_AVAIL, TECH_ELITE_SERJEANT};
    this->uuTechIDs[37] = {TECH_OBUCH_MAKE_AVAIL, TECH_ELITE_OBUCH};
    this->uuTechIDs[38] = {TECH_HUSSITE_WAGON_MAKE_AVAIL, TECH_ELITE_HUSSITE_WAGON};
    this->uuTechIDs[78] = {TECH_CHAKRAM_THROWER_MAKE_AVAIL, TECH_ELITE_CHAKRAM_THROWER};
    this->uuTechIDs[79] = {TECH_URUMI_SWORDSMAN_MAKE_AVAIL, TECH_ELITE_URUMI_SWORDSMAN};
    this->uuTechIDs[80] = {TECH_RATHA_MAKE_AVAIL, TECH_ELITE_RATHA};
    this->uuTechIDs[81] = {TECH_COMPOSITE_BOWMAN_MAKE_AVAIL, TECH_ELITE_COMPOSITE_BOWMAN};
    this->uuTechIDs[82] = {TECH_MONASPA_MAKE_AVAIL, TECH_ELITE_MONASPA};
    this->uuTechIDs[83] = {TECH_WHITE_FEATHER_GUARD_MAKE_AVAIL, TECH_ELITE_WHITE_FEATHER_GUARD};
    this->uuTechIDs[84] = {TECH_FIRE_ARCHER_MAKE_AVAIL, TECH_ELITE_FIRE_ARCHER};
    this->uuTechIDs[85] = {TECH_TIGER_CAVALRY_MAKE_AVAIL, TECH_ELITE_TIGER_CAVALRY};
    this->uuTechIDs[86] = {TECH_IRON_PAGODA_MAKE_AVAIL, TECH_ELITE_IRON_PAGODA};
    this->uuTechIDs[87] = {TECH_LIAO_DAO_MAKE_AVAIL, TECH_ELITE_LIAO_DAO};
}

void Civbuilder::configure() {
    cout << "[C++]: Setting up data" << endl;
    this->setupData();
    cout << "[C++]: Creating new data" << endl;
    this->createData();
    cout << "[C++]: Assigning data" << endl;
    this->assignData();
    cout << "[C++]: Reconfiguring" << endl;
    this->reconfigureEffects();
    cout << "[C++]: Cleaning up" << endl;
    this->cleanup();
}

void Civbuilder::createData() {
    this->createNewUnits();
    this->createUniqueTechs();
    this->createCivBonuses();
    this->createTeamBonuses();
}

void Civbuilder::assignData() {
    cout << "[C++]: Assigning architectures..." << endl;
    this->assignArchitectures();
    cout << "[C++]: Assigning languages..." << endl;
    this->assignLanguages();
    cout << "[C++]: Assigning wonders..." << endl;
    this->assignWonders();
    cout << "[C++]: Assigning castles..." << endl;
    this->assignCastles();
    cout << "[C++]: Assigning unique units..." << endl;
    this->assignUniqueUnits();
    cout << "[C++]: Assigning basic techs..." << endl;
    this->assignBasicTechs();
    cout << "[C++]: Assigning unique techs..." << endl;
    this->assignUniqueTechs();
    cout << "[C++]: Assigning civ bonuses..." << endl;
    this->assignCivBonuses();
    cout << "[C++]: Data assignment completed" << endl;
}

void Civbuilder::assignWonders() {
    cout << "[C++]: Assigning wonders for " << numPlayerCivs << " civs" << endl;
    
    // Create wonder graphic dictionary with bounds checking
    for (int i = 0; i < numPlayerCivs; i++) {
        if (i + 1 >= df->Civs.size()) {
            cerr << "[C++]: WARNING - Cannot access Civ[" << (i+1) << "], only " 
                 << df->Civs.size() << " civs available" << endl;
            break;
        }
        if (df->Civs[i + 1].Units.size() <= 276) {
            cerr << "[C++]: WARNING - Civ " << (i+1) << " has only " 
                 << df->Civs[i + 1].Units.size() << " units (need >276 for wonder)" << endl;
            continue;
        }
        wonderGraphics.push_back(this->df->Civs[i + 1].Units[276]);
    }

    for (int i = 0; i < this->config["wonder"].size(); i++) {
        if (i + 1 >= df->Civs.size()) {
            cerr << "[C++]: WARNING - Cannot assign wonder to Civ[" << (i+1) << "]" << endl;
            break;
        }
        if (df->Civs[i + 1].Units.size() <= 276) {
            cerr << "[C++]: WARNING - Cannot assign wonder to Civ " << (i+1) << endl;
            continue;
        }
        int wonderIndex = this->config["wonder"][i].asInt();
        if (wonderIndex >= 0 && wonderIndex < wonderGraphics.size()) {
            this->df->Civs[i + 1].Units[276] = wonderGraphics[wonderIndex];
        } else {
            cerr << "[C++]: WARNING - Invalid wonder index " << wonderIndex << endl;
        }
    }
    cout << "[C++]: Wonder assignment completed" << endl;
}

void Civbuilder::assignCastles() {
    cout << "[C++]: Assigning castles for " << numPlayerCivs << " civs" << endl;
    
    // Create castle graphic dictionary with bounds checking
    for (int i = 0; i < numPlayerCivs; i++) {
        if (i + 1 >= df->Civs.size()) {
            cerr << "[C++]: WARNING - Cannot access Civ[" << (i+1) << "], only " 
                 << df->Civs.size() << " civs available" << endl;
            break;
        }
        if (df->Civs[i + 1].Units.size() <= 82) {
            cerr << "[C++]: WARNING - Civ " << (i+1) << " has only " 
                 << df->Civs[i + 1].Units.size() << " units (need >82 for castle)" << endl;
            continue;
        }
        castleGraphics.push_back(this->df->Civs[i + 1].Units[82]);
    }

    // Assign castles with bounds checking
    for (int i = 0; i < this->config["castle"].size(); i++) {
        if (i + 1 >= df->Civs.size()) {
            cerr << "[C++]: WARNING - Cannot assign castle to Civ[" << (i+1) << "]" << endl;
            break;
        }
        if (df->Civs[i + 1].Units.size() <= 82) {
            cerr << "[C++]: WARNING - Cannot assign castle to Civ " << (i+1) << endl;
            continue;
        }
        int castleIndex = this->config["castle"][i].asInt();
        if (castleIndex >= 0 && castleIndex < castleGraphics.size()) {
            this->df->Civs[i + 1].Units[82] = castleGraphics[castleIndex];
        } else {
            cerr << "[C++]: WARNING - Invalid castle index " << castleIndex << endl;
        }
    }
    cout << "[C++]: Castle assignment completed" << endl;
}

// Give civilizations the appropriate sfx files
void Civbuilder::assignLanguages() {
    int civOffset = 100;

    // Copy language sound items of the civilization we want
    for (int i = 0; i < this->config["language"].size(); i++) {
        for (int j = 0; j < this->df->Sounds.size(); j++) {
            int soundSize = this->df->Sounds[j].Items.size();
            for (int k = 0; k < soundSize; k++) {
                if (this->df->Sounds[j].Items[k].Civilization == (this->config["language"][i].asInt() + 1)) {
                    // Make a copy, but change its civilization so that it doesn't get re-copied
                    SoundItem copySound = this->df->Sounds[j].Items[k];
                    copySound.Civilization = i + 1 + civOffset;
                    this->df->Sounds[j].Items.push_back(copySound);
                }
            }
        }
    }

    // Remove all the old sound items
    for (int i = 0; i < this->df->Sounds.size(); i++) {
        for (int j = 0; j < this->df->Sounds[i].Items.size(); j++) {
            if (this->df->Sounds[i].Items[j].Civilization<civOffset &&this->df->Sounds[i].Items[j].Civilization> 0) {
                this->df->Sounds[i].Items.erase(this->df->Sounds[i].Items.begin() + j);
                j--;
            }
        }
    }

    // Change all new sound items so that they are readable
    for (int i = 0; i < this->df->Sounds.size(); i++) {
        for (int j = 0; j < this->df->Sounds[i].Items.size(); j++) {
            if (this->df->Sounds[i].Items[j].Civilization >= civOffset) {
                this->df->Sounds[i].Items[j].Civilization -= civOffset;
            }
        }
    }
}

// Algorithm for transforming one array to another when we can only copy from one index to another and have only one temp slot (gaia civ stores architectures)
// Abstracted version in javascript: https://github.com/Krakenmeister/CopyTransform
void Civbuilder::assignArchitectures() {
    cout << "[C++]: Processing architecture assignments for " << this->numPlayerCivs << " civs" << endl;
    
    vector<int> dest = {};
    for (int i = 0; i < this->config["architecture"].size(); i++) {
        dest.push_back(this->config["architecture"][i].asInt());
    }
    
    cout << "[C++]: Config has " << dest.size() << " architecture entries" << endl;
    
    while (dest.size() < this->numPlayerCivs) {
        dest.push_back(1);
    }
    
    cout << "[C++]: Extended dest to " << dest.size() << " entries" << endl;
    
    // Save the architecture of one of each type for copying
    vector<int> repArch = {3, 1, 5, 8, 15, 7, 20, 22, 25, 28, 33};
    
    // Add bounds checking
    for (int i = 0; i < dest.size(); i++) {
        if (find(repArch.begin(), repArch.end(), (i + 1)) == repArch.end()) {
            int archIndex = dest[i] - 1;
            if (archIndex < 0 || archIndex >= repArch.size()) {
                cerr << "[C++]: WARNING - Invalid architecture index " << archIndex 
                     << " for civ " << i << ", skipping" << endl;
                continue;
            }
            if (repArch[archIndex] >= df->Civs.size()) {
                cerr << "[C++]: WARNING - Architecture source civ " << repArch[archIndex] 
                     << " out of range, skipping" << endl;
                continue;
            }
            if ((i + 1) >= df->Civs.size()) {
                cerr << "[C++]: WARNING - Target civ " << (i+1) 
                     << " out of range, skipping" << endl;
                continue;
            }
            copyArchitecture(df, repArch[archIndex], (i + 1));
        }
    }
    
    cout << "[C++]: Initial architecture copy completed" << endl;
    
    // Count how many other civs want to copy your architecture
    vector<int> dependencies = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
    for (int i = 0; i < repArch.size(); i++) {
        for (int j = 0; j < repArch.size(); j++) {
            int destIndex = repArch[j] - 1;
            if (destIndex >= 0 && destIndex < dest.size() && (i != j) && (dest[destIndex] == (i + 1))) {
                dependencies[i]++;
            }
        }
    }

    int cycleStart = -1;
    if (df->Civs.size() > 0) {
        this->df->Civs[0].IconSet = -1;
    }

    while (vectorSum(dependencies) > 0) {
        // Find the least dependent architecture that has yet to be copied to
        int minIndex = -1;
        for (int i = 0; i < dependencies.size(); i++) {
            int repArchIndex = repArch[i];
            if (repArchIndex < df->Civs.size()) {
                int destRepArchIndex = repArch[i] - 1;
                if (destRepArchIndex >= 0 && destRepArchIndex < dest.size() 
                    && dest[destRepArchIndex] != this->df->Civs[repArchIndex].IconSet) {
                    if (minIndex == -1) {
                        minIndex = i;
                    } else if (dependencies[i] < dependencies[minIndex]) {
                        minIndex = i;
                    }
                }
            }
        }
        
        if (minIndex == -1) {
            cerr << "[C++]: WARNING - Could not find valid minIndex, breaking architecture copy loop" << endl;
            break;
        }
        
        int repArchMinIndex = repArch[minIndex] - 1;
        if (repArchMinIndex < 0 || repArchMinIndex >= dest.size()) {
            cerr << "[C++]: WARNING - Invalid repArchMinIndex, breaking" << endl;
            break;
        }
        
        if (dependencies[minIndex] == 0) {
            if (df->Civs.size() > 0 && this->df->Civs[0].IconSet == dest[repArchMinIndex]) {
                // If this is the last in a cycle, copy from the temp slot
                if (repArch[minIndex] < df->Civs.size()) {
                    copyArchitecture(df, 0, repArch[minIndex]);
                    dependencies[cycleStart]--;
                    cycleStart = -1;
                    this->df->Civs[0].IconSet = -1;
                }
            } else {
                // Copy without worries since there are no dependencies
                int srcArch = dest[repArchMinIndex] - 1;
                if (srcArch >= 0 && srcArch < repArch.size() 
                    && repArch[srcArch] < df->Civs.size() 
                    && repArch[minIndex] < df->Civs.size()) {
                    copyArchitecture(df, repArch[srcArch], repArch[minIndex]);
                    dependencies[dest[repArchMinIndex] - 1]--;
                }
            }
        } else {
            // Only dependency-cycles remain, so copy info from first in cycle to temp slot
            int srcArch = dest[repArchMinIndex] - 1;
            if (df->Civs.size() > 0 && srcArch >= 0 && srcArch < repArch.size() 
                && repArch[minIndex] < df->Civs.size() 
                && repArch[srcArch] < df->Civs.size()) {
                copyArchitecture(df, repArch[minIndex], 0);
                copyArchitecture(df, repArch[srcArch], repArch[minIndex]);
                dependencies[dest[repArchMinIndex] - 1]--;
                cycleStart = minIndex;
            }
        }
    }

    if (df->Civs.size() > 0) {
        this->df->Civs[0].IconSet = 2;
    }
    cout << "[C++]: Architecture assignment completed" << endl;
}

// Create a unique tech given parameters and an effect
// type 0 = castle age, type 1 = imperial age UT
void Civbuilder::createUT(int civbuilderID, int type, Effect utEffect, string name, vector<int> techCosts, int techTime, int techDLL) {
    this->df->Effects.push_back(utEffect);
    Tech ut = Tech();
    ut.Name = name;
    ut.RequiredTechs.push_back(102 + type);
    ut.RequiredTechCount = 1;
    ut.Civ = 99;

    if (type == 0) {
        ut.IconID = 33;
        setResearchLocation(ut, 82, techTime, 7);
    } else if (type == 1) {
        ut.IconID = 107;
        setResearchLocation(ut, 82, techTime, 8);
    }

    int writeIndex = 0;
    for (int i = 0; i < techCosts.size(); i++) {
        if (techCosts[i] != 0) {
            ut.ResourceCosts[writeIndex].Type = i;
            ut.ResourceCosts[writeIndex].Amount = techCosts[i];
            ut.ResourceCosts[writeIndex].Flag = 1;
            writeIndex++;
        }
    }

    ut.LanguageDLLName = techDLL;
    ut.LanguageDLLDescription = techDLL + 1000;
    ut.LanguageDLLHelp = techDLL + 100000;

    ut.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(ut);

    if (type == 0) {
        this->castleUniqueTechIDs[civbuilderID] = ((int)(this->df->Techs.size() - 1));
    } else if (type == 1) {
        this->impUniqueTechIDs[civbuilderID] = ((int)(this->df->Techs.size() - 1));
    }
}

void Civbuilder::createCivBonus(int civbuilderID, Effect e, string name, vector<int> requirements = {}) {
    e.Name = name;
    this->df->Effects.push_back(e);
    Tech t = Tech();
    t.Name = name;
    for (int i = 0; i < requirements.size(); i++) {
        t.RequiredTechs.push_back(requirements[i]);
    }
    t.RequiredTechCount = requirements.size();
    t.Civ = 99;
    t.EffectID = (this->df->Effects.size() - 1);
    setResearchLocation(t, -1, 0, 0);
    this->df->Techs.push_back(t);
    if (this->civBonuses.find(civbuilderID) == this->civBonuses.end()) {
        this->civBonuses[civbuilderID] = {(int)(this->df->Techs.size() - 1)};
    } else {
        this->civBonuses[civbuilderID].push_back((int)(this->df->Techs.size() - 1));
    }
}

void Civbuilder::createTeamBonus(int civbuilderID, Effect e, string name) {
    e.Name = name;
    this->df->Effects.push_back(e);
    this->teamBonuses[civbuilderID] = (this->df->Effects.size() - 1);
}

// Create a unique unit and an elite version
void Civbuilder::createUU(int civbuilderID, int baseID, string name, vector<int> techCosts, int techTime, int techDLL) {
    int uuTechID;
    int eliteTechID;

    for (Civ &civ : this->df->Civs) {
        // base unique unit
        civ.Units.push_back(civ.Units[baseID]);
        civ.UnitPointers.push_back(1);
        setTrainLocation(civ.Units[(int)(civ.Units.size() - 1)].Creatable, 82, 1, 16101);
        civ.Units[(int)(civ.Units.size() - 1)].Creatable.HeroMode = 0;

        // elite unique unit
        civ.Units.push_back(civ.Units[baseID]);
        civ.UnitPointers.push_back(1);
        setTrainLocation(civ.Units[(int)(civ.Units.size() - 1)].Creatable, 82, 1, 16101);
        civ.Units[(int)(civ.Units.size() - 1)].Creatable.HeroMode = 0;
    }
    int uuID = ((int)(this->df->Civs[0].Units.size())) - 2;
    int eID = ((int)(this->df->Civs[0].Units.size())) - 1;

    // Tech to make unique unit available
    Effect uuAvailable = Effect();
    uuAvailable.Name = name + " (make avail)";
    uuAvailable.EffectCommands.push_back(createEC(2, uuID, 1, -1, 0));
    this->df->Effects.push_back(uuAvailable);

    Tech uuTech = Tech();
    uuTech.Name = name + " (make avail)";
    uuTech.RequiredTechs.push_back(102);
    uuTech.RequiredTechCount = 1;
    uuTech.FullTechMode = 1;
    uuTech.Repeatable = true;
    uuTech.Civ = 99;
    uuTech.EffectID = (int)(this->df->Effects.size() - 1);
    setResearchLocation(uuTech, -1, 0, 0);
    this->df->Techs.push_back(uuTech);
    uuTechID = (int)(this->df->Techs.size() - 1);

    // Tech to upgrade to elite version
    Effect eliteUpgrade = Effect();
    eliteUpgrade.Name = "Elite " + name;
    eliteUpgrade.EffectCommands.push_back(createEC(3, uuID, eID, -1, 0));
    this->df->Effects.push_back(eliteUpgrade);

    Tech eliteTech = Tech();
    eliteTech.Name = "Elite " + name;
    eliteTech.FullTechMode = 1;
    eliteTech.IconID = 105;
    eliteTech.Repeatable = true;

    int writeIndex = 0;
    for (int i = 0; i < techCosts.size(); i++) {
        if (techCosts[i] != 0) {
            eliteTech.ResourceCosts[writeIndex].Type = i;
            eliteTech.ResourceCosts[writeIndex].Amount = techCosts[i];
            eliteTech.ResourceCosts[writeIndex].Flag = 1;
            writeIndex++;
        }
    }

    // Set research location using the new helper method
    setResearchLocation(eliteTech, 82, techTime, 6);

    eliteTech.LanguageDLLName = techDLL;
    eliteTech.LanguageDLLDescription = techDLL + 1000;
    eliteTech.LanguageDLLHelp = techDLL + 1000 + 20000;
    eliteTech.RequiredTechs.push_back(103);
    eliteTech.RequiredTechs.push_back((int)(this->df->Techs.size() - 1));
    eliteTech.RequiredTechCount = 2;
    eliteTech.Civ = 99;
    eliteTech.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(eliteTech);
    eliteTechID = (int)(this->df->Techs.size() - 1);

    // Make the new units data.json interpretable
    this->uuTechIDs[civbuilderID] = {uuTechID, eliteTechID};

    // Add the new units to custom website classes
    this->unitClasses["unique"].push_back(uuID);
    this->unitClasses["unique"].push_back(eID);
}

void Civbuilder::setupData() {
    // Deactivate all civ bonuses tied to techs
    for (Tech &tech : this->df->Techs) {
        if (tech.Civ != -1) {
            tech.Civ = 99;  // Setting civ = 99 is equivalent to making so that no civ gets it
        }
    }

    // Clear the vanilla tech trees of all effect commands
    for (int i = 0; i < techTreeIDs.size(); i++) {
        this->df->Effects[techTreeIDs[i]].EffectCommands.clear();
    }

    // Reorder Elite Konnik EffectCommands to not create weird bug
    EffectCommand etemp = this->df->Effects[715].EffectCommands[0];
    this->df->Effects[715].EffectCommands[0] = this->df->Effects[715].EffectCommands[1];
    this->df->Effects[715].EffectCommands[1] = etemp;

    // Delete the auto-upgrade in Castle Age effect (duplicateUUEffects will add this back if it is needed)
    for (int i = 0; i < this->df->Effects[102].EffectCommands.size(); i++) {
        if (this->df->Effects[102].EffectCommands[i].A == 1660) {
            this->df->Effects[102].EffectCommands.erase(this->df->Effects[102].EffectCommands.begin() + i);
            i--;
        }
    }

    // Move shrivamsha train location
    for (Civ &civ : this->df->Civs) {
        setTrainButtonID(civ.Units[1751].Creatable, 10);
        setTrainButtonID(civ.Units[1753].Creatable, 10);
    }
    this->df->Techs[843].ButtonID = 15;
    this->df->Techs[865].EffectID = -1;
    this->df->Techs[866].EffectID = -1;
    // Move missionary train location
    for (Civ &civ : this->df->Civs) {
        setTrainButtonID(civ.Units[775].Creatable, 15);
        setTrainButtonID(civ.Units[775].Creatable, 15);
    }

    // Give missionaries a 0 food cost so that it can be added with Hussite Reforms
    for (Civ &civ : this->df->Civs) {
        civ.Units[775].Creatable.ResourceCosts[1].Type = 0;
        civ.Units[775].Creatable.ResourceCosts[1].Amount = 0;
        civ.Units[775].Creatable.ResourceCosts[1].Flag = 1;
    }

    // Make battering ram requirement the right one
    this->df->Techs[162].RequiredTechs[1] = 705;

    // Make chemistry + torsion available to anyone so that it can be allocated
    this->df->Techs[609].Civ = -1;

    // Set up AI config file
    for (int i = 0; i < this->config["name"].size(); i++) {
        this->ai["civs"][i]["nm"] = this->config["name"][i];
        this->ai["civs"][i]["id"] = (i + 1);
        Value emptyArray;
        emptyArray.append(Value::null);
        emptyArray.clear();
        this->ai["civs"][i]["tt"] = emptyArray;
        this->ai["civs"][i]["bn"] = emptyArray;
        this->ai["civs"][i]["tb"] = emptyArray;
    }

    // Basic units/buildings are disableable
    for (Civ &civ : df->Civs) {
        for (int i = 0; i < disableIDs.size(); i++) {
            civ.Units[disableIDs[i]].Enabled = 0;
        }
        for (int i = 0; i < palisadeGates.size(); i++) {
            civ.Units[palisadeGates[i]].Enabled = 0;
        }
    }
    for (int i = 0; i < enablingTechs.size(); i++) {
        Effect enableUnit = Effect();
        enableUnit.Name = to_string(i) + " (make avail)";
        enableUnit.EffectCommands.push_back(createEC(2, disableIDs[i], 1, -1, 0));
        if (i == enablingTechs.size() - 1) {
            for (int j = 0; j < palisadeGates.size(); j++) {
                enableUnit.EffectCommands.push_back(createEC(2, palisadeGates[j], 1, -1, 0));
            }
        }
        df->Effects.push_back(enableUnit);
        df->Techs[enablingTechs[i]].Name = to_string(i) + " (make avail)";
        df->Techs[enablingTechs[i]].EffectID = (df->Effects.size() - 1);
        df->Techs[enablingTechs[i]].Civ = -1;
        df->Techs[enablingTechs[i]].RequiredTechCount = 0;
    }

    // Burgundian bonus also get discount
    Effect e = Effect();
    this->createCivBonus(CIV_BONUS_105_ECONOMIC_UPGRADES_COST_33_FOOD_AND_AVAILABLE, e, "C-Bonus, Eco upgrades cost -33% food");

    // Krepost heal task incase stronghold
    for (Civ &civ : df->Civs) {
        Task healTask = Task();
        healTask.ActionType = 155;
        healTask.TaskType = 1;
        healTask.ClassID = 6;
        healTask.WorkValue1 = 30;
        healTask.WorkValue2 = 1;
        healTask.WorkRange = 7;
        healTask.SearchWaitTime = 109;
        healTask.CombatLevelFlag = 4;
        healTask.TargetDiplomacy = 4;
        civ.Units[1251].Bird.TaskList.push_back(healTask);
    }

    // Add berry, hunter, fish productivity resources
    // Villager unit, task action type, productivity resource
    const vector<vector<int>> villagerTasks = {{120, 5, 198}, {354, 5, 198}, {122, 110, 199}, {216, 110, 199}, {56, 5, 200}, {57, 5, 200}, {13, 5, 200}};
    for (Civ &civ : df->Civs) {
        civ.Resources[198] = 1;
        civ.Resources[199] = 1;
        civ.Resources[200] = 1;
        for (int i = 0; i < villagerTasks.size(); i++) {
            for (int j = 0; j < civ.Units[villagerTasks[i][0]].Bird.TaskList.size(); j++) {
                if (civ.Units[villagerTasks[i][0]].Bird.TaskList[j].ActionType == villagerTasks[i][1]) {
                    civ.Units[villagerTasks[i][0]].Bird.TaskList[j].ResourceMultiplier = villagerTasks[i][2];
                }
            }
        }
    }

    // Give eco buildings and towers 0 population headroom so it can be increased with bonus
    for (Civ &civ : df->Civs) {
        for (int i = 0; i < ecoBuildings.size(); i++) {
            // Except folwarks
            if (ecoBuildings[i] != 1711 && ecoBuildings[i] != 1720 && ecoBuildings[i] != 1734) {
                civ.Units[ecoBuildings[i]].ResourceStorages[0].Type = 4;
                civ.Units[ecoBuildings[i]].ResourceStorages[0].Amount = 0;
                civ.Units[ecoBuildings[i]].ResourceStorages[0].Flag = 4;
            }
        }
        for (Unit &unit : civ.Units) {
            if (unit.Class == 52) {
                unit.ResourceStorages[0].Type = 4;
                unit.ResourceStorages[0].Amount = 0;
                unit.ResourceStorages[0].Flag = 4;
            }
        }
    }

    // Copy the attack tree task from onager
    cout << "[C++]: Copying attack tree tasks for " << df->Civs.size() << " civs" << endl;
    for (int k = 0; k < df->Civs.size(); k++) {
        // Add bounds checking to prevent crashes with different dat file versions
        if (this->df->Civs[k].Units.size() <= 280) {
            cerr << "[C++]: WARNING - Civ " << k << " has only " << this->df->Civs[k].Units.size() 
                 << " units (need >280). Skipping attack tree task copy." << endl;
            continue;
        }
        if (this->df->Civs[k].Units.size() <= 550) {
            cerr << "[C++]: WARNING - Civ " << k << " has only " << this->df->Civs[k].Units.size() 
                 << " units (need >550). Skipping attack tree task copy." << endl;
            continue;
        }
        
        // Additional check for task list size
        if (this->df->Civs[k].Units[550].Bird.TaskList.size() <= 4) {
            cerr << "[C++]: WARNING - Civ " << k << " Unit[550] has only " 
                 << this->df->Civs[k].Units[550].Bird.TaskList.size() 
                 << " tasks (need >4). Skipping." << endl;
            continue;
        }
        
        this->df->Civs[k].Units[280].Bird.TaskList.push_back(this->df->Civs[k].Units[550].Bird.TaskList[4]);
        
        // Check if TaskList[5] exists before accessing
        if (this->df->Civs[k].Units[280].Bird.TaskList.size() > 5) {
            // Disable attacking trees unless it's the civ with the bonus
            this->df->Civs[k].Units[280].Bird.TaskList[5].ClassID = -1;
        }
    }
    cout << "[C++]: Attack tree task copy completed" << endl;

    // Give villagers their own armor class
    for (Civ &civ : df->Civs) {
        for (Unit &unit : civ.Units) {
            if (unit.Class == 4) {
                unit::AttackOrArmor civilian_armor = unit::AttackOrArmor();
                civilian_armor.Class = 10;
                civilian_armor.Amount = 0;
                unit.Type50.Armours.push_back(civilian_armor);
            }
        }
    }

    // Create generate stone task (copied from keshiks)
    for (Civ &civ : this->df->Civs) {
        for (int i = 0; i < this->unitClasses["ram"].size(); i++) {
            civ.Units[this->unitClasses["ram"][i]].Bird.TaskList.push_back(civ.Units[1228].Bird.TaskList[5]);
            int taskListSize = civ.Units[this->unitClasses["ram"][i]].Bird.TaskList.size();
            civ.Units[this->unitClasses["ram"][i]].Bird.TaskList[taskListSize - 1].ClassID = -1;
            civ.Units[this->unitClasses["ram"][i]].Bird.TaskList[taskListSize - 1].ResourceOut = 2;
            civ.Units[this->unitClasses["ram"][i]].Bird.TaskList[taskListSize - 1].WorkValue1 = 0.01;
        }
    }

    // Genericize unique units outside of castle
    df->Effects[714].EffectCommands.pop_back();
    df->Effects[715].EffectCommands.pop_back();
    df->Effects[788].EffectCommands.pop_back();
    df->Effects[789].EffectCommands.pop_back();
    df->Effects[363].EffectCommands.pop_back();
    df->Effects[454].EffectCommands.pop_back();
    EffectCommand uniqueAvailable = createEC(2, 1254, 1, -1, 0);
    df->Effects[732].EffectCommands.push_back(uniqueAvailable);

    // Donjons add the ability to recruit from them
    Effect donjonUnitEffect = Effect();
    donjonUnitEffect.Name = "Enable Donjon Unit";
    uniqueAvailable = createEC(2, 1660, 1, -1, 0);
    donjonUnitEffect.EffectCommands.push_back(uniqueAvailable);
    df->Effects.push_back(donjonUnitEffect);
    Tech donjonUnitTech = Tech();
    donjonUnitTech.Name = "Enable Donjon Unit";
    donjonUnitTech.RequiredTechs.push_back(101);
    donjonUnitTech.RequiredTechCount = 1;
    donjonUnitTech.Civ = 99;
    donjonUnitTech.EffectID = (df->Effects.size() - 1);
    setResearchLocation(donjonUnitTech, -1, 0, 0);
    df->Techs.push_back(donjonUnitTech);
    this->civBonuses[CIV_BONUS_109_CAN_BUILD_DONJON].push_back((int)(df->Techs.size() - 1));

    // Recreate old Indian bonus
    Tech stable_armor_castle = Tech();
    stable_armor_castle.Name = "Stable Units +1P armor";
    stable_armor_castle.RequiredTechs.push_back(102);
    stable_armor_castle.RequiredTechCount = 1;
    stable_armor_castle.Civ = 99;
    stable_armor_castle.EffectID = 640;
    setResearchLocation(stable_armor_castle, -1, 0, 0);
    df->Techs[338] = stable_armor_castle;

    Tech stable_armor_imp = Tech();
    stable_armor_imp.Name = "Stable Units +2P armor";
    stable_armor_imp.RequiredTechs.push_back(103);
    stable_armor_imp.RequiredTechCount = 1;
    stable_armor_imp.Civ = 99;
    stable_armor_imp.EffectID = 584;
    setResearchLocation(stable_armor_imp, -1, 0, 0);
    df->Techs[552] = stable_armor_imp;

    Tech fishermen = Tech();
    fishermen.Name = "Fishermen work 10% faster";
    fishermen.Civ = 99;
    fishermen.EffectID = 641;
    setResearchLocation(fishermen, -1, 0, 0);
    df->Techs[469] = fishermen;
    df->Effects[641].EffectCommands.push_back(createEC(5, 56, -1, 13, 1.1));
    df->Effects[641].EffectCommands.push_back(createEC(5, 57, -1, 13, 1.1));

    // Make all buildings have stone storage
    for (Civ &civ : this->df->Civs) {
        for (Unit &unit : civ.Units) {
            bool isBuilding = false;
            for (int j = 0; j < buildingClasses.size(); j++) {
                if (buildingClasses[j] == unit.Class) {
                    isBuilding = true;
                }
            }
            if (isBuilding) {
                unit.ResourceStorages[2].Type = 2;
                unit.ResourceStorages[2].Amount = 0;
                unit.ResourceStorages[2].Flag = 8;
            }
        }
    }

    // Make all villagers have power-up effect
    for (Civ &civ : this->df->Civs) {
        for (int i = 4; i < unitSets[28].size(); i++) {
            civ.Units[unitSets[28][i]].Bird.TaskList.push_back(civ.Units[1803].Bird.TaskList[5]);
            int taskListSize = civ.Units[unitSets[28][i]].Bird.TaskList.size();
            civ.Units[unitSets[28][i]].Bird.TaskList[taskListSize - 1].ClassID = 4;
            civ.Units[unitSets[28][i]].Bird.TaskList[taskListSize - 1].UnitID = -1;
            civ.Units[unitSets[28][i]].Bird.TaskList[taskListSize - 1].WorkValue2 = 20;
            civ.Units[unitSets[28][i]].Bird.TaskList[taskListSize - 1].WorkRange = 2;
            civ.Units[unitSets[28][i]].Bird.TaskList[taskListSize - 1].CombatLevelFlag = 6;
            civ.Units[unitSets[28][i]].Bird.TaskList[taskListSize - 1].TargetDiplomacy = 1;
            civ.Units[unitSets[28][i]].Bird.TaskList[taskListSize - 1].SearchWaitTime = 13;
            if (unitSets[28][i] == 214 || unitSets[28][i] == 259) {
                civ.Units[unitSets[28][i]].Bird.TaskList[taskListSize - 1].WorkValue1 = 0.36;
            } else {
                civ.Units[unitSets[28][i]].Bird.TaskList[taskListSize - 1].WorkValue1 = 0.2;
            }
        }
    }

    // Make sure all techs have a unique name
    for (int i = 0; i < this->df->Techs.size(); i++) {
        this->df->Techs[i].Name = to_string(i) + " " + this->df->Techs[i].Name;
    }

    // Orthodoxy requires Castle Age
    this->df->Techs[512].RequiredTechs[0] = 102;

    // Madrasah requires Castle Age
    this->df->Techs[490].RequiredTechs[0] = 102;

    // Make zealotry work again
    this->df->Techs[9].RequiredTechs[0] = 102;

    // Cheaper gunpowder not require anything
    this->df->Techs[500].RequiredTechCount = 0;
    this->df->Techs[500].RequiredTechs[0] = -1;

    // Make pavise work again
    this->df->Techs[494].RequiredTechs[0] = 102;

    // Fix vanilla bug with chinese team bonus and eco upgrades
    this->df->Effects[831].Name = "Horse collar + chinese TB + sicilian farm";
    this->df->Effects[832].Name = "Heavy plow + chinese TB + sicilian farm";
    this->df->Effects[833].Name = "Crop rotation + chinese TB + sicilian farm";

    e.Name = "Horse collar + chinese TB";
    e.EffectCommands.push_back(createEC(1, 36, 1, -1, 7.5));
    this->df->Effects.push_back(e);
    this->df->Techs[812].EffectID = (int)(this->df->Effects.size() - 1);

    e.EffectCommands.clear();
    e.Name = "Heavy plow + chinese TB";
    e.EffectCommands.push_back(createEC(1, 36, 1, -1, 12.5));
    this->df->Effects.push_back(e);
    this->df->Techs[813].EffectID = (int)(this->df->Effects.size() - 1);

    e.EffectCommands.clear();
    e.Name = "Crop rotation + chinese TB";
    e.EffectCommands.push_back(createEC(1, 36, 1, -1, 17.5));
    this->df->Effects.push_back(e);
    this->df->Techs[814].EffectID = (int)(this->df->Effects.size() - 1);

    // Move unit buttons around
    for (Civ &civ : this->df->Civs) {
        setTrainButtonID(civ.Units[1923].Creatable, 9);
        setTrainButtonID(civ.Units[1942].Creatable, 10);
        setTrainButtonID(civ.Units[1904].Creatable, 13);
        setTrainButtonID(civ.Units[1907].Creatable, 13);
        setTrainButtonID(civ.Units[1962].Creatable, 15);
        setTrainButtonID(civ.Units[1980].Creatable, 15);
        setTrainButtonID(civ.Units[1263].Creatable, 15);
        setTrainButtonID(civ.Units[1966].Creatable, 10);
        setTrainButtonID(civ.Units[1978].Creatable, 9);
        setTrainButtonID(civ.Units[1954].Creatable, 15);
    }
}

void Civbuilder::createNewUnits() {
    // Crusader Knights
    this->createUU(UU_CRUSADER_KNIGHT, 1723, "Crusader Knight", {600, 0, 0, 1200}, 45, 7604);
    int uuID = (int)(this->df->Civs[0].Units.size() - 2);
    int eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Type50.Attacks[0].Amount = 16;
        civ.Units[uuID].Type50.DisplayedAttack = 16;
        civ.Units[uuID].Type50.Armours[0].Amount = 3;
        civ.Units[uuID].Type50.Armours[2].Amount = 3;
        civ.Units[uuID].Type50.DisplayedMeleeArmour = 2;
        civ.Units[uuID].Creatable.DisplayedPierceArmour = 2;
        civ.Units[uuID].HitPoints = 90;

        civ.Units[eID].Name = "ECRUSADERKNIGHT";
        civ.Units[eID].LanguageDLLName = 5243;
        civ.Units[eID].LanguageDLLCreation = 6243;
        civ.Units[eID].LanguageDLLHelp = 105243;

        civ.Units[uuID].Creatable.HeroMode = 2;
        civ.Units[eID].Creatable.HeroMode = 2;
    }

    // Xolotl Warriors
    createUU(UU_XOLOTL_WARRIOR, 1570, "Xolotl Warrior", {800, 0, 0, 800}, 60, 7605);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[eID].Name = "EAZTRAIDER";
        civ.Units[eID].LanguageDLLName = 5244;
        civ.Units[eID].LanguageDLLCreation = 6244;
        civ.Units[eID].LanguageDLLHelp = 105244;

        civ.Units[uuID].Type50.ReloadTime = 0.9;
        civ.Units[uuID].Type50.DisplayedReloadTime = 0.9;
        civ.Units[uuID].Type50.Attacks[0].Amount = 5;
        civ.Units[uuID].Type50.DisplayedAttack = 5;
        civ.Units[uuID].Type50.Armours[2].Amount = 0;
        civ.Units[uuID].Creatable.DisplayedPierceArmour = 0;
        civ.Units[uuID].HitPoints = 95;

        civ.Units[eID].Type50.ReloadTime = 0.8;
        civ.Units[eID].Type50.DisplayedReloadTime = 0.8;
        civ.Units[eID].Type50.Attacks[0].Amount = 6;
        civ.Units[eID].Type50.DisplayedAttack = 6;
        civ.Units[eID].Type50.Armours[0].Amount = 3;
        civ.Units[eID].Type50.DisplayedMeleeArmour = 3;
        civ.Units[eID].HitPoints = 115;

        civ.Units[uuID].Creatable.ResourceCosts[0].Amount = 30;
        civ.Units[uuID].Creatable.ResourceCosts[1].Amount = 60;
        civ.Units[eID].Creatable.ResourceCosts[0].Amount = 30;
        civ.Units[eID].Creatable.ResourceCosts[1].Amount = 60;
    }

    // Saboteur
    createUU(UU_SABOTEUR, 706, "Saboteur", {0, 600, 600, 0}, 40, 7606);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    this->unitClasses["explosive"].push_back(uuID);
    this->unitClasses["explosive"].push_back(eID);
    for (Civ &civ : this->df->Civs) {
        civ.Units[eID].Name = "EHDSQD";
        civ.Units[eID].LanguageDLLName = 5245;
        civ.Units[eID].LanguageDLLCreation = 6245;
        civ.Units[eID].LanguageDLLHelp = 105245;
        civ.Units[eID].Type50.Armours[2].Amount = 5;
        civ.Units[eID].Creatable.DisplayedPierceArmour = 5;
        civ.Units[eID].HitPoints = 70;
        setTrainTime(civ.Units[uuID].Creatable, 15);
        setTrainTime(civ.Units[eID].Creatable, 15);
        civ.Units[uuID].Type50.Attacks[1].Amount = 40;
        civ.Units[eID].Type50.Attacks[1].Amount = 55;
        civ.Units[uuID].Type50.DisplayedAttack = 40;
        civ.Units[eID].Type50.DisplayedAttack = 55;
        unit::AttackOrArmor siege_bonus = unit::AttackOrArmor();
        siege_bonus.Class = 20;
        siege_bonus.Amount = 60;
        civ.Units[uuID].Type50.Attacks.push_back(siege_bonus);
        siege_bonus.Amount = 120;
        civ.Units[eID].Type50.Attacks.push_back(siege_bonus);
        unit::AttackOrArmor castle_bonus = unit::AttackOrArmor();
        castle_bonus.Class = 26;
        castle_bonus.Amount = 600;
        civ.Units[uuID].Type50.Attacks.push_back(castle_bonus);
        castle_bonus.Amount = 1200;
        civ.Units[eID].Type50.Attacks.push_back(castle_bonus);
        civ.Units[uuID].Type50.BlastAttackLevel = 1;
        civ.Units[uuID].Bird.TaskList.push_back(civ.Units[1120].Bird.TaskList[5]);
        civ.Units[eID].Type50.BlastAttackLevel = 1;
        civ.Units[eID].Bird.TaskList.push_back(civ.Units[1120].Bird.TaskList[5]);
        civ.Units[uuID].Type50.BlastWidth = 1;
        civ.Units[eID].Type50.BlastWidth = 2.5;
    }
    setUnitCosts(this->df, {uuID, eID}, {0, 0, 50, 50});
    // Ninja
    createUU(UU_NINJA, 1145, "Ninja", {0, 500, 0, 600}, 100, 7607);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    int ninjaID = uuID;
    for (Civ &civ : this->df->Civs) {
        civ.Units[eID].Name = "ENINJA";
        civ.Units[eID].LanguageDLLName = 5286;
        civ.Units[eID].LanguageDLLCreation = 6286;
        civ.Units[eID].LanguageDLLHelp = 105286;
        unit::AttackOrArmor uu_bonus = unit::AttackOrArmor();
        uu_bonus.Class = 19;
        uu_bonus.Amount = 5;
        civ.Units[uuID].Type50.Attacks.push_back(uu_bonus);
        uu_bonus.Amount = 7;
        civ.Units[eID].Type50.Attacks.push_back(uu_bonus);
        civ.Units[uuID].Type50.Attacks[2].Class = 4;
        civ.Units[uuID].Type50.Attacks[2].Amount = 11;
        civ.Units[uuID].Type50.DisplayedAttack = 11;
        civ.Units[eID].Type50.Attacks[2].Class = 4;
        civ.Units[eID].Type50.Attacks[2].Amount = 14;
        civ.Units[eID].Type50.DisplayedAttack = 14;
        civ.Units[uuID].Speed = 1.15;
        civ.Units[eID].Speed = 1.3;
        civ.Units[eID].HitPoints = 60;
        civ.Units[eID].Type50.Armours[2].Amount = 2;
        civ.Units[eID].Creatable.DisplayedPierceArmour = 2;
        civ.Units[uuID].Type50.BreakOffCombat = 1;
        civ.Units[eID].Type50.BreakOffCombat = 1;
    }
    // Flamethrower
    createUU(UU_FLAMETHROWER, 188, "Flamethrower", {0, 1000, 0, 1000}, 75, 7608);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[eID].Name = "EMPCAV";
        civ.Units[eID].LanguageDLLName = 5801;
        civ.Units[eID].LanguageDLLCreation = 6801;
        civ.Units[eID].LanguageDLLHelp = 26801;
        unit::AttackOrArmor ram_bonus = unit::AttackOrArmor();
        ram_bonus.Class = 17;
        ram_bonus.Amount = 8;
        civ.Units[uuID].Type50.Attacks.push_back(ram_bonus);
        ram_bonus.Amount = 12;
        civ.Units[eID].Type50.Attacks.push_back(ram_bonus);
        civ.Units[eID].Type50.Armours[0].Amount = 4;
        civ.Units[eID].Type50.DisplayedMeleeArmour = 4;
        civ.Units[uuID].Type50.Attacks[1].Amount = 7;
        civ.Units[uuID].Type50.DisplayedAttack = 7;
        civ.Units[uuID].Type50.Attacks[0].Amount = 8;
        civ.Units[uuID].Type50.Attacks[2].Amount = 0;
        civ.Units[eID].Type50.Attacks[1].Amount = 9;
        civ.Units[eID].Type50.DisplayedAttack = 9;
        civ.Units[eID].Type50.Attacks[0].Amount = 12;
        civ.Units[eID].Type50.Attacks[2].Amount = 0;
        civ.Units[eID].Type50.MaxRange = 5;
        civ.Units[eID].Type50.DisplayedRange = 5;
    }
    setUnitCosts(this->df, {uuID, eID}, {0, 125, 0, 50});
    // Photonman
    createUU(UU_PHOTONMAN, 1577, "Photonman", {1000, 0, 0, 1000}, 120, 7609);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[eID].Name = "EPHOTON";
        civ.Units[eID].LanguageDLLName = 5802;
        civ.Units[eID].LanguageDLLCreation = 6802;
        civ.Units[eID].LanguageDLLHelp = 105802;
        civ.Units[uuID].Type50.ReloadTime = 5.5;
        civ.Units[uuID].Type50.DisplayedReloadTime = 5.5;
        civ.Units[eID].Type50.ReloadTime = 5.5;
        civ.Units[eID].Type50.DisplayedReloadTime = 5.5;
        civ.Units[uuID].Creatable.ResourceCosts[1].Amount = 140;
        civ.Units[eID].Creatable.ResourceCosts[1].Amount = 140;
        setTrainTime(civ.Units[uuID].Creatable, 50);
        setTrainTime(civ.Units[eID].Creatable, 50);
        civ.Units[uuID].Type50.MaxRange = 8;
        civ.Units[uuID].Type50.DisplayedRange = 8;
        civ.Units[uuID].Speed = 0.9;
        civ.Units[eID].Speed = 0.9;
        civ.Units[uuID].Type50.Armours[0].Amount = -3;
        civ.Units[uuID].Type50.DisplayedMeleeArmour = -3;
        civ.Units[uuID].Type50.Armours[2].Amount = -3;
        civ.Units[uuID].Creatable.DisplayedPierceArmour = -3;
        civ.Units[eID].Type50.Armours[0].Amount = -3;
        civ.Units[eID].Type50.DisplayedMeleeArmour = -3;
        civ.Units[eID].Type50.Armours[2].Amount = -3;
        civ.Units[eID].Creatable.DisplayedPierceArmour = -3;
        civ.Units[uuID].HitPoints = 30;
        civ.Units[eID].HitPoints = 30;
        unit::AttackOrArmor ramAttack = unit::AttackOrArmor();
        ramAttack.Class = 17;
        ramAttack.Amount = 10;
        civ.Units[uuID].Type50.Attacks.push_back(ramAttack);
        civ.Units[eID].Type50.Attacks.push_back(ramAttack);
    }
    this->unitClasses["gunpowder"].push_back(uuID);
    this->unitClasses["gunpowder"].push_back(eID);
    // copyEffectstoUnits(this->df, {{563, 0, 1, 2}}, {uuID, eID});
    // Centurion
    this->uuTechIDs[45] = {881, 882};
    // Apukispay
    vector<Task> shockPowerUpTasks = {};
    for (int i = 0; i < this->unitClasses["shock"].size(); i++) {
        Task shockPowerUpTask = this->df->Civs[0].Units[1790].Bird.TaskList[5];
        shockPowerUpTask.ClassID = -1;
        shockPowerUpTask.UnitID = this->unitClasses["shock"][i];
        shockPowerUpTask.WorkValue1 = 100;
        shockPowerUpTask.WorkValue2 = 5;
        shockPowerUpTask.SearchWaitTime = 109;
        shockPowerUpTask.WorkRange = 2;
        shockPowerUpTasks.push_back(shockPowerUpTask);
    }
    createUU(UU_APUKISPAY, 1074, "Apukispay", {800, 0, 0, 900}, 70, 7643);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "APU";
        civ.Units[eID].Name = "EAPU";
        civ.Units[eID].LanguageDLLName = 5836;
        civ.Units[eID].LanguageDLLCreation = 6836;
        civ.Units[eID].LanguageDLLHelp = 105836;
        civ.Units[uuID].Speed = 1.15;
        civ.Units[eID].Speed = 1.3;
        civ.Units[uuID].HitPoints = 70;
        civ.Units[eID].HitPoints = 90;
        setTrainTime(civ.Units[uuID].Creatable, 20);
        setTrainTime(civ.Units[eID].Creatable, 20);
        civ.Units[uuID].Type50.BreakOffCombat = 32;
        civ.Units[eID].Type50.BreakOffCombat = 32;
        for (int i = 0; i < shockPowerUpTasks.size(); i++) {
            civ.Units[uuID].Bird.TaskList.push_back(shockPowerUpTasks[i]);
            civ.Units[eID].Bird.TaskList.push_back(shockPowerUpTasks[i]);
        }
    }
    setUnitCosts(this->df, {uuID, eID}, {50, 0, 0, 85});
    setCombatStats(this->df, uuID, {{4, 9}}, {{4, 1}, {3, 0}, {19, 0}});
    setCombatStats(this->df, eID, {{4, 12}}, {{4, 2}, {3, 0}, {19, 0}});
    // Monkey Boy
    createUU(UU_MONKEY_BOY, 860, "Monkey Boy", {2000, 0, 0, 0}, 60, 7612);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[eID].Name = "emkyby";
        civ.Units[eID].LanguageDLLName = 5805;
        civ.Units[eID].LanguageDLLCreation = 6805;
        civ.Units[eID].LanguageDLLHelp = 105805;
        civ.Units[uuID].Creatable.ResourceCosts[0].Amount = 90;
        civ.Units[uuID].Creatable.ResourceCosts[1].Amount = 20;
        civ.Units[uuID].Creatable.ResourceCosts[1].Type = 3;
        civ.Units[uuID].Creatable.ResourceCosts[1].Flag = 1;
        civ.Units[uuID].Type50.Attacks[0].Amount = -99;
        civ.Units[eID].ResourceStorages = civ.Units[1].ResourceStorages;
        civ.Units[eID].Creatable.ResourceCosts[0].Amount = 105;
        civ.Units[eID].Creatable.ResourceCosts[1].Amount = 25;
        civ.Units[eID].Creatable.ResourceCosts[1].Type = 3;
        civ.Units[eID].Creatable.ResourceCosts[1].Flag = 1;
        civ.Units[eID].Type50.Attacks[0].Amount = -99;
        civ.Units[eID].ResourceStorages = civ.Units[1].ResourceStorages;
        unit::AttackOrArmor animal_armor = unit::AttackOrArmor();
        animal_armor.Class = 14;
        animal_armor.Amount = 0;
        civ.Units[uuID].Type50.Armours.push_back(animal_armor);
        civ.Units[eID].Type50.Armours.push_back(animal_armor);
        civ.Units[eID].HitPoints = 16;
        civ.Units[uuID].Bird.TaskList.push_back(civ.Units[1723].Bird.TaskList[1]);
        civ.Units[uuID].Bird.TaskList.push_back(civ.Units[1723].Bird.TaskList[2]);
        civ.Units[uuID].Bird.TaskList.push_back(civ.Units[1723].Bird.TaskList[3]);
        civ.Units[uuID].Bird.TaskList.push_back(civ.Units[1723].Bird.TaskList[4]);
        civ.Units[eID].Bird.TaskList.push_back(civ.Units[1723].Bird.TaskList[1]);
        civ.Units[eID].Bird.TaskList.push_back(civ.Units[1723].Bird.TaskList[2]);
        civ.Units[eID].Bird.TaskList.push_back(civ.Units[1723].Bird.TaskList[3]);
        civ.Units[eID].Bird.TaskList.push_back(civ.Units[1723].Bird.TaskList[4]);
    }
    // Amazon Warrior
    createUU(UU_AMAZON_WARRIOR, 825, "Amazon Warrior", {600, 0, 0, 1000}, 70, 7613);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[eID].Name = "Elite Amazon Warrior";
        civ.Units[eID].LanguageDLLName = 5806;
        civ.Units[eID].LanguageDLLCreation = 6806;
        civ.Units[eID].LanguageDLLHelp = 106806;
        civ.Units[uuID].Creatable.ResourceCosts[0].Amount = 50;
        civ.Units[uuID].Creatable.ResourceCosts[1].Amount = 15;
        civ.Units[eID].Creatable.ResourceCosts[0].Amount = 50;
        civ.Units[eID].Creatable.ResourceCosts[1].Amount = 15;
        civ.Units[uuID].Type50.Attacks[2].Amount = 13;
        civ.Units[uuID].Type50.DisplayedAttack = 13;
        civ.Units[eID].Type50.Attacks[2].Amount = 15;
        civ.Units[eID].Type50.DisplayedAttack = 15;
        civ.Units[eID].HitPoints = 60;
        unit::AttackOrArmor vil_bonus = unit::AttackOrArmor();
        vil_bonus.Class = 10;
        vil_bonus.Amount = 10;
        civ.Units[uuID].Type50.Attacks.push_back(vil_bonus);
        vil_bonus.Amount = 20;
        civ.Units[eID].Type50.Attacks.push_back(vil_bonus);
        unit::AttackOrArmor animal_bonus = unit::AttackOrArmor();
        animal_bonus.Class = 14;
        animal_bonus.Amount = 30;
        civ.Units[uuID].Type50.Attacks.push_back(animal_bonus);
        civ.Units[eID].Type50.Attacks.push_back(animal_bonus);
        civ.Units[eID].Speed = 1.2;
    }
    // Amazon Archer
    createUU(UU_AMAZON_ARCHER, 850, "Amazon Archer", {600, 0, 0, 400}, 60, 7614);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    this->unitClasses["footArcher"].push_back(uuID);
    this->unitClasses["footArcher"].push_back(eID);
    for (Civ &civ : this->df->Civs) {
        civ.Units[eID].Name = "Elite Amazon Archer";
        civ.Units[eID].LanguageDLLName = 5807;
        civ.Units[eID].LanguageDLLCreation = 6807;
        civ.Units[eID].LanguageDLLHelp = 105807;
        civ.Units[uuID].Type50.Armours[2].Amount = 0;
        civ.Units[eID].Type50.Armours[2].Amount = 0;
        civ.Units[uuID].Creatable.DisplayedPierceArmour = 0;
        civ.Units[uuID].Type50.Attacks[2].Class = 10;
        civ.Units[uuID].Type50.Attacks[2].Amount = 5;
        civ.Units[uuID].Type50.Attacks[5].Class = 14;
        civ.Units[uuID].Type50.Attacks[5].Amount = 5;
        civ.Units[uuID].Type50.Attacks[3].Amount = 4;
        civ.Units[uuID].Type50.DisplayedAttack = 4;
        civ.Units[eID].Type50.Attacks[2].Class = 10;
        civ.Units[eID].Type50.Attacks[2].Amount = 10;
        civ.Units[eID].Type50.Attacks[5].Class = 14;
        civ.Units[eID].Type50.Attacks[5].Amount = 5;
        civ.Units[eID].Type50.Attacks[3].Amount = 5;
        civ.Units[eID].Type50.DisplayedAttack = 5;
        civ.Units[uuID].HitPoints = 35;
        civ.Units[eID].HitPoints = 35;
        civ.Units[uuID].Speed = 1.1;
        civ.Units[eID].Speed = 1.2;
        civ.Units[uuID].Creatable.ResourceCosts[0].Amount = 25;
        civ.Units[uuID].Creatable.ResourceCosts[1].Amount = 35;
        civ.Units[eID].Creatable.ResourceCosts[0].Amount = 25;
        civ.Units[eID].Creatable.ResourceCosts[1].Amount = 35;
    }
    // Iroquois Warrior
    createUU(UU_IROQUOIS_WARRIOR, 1374, "Iroquois Warrior", {800, 0, 0, 700}, 70, 7615);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[eID].Name = "EIRWAR";
        civ.Units[eID].LanguageDLLName = 5808;
        civ.Units[eID].LanguageDLLCreation = 6808;
        civ.Units[eID].LanguageDLLHelp = 105808;
        civ.Units[uuID].Type50.Attacks[1].Amount = 5;
        civ.Units[eID].Type50.Attacks[1].Amount = 10;
        unit::AttackOrArmor castle_bonus = unit::AttackOrArmor();
        castle_bonus.Class = 26;
        castle_bonus.Amount = 10;
        civ.Units[uuID].Type50.Attacks.push_back(castle_bonus);
        civ.Units[eID].Type50.Attacks.push_back(castle_bonus);
        unit::AttackOrArmor wall_bonus = unit::AttackOrArmor();
        wall_bonus.Class = 22;
        wall_bonus.Amount = 6;
        civ.Units[uuID].Type50.Attacks.push_back(wall_bonus);
        wall_bonus.Amount = 12;
        civ.Units[eID].Type50.Attacks.push_back(wall_bonus);
        unit::AttackOrArmor stone_bonus = unit::AttackOrArmor();
        stone_bonus.Class = 13;
        stone_bonus.Amount = 12;
        civ.Units[uuID].Type50.Attacks.push_back(stone_bonus);
        civ.Units[eID].Type50.Attacks.push_back(stone_bonus);
        civ.Units[uuID].Type50.Attacks[2].Amount = 7;
        civ.Units[uuID].Type50.DisplayedAttack = 7;
        civ.Units[eID].Type50.Attacks[2].Amount = 11;
        civ.Units[eID].Type50.DisplayedAttack = 11;
        civ.Units[eID].HitPoints = 80;
    }
    // Varangian Guard
    createUU(UU_VARANGIAN_GUARD, 1681, "Varangian Guard", {900, 0, 0, 900}, 90, 7616);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "VARANG";
        civ.Units[eID].Name = "EVARANG";
        civ.Units[eID].LanguageDLLName = 5809;
        civ.Units[eID].LanguageDLLCreation = 6809;
        civ.Units[eID].LanguageDLLHelp = 105809;
        civ.Units[uuID].Creatable.HeroMode = 0;
        civ.Units[eID].Creatable.HeroMode = 0;
        civ.Units[uuID].HitPoints = 80;
        civ.Units[eID].HitPoints = 100;
        civ.Units[uuID].Speed = 1.4;
        civ.Units[eID].Speed = 1.4;
        civ.Units[uuID].Type50.Armours.pop_back();
        civ.Units[eID].Type50.Armours.pop_back();
        civ.Units[uuID].Type50.Armours[0].Amount = 0;
        civ.Units[uuID].Type50.DisplayedMeleeArmour = 0;
        civ.Units[uuID].Type50.Armours[2].Amount = 5;
        civ.Units[uuID].Creatable.DisplayedPierceArmour = 5;
        civ.Units[eID].Type50.Armours[0].Amount = 0;
        civ.Units[eID].Type50.DisplayedMeleeArmour = 0;
        civ.Units[eID].Type50.Armours[2].Amount = 7;
        civ.Units[eID].Creatable.DisplayedPierceArmour = 7;
        civ.Units[uuID].Type50.Attacks[0].Amount = 9;
        civ.Units[uuID].Type50.DisplayedAttack = 9;
        civ.Units[eID].Type50.Attacks[0].Amount = 11;
        civ.Units[eID].Type50.DisplayedAttack = 11;
        unit::AttackOrArmor archer_bonus = unit::AttackOrArmor();
        archer_bonus.Class = 15;
        archer_bonus.Amount = 6;
        civ.Units[uuID].Type50.Attacks.push_back(archer_bonus);
        archer_bonus.Amount = 10;
        civ.Units[eID].Type50.Attacks.push_back(archer_bonus);
    }
    setUnitCosts(this->df, {uuID, eID}, {70, 0, 0, 45});
    // Gendarme
    createUU(UU_GENDARME, 1281, "Gendarme", {1000, 0, 0, 850}, 110, 7617);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "GENDARME";
        civ.Units[eID].Name = "EGENDARME";
        civ.Units[eID].LanguageDLLName = 5810;
        civ.Units[eID].LanguageDLLCreation = 6810;
        civ.Units[eID].LanguageDLLHelp = 105810;
        civ.Units[uuID].HitPoints = 75;
        civ.Units[eID].HitPoints = 100;
        civ.Units[uuID].Speed = 1.3;
        civ.Units[eID].Speed = 1.3;
        setTrainTime(civ.Units[uuID].Creatable, 20);
        setTrainTime(civ.Units[eID].Creatable, 20);
    }
    setUnitCosts(this->df, {uuID, eID}, {95, 0, 0, 85});
    setCombatStats(this->df, uuID, {{4, 10}}, {{3, 5}, {4, 5}, {8, 0}, {19, 0}});
    setCombatStats(this->df, eID, {{4, 13}}, {{3, 7}, {4, 7}, {8, 0}, {19, 0}});
    // Cuahchiqueh
    createUU(UU_CUAHCHIQUEH, 1067, "Cuahchiqueh", {600, 0, 0, 900}, 60, 7618);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "CCQ";
        civ.Units[eID].Name = "ECCQ";
        civ.Units[eID].LanguageDLLName = 5811;
        civ.Units[eID].LanguageDLLCreation = 6811;
        civ.Units[eID].LanguageDLLHelp = 105811;
        civ.Units[uuID].HitPoints = 80;
        civ.Units[eID].HitPoints = 105;
        civ.Units[uuID].Type50.ReloadTime = 0.9;
        civ.Units[uuID].Type50.DisplayedReloadTime = 0.9;
        civ.Units[eID].Type50.ReloadTime = 0.8;
        civ.Units[eID].Type50.DisplayedReloadTime = 0.8;
        setTrainTime(civ.Units[uuID].Creatable, 11);
        setTrainTime(civ.Units[eID].Creatable, 11);
        civ.Units[uuID].Speed = 1.1;
        civ.Units[eID].Speed = 1.1;
    }
    setUnitCosts(this->df, {uuID, eID}, {40, 0, 0, 30});
    setCombatStats(this->df, uuID, {{29, 5}, {21, 1}, {1, 5}, {4, 6}, {8, 0}, {32, 5}}, {{4, 1}, {3, -1}, {19, 0}});
    setCombatStats(this->df, eID, {{29, 7}, {21, 1}, {1, 5}, {4, 8}, {8, 0}, {32, 5}}, {{4, 1}, {3, -1}, {19, 0}});
    // Ritterbruder
    createUU(UU_RITTERBRUDER, 1727, "Ritterbruder", {850, 0, 0, 850}, 60, 7619);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "SUPERTEUTONIC";
        civ.Units[eID].Name = "ESUPERTEUTONIC";
        civ.Units[eID].LanguageDLLName = 5812;
        civ.Units[eID].LanguageDLLCreation = 6812;
        civ.Units[eID].LanguageDLLHelp = 105812;
        civ.Units[uuID].HitPoints = 125;
        civ.Units[eID].HitPoints = 150;
        civ.Units[uuID].Speed = 1.3;
        civ.Units[eID].Speed = 1.3;
        setTrainTime(civ.Units[uuID].Creatable, 22);
        setTrainTime(civ.Units[eID].Creatable, 22);
    }
    setUnitCosts(this->df, {uuID, eID}, {80, 0, 0, 75});
    setCombatStats(this->df, uuID, {{4, 11}}, {{3, 1}, {4, 6}, {8, 0}, {19, 0}});
    setCombatStats(this->df, eID, {{4, 13}}, {{3, 2}, {4, 11}, {8, 0}, {19, 0}});
    // Kazak
    createUU(UU_KAZAK, 1269, "Kazak", {0, 1100, 0, 500}, 70, 7620);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "KAZAK";
        civ.Units[eID].Name = "EKAZAK";
        civ.Units[eID].LanguageDLLName = 5813;
        civ.Units[eID].LanguageDLLCreation = 6813;
        civ.Units[eID].LanguageDLLHelp = 105813;
        civ.Units[uuID].HitPoints = 80;
        civ.Units[eID].HitPoints = 100;
        civ.Units[uuID].Speed = 1.35;
        civ.Units[eID].Speed = 1.35;
        setTrainTime(civ.Units[uuID].Creatable, 25);
        setTrainTime(civ.Units[eID].Creatable, 25);
        civ.Units[uuID].Type50.MaxRange = 5;
        civ.Units[eID].Type50.MaxRange = 6;
        civ.Units[uuID].Type50.DisplayedRange = 5;
        civ.Units[eID].Type50.DisplayedRange = 6;
    }
    setUnitCosts(this->df, {uuID, eID}, {0, 65, 0, 55});
    setCombatStats(this->df, uuID, {{27, 2}, {3, 5}, {21, 3}}, {{28, 0}, {4, 1}, {3, 0}, {15, 0}, {8, 0}, {19, 0}});
    setCombatStats(this->df, eID, {{27, 2}, {3, 7}, {21, 5}}, {{28, 0}, {4, 2}, {3, 0}, {15, 0}, {8, 0}, {19, 0}});
    // Szlachcic
    vector<Task> monkPowerUpTasks = {};
    Task monkPowerUpTask = this->df->Civs[0].Units[1803].Bird.TaskList[5];
    monkPowerUpTask.ClassID = 18;
    monkPowerUpTask.UnitID = -1;
    monkPowerUpTask.WorkValue1 = 5;
    monkPowerUpTask.WorkValue2 = 5;
    monkPowerUpTask.SearchWaitTime = 9;
    monkPowerUpTask.WorkRange = 10;
    monkPowerUpTasks.push_back(monkPowerUpTask);
    monkPowerUpTask.ClassID = 43;
    monkPowerUpTasks.push_back(monkPowerUpTask);
    monkPowerUpTask.ClassID = -1;
    monkPowerUpTask.UnitID = 1811;
    monkPowerUpTasks.push_back(monkPowerUpTask);
    createUU(UU_SZLACHCIC, 1721, "Szlachcic", {750, 0, 0, 650}, 60, 7621);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "SZLACH";
        civ.Units[eID].Name = "ESZLACH";
        civ.Units[eID].LanguageDLLName = 5814;
        civ.Units[eID].LanguageDLLCreation = 6814;
        civ.Units[eID].LanguageDLLHelp = 105814;
        civ.Units[uuID].HitPoints = 115;
        civ.Units[eID].HitPoints = 145;
        setTrainTime(civ.Units[uuID].Creatable, 18);
        setTrainTime(civ.Units[eID].Creatable, 18);
        for (int i = 0; i < monkPowerUpTasks.size(); i++) {
            civ.Units[uuID].Bird.TaskList.push_back(monkPowerUpTasks[i]);
            civ.Units[eID].Bird.TaskList.push_back(monkPowerUpTasks[i]);
        }
        civ.Units[uuID].Type50.BreakOffCombat = 96;
        civ.Units[eID].Type50.BreakOffCombat = 96;
    }
    setUnitCosts(this->df, {uuID, eID}, {75, 0, 0, 60});
    setCombatStats(this->df, uuID, {{4, 10}}, {{4, 4}, {3, 1}, {8, 0}, {19, 0}});
    setCombatStats(this->df, eID, {{4, 12}}, {{4, 5}, {3, 2}, {8, 0}, {19, 0}});
    // Cuirassier
    createUU(UU_CUIRASSIER, 1186, "Cuirassier", {650, 0, 0, 800}, 60, 7622);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "CHEVAL";
        civ.Units[eID].Name = "ECHEVAL";
        civ.Units[eID].LanguageDLLName = 5815;
        civ.Units[eID].LanguageDLLCreation = 6815;
        civ.Units[eID].LanguageDLLHelp = 105815;
        civ.Units[uuID].Speed = 1.55;
        civ.Units[eID].Speed = 1.55;
        civ.Units[uuID].HitPoints = 50;
        civ.Units[eID].HitPoints = 65;
        setTrainTime(civ.Units[uuID].Creatable, 11);
        setTrainTime(civ.Units[eID].Creatable, 9);
    }
    setUnitCosts(this->df, {uuID, eID}, {70, 0, 0, 35});
    setCombatStats(this->df, uuID, {{4, 16}, {10, 10}, {23, 6}, {32, 6}, {25, 5}}, {{4, -2}, {3, 2}, {8, 0}, {19, 0}});
    setCombatStats(this->df, eID, {{4, 19}, {10, 10}, {23, 9}, {32, 9}, {25, 7}}, {{4, -2}, {3, 4}, {8, 0}, {19, 0}});
    // Rajput
    vector<Task> camelPowerUpTasks = {};
    for (int i = 0; i < this->unitClasses["camel"].size(); i++) {
        Task camelPowerUpTask = this->df->Civs[0].Units[1790].Bird.TaskList[5];
        camelPowerUpTask.ClassID = -1;
        camelPowerUpTask.UnitID = this->unitClasses["camel"][i];
        camelPowerUpTask.WorkValue1 = 1.05;
        camelPowerUpTask.WorkValue2 = 1;
        camelPowerUpTask.SearchWaitTime = 5;
        camelPowerUpTask.WorkRange = 3;
        camelPowerUpTasks.push_back(camelPowerUpTask);
    }
    createUU(UU_RAJPUT, 1184, "Rajput", {750, 0, 0, 750}, 55, 7623);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "RAJPUT";
        civ.Units[eID].Name = "ERAJPUT";
        civ.Units[eID].LanguageDLLName = 5816;
        civ.Units[eID].LanguageDLLCreation = 6816;
        civ.Units[eID].LanguageDLLHelp = 105816;
        civ.Units[uuID].Speed = 1.52;
        civ.Units[eID].Speed = 1.52;
        civ.Units[uuID].HitPoints = 95;
        civ.Units[eID].HitPoints = 125;
        setTrainTime(civ.Units[uuID].Creatable, 16);
        setTrainTime(civ.Units[eID].Creatable, 16);
        civ.Units[uuID].Type50.BreakOffCombat = 32;
        civ.Units[eID].Type50.BreakOffCombat = 32;
        for (int i = 0; i < camelPowerUpTasks.size(); i++) {
            civ.Units[uuID].Bird.TaskList.push_back(camelPowerUpTasks[i]);
            civ.Units[eID].Bird.TaskList.push_back(camelPowerUpTasks[i]);
        }
    }
    setUnitCosts(this->df, {uuID, eID}, {70, 0, 0, 70});
    setCombatStats(this->df, uuID, {{4, 9}}, {{4, 0}, {3, 1}, {8, 0}, {19, 0}});
    setCombatStats(this->df, eID, {{4, 11}}, {{4, 0}, {3, 2}, {8, 0}, {19, 0}});
    // Seljuk Archer
    createUU(UU_SELJUK_ARCHER, 943, "Seljuk Archer", {0, 800, 0, 700}, 65, 7624);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "SELJUK";
        civ.Units[eID].Name = "ESELJUK";
        civ.Units[eID].LanguageDLLName = 5817;
        civ.Units[eID].LanguageDLLCreation = 6817;
        civ.Units[eID].LanguageDLLHelp = 105817;
        civ.Units[uuID].Speed = 1.4;
        civ.Units[eID].Speed = 1.4;
        civ.Units[uuID].HitPoints = 50;
        civ.Units[eID].HitPoints = 65;
        setTrainTime(civ.Units[uuID].Creatable, 16);
        setTrainTime(civ.Units[eID].Creatable, 13);
        civ.Units[uuID].Type50.MaxRange = 4;
        civ.Units[eID].Type50.MaxRange = 4;
        civ.Units[uuID].Type50.DisplayedRange = 4;
        civ.Units[eID].Type50.DisplayedRange = 4;
    }
    setUnitCosts(this->df, {uuID, eID}, {0, 50, 0, 70});
    setCombatStats(this->df, uuID, {{3, 7}}, {{28, 0}, {4, -2}, {3, 0}, {15, 0}, {8, 0}, {19, 0}});
    setCombatStats(this->df, eID, {{3, 9}}, {{28, 0}, {4, -2}, {3, 1}, {15, 0}, {8, 0}, {19, 0}});
    // Numidian Javelinman
    createUU(UU_NUMIDIAN_JAVELINMAN, 1036, "Numidian Javelinman", {0, 600, 0, 400}, 45, 7625);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "NUMIDIAN";
        civ.Units[eID].Name = "ENUMIDIAN";
        civ.Units[eID].LanguageDLLName = 5818;
        civ.Units[eID].LanguageDLLCreation = 6818;
        civ.Units[eID].LanguageDLLHelp = 105818;
        civ.Units[uuID].HitPoints = 65;
        civ.Units[eID].HitPoints = 80;
        setTrainTime(civ.Units[uuID].Creatable, 17);
        setTrainTime(civ.Units[eID].Creatable, 17);
    }
    setUnitCosts(this->df, {uuID, eID}, {0, 80, 0, 30});
    setCombatStats(this->df, uuID, {{3, 5}, {28, 2}, {15, 3}, {27, 1}}, {{4, 0}, {15, 1}, {8, -1}, {3, 3}, {19, 0}});
    setCombatStats(this->df, eID, {{3, 6}, {28, 3}, {15, 5}, {27, 1}}, {{4, 0}, {15, 1}, {8, -1}, {3, 4}, {19, 0}});
    for (Civ &civ : this->df->Civs) {
        civ.Units[eID].Creatable.ResourceCosts[1].Amount = 15;
    }
    this->unitClasses["skirmisher"].push_back(uuID);
    this->unitClasses["skirmisher"].push_back(eID);
    // Sosso Guard
    createUU(UU_SOSSO_GUARD, 1574, "Sosso Guard", {1000, 0, 0, 700}, 65, 7626);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "SOSSOG";
        civ.Units[eID].Name = "ESOSSOG";
        civ.Units[eID].LanguageDLLName = 5819;
        civ.Units[eID].LanguageDLLCreation = 6819;
        civ.Units[eID].LanguageDLLHelp = 105819;
        civ.Units[uuID].HitPoints = 60;
        civ.Units[eID].HitPoints = 75;
        setTrainTime(civ.Units[uuID].Creatable, 12);
        setTrainTime(civ.Units[eID].Creatable, 14);
        civ.Units[uuID].Speed = 1.1;
        civ.Units[eID].Speed = 1.1;
    }
    setUnitCosts(this->df, {uuID, eID}, {55, 0, 0, 5});
    setCombatStats(this->df, uuID, {{4, 6}, {8, 22}, {5, 25}, {30, 16}}, {{1, 0}, {4, 0}, {3, 1}, {27, 0}, {19, 0}});
    setCombatStats(this->df, eID, {{4, 7}, {8, 44}, {5, 50}, {30, 32}}, {{1, 0}, {4, 0}, {3, 2}, {27, 0}, {19, 0}});
    this->unitClasses["spear"].push_back(uuID);
    this->unitClasses["spear"].push_back(eID);
    // Swiss Pikeman
    createUU(UU_SWISS_PIKEMAN, 892, "Swiss Pikeman", {600, 0, 0, 1200}, 45, 7627);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "SWISSPIKE";
        civ.Units[eID].Name = "ESWISSPIKE";
        civ.Units[eID].LanguageDLLName = 5856;
        civ.Units[eID].LanguageDLLCreation = 6856;
        civ.Units[eID].LanguageDLLHelp = 106856;
        civ.Units[uuID].HitPoints = 80;
        civ.Units[eID].HitPoints = 95;
        civ.Units[uuID].Speed = 0.9;
        civ.Units[eID].Speed = 0.9;
        setTrainTime(civ.Units[uuID].Creatable, 19);
        setTrainTime(civ.Units[eID].Creatable, 19);
        civ.Units[uuID].Type50.MaxRange = 2;
        civ.Units[eID].Type50.MaxRange = 2;
        civ.Units[uuID].Type50.DisplayedRange = 2;
        civ.Units[eID].Type50.DisplayedRange = 2;
    }
    setUnitCosts(this->df, {uuID, eID}, {40, 0, 0, 50});
    setCombatStats(this->df, uuID, {{4, 5}, {8, 5}, {5, 15}, {30, 3}}, {{1, 0}, {3, 1}, {4, 1}, {27, 0}, {19, 0}});
    setCombatStats(this->df, eID, {{4, 6}, {8, 10}, {5, 20}, {30, 6}}, {{1, 0}, {3, 1}, {4, 1}, {27, 0}, {19, 0}});
    this->unitClasses["spear"].push_back(uuID);
    this->unitClasses["spear"].push_back(eID);
    // Headhunter
    createUU(UU_HEADHUNTER, 1673, "Headhunter", {400, 0, 0, 300}, 50, 7628);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "BOUNTY";
        civ.Units[eID].Name = "EBOUNTY";
        civ.Units[uuID].LanguageDLLHelp = 105478;
        civ.Units[eID].LanguageDLLName = 5821;
        civ.Units[eID].LanguageDLLCreation = 6821;
        civ.Units[eID].LanguageDLLHelp = 105821;
        civ.Units[uuID].HitPoints = 60;
        civ.Units[eID].HitPoints = 65;
        civ.Units[uuID].Speed = 1.33;
        civ.Units[eID].Speed = 1.33;
        setTrainTime(civ.Units[uuID].Creatable, 15);
        setTrainTime(civ.Units[eID].Creatable, 15);
    }
    setUnitCosts(this->df, {uuID, eID}, {0, 0, 0, 75});
    setCombatStats(this->df, uuID, {{4, 7}}, {{4, 1}, {3, 0}, {8, 0}, {19, 0}});
    setCombatStats(this->df, eID, {{4, 8}}, {{4, 1}, {3, 0}, {8, 0}, {19, 0}});
    int headhunterID = uuID;
    int headhunterEliteID = eID;
    // Give it a 0 food cost so that it can be added with corvinian army
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Creatable.ResourceCosts[1].Type = 0;
        civ.Units[uuID].Creatable.ResourceCosts[1].Amount = 0;
        civ.Units[uuID].Creatable.ResourceCosts[1].Flag = 1;
        civ.Units[eID].Creatable.ResourceCosts[1].Type = 0;
        civ.Units[eID].Creatable.ResourceCosts[1].Amount = 0;
        civ.Units[eID].Creatable.ResourceCosts[1].Flag = 1;
    }
    // Teulu
    createUU(UU_TEULU, 1683, "Teulu", {600, 0, 0, 550}, 45, 7629);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "TEULU";
        civ.Units[eID].Name = "ETEULU";
        civ.Units[eID].LanguageDLLName = 5822;
        civ.Units[eID].LanguageDLLCreation = 6822;
        civ.Units[eID].LanguageDLLHelp = 105822;
        civ.Units[uuID].HitPoints = 70;
        civ.Units[eID].HitPoints = 85;
        setTrainTime(civ.Units[uuID].Creatable, 10);
        setTrainTime(civ.Units[eID].Creatable, 10);
        civ.Units[uuID].Speed = 0.95;
        civ.Units[eID].Speed = 0.95;
        civ.Units[uuID].Creatable.MaxCharge = 10;
        civ.Units[uuID].Creatable.RechargeRate = 0.1;
        civ.Units[uuID].Creatable.ChargeEvent = 0;
        civ.Units[uuID].Creatable.ChargeType = 2;
    }
    setUnitCosts(this->df, {uuID, eID}, {65, 0, 0, 40});
    setCombatStats(this->df, uuID, {{4, 10}}, {{1, 0}, {4, 0}, {3, 1}, {19, 0}});
    setCombatStats(this->df, eID, {{4, 12}}, {{1, 0}, {4, 0}, {3, 1}, {19, 0}});
    // Maillotins
    createUU(UU_MAILLOTINS, 1685, "Maillotins", {950, 0, 0, 250}, 35, 7630);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "GHALMARAZ";
        civ.Units[eID].Name = "EGHALMARAZ";
        civ.Units[eID].LanguageDLLName = 5823;
        civ.Units[eID].LanguageDLLCreation = 6823;
        civ.Units[eID].LanguageDLLHelp = 105823;
        civ.Units[uuID].HitPoints = 40;
        civ.Units[eID].HitPoints = 40;
        setTrainTime(civ.Units[uuID].Creatable, 8);
        setTrainTime(civ.Units[eID].Creatable, 8);
        civ.Units[uuID].Speed = 0.9;
        civ.Units[eID].Speed = 0.9;
        civ.Units[uuID].Type50.DisplayedReloadTime = 4;
        civ.Units[eID].Type50.DisplayedReloadTime = 4;
    }
    setUnitCosts(this->df, {uuID, eID}, {90, 0, 0, 10});
    setCombatStats(this->df, uuID, {{4, 20}}, {{1, 0}, {4, 0}, {3, 3}, {19, 0}});
    setCombatStats(this->df, eID, {{4, 27}}, {{1, 0}, {4, 0}, {3, 5}, {19, 0}});
    // Hashashin
    createUU(UU_HASHASHIN, 1035, "Hashashin", {500, 0, 0, 1250}, 60, 7631);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "STONERS";
        civ.Units[eID].Name = "ESTONERS";
        civ.Units[eID].LanguageDLLName = 5824;
        civ.Units[eID].LanguageDLLCreation = 6824;
        civ.Units[eID].LanguageDLLHelp = 105824;
        civ.Units[uuID].HitPoints = 85;
        civ.Units[eID].HitPoints = 105;
        setTrainTime(civ.Units[uuID].Creatable, 14);
        setTrainTime(civ.Units[eID].Creatable, 14);
        civ.Units[uuID].Speed = 1.45;
        civ.Units[eID].Speed = 1.45;
    }
    setUnitCosts(this->df, {uuID, eID}, {25, 0, 0, 85});
    setCombatStats(this->df, uuID, {{4, 12}, {19, 8}, {36, 25}}, {{4, 1}, {3, 1}, {8, 0}, {19, 0}});
    setCombatStats(this->df, eID, {{4, 14}, {19, 12}, {36, 50}}, {{4, 1}, {3, 1}, {8, 0}, {19, 0}});
    // Highlander
    createUU(UU_HIGHLANDER, 453, "Highlander", {850, 0, 0, 700}, 65, 7632);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "CHAD";
        civ.Units[eID].Name = "ECHAD";
        civ.Units[eID].LanguageDLLName = 5825;
        civ.Units[eID].LanguageDLLCreation = 6825;
        civ.Units[eID].LanguageDLLHelp = 105825;
        civ.Units[uuID].HitPoints = 60;
        civ.Units[eID].HitPoints = 75;
        setTrainTime(civ.Units[uuID].Creatable, 13);
        setTrainTime(civ.Units[eID].Creatable, 13);
        civ.Units[uuID].Speed = 0.95;
        civ.Units[eID].Speed = 0.95;
    }
    setUnitCosts(this->df, {uuID, eID}, {75, 0, 0, 35});
    setCombatStats(this->df, uuID, {{4, 9}, {1, 5}, {8, 5}, {32, 5}}, {{4, 1}, {3, 1}, {1, 0}, {19, 0}});
    setCombatStats(this->df, eID, {{4, 13}, {1, 6}, {8, 6}, {32, 6}}, {{4, 1}, {3, 1}, {1, 0}, {19, 0}});
    // Stradiot
    createUU(UU_STRADIOT, 1677, "Stradiot", {800, 0, 0, 850}, 65, 7633);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "STRADIOT";
        civ.Units[eID].Name = "ESTRADIOT";
        civ.Units[eID].LanguageDLLName = 5826;
        civ.Units[eID].LanguageDLLCreation = 6826;
        civ.Units[eID].LanguageDLLHelp = 105826;
        civ.Units[uuID].Type50.MaxRange = 1;
        civ.Units[eID].Type50.MaxRange = 1;
        civ.Units[uuID].Type50.DisplayedRange = 1;
        civ.Units[eID].Type50.DisplayedRange = 1;
        civ.Units[uuID].HitPoints = 80;
        civ.Units[eID].HitPoints = 100;
        setTrainTime(civ.Units[uuID].Creatable, 20);
        setTrainTime(civ.Units[eID].Creatable, 20);
        civ.Units[uuID].Speed = 1.4;
        civ.Units[eID].Speed = 1.4;
    }
    setUnitCosts(this->df, {uuID, eID}, {75, 0, 0, 55});
    setCombatStats(this->df, uuID, {{4, 9}, {8, 4}}, {{8, 0}, {4, 0}, {3, 0}, {19, 0}});
    setCombatStats(this->df, eID, {{4, 12}, {8, 6}}, {{8, 0}, {4, 1}, {3, 1}, {19, 0}});
    // Ahosi
    createUU(UU_AHOSI, 1066, "Ahosi", {450, 0, 0, 350}, 40, 7634);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "AHOSI";
        civ.Units[eID].Name = "EAHOSI";
        civ.Units[eID].LanguageDLLName = 5827;
        civ.Units[eID].LanguageDLLCreation = 6827;
        civ.Units[eID].LanguageDLLHelp = 105827;
        civ.Units[uuID].HitPoints = 45;
        civ.Units[eID].HitPoints = 55;
        setTrainTime(civ.Units[uuID].Creatable, 9);
        setTrainTime(civ.Units[eID].Creatable, 9);
        civ.Units[uuID].Speed = 1.25;
        civ.Units[eID].Speed = 1.25;
        civ.Units[uuID].Type50.MaxRange = 0;
        civ.Units[eID].Type50.MaxRange = 0;
        civ.Units[uuID].Type50.DisplayedRange = 0;
        civ.Units[eID].Type50.DisplayedRange = 0;
        setTrainTime(civ.Units[uuID].Creatable, 7);
        setTrainTime(civ.Units[eID].Creatable, 7);
    }
    setUnitCosts(this->df, {uuID, eID}, {45, 0, 0, 15});
    setCombatStats(this->df, uuID, {{3, 15}}, {{1, 0}, {4, 0}, {3, 0}, {19, 0}});
    setCombatStats(this->df, eID, {{3, 19}}, {{1, 0}, {4, 0}, {3, 0}, {19, 0}});
    this->ahosiID = uuID;
    this->ehosiID = eID;
    // Landsknecht
    vector<Task> landsknechtPowerUpTasks = {};
    for (int i = 0; i < this->unitClasses["spear"].size(); i++) {
        Task landsknechtPowerUpTask = this->df->Civs[0].Units[1790].Bird.TaskList[5];
        landsknechtPowerUpTask.ClassID = -1;
        landsknechtPowerUpTask.UnitID = this->unitClasses["spear"][i];
        landsknechtPowerUpTask.WorkValue1 = 0.4;
        landsknechtPowerUpTask.WorkValue2 = 6;
        landsknechtPowerUpTask.SearchWaitTime = 10;
        landsknechtPowerUpTask.WorkRange = 5;
        landsknechtPowerUpTask.TargetDiplomacy = 4;
        landsknechtPowerUpTasks.push_back(landsknechtPowerUpTask);
    }
    for (int i = 0; i < this->unitClasses["gunpowder"].size(); i++) {
        Task landsknechtPowerUpTask = this->df->Civs[0].Units[1790].Bird.TaskList[5];
        landsknechtPowerUpTask.ClassID = -1;
        landsknechtPowerUpTask.UnitID = this->unitClasses["gunpowder"][i];
        landsknechtPowerUpTask.WorkValue1 = 0.4;
        landsknechtPowerUpTask.WorkValue2 = 6;
        landsknechtPowerUpTask.SearchWaitTime = 10;
        landsknechtPowerUpTask.WorkRange = 5;
        landsknechtPowerUpTask.TargetDiplomacy = 4;
        landsknechtPowerUpTasks.push_back(landsknechtPowerUpTask);
    }
    Task landsknechtPowerUpTask = this->df->Civs[0].Units[1790].Bird.TaskList[5];
    landsknechtPowerUpTask.ClassID = -1;
    landsknechtPowerUpTask.UnitID = 882;
    landsknechtPowerUpTask.WorkValue1 = 0.4;
    landsknechtPowerUpTask.WorkValue2 = 6;
    landsknechtPowerUpTask.SearchWaitTime = 10;
    landsknechtPowerUpTask.WorkRange = 5;
    landsknechtPowerUpTask.TargetDiplomacy = 4;
    landsknechtPowerUpTasks.push_back(landsknechtPowerUpTask);
    createUU(UU_LANDSKNECHT, 439, "Landsknecht", {850, 0, 0, 650}, 60, 7635);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "GOALS";
        civ.Units[eID].Name = "EGOALS";
        civ.Units[uuID].LanguageDLLCreation = 6780;
        civ.Units[uuID].LanguageDLLHelp = 105780;
        civ.Units[eID].LanguageDLLName = 5828;
        civ.Units[eID].LanguageDLLCreation = 6828;
        civ.Units[eID].LanguageDLLHelp = 105828;
        civ.Units[uuID].HitPoints = 45;
        civ.Units[eID].HitPoints = 55;
        setTrainTime(civ.Units[uuID].Creatable, 11);
        setTrainTime(civ.Units[eID].Creatable, 11);
        civ.Units[uuID].Speed = 1.02;
        civ.Units[eID].Speed = 1.02;
        civ.Units[uuID].Type50.BreakOffCombat = 32;
        civ.Units[eID].Type50.BreakOffCombat = 32;
        for (int i = 0; i < landsknechtPowerUpTasks.size(); i++) {
            civ.Units[uuID].Bird.TaskList.push_back(landsknechtPowerUpTasks[i]);
            civ.Units[eID].Bird.TaskList.push_back(landsknechtPowerUpTasks[i]);
        }
    }
    setCombatStats(this->df, uuID, {{4, 12}, {21, 2}}, {{1, 3}, {4, 1}, {3, 0}, {19, 0}});
    setCombatStats(this->df, eID, {{4, 14}, {21, 2}}, {{1, 3}, {4, 1}, {3, 0}, {19, 0}});
    // Clibinarii
    createUU(UU_CLIBINARII, 932, "Clibinarii", {950, 0, 0, 850}, 65, 7636);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "CLIBS";
        civ.Units[eID].Name = "ECLIBS";
        civ.Units[uuID].LanguageDLLCreation = 6781;
        civ.Units[eID].LanguageDLLHelp = 105781;
        civ.Units[eID].LanguageDLLName = 5829;
        civ.Units[eID].LanguageDLLCreation = 6829;
        civ.Units[eID].LanguageDLLHelp = 105829;
        civ.Units[uuID].HitPoints = 140;
        civ.Units[eID].HitPoints = 180;
        setTrainTime(civ.Units[uuID].Creatable, 30);
        setTrainTime(civ.Units[eID].Creatable, 28);
        civ.Units[uuID].Speed = 1.25;
        civ.Units[eID].Speed = 1.25;
    }
    setUnitCosts(this->df, {uuID, eID}, {95, 0, 0, 75});
    setCombatStats(this->df, uuID, {{4, 15}}, {{8, 0}, {3, 2}, {4, 2}, {19, 0}});
    setCombatStats(this->df, eID, {{4, 19}}, {{8, 0}, {3, 3}, {4, 3}, {19, 0}});
    // Silahtar
    createUU(UU_SILAHTAR, 1267, "Silahtar", {0, 1100, 0, 650}, 75, 7637);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "NTWFTW";
        civ.Units[eID].Name = "ENTWFTW";
        civ.Units[eID].LanguageDLLName = 5830;
        civ.Units[eID].LanguageDLLCreation = 6830;
        civ.Units[eID].LanguageDLLHelp = 105830;
        civ.Units[uuID].HitPoints = 60;
        civ.Units[eID].HitPoints = 80;
        setTrainTime(civ.Units[uuID].Creatable, 34);
        setTrainTime(civ.Units[eID].Creatable, 29);
        civ.Units[uuID].Speed = 1.25;
        civ.Units[eID].Speed = 1.25;
        civ.Units[uuID].Type50.BonusDamageResistance = 0.5;
        civ.Units[eID].Type50.BonusDamageResistance = 0.5;
    }
    setUnitCosts(this->df, {uuID, eID}, {0, 40, 0, 70});
    setCombatStats(this->df, uuID, {{3, 6}, {1, 3}, {32, 3}}, {{28, 0}, {15, 0}, {8, 0}, {19, 2}, {4, 1}, {3, 0}});
    setCombatStats(this->df, eID, {{3, 8}, {1, 6}, {32, 6}}, {{28, 0}, {15, 0}, {8, 0}, {19, 2}, {4, 2}, {3, 1}});
    // Jaridah
    createUU(UU_JARIDAH, 777, "Jaridah", {900, 0, 0, 450}, 60, 7638);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "JARIDAH";
        civ.Units[eID].Name = "EJARIDAH";
        civ.Units[eID].LanguageDLLName = 5831;
        civ.Units[eID].LanguageDLLCreation = 6831;
        civ.Units[eID].LanguageDLLHelp = 105831;
        civ.Units[uuID].HitPoints = 60;
        civ.Units[eID].HitPoints = 90;
        civ.Units[uuID].Speed = 1.48;
        civ.Units[eID].Speed = 1.48;
        setTrainTime(civ.Units[uuID].Creatable, 14);
        setTrainTime(civ.Units[eID].Creatable, 14);
    }
    setUnitCosts(this->df, {uuID, eID}, {50, 0, 0, 35});
    setCombatStats(this->df, uuID, {{4, 11}, {30, 8}, {5, 25}}, {{4, 1}, {3, 0}, {8, 12}, {19, 0}});
    setCombatStats(this->df, eID, {{4, 13}, {30, 14}, {5, 45}}, {{4, 1}, {3, 0}, {8, 16}, {19, 0}});
    // Wolf Warrior
    createUU(UU_WOLF_WARRIOR, 702, "Wolf Warrior", {800, 0, 0, 700}, 65, 7639);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "WHERE";
        civ.Units[eID].Name = "EWHERE";
        civ.Units[eID].LanguageDLLName = 5832;
        civ.Units[eID].LanguageDLLCreation = 6832;
        civ.Units[eID].LanguageDLLHelp = 105832;
        civ.Units[uuID].HitPoints = 125;
        civ.Units[eID].HitPoints = 150;
        civ.Units[uuID].Speed = 1.3;
        civ.Units[eID].Speed = 1.3;
        setTrainTime(civ.Units[uuID].Creatable, 21);
        setTrainTime(civ.Units[eID].Creatable, 21);
    }
    setUnitCosts(this->df, {uuID, eID}, {85, 0, 0, 50});
    setCombatStats(this->df, uuID, {{4, 13}}, {{4, 3}, {3, 0}, {8, 0}, {19, 0}});
    setCombatStats(this->df, eID, {{4, 15}}, {{4, 5}, {3, 0}, {8, 0}, {19, 0}});
    // Warrior Monk
    createUU(UU_WARRIOR_MONK, 1178, "Warrior Monk", {800, 0, 0, 750}, 80, 7640);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "NAGINATA";
        civ.Units[eID].Name = "ENAGINATA";
        civ.Units[eID].LanguageDLLName = 5833;
        civ.Units[eID].LanguageDLLCreation = 6833;
        civ.Units[eID].LanguageDLLHelp = 105833;
        civ.Units[uuID].HitPoints = 30;
        civ.Units[eID].HitPoints = 40;
        civ.Units[uuID].Speed = 0.9;
        civ.Units[eID].Speed = 0.9;
        setTrainTime(civ.Units[uuID].Creatable, 45);
        setTrainTime(civ.Units[eID].Creatable, 45);
        civ.Units[uuID].Creatable.MaxCharge = 100;
        civ.Units[uuID].Creatable.RechargeRate = 3;
        civ.Units[uuID].Creatable.ChargeEvent = 0;
        civ.Units[uuID].Creatable.ChargeType = 4;
        civ.Units[eID].Creatable.MaxCharge = 200;
        civ.Units[eID].Creatable.RechargeRate = 10;
        civ.Units[eID].Creatable.ChargeEvent = 0;
        civ.Units[eID].Creatable.ChargeType = 4;
    }
    setUnitCosts(this->df, {uuID, eID}, {0, 0, 0, 100});
    setCombatStats(this->df, uuID, {{4, 11}, {25, 0}, {20, 0}}, {{4, 0}, {3, 0}, {25, 0}, {19, 0}});
    setCombatStats(this->df, eID, {{4, 14}, {25, 0}, {20, 0}}, {{4, 0}, {3, 0}, {25, 0}, {19, 0}});
    int warmonkID = uuID;
    // Give it a 0 food cost so that it can be added with corvinian army
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Creatable.ResourceCosts[1].Type = 0;
        civ.Units[uuID].Creatable.ResourceCosts[1].Amount = 0;
        civ.Units[uuID].Creatable.ResourceCosts[1].Flag = 1;
        civ.Units[eID].Creatable.ResourceCosts[1].Type = 0;
        civ.Units[eID].Creatable.ResourceCosts[1].Amount = 0;
        civ.Units[eID].Creatable.ResourceCosts[1].Flag = 1;
    }
    // Castellan
    createUU(UU_CASTELLAN, 1718, "Castellan", {700, 0, 0, 900}, 75, 7641);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    setUnitCosts(this->df, {uuID, eID}, {65, 0, 0, 90});
    setCombatStats(this->df, uuID, {{4, 13}}, {{4, 0}, {3, 0}, {8, 0}, {19, 0}, {36, 0}});
    setCombatStats(this->df, eID, {{4, 16}}, {{4, 0}, {3, 0}, {8, 0}, {19, 0}, {36, 0}});
    Task powerUpTask = this->df->Civs[0].Units[1803].Bird.TaskList[5];
    powerUpTask.ClassID = 4;
    powerUpTask.UnitID = -1;
    powerUpTask.WorkValue1 = 1.25;
    powerUpTask.WorkValue2 = 40;
    powerUpTask.SearchWaitTime = 10;
    powerUpTask.WorkRange = 12;
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "YATHQUEEN";
        civ.Units[eID].Name = "EYATHQUEEN";
        civ.Units[uuID].LanguageDLLHelp = 105608;
        civ.Units[eID].LanguageDLLName = 5834;
        civ.Units[eID].LanguageDLLCreation = 6834;
        civ.Units[eID].LanguageDLLHelp = 105834;
        civ.Units[uuID].HitPoints = 55;
        civ.Units[eID].HitPoints = 65;
        setTrainTime(civ.Units[uuID].Creatable, 35);
        setTrainTime(civ.Units[eID].Creatable, 35);
        civ.Units[uuID].LineOfSight = 9;
        civ.Units[eID].LineOfSight = 15;
        civ.Units[uuID].Bird.TaskList.push_back(powerUpTask);
        civ.Units[eID].Bird.TaskList.push_back(powerUpTask);
        civ.Units[uuID].Type50.BreakOffCombat = 96;
        civ.Units[eID].Type50.BreakOffCombat = 96;
    }
    // Wind Warrior
    createUU(UU_WIND_WARRIOR, 749, "Wind Warrior", {600, 0, 0, 900}, 65, 7642);
    uuID = (int)(this->df->Civs[0].Units.size() - 2);
    eID = (int)(this->df->Civs[0].Units.size() - 1);
    for (Civ &civ : this->df->Civs) {
        civ.Units[uuID].Name = "LIGHTNINGMCQUEEN";
        civ.Units[eID].Name = "ELIGHTNINGMCQUEEN";
        civ.Units[uuID].LanguageDLLHelp = 105017;
        civ.Units[eID].LanguageDLLName = 5835;
        civ.Units[eID].LanguageDLLCreation = 6835;
        civ.Units[eID].LanguageDLLHelp = 105835;
        civ.Units[uuID].Speed = 1.15;
        civ.Units[eID].Speed = 1.15;
        civ.Units[uuID].HitPoints = 55;
        civ.Units[eID].HitPoints = 65;
        setTrainTime(civ.Units[uuID].Creatable, 12);
        setTrainTime(civ.Units[eID].Creatable, 12);
    }
    setUnitCosts(this->df, {uuID, eID}, {55, 0, 0, 35});
    setCombatStats(this->df, uuID, {{4, 8}, {20, 8}, {11, 1}}, {{1, 0}, {4, 0}, {3, 1}, {19, 0}});
    setCombatStats(this->df, eID, {{4, 10}, {20, 12}, {11, 2}}, {{1, 0}, {4, 0}, {3, 2}, {19, 0}});

    // Create TC spearmen
    for (Civ &civ : this->df->Civs) {
        civ.Units[UNIT_TC_SPEARMAN] = civ.Units[93];
        civ.Units[UNIT_TC_PIKEMAN] = civ.Units[358];
        civ.Units[UNIT_TC_HALBERDIER] = civ.Units[359];
        civ.Units[UNIT_TC_SPEARMAN].Name = "TCPKEMN";
        civ.Units[UNIT_TC_PIKEMAN].Name = "TCPKM";
        civ.Units[UNIT_TC_HALBERDIER].Name = "TCHLBDM";
        setTrainLocationID(civ.Units[UNIT_TC_SPEARMAN].Creatable, 109);
        setTrainLocationID(civ.Units[UNIT_TC_PIKEMAN].Creatable, 109);
        setTrainLocationID(civ.Units[UNIT_TC_HALBERDIER].Creatable, 109);
    }
    this->df->Effects[189].EffectCommands.push_back(createEC(3, UNIT_TC_SPEARMAN, UNIT_TC_HALBERDIER, -1, 0));
    this->duplicationUnits.push_back({93, UNIT_TC_SPEARMAN, UNIT_TC_PIKEMAN});
    this->duplicationUnits.push_back({358, UNIT_TC_PIKEMAN, UNIT_TC_HALBERDIER});
    this->duplicationUnits.push_back({359, UNIT_TC_HALBERDIER, -1});

    // Create the TC siege tower
    for (Civ &civ : this->df->Civs) {
        civ.Resources[29] = 1;
        civ.Units[UNIT_TC_SIEGE_TOWER] = civ.Units[1105];
        civ.Units[UNIT_TC_SIEGE_TOWER].Name = "SIEGTWR_F";
        setTrainLocation(civ.Units[UNIT_TC_SIEGE_TOWER].Creatable, 109, 9);
        civ.Units[UNIT_TC_SIEGE_TOWER].Creatable.ResourceCosts[0].Type = 29;
        civ.Units[UNIT_TC_SIEGE_TOWER].Creatable.ResourceCosts[0].Amount = 1;
        civ.Units[UNIT_TC_SIEGE_TOWER].Creatable.ResourceCosts[0].Flag = 1;
        civ.Units[UNIT_TC_SIEGE_TOWER].Creatable.ResourceCosts[1] = civ.Units[UNIT_TC_SIEGE_TOWER].Creatable.ResourceCosts[2];
        civ.Units[UNIT_TC_SIEGE_TOWER].Creatable.ResourceCosts[2].Type = -1;
        civ.Units[UNIT_TC_SIEGE_TOWER].Creatable.ResourceCosts[2].Amount = 0;
        civ.Units[UNIT_TC_SIEGE_TOWER].Creatable.ResourceCosts[2].Flag = 0;
    }
    this->duplicationUnits.push_back({1105, UNIT_TC_SIEGE_TOWER, -1});

    // Create small farms
    for (Civ &civ : this->df->Civs) {
        civ.Units[UNIT_SMALL_FARM] = civ.Units[50];
        civ.Units[UNIT_SMALL_DEAD_FARM] = civ.Units[357];
        civ.Units[UNIT_SMALL_RICE_FARM] = civ.Units[1187];
        civ.Units[UNIT_SMALL_DEAD_RICE_FARM] = civ.Units[1188];
        civ.Units[UNIT_SMALL_FARM_DROP] = civ.Units[1193];
        civ.Units[UNIT_SMALL_FARM_STACK] = civ.Units[1194];
        civ.Units[UNIT_SMALL_RICE_FARM_DROP] = civ.Units[1195];

        vector<int> newFarms = {UNIT_SMALL_FARM, UNIT_SMALL_DEAD_FARM, UNIT_SMALL_RICE_FARM, UNIT_SMALL_DEAD_RICE_FARM, UNIT_SMALL_FARM_DROP, UNIT_SMALL_FARM_STACK, UNIT_SMALL_RICE_FARM_DROP};
        for (int i = 0; i < newFarms.size(); i++) {
            if (civ.Units[newFarms[i]].CollisionSize.x == 1.5) {
                civ.Units[newFarms[i]].CollisionSize.x = 1;
                civ.Units[newFarms[i]].CollisionSize.y = 1;
            }
            if (civ.Units[newFarms[i]].ClearanceSize.first == 1.5) {
                civ.Units[newFarms[i]].ClearanceSize.first = 1.0f;
                civ.Units[newFarms[i]].ClearanceSize.second = 1.0f;
            }
            if (civ.Units[newFarms[i]].OutlineSize.x == 1.5) {
                civ.Units[newFarms[i]].OutlineSize.x = 1;
                civ.Units[newFarms[i]].OutlineSize.y = 1;
            }
        }
    }
    this->duplicationUnits.push_back({50, UNIT_SMALL_FARM, -1});
    this->duplicationUnits.push_back({357, UNIT_SMALL_DEAD_FARM, -1});
    this->duplicationUnits.push_back({1187, UNIT_SMALL_RICE_FARM, -1});
    this->duplicationUnits.push_back({1188, UNIT_SMALL_DEAD_RICE_FARM, -1});
    this->duplicationUnits.push_back({1193, UNIT_SMALL_FARM_DROP, -1});
    this->duplicationUnits.push_back({1194, UNIT_SMALL_FARM_STACK, -1});
    this->duplicationUnits.push_back({1195, UNIT_SMALL_RICE_FARM_DROP, -1});

    // Create Royal Lancer Cavalry
    for (Civ &civ : this->df->Civs) {
        civ.Units[UNIT_ROYAL_LANCER] = civ.Units[1372];
        civ.Units[UNIT_ROYAL_LANCER].Name = "RSLANCER";
        civ.Units[UNIT_ROYAL_LANCER].LanguageDLLName = 5242;
        civ.Units[UNIT_ROYAL_LANCER].LanguageDLLCreation = 6242;
        civ.Units[UNIT_ROYAL_LANCER].LanguageDLLHelp = 26242;
        civ.Units[UNIT_ROYAL_LANCER].StandingGraphic = {10510, 10511};
        civ.Units[UNIT_ROYAL_LANCER].Type50.AttackGraphic = 10508;
        civ.Units[UNIT_ROYAL_LANCER].DyingGraphic = 10509;
        civ.Units[UNIT_ROYAL_LANCER].DeadFish.WalkingGraphic = 10513;
        civ.Units[UNIT_ROYAL_LANCER].HitPoints = 100;
        civ.Units[UNIT_ROYAL_LANCER].Type50.DisplayedAttack = 13;
        civ.Units[UNIT_ROYAL_LANCER].Type50.Attacks[0].Amount = 13;
    }
    this->unitClasses["steppe"].push_back(UNIT_ROYAL_LANCER);

    // Create Royal Battle Elephant
    for (Civ &civ : this->df->Civs) {
        civ.Units[UNIT_ROYAL_ELEPHANT] = civ.Units[1134];
        civ.Units[UNIT_ROYAL_ELEPHANT].Name = "RBATELE";
        civ.Units[UNIT_ROYAL_ELEPHANT].LanguageDLLName = 5241;
        civ.Units[UNIT_ROYAL_ELEPHANT].LanguageDLLCreation = 6241;
        civ.Units[UNIT_ROYAL_ELEPHANT].LanguageDLLHelp = 26241;

        // TODO: seem wrong Shrivamsha_Rider and Genitour 
        //civ.Units[UNIT_ROYAL_ELEPHANT].StandingGraphic = {2926, -1};
        //civ.Units[UNIT_ROYAL_ELEPHANT].Type50.AttackGraphic = 2924;
        //civ.Units[UNIT_ROYAL_ELEPHANT].DyingGraphic = 2925;
        //civ.Units[UNIT_ROYAL_ELEPHANT].DeadFish.WalkingGraphic = 2927;
        civ.Units[UNIT_ROYAL_ELEPHANT].HitPoints = 330;
        civ.Units[UNIT_ROYAL_ELEPHANT].Type50.DisplayedAttack = 15;
        civ.Units[UNIT_ROYAL_ELEPHANT].Type50.Attacks[1].Amount = 15;
        civ.Units[UNIT_ROYAL_ELEPHANT].Creatable.DisplayedPierceArmour = 4;
        civ.Units[UNIT_ROYAL_ELEPHANT].Type50.Armours[3].Amount = 4;
    }
    this->unitClasses["elephant"].push_back(UNIT_ROYAL_ELEPHANT);
    this->unitClasses["stable"].push_back(UNIT_ROYAL_ELEPHANT);

    // Create Imperial Scorpion
    for (Civ &civ : this->df->Civs) {
        civ.Units[UNIT_IMP_SCORPION] = civ.Units[542];
        civ.Units[UNIT_IMP_SCORPION].Name = "IMPBAL";
        civ.Units[UNIT_IMP_SCORPION].LanguageDLLName = 5240;
        civ.Units[UNIT_IMP_SCORPION].LanguageDLLCreation = 6240;
        civ.Units[UNIT_IMP_SCORPION].LanguageDLLHelp = 26240;
        civ.Units[UNIT_IMP_SCORPION].HitPoints = 60;
        civ.Units[UNIT_IMP_SCORPION].Type50.DisplayedAttack = 18;
        civ.Units[UNIT_IMP_SCORPION].Type50.Attacks[3].Amount = 18;
        civ.Units[UNIT_IMP_SCORPION].Type50.ProjectileUnitID = UNIT_IMP_SCORPION_PROJECTILE;
        civ.Units[UNIT_IMP_SCORPION].Creatable.SecondaryProjectileUnit = UNIT_IMP_SCORPION_PROJECTILE;
        civ.Units[UNIT_IMP_SCORPION_PROJECTILE].Name = "Projectile Imperial Scorpion";
        civ.Units[UNIT_IMP_SCORPION_PROJECTILE_FIRE].Name = "Projectile Imperial Scorpion (Fire)";
        civ.Units[UNIT_IMP_SCORPION_PROJECTILE].Type50.DisplayedAttack = 14;
        civ.Units[UNIT_IMP_SCORPION_PROJECTILE].Type50.Attacks[2].Amount = 14;
        civ.Units[UNIT_IMP_SCORPION_PROJECTILE_FIRE].Type50.DisplayedAttack = 14;
        civ.Units[UNIT_IMP_SCORPION_PROJECTILE_FIRE].Type50.Attacks[2].Amount = 14;
    }
    df->Effects[47].EffectCommands.push_back(createEC(3, UNIT_IMP_SCORPION_PROJECTILE, UNIT_IMP_SCORPION_PROJECTILE_FIRE, -1, 0));
    df->Effects[47].EffectCommands.push_back(createEC(4, UNIT_IMP_SCORPION, -1, 9, amountTypetoD(1, 3)));
    this->unitClasses["scorpion"].push_back(UNIT_IMP_SCORPION);
    this->unitClasses["workshop"].push_back(UNIT_IMP_SCORPION);

    // Create the mill cow
    for (Civ &civ : this->df->Civs) {
        civ.Units[UNIT_MILL_COW] = civ.Units[705];
        civ.Units[UNIT_MILL_COW].Name = "BABY";
        setTrainLocation(civ.Units[UNIT_MILL_COW].Creatable, 68, 2);
        civ.Units[UNIT_MILL_COW].Creatable.ResourceCosts[0].Type = 3;
        civ.Units[UNIT_MILL_COW].Creatable.ResourceCosts[0].Amount = 10;

        civ.Units[UNIT_PASTURE_COW] = civ.Units[705];
        civ.Units[UNIT_PASTURE_COW].Name = "BIGBABY";
        setTrainLocation(civ.Units[UNIT_PASTURE_COW].Creatable, 1889, 2);
        civ.Units[UNIT_PASTURE_COW].Creatable.ResourceCosts[0].Type = 3;
        civ.Units[UNIT_PASTURE_COW].Creatable.ResourceCosts[0].Amount = 10;
    }

    // Create feudal monk
    for (Civ &civ : this->df->Civs) {
        civ.Units[UNIT_FEUDAL_MONK] = civ.Units[125];
        civ.Units[UNIT_FEUDAL_MONK].Name = "MONK_F";
        for (int i = 0; i < civ.Units[UNIT_FEUDAL_MONK].Bird.TaskList.size(); i++) {
            if (civ.Units[UNIT_FEUDAL_MONK].Bird.TaskList[i].ActionType == 132) {
                // Remove the ability to pick up relics
                civ.Units[UNIT_FEUDAL_MONK].Bird.TaskList.erase(civ.Units[UNIT_FEUDAL_MONK].Bird.TaskList.begin() + i);
                i--;
            } else if (civ.Units[UNIT_FEUDAL_MONK].Bird.TaskList[i].ActionType == 104) {
                // Increase conversion times
                if (civ.Units[UNIT_FEUDAL_MONK].Bird.TaskList[i].WorkValue1 == 4 && civ.Units[UNIT_FEUDAL_MONK].Bird.TaskList[i].WorkValue2 == 10) {
                    civ.Units[UNIT_FEUDAL_MONK].Bird.TaskList[i].WorkValue1 = 5;
                    civ.Units[UNIT_FEUDAL_MONK].Bird.TaskList[i].WorkValue2 = 12;
                } else if (civ.Units[UNIT_FEUDAL_MONK].Bird.TaskList[i].WorkValue1 == 15 && civ.Units[UNIT_FEUDAL_MONK].Bird.TaskList[i].WorkValue2 == 25) {
                    civ.Units[UNIT_FEUDAL_MONK].Bird.TaskList[i].WorkValue1 = 20;
                    civ.Units[UNIT_FEUDAL_MONK].Bird.TaskList[i].WorkValue2 = 30;
                }
            }
        }
    }

    // Create feudal knight
    for (Civ &civ : this->df->Civs) {
        civ.Units[UNIT_FEUDAL_KNIGHT] = civ.Units[38];
        civ.Units[UNIT_FEUDAL_KNIGHT].Name = "KNIGHT_F";
        civ.Units[UNIT_FEUDAL_KNIGHT].HitPoints = 30;
        civ.Units[UNIT_FEUDAL_KNIGHT].Speed = 1.25;
        civ.Units[UNIT_FEUDAL_KNIGHT].LineOfSight = 3;
        civ.Units[UNIT_FEUDAL_KNIGHT].Bird.SearchRadius = 3;
        setTrainTime(civ.Units[UNIT_FEUDAL_KNIGHT].Creatable, 45);
    }
    // this->df->Effects[175].EffectCommands.push_back(createEC(3, UNIT_FEUDAL_KNIGHT, 283, -1, 0));
    // this->df->Effects[253].EffectCommands.push_back(createEC(3, UNIT_FEUDAL_KNIGHT, 569, -1, 0));
    this->duplicationUnits.push_back({38, UNIT_FEUDAL_KNIGHT, 38});

    // Create City Walls
    for (Civ &civ : this->df->Civs) {
        setTrainLocation(civ.Units[UNIT_CITY_WALL].Creatable, 118, 8);
        civ.Units[UNIT_CITY_WALL].HitPoints = 4800;
        civ.Units[UNIT_CITY_WALL].Creatable.DisplayedPierceArmour = 16;
        civ.Units[UNIT_CITY_WALL].Type50.DisplayedMeleeArmour = 16;
        civ.Units[UNIT_CITY_WALL].Type50.Armours = civ.Units[155].Type50.Armours;
        civ.Units[UNIT_CITY_WALL].Type50.Armours[2].Amount = 16;
        civ.Units[UNIT_CITY_WALL].Type50.Armours[3].Amount = 16;
        civ.Units[UNIT_CITY_WALL].Type50.Armours[6].Amount = 16;
        civ.Units[UNIT_CITY_WALL].Creatable.ResourceCosts[0].Amount = 5;
        civ.Units[UNIT_CITY_WALL].BlastDefenseLevel = 2;
        for (int i = 0; i < 16; i++) {
            civ.Units[i + 1579].Type50.Armours[1].Amount = 30;
            civ.Units[i + 1579].Creatable.ResourceCosts[0].Amount = 30;
        }
        setTrainButtonID(civ.Units[1582].Creatable, 11);
    }

    // Allow siege towers to shoot
    unit::AttackOrArmor attack0 = unit::AttackOrArmor();
    attack0.Amount = 0;
    attack0.Class = 3;
    unit::AttackOrArmor attack1 = unit::AttackOrArmor();
    attack0.Amount = 0;
    attack0.Class = 11;
    for (Civ &civ : this->df->Civs) {
        for (int i = 0; i < siegeTowers.size(); i++) {
            civ.Units[siegeTowers[i]].Type50.MaxRange = 8;
            civ.Units[siegeTowers[i]].Type50.MinRange = 1;
            civ.Units[siegeTowers[i]].Type50.DisplayedRange = 8;
            civ.Units[siegeTowers[i]].Type50.DisplayedAttack = 0;
            civ.Units[siegeTowers[i]].Type50.AccuracyPercent = 90;
            civ.Units[siegeTowers[i]].Type50.AccuracyDispersion = 0;
            civ.Units[siegeTowers[i]].Type50.ReloadTime = 4;
            civ.Units[siegeTowers[i]].Type50.DisplayedReloadTime = 4;
            civ.Units[siegeTowers[i]].Type50.BlastAttackLevel = 3;
            civ.Units[siegeTowers[i]].Type50.Attacks.push_back(attack0);
            civ.Units[siegeTowers[i]].Type50.Attacks.push_back(attack1);
            civ.Units[siegeTowers[i]].Bird.TaskList.push_back(civ.Units[79].Bird.TaskList[0]);
            civ.Units[siegeTowers[i]].Type50.ProjectileUnitID = 504;
            civ.Units[siegeTowers[i]].Creatable.SecondaryProjectileUnit = 505;
            civ.Units[siegeTowers[i]].Creatable.TotalProjectiles = 1;
            civ.Units[siegeTowers[i]].Creatable.MaxTotalProjectiles = 5;
            civ.Units[siegeTowers[i]].Type50.GraphicDisplacement = {0, 1, 5};
            civ.Units[siegeTowers[i]].Creatable.ProjectileSpawningArea = {1, 0.5, 2};
        }
    }

    // Headhunter kidnapper
    Task kidnapTask = Task();
    kidnapTask.ActionType = 135;
    kidnapTask.ClassID = 4;
    kidnapTask.WorkRange = 0.25;
    kidnapTask.TargetDiplomacy = 2;
    kidnapTask.GatherType = 2;
    for (Civ &civ : this->df->Civs) {
        civ.Units.push_back(civ.Units[headhunterID]);
        civ.UnitPointers.push_back(1);
        civ.Units.push_back(civ.Units[headhunterEliteID]);
        civ.UnitPointers.push_back(1);

        int headhunterKidnapper = ((int)(this->df->Civs[0].Units.size())) - 2;
        int headhunterKidnapperElite = ((int)(this->df->Civs[0].Units.size())) - 1;

        civ.Units[headhunterID].GarrisonCapacity = 1;
        civ.Units[headhunterEliteID].GarrisonCapacity = 2;
        civ.Units[headhunterKidnapper].GarrisonCapacity = 1;
        civ.Units[headhunterKidnapperElite].GarrisonCapacity = 2;

        civ.Units[headhunterID].Bird.TaskSwapGroup = 3;
        civ.Units[headhunterKidnapper].Bird.TaskSwapGroup = 3;
        civ.Units[headhunterEliteID].Bird.TaskSwapGroup = 4;
        civ.Units[headhunterKidnapperElite].Bird.TaskSwapGroup = 4;

        civ.Units[headhunterKidnapper].Bird.TaskList.erase(civ.Units[headhunterKidnapper].Bird.TaskList.begin());
        civ.Units[headhunterKidnapperElite].Bird.TaskList.erase(civ.Units[headhunterKidnapperElite].Bird.TaskList.begin());
        civ.Units[headhunterKidnapper].Bird.TaskList.push_back(kidnapTask);
        civ.Units[headhunterKidnapperElite].Bird.TaskList.push_back(kidnapTask);
    }
}

void Civbuilder::createUniqueTechs() {
    // Deconstruction
    Effect e = Effect();
    e.Name = "Deconstruction";
    e.EffectCommands.push_back(createEC(5, -1, 13, 10, 0.75));
    e.EffectCommands.push_back(createEC(5, -1, 55, 10, 0.75));
    e.EffectCommands.push_back(createEC(5, -1, 54, 10, 0.75));
    createUT(39, 0, e, "Deconstruction", {0, 500, 0, 500}, 60, 7500);

    // Obsidian Arrows
    e.EffectCommands.clear();
    e.Name = "Obsidian Arrows";
    //e.EffectCommands.push_back(createEC(4, -1, 0, 9, amountTypetoD(6, 21))); // this does it for all archer lines including skirmishers
    // just set foot archers
    for (int i = 0; i < this->unitClasses["archerLine"].size(); i++) {
        e.EffectCommands.push_back(createEC(4, this->unitClasses["archerLine"][i], -1, 9, amountTypetoD(6, 21)));
    }
    createUT(40, 0, e, "Obsidian Arrows", {300, 0, 0, 300}, 40, 7501);

    // Tortoise Engineers
    e.EffectCommands.clear();
    e.Name = "Tortoise Engineers";
    for (int i = 0; i < this->unitClasses["ram"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["ram"][i], -1, 101, 0.5));
    }
    createUT(41, 0, e, "Tortoise Engineers", {0, 100, 0, 200}, 30, 7502);

    // Panoply
    e.EffectCommands.clear();
    e.Name = "Panoply";
    e.EffectCommands.push_back(createEC(4, -1, 6, 8, amountTypetoD(1, 3)));
    e.EffectCommands.push_back(createEC(4, -1, 6, 8, amountTypetoD(1, 4)));
    e.EffectCommands.push_back(createEC(4, -1, 6, 9, amountTypetoD(1, 4)));
    createUT(42, 0, e, "Panoply", {300, 0, 0, 200}, 50, 7507);

    // Clout Archery
    e.EffectCommands.clear();
    e.Name = "Clout Archery";
    e.EffectCommands.push_back(createEC(5, 87, -1, 13, 1.5));
    e.EffectCommands.push_back(createEC(5, 10, -1, 13, 1.5));
    e.EffectCommands.push_back(createEC(5, 14, -1, 13, 1.5));
    createUT(43, 0, e, "Clout Archery", {0, 150, 0, 250}, 40, 7508);

    // Lamellar Armour
    e.EffectCommands.clear();
    e.Name = "Lamellar Armour";
    e.EffectCommands.push_back(createEC(4, -1, 36, 8, amountTypetoD(2, 4)));
    e.EffectCommands.push_back(createEC(4, -1, 36, 8, amountTypetoD(1, 3)));
    for (int i = 0; i < this->unitClasses["camel"].size(); i++) {
        e.EffectCommands.push_back(createEC(4, this->unitClasses["camel"][i], -1, 8, amountTypetoD(2, 4)));
        e.EffectCommands.push_back(createEC(4, this->unitClasses["camel"][i], -1, 8, amountTypetoD(1, 3)));
    }
    createUT(39, 1, e, "Lamellar Armour", {0, 500, 0, 500}, 40, 7503);

    // Field Repairmen
    e.EffectCommands.clear();
    e.Name = "Field Repairmen";
    for (int i = 0; i < this->unitClasses["ram"].size(); i++) {
        e.EffectCommands.push_back(createEC(4, this->unitClasses["ram"][i], -1, 109, 20));
    }
    createUT(40, 1, e, "Field Repairmen", {0, 350, 0, 650}, 80, 7504);

    // Golden Age
    e.EffectCommands.clear();
    e.Name = "Golden Age";
    e.EffectCommands.push_back(createEC(5, -1, 3, 13, 1.1));
    createUT(41, 1, e, "Golden Age", {0, 0, 300, 600}, 90, 7505);

    // Villager's Revenge
    e.EffectCommands.clear();
    e.Name = "Villager's Revenge";
    // Create villager spear units
    for (Civ &civ : this->df->Civs) {
        civ.Units.push_back(civ.Units[93]);
        civ.UnitPointers.push_back(1);
        this->vilspear = (int)(civ.Units.size() - 1);

        civ.Units.push_back(civ.Units[358]);
        civ.UnitPointers.push_back(1);
        this->vilpike = (int)(civ.Units.size() - 1);

        civ.Units.push_back(civ.Units[359]);
        civ.UnitPointers.push_back(1);
        this->vilhalb = (int)(civ.Units.size() - 1);

        civ.Units[this->vilspear].Name = "VILPKEMN";
        civ.Units[this->vilpike].Name = "VILPKM";
        civ.Units[this->vilhalb].Name = "VILHLBDM";
    }
    // e.EffectCommands.push_back(createEC(0, -1, 4, 57, vilspear));
    e.EffectCommands.push_back(createEC(0, -1, 4, 66, vilspear));
    createUT(42, 1, e, "Villager's Revenge", {500, 0, 0, 250}, 40, 7506);
    this->duplicationUnits.push_back({93, this->vilspear, this->vilpike});
    this->duplicationUnits.push_back({358, this->vilpike, this->vilhalb});
    this->duplicationUnits.push_back({359, this->vilhalb, -1});
    this->df->Effects[189].EffectCommands.push_back(createEC(3, this->vilspear, this->vilhalb, -1, 0));

    // Gate Crashing
    e.EffectCommands.clear();
    e.Name = "Gate Crashing";
    for (int i = 0; i < this->unitClasses["ram"].size(); i++) {
        e.EffectCommands.push_back(createEC(0, this->unitClasses["ram"][i], -1, 105, 0));
        e.EffectCommands.push_back(createEC(4, this->unitClasses["ram"][i], -1, 104, 75));
    }
    createUT(43, 1, e, "Gate Crashing", {0, 600, 0, 700}, 60, 7509);

    // Replaceable Parts
    e.EffectCommands.clear();
    e.Name = "Replaceable Parts";
    for (int i = 0; i < siegeClasses.size(); i++) {
        e.EffectCommands.push_back(createEC(4, -1, siegeClasses[i], 8, amountTypetoD(1, 3)));
        e.EffectCommands.push_back(createEC(4, -1, siegeClasses[i], 8, amountTypetoD(1, 4)));
    }
    e.EffectCommands.push_back(createEC(6, 270, -1, -1, 0));
    createUT(53, 0, e, "Replaceable Parts", {0, 400, 0, 250}, 35, 7510);

    // Pila
    e.EffectCommands.clear();
    e.Name = "Pila";
    for (int i = 0; i < this->unitClasses["skirmisher"].size(); i++) {
        e.EffectCommands.push_back(createEC(4, this->unitClasses["skirmisher"][i], -1, 63, 4));
    }
    createUT(50, 1, e, "Pila", {700, 0, 0, 600}, 75, 7511);

    // Enlistment
    e.EffectCommands.clear();
    e.Name = "Enlistment";
    e.EffectCommands.push_back(createEC(0, -1, 6, 110, -0.85));
    e.EffectCommands.push_back(createEC(0, 1123, -1, 110, -0.425));
    e.EffectCommands.push_back(createEC(0, 1125, -1, 110, -0.425));
    createUT(51, 1, e, "Enlistment", {700, 0, 0, 300}, 55, 7512);

    // Marshalled Hunters
    e.EffectCommands.clear();
    e.Name = "Marshalled Hunters";
    e.EffectCommands.push_back(createEC(0, -1, 0, 110, -0.85));
    createUT(52, 1, e, "Marshalled Hunters", {750, 0, 0, 250}, 50, 7513);

    // Shigeto Yumi
    e.EffectCommands.clear();
    e.Name = "Shigeto Yumi";
    e.EffectCommands.push_back(createEC(5, -1, 52, 10, 0.869565));
    e.EffectCommands.push_back(createEC(5, -1, 36, 10, 0.869565));
    e.EffectCommands.push_back(createEC(4, -1, 52, 9, amountTypetoD(2, 19)));
    e.EffectCommands.push_back(createEC(4, -1, 36, 9, amountTypetoD(2, 19)));
    for (int i = 0; i < this->unitClasses["unique"].size(); i++) {
        if (this->df->Civs[0].Units[this->unitClasses["unique"][i]].Class != 36) {
            e.EffectCommands.push_back(createEC(5, this->unitClasses["unique"][i], -1, 10, 0.869565));
            e.EffectCommands.push_back(createEC(4, this->unitClasses["unique"][i], -1, 9, amountTypetoD(6, 19)));
        }
    }
    createUT(53, 1, e, "Shigeto Yumi", {750, 0, 0, 350}, 75, 7514);
}

void Civbuilder::createCivBonuses() {
    Effect e = Effect();

    // Imperial Scorpion
    e.EffectCommands.clear();
    e.Name = "Imperial Scorpion";
    e.EffectCommands.push_back(createEC(3, 279, UNIT_IMP_SCORPION, -1, 0));
    e.EffectCommands.push_back(createEC(3, 542, UNIT_IMP_SCORPION, -1, 0));
    this->df->Effects.push_back(e);

    Tech t = Tech();
    t.Name = "Imperial Scorpion";
    t.LanguageDLLName = 7600;
    t.LanguageDLLDescription = 8600;
    t.LanguageDLLHelp = 28600;
    t.LanguageDLLTechTree = 17600;
    t.RequiredTechs.push_back(239);
    t.RequiredTechCount = 1;
    t.ResourceCosts[0].Type = 0;
    t.ResourceCosts[0].Amount = 1200;
    t.ResourceCosts[0].Flag = 1;
    t.ResourceCosts[1].Type = 1;
    t.ResourceCosts[1].Amount = 1000;
    t.ResourceCosts[1].Flag = 1;
    setResearchLocation(t, 49, 150, 8);
    t.IconID = 38;
    t.Civ = 99;
    t.EffectID = (this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);
    this->civBonuses[CIV_BONUS_308_CAN_UPGRADE_HEAVY_SCORPIONS_TO_IMPERIAL_SCORPIONS] = {(int)(this->df->Techs.size() - 1)};

    // Royal Battle Elephant
    e.EffectCommands.clear();
    e.Name = "Royal Battle Elephant";
    e.EffectCommands.push_back(createEC(3, 1132, UNIT_ROYAL_ELEPHANT, -1, 0));
    e.EffectCommands.push_back(createEC(3, 1134, UNIT_ROYAL_ELEPHANT, -1, 0));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Royal Battle Elephant";
    t.LanguageDLLName = 7601;
    t.LanguageDLLDescription = 8601;
    t.LanguageDLLHelp = 28601;
    t.LanguageDLLTechTree = 7601; // TODO does not exist?
    t.RequiredTechCount = 1;
    t.RequiredTechs.push_back(631);
    t.ResourceCosts[0].Type = 0;
    t.ResourceCosts[0].Amount = 1200;
    t.ResourceCosts[0].Flag = 1;
    t.ResourceCosts[1].Type = 3;
    t.ResourceCosts[1].Amount = 1000;
    t.ResourceCosts[1].Flag = 1;
    t.Civ = 99;
    t.IconID = 121;
    setResearchLocation(t, 101, 200, 9);
    t.EffectID = (this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);
    this->civBonuses[CIV_BONUS_309_CAN_UPGRADE_ELITE_BATTLE_ELEPHANTS_TO_ROYAL] = {(int)(this->df->Techs.size() - 1)};
    int royalElephantTech = (int)(this->df->Techs.size() - 1);

    // Royal Lancer
    e.EffectCommands.clear();
    e.Name = "Royal Lancer";
    e.EffectCommands.push_back(createEC(3, 1370, UNIT_ROYAL_LANCER, -1, 0));
    e.EffectCommands.push_back(createEC(3, 1372, UNIT_ROYAL_LANCER, -1, 0));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Royal Lancer";
    t.LanguageDLLName = 7602;
    t.LanguageDLLDescription = 8602;
    t.LanguageDLLHelp = 28602;
    t.LanguageDLLTechTree = 7602;
    t.RequiredTechs.push_back(715);
    t.RequiredTechCount = 1;
    t.ResourceCosts[0].Type = 0;
    t.ResourceCosts[0].Amount = 1200;
    t.ResourceCosts[0].Flag = 1;
    t.ResourceCosts[1].Type = 3;
    t.ResourceCosts[1].Amount = 900;
    t.ResourceCosts[1].Flag = 1;
    setResearchLocation(t, 101, 100, 9);
    t.IconID = 123;
    t.Civ = 99;
    t.EffectID = (this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);
    this->civBonuses[CIV_BONUS_310_CAN_UPGRADE_ELITE_STEPPE_LANCERS_TO_ROYAL_LANCERS] = {(int)(this->df->Techs.size() - 1)};
    int royalLancerTech = (int)(this->df->Techs.size() - 1);

    // Create civ bonuses that are just a list of free techs
    const vector<vector<int>> freeTechs = {
        {TECH_CROP_ROTATION, TECH_HEAVY_PLOW, TECH_HORSE_COLLAR, TECH_TRANSHUMANCE, TECH_PASTORALISM, TECH_DOMESTICATION}, // Pasture & Farm upgrades free (require Mill)
        {TECH_FORGING, TECH_IRON_CASTING, TECH_BLAST_FURNACE},
        {TECH_ARSON, TECH_GAMBESONS},
        {TECH_TOWN_WATCH, TECH_TOWN_PATROL},
        {TECH_MURDER_HOLES, TECH_HERBAL_MEDICINE},
        {TECH_CHEMISTRY},
        {TECH_LIGHT_CAVALRY, TECH_HUSSAR, TECH_WINGED_HUSSAR},
        {TECH_WHEELBARROW, TECH_HAND_CART},
        {TECH_GUARD_TOWER, TECH_KEEP, TECH_BOMBARD_TOWER},
        {TECH_CONSCRIPTION}
    };
    for (int i = 0; i < freeTechs.size(); i++) {
        e.EffectCommands.clear();
        for (int j = 0; j < freeTechs[i].size(); j++) {
            for (int k = 0; k < 4; k++) {
                e.EffectCommands.push_back(createEC(101, freeTechs[i][j], k, 0, 0));
            }
            if (i == 7) {
                // Exception for wheelbarrow/hand cart for compatibility with other civ bonuses
                e.EffectCommands.push_back(createEC(103, freeTechs[i][j], -1, 0, 1));
            } else {
                e.EffectCommands.push_back(createEC(103, freeTechs[i][j], -1, 0, 0));
            }
        }
        this->createCivBonus(110 + i, e, "C-Bonus, Free techs (set 1)" + to_string(i));
    }

    // Farmers work 15% faster
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(5, 214, -1, 13, 1.23));
    e.EffectCommands.push_back(createEC(5, 259, -1, 13, 1.23));
    e.EffectCommands.push_back(createEC(5, 50, -1, 13, 1.15));
    e.EffectCommands.push_back(createEC(5, 1187, -1, 13, 1.15));
    this->createCivBonus(CIV_BONUS_120_FARMERS_WORK_15_FASTER, e, "C-Bonus, farmers work 15% faster");

    //-15% age up cost
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(101, 101, 0, 1, -75));
    e.EffectCommands.push_back(createEC(101, 102, 0, 1, -120));
    e.EffectCommands.push_back(createEC(101, 102, 3, 1, -30));
    e.EffectCommands.push_back(createEC(101, 103, 0, 1, -150));
    e.EffectCommands.push_back(createEC(101, 103, 3, 1, -120));
    this->createCivBonus(CIV_BONUS_121_15_AGE_UP_COST, e, "C-Bonus, -15% age up cost");

    //-15% fishing ship cost
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(5, 13, -1, 104, 0.85));
    this->createCivBonus(CIV_BONUS_122_15_FISHING_SHIP_COST, e, "C-Bonus, -15% fishing ship cost");

    // Dock and university techs cost -33%
    e.EffectCommands.clear();
    this->createCivBonus(CIV_BONUS_123_DOCK_UNIVERSITY_TECHS_COST_33, e, "C-Bonus, Dock and university techs cost -33%");

    // Advancing to Imp cost -33%
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(101, 103, 0, 1, -333));
    e.EffectCommands.push_back(createEC(101, 103, 3, 1, -264));
    this->createCivBonus(CIV_BONUS_124_IMPERIAL_COST_33, e, "C-Bonus, Imperial cost -33%");

    // Blacksmith upgrades don't cost gold
    e.EffectCommands.clear();
    for (int i = 0; i < this->df->Techs.size(); i++) {
        if (getResearchLocation(this->df->Techs[i]) == 103) {
            e.EffectCommands.push_back(createEC(101, i, 3, 0, 0));
        }
    }
    this->createCivBonus(CIV_BONUS_125_BLACKSMITH_UPGRADES_COST_NO_GOLD, e, "C-Bonus, Blacksmith upgrades cost no gold");

    // Gunpowder units fire faster
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["gunpowder"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["gunpowder"][i], -1, 10, 0.85));
    }
    this->createCivBonus(CIV_BONUS_126_GUNPOWDER_FIRE_18_FASTER, e, "C-Bonus, Gunpowder fire 18% faster");

    // Builders work 30% faster
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(1, 195, 0, -1, 1.3));
    this->createCivBonus(CIV_BONUS_127_BUILDERS_30_FASTER, e, "C-Bonus, Builders 30% faster");

    // Military units created 11% faster
    e.EffectCommands.clear();
    for (int i = 0; i < militaryClasses.size(); i++) {
        e.EffectCommands.push_back(createEC(5, -1, militaryClasses[i], 101, 0.9));
    }
    this->createCivBonus(CIV_BONUS_128_MILITARY_UNITS_CREATED_11_FASTER, e, "C-Bonus, Military units created 11% faster");

    // Villagers carry +3
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, -1, 4, 14, 3));
    this->createCivBonus(CIV_BONUS_129_VILLAGERS_CARRY_3, e, "C-Bonus, Villagers carry +3");

    // Trebuchets +35% accuracy
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["trebuchet"].size(); i++) {
        e.EffectCommands.push_back(createEC(4, this->unitClasses["trebuchet"][i], -1, 11, 35));
    }
    this->createCivBonus(CIV_BONUS_130_TREBUCHETS_35_ACCURACY, e, "C-Bonus, Trebuchets +35% accuracy");

    // No houses, -100 wood
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(1, 4, 1, -1, 2000));
    e.EffectCommands.push_back(createEC(2, 70, 0, -1, 0));
    e.EffectCommands.push_back(createEC(1, 92, 1, -1, -100));
    this->createCivBonus(CIV_BONUS_131_NO_HOUSES_100_WOOD, e, "C-Bonus, No houses, -100 wood");

    // Resources last 15% longer
    e.EffectCommands.clear();
    for (int i = 0; i < productivityRates.size(); i++) {
        e.EffectCommands.push_back(createEC(6, productivityRates[i], -1, -1, 1.15));
    }
    for (int i = 0; i < gatherRates.size(); i++) {
        e.EffectCommands.push_back(createEC(5, gatherRates[i], -1, 13, 0.87));
    }
    this->createCivBonus(CIV_BONUS_132_RESOURCES_LAST_15_LONGER, e, "C-Bonus, Resources last 15% longer");

    // Archers cost -10% Feudal, -20% Castle, -30% Imperial Age
    e.EffectCommands.clear();
    this->df->Effects[485].EffectCommands.clear();
    this->df->Effects[486].EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["footArcher"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["footArcher"][i], -1, 100, 0.9));
        this->df->Effects[485].EffectCommands.push_back(createEC(5, this->unitClasses["footArcher"][i], -1, 100, 0.889));
        this->df->Effects[486].EffectCommands.push_back(createEC(5, this->unitClasses["footArcher"][i], -1, 100, 0.875));
    }
    e.Name = "C-Bonus, Archers cost -10%";
    this->df->Effects.push_back(e);
    t = Tech();
    t.Name = "C-Bonus, Archers cost -10%";
    t.Civ = 99;
    t.EffectID = (this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);
    this->civBonuses[CIV_BONUS_133_FOOT_ARCHERS_AND_SKIRMISHERS_COST_10_FEUDAL] = {(int)(this->df->Techs.size() - 1), 53, 56};

    // Lumberjack food trickle
    this->civBonuses[CIV_BONUS_134_LUMBERJACKS_GENERATE_FOOD_IN_ADDITION_TO_WOOD] = {1071};

    // Fast stoners
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(5, 220, -1, 13, 1.2));
    e.EffectCommands.push_back(createEC(5, 124, -1, 13, 1.2));
    this->createCivBonus(CIV_BONUS_135_STONE_MINERS_WORK_20_FASTER, e, "C-Bonus, Stone Miners 20% faster");

    // No wood eco upgrades
    e.EffectCommands.clear();
    for (int i = 0; i < ecoUpgrades.size(); i++) {
        e.EffectCommands.push_back(createEC(101, ecoUpgrades[i], 1, 0, 0));
        e.EffectCommands.push_back(createEC(103, ecoUpgrades[i], -1, 2, 0.5));
    }
    this->createCivBonus(CIV_BONUS_136_ECO_UPGRADES_NO_WOOD_FASTER, e, "C-Bonus, Eco upgrades no wood and faster");

    //-50% food for blacksmith and siege techs
    e.EffectCommands.clear();
    this->createCivBonus(CIV_BONUS_137_50_FOOD_BLACKSMITHSIEGE_TECHS, e, "C-Bonus, -50% food blacksmith+siege techs");

    //-50% cost for stable techs
    e.EffectCommands.clear();
    this->createCivBonus(CIV_BONUS_138_50_COST_STABLE_TECHS, e, "C-Bonus, -50% cost stable techs");

    // Spawn sheep from TCs
    this->civBonuses[CIV_BONUS_139_NEW_TOWN_CENTERS_SPAWN_2_SHEEP_STARTING] = {299, 303, 305, 310};

    // Wonders provide +50 bonus pop space
    this->civBonuses[CIV_BONUS_140_WONDERS_DON_T_COST_WOOD_AND_PROVIDE] = {};

    //+3 HP on villagers per economic tech
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, -1, 4, 0, 3));
    for (int i = 0; i < ecoUpgrades.size(); i++) {
        this->createCivBonus(CIV_BONUS_141_VILLAGERS_3_HP_ECO_TECH, e, "Villagers +3 HP for eco tech " + to_string(ecoUpgrades[i]), {ecoUpgrades[i]});
    }

    // Villagers regenerate slowly
    this->civBonuses[CIV_BONUS_142_VILLAGERS_REGENERATE_10_HP_MIN_IN_FEUDAL] = {792, 809, 810, 811};

    // Military buildings build 100% faster
    e.EffectCommands.clear();
    for (int i = 0; i < militaryBuildings.size(); i++) {
        e.EffectCommands.push_back(createEC(5, militaryBuildings[i], -1, 101, 0.5));
    }
    this->createCivBonus(CIV_BONUS_143_MILITARY_BUILDINGS_BUILT_100_FASTER, e, "C-Bonus, Military buildings built 100% faster");

    // Resource drop-off buildings provide +5 population
    e.EffectCommands.clear();
    for (int i = 0; i < ecoBuildings.size(); i++) {
        e.EffectCommands.push_back(createEC(0, ecoBuildings[i], -1, 21, 5));
    }
    this->createCivBonus(CIV_BONUS_144_DROP_SITE_BUILDINGS_PROVIDE_5_POPULATION, e, "C-Bonus, Drop site buildings provide +5 population");

    // Ballistics researched instantly
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(103, 93, -1, 0, 1));
    e.EffectCommands.push_back(createEC(101, 93, 1, 0, 0));
    this->createCivBonus(CIV_BONUS_145_BALLISTICS_RESEARCHED_INSTANTLY, e, "C-Bonus, Ballistics researched instantly");

    // Dragon Ships
    e.EffectCommands.clear();
    e.Name = "Disable Fast Fire";
    e.EffectCommands.push_back(createEC(102, -1, -1, -1, 256));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Disable Fast Fire";
    t.EffectID = (int)(this->df->Effects.size() - 1);
    t.Civ = 99;
    this->df->Techs.push_back(t);

    int dragonShipTech = (int)(this->df->Techs.size() - 1);

    this->civBonuses[CIV_BONUS_362_BONUS_362] = {dragonShipTech, 1010};

    // More free techs
    const vector<vector<int>> freeTechs2 = {
        {TECH_CROSSBOW, TECH_ARBALEST}, 
        {TECH_ELITE_SKIRMISHER, TECH_IMPERIAL_SKIRMISHER, TECH_ELITE_GENITOUR_1}, 
        {TECH_HEAVY_CAMEL, TECH_HEAVY_CAMEL_1}, 
        {TECH_SCALE_MAIL_ARMOR, TECH_CHAIN_MAIL_ARMOR, TECH_PLATE_MAIL_ARMOR}, 
        {TECH_PLATE_BARDING_ARMOR, TECH_SCALE_BARDING_ARMOR, TECH_CHAIN_BARDING_ARMOR},
        {TECH_FLETCHING, TECH_BODKIN_ARROW, TECH_BRACER},
        {TECH_REDEMPTION},
        {TECH_SQUIRES}, 
        {TECH_HEAVY_EAGLE_WARRIOR, TECH_ELITE_EAGLE_WARRIOR}, 
        {TECH_ELITE_BATTLE_ELEPHANT, royalElephantTech},
        {TECH_SANCTITY, TECH_FERVOR}, 
        {TECH_ATONEMENT, TECH_ILLUMINATION},
        {TECH_THEOCRACY, TECH_BLOCK_PRINTING}, 
        {TECH_HOARDINGS, TECH_FORTIFIED_WALL},
        {TECH_MASONRY, TECH_ARCHITECTURE},
        {TECH_GOLD_MINING, TECH_GOLD_SHAFT_MINING, TECH_STONE_MINING, TECH_STONE_SHAFT_MINING}, 
        {TECH_SAPPERS, TECH_TREADMILL_CRANE}, 
        {TECH_GALLEON},
        {TECH_CAREENING, TECH_DRY_DOCK}, 
        {TECH_FAST_FIRE_SHIP, dragonShipTech},
        {TECH_HEAVY_DEMOLITION},
        {TECH_GILLNETS},
        {TECH_WAR_GALLEY},
        {TECH_HEAVY_CAVALRY_ARCHER},
        {TECH_CAPPED_RAM, TECH_SIEGE_RAM, TECH_ELITE_ARMORED_ELEPHANT}
    };
    for (int i = 0; i < freeTechs2.size(); i++) {
        e.EffectCommands.clear();
        for (int j = 0; j < freeTechs2[i].size(); j++) {
            for (int k = 0; k < 4; k++) {
                e.EffectCommands.push_back(createEC(101, freeTechs2[i][j], k, 0, 0));
            }
            if ((i == 1) && (j == 1)) {
                // Imp Skirm takes 1 second to research
                e.EffectCommands.push_back(createEC(103, freeTechs2[i][j], -1, 0, 1));
            } else {
                e.EffectCommands.push_back(createEC(103, freeTechs2[i][j], -1, 0, 0));
            }
        }
        if (i == 8) {
            // Eagle line upgrade disables auto upgrade
            e.EffectCommands.push_back(createEC(102, -1, -1, -1, 387));
        }
        this->createCivBonus(146 + i, e, "C-Bonus, Free techs (set 2) " + to_string(i));
    }

    // Trade units 20% faster
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(5, -1, 2, 5, 1.2));
    e.EffectCommands.push_back(createEC(5, -1, 2, 13, 1.2));
    e.EffectCommands.push_back(createEC(5, -1, 19, 5, 1.2));
    e.EffectCommands.push_back(createEC(5, -1, 19, 13, 1.2));
    this->createCivBonus(CIV_BONUS_171_TRADE_20_FASTER, e, "C-Bonus, Trade 20% faster");

    // Squires affects foot archers and skirmishers
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["footArcher"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["footArcher"][i], -1, 5, 1.1));
    }
    for (int i = 0; i < this->unitClasses["skirmisher"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["skirmisher"][i], -1, 5, 1.1));
    }
    this->createCivBonus(CIV_BONUS_172_SQUIRES_AFFECTS_ARCHERS, e, "C-Bonus, Squires affects archers", {215});

    // Shock Infantry 5/10/15% speed
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["shock"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["shock"][i], -1, 5, 1.05));
    }
    this->createCivBonus(CIV_BONUS_173_SHOCK_INFANTRY_SPEED_BONUS, e, "C-Bonus, Shock Infantry +5% speed", {101});
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["shock"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["shock"][i], -1, 5, 1.0476));
    }
    this->createCivBonus(CIV_BONUS_173_SHOCK_INFANTRY_SPEED_BONUS, e, "C-Bonus, Shock Infantry +10% speed", {102});
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["shock"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["shock"][i], -1, 5, 1.0455));
    }
    this->createCivBonus(CIV_BONUS_173_SHOCK_INFANTRY_SPEED_BONUS, e, "C-Bonus, Shock Infantry +15% speed", {103});

    // Start with +150 wood
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(1, 1, 1, -1, 150));
    e.EffectCommands.push_back(createEC(1, 92, 1, -1, 150));
    this->createCivBonus(CIV_BONUS_174_150_WOOD, e, "C-Bonus, +150 wood", {639, 307});

    // Start with +100 stone
    this->civBonuses[CIV_BONUS_175_START_WITH_100_STONE] = {228};

    // Start with +50 wood, +50 stone
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(1, 1, 1, -1, 50));
    e.EffectCommands.push_back(createEC(1, 2, 1, -1, 50));
    e.EffectCommands.push_back(createEC(1, 92, 1, -1, 50));
    e.EffectCommands.push_back(createEC(1, 93, 1, -1, 50));
    this->createCivBonus(CIV_BONUS_176_50_WOOD_50_STONE, e, "C-Bonus, +50 wood, +50 stone", {639, 307});

    // Start with +30 gold, +70 food
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(1, 0, 1, -1, 70));
    e.EffectCommands.push_back(createEC(1, 3, 1, -1, 30));
    e.EffectCommands.push_back(createEC(1, 91, 1, -1, 70));
    e.EffectCommands.push_back(createEC(1, 94, 1, -1, 30));
    this->createCivBonus(CIV_BONUS_177_70_FOOD_30_GOLD, e, "C-Bonus, +70 food, +30 gold", {639, 307});

    // Monk units train 66% faster
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(5, -1, 18, 101, 0.6));
    e.EffectCommands.push_back(createEC(5, 1811, -1, 101, 0.6));
    this->createCivBonus(CIV_BONUS_178_MONKS_TRAIN_66_FASTER, e, "C-Bonus, Monks train 66% faster");

    // Trebuchets train 50% faster
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["trebuchet"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["trebuchet"][i], -1, 101, 0.66));
    }
    this->createCivBonus(CIV_BONUS_179_TREBUCHETS_TRAIN_50_FASTER, e, "C-Bonus, Trebuchets train 50% faster");

    // Cavalry archers train 33% faster
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(5, -1, 36, 101, 0.8));
    this->createCivBonus(CIV_BONUS_180_CAV_ARCHERS_TRAIN_33_FASTER, e, "C-Bonus, Cav archers train 33% faster");

    // Land explosive units train 200% faster
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(5, -1, 35, 101, 0.33));
    this->createCivBonus(CIV_BONUS_181_PETARDS_TRAIN_200_FASTER, e, "C-Bonus, Petards train 200% faster");

    // Land explosive units +8 pierce armor
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, -1, 35, 8, amountTypetoD(8, 3)));
    this->createCivBonus(CIV_BONUS_182_PETARDS_8_PIERCE_ARMOR, e, "C-Bonus, Petards +8 pierce armor");

    // Bloodlines free in Castle Age
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(101, 435, 0, 0, 0));
    e.EffectCommands.push_back(createEC(101, 435, 3, 0, 0));
    e.EffectCommands.push_back(createEC(103, 435, -1, 0, 0));
    this->createCivBonus(CIV_BONUS_183_FREE_TECH_BONUS, e, "C-Bonus, Bloodlines free in Castle Age", {102});

    // Galleys +1 range
    e.EffectCommands.clear();
    for (int i = 0; i < galleys.size(); i++) {
        e.EffectCommands.push_back(createEC(4, galleys[i], -1, 12, 1));
        e.EffectCommands.push_back(createEC(4, galleys[i], -1, 1, 1));
        e.EffectCommands.push_back(createEC(4, galleys[i], -1, 23, 1));
    }
    this->createCivBonus(CIV_BONUS_184_GALLEYS_1_RANGE, e, "C-Bonus, Galleys +1 range");

    //+100 wood, +100 stone every age up
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(1, 1, 1, -1, 100));
    e.EffectCommands.push_back(createEC(1, 2, 1, -1, 100));
    for (int i = 0; i < 3; i++) {
        this->createCivBonus(CIV_BONUS_185_RESOURCE_BONUS, e, "C-Bonus, +100 wood, +100 stone in age " + to_string(i), {i + 101});
    }

    //+400 food upon reaching Castle Age
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(1, 0, 1, -1, 400));
    this->createCivBonus(CIV_BONUS_186_UNIT_BONUS, e, "C-Bonus, +400 food in Castle Age", {102});

    //+350 stone upon reaching Castle Age
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(1, 2, 1, -1, 350));
    this->createCivBonus(CIV_BONUS_187_FREE_TECH_BONUS, e, "C-Bonus, +350 stone in Castle Age", {102});

    //+250 wood upon reaching Feudal Age
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(1, 1, 1, -1, 250));
    this->createCivBonus(CIV_BONUS_188_BUILDING_BONUS, e, "C-Bonus, +250 wood in Feudal Age", {101});

    //+500 gold upon reaching Imperial Age
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(1, 3, 1, -1, 500));
    this->createCivBonus(CIV_BONUS_189_ECONOMIC_BONUS, e, "C-Bonus, +500 gold in Imperial Age", {103});

    //+100 HP, 100 pierce armor for monks with relics
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, -1, 43, 0, 100));
    e.EffectCommands.push_back(createEC(4, -1, 43, 8, amountTypetoD(100, 3)));
    this->createCivBonus(CIV_BONUS_190_MONKS_RELICS_TANK, e, "C-Bonus, Monks with relics tank");

    // Land explosive units 2x HP
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(5, -1, 35, 0, 2));
    this->createCivBonus(CIV_BONUS_191_EXPLOSIVE_UNITS_2X_HP, e, "C-Bonus, Explosive units 2x HP");

    // Town Center spawns a married couple every age
    this->civBonuses[CIV_BONUS_192_TOWN_CENTERS_SPAWN_2_VILLAGERS_WHEN_THE] = {847, 848, 849};

    // Can recruit warrior priests
    this->civBonuses[CIV_BONUS_193_CAN_RECRUIT_WARRIOR_PRIESTS] = {948};

    // Castles and Kreposts +2000 HP
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, 82, -1, 0, 2000));
    e.EffectCommands.push_back(createEC(4, 1251, -1, 0, 2000));
    this->createCivBonus(CIV_BONUS_194_CASTLES_KREPOSTS_2000_HP, e, "C-Bonus, Castles and Kreposts +2000 HP");

    // Blacksmith upgrades are free an age after they become available
    const vector<int> blacksmith_2_3 = {199, 200, 211, 212, 67, 68, 81, 82, 74, 76};
    for (int i = 0; i < this->df->Techs.size(); i++) {
        if (getResearchLocation(this->df->Techs[i]) == 103) {
            int ageRequirement = -1;
            for (int j = 0; j < this->df->Techs[i].getRequiredTechsSize(); j++) {
                if (this->df->Techs[i].RequiredTechs[j] == 101 || this->df->Techs[i].RequiredTechs[j] == 102) {
                    ageRequirement = this->df->Techs[i].RequiredTechs[j];
                }
            }
            if (ageRequirement != -1) {
                e.EffectCommands.clear();
                for (int j = 0; j < 4; j++) {
                    e.EffectCommands.push_back(createEC(101, i, j, 0, 0));
                }
                e.EffectCommands.push_back(createEC(103, i, -1, 0, 0));
                this->createCivBonus(CIV_BONUS_195_RESOURCE_BONUS, e, "C-Bonus, Blacksmith upgrade " + to_string(i) + " free in " + to_string(ageRequirement), {ageRequirement + 1});
            }
        }
    }

    // Barracks -75 wood
    e.EffectCommands.clear();
    for (int i = 0; i < barracks.size(); i++) {
        e.EffectCommands.push_back(createEC(4, barracks[i], -1, 104, -75));
    }
    this->createCivBonus(CIV_BONUS_196_BARRACKS_75_WOOD, e, "C-Bonus, Barracks -75 wood");

    // Stable -75 wood
    e.EffectCommands.clear();
    const vector<int> stables = {86, 101, 153};
    for (int i = 0; i < stables.size(); i++) {
        e.EffectCommands.push_back(createEC(4, stables[i], -1, 104, -75));
    }
    this->createCivBonus(CIV_BONUS_197_STABLES_75_WOOD, e, "C-Bonus, Stables -75 wood");

    // Archery Range -75 wood
    e.EffectCommands.clear();
    for (int i = 0; i < stables.size(); i++) {
        e.EffectCommands.push_back(createEC(4, ranges[i], -1, 104, -75));
    }
    this->createCivBonus(CIV_BONUS_198_ARRG_75_WOOD, e, "C-Bonus, Arrg -75 wood");

    // Monastery -100 wood
    for (int i = 0; i < monasteries.size(); i++) {
        e.EffectCommands.push_back(createEC(4, monasteries[i], -1, 104, -100));
    }
    this->createCivBonus(CIV_BONUS_199_MONASTERY_100_WOOD, e, "C-Bonus, Monastery -100 wood");

    // Siege Workshops -100 wood
    e.EffectCommands.clear();
    for (int i = 0; i < workshops.size(); i++) {
        e.EffectCommands.push_back(createEC(4, workshops[i], -1, 104, -100));
    }
    this->createCivBonus(CIV_BONUS_200_SIEGE_WORKSHOP_100_WOOD, e, "C-Bonus, Siege workshop -100 wood");

    // Military Buildings -50 wood
    e.EffectCommands.clear();
    for (int i = 0; i < militaryBuildings.size(); i++) {
        e.EffectCommands.push_back(createEC(4, militaryBuildings[i], -1, 104, -50));
    }
    this->createCivBonus(CIV_BONUS_201_MILITARY_BUILDINGS_50_WOOD, e, "C-Bonus, Military buildings -50 wood");

    // Blacksmith, University cost -100 wood
    e.EffectCommands.clear();
    for (int i = 0; i < blacksmiths.size(); i++) {
        e.EffectCommands.push_back(createEC(4, blacksmiths[i], -1, 104, -100));
    }
    for (int i = 0; i < universities.size(); i++) {
        e.EffectCommands.push_back(createEC(4, universities[i], -1, 104, -100));
    }
    this->createCivBonus(CIV_BONUS_202_BLACKSMITH_UNIVERSITY_COST_100_WOOD, e, "C-Bonus, Blacksmith, University cost -100 wood");

    // Infantry +1/2/3/4 attack vs villagers
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, -1, 6, 9, amountTypetoD(1, 10)));
    this->createCivBonus(CIV_BONUS_203_INFANTRY_ATTACK_VS_VILS_AGE, e, "C-Bonus, Infantry +attack vs vils in Age -1");
    for (int i = 0; i < 3; i++) {
        this->createCivBonus(CIV_BONUS_203_INFANTRY_ATTACK_VS_VILS_AGE, e, "C-Bonus, Infantry +attack vs vils in Age " + to_string(101 + i), {101 + i});
    }

    // Fishermen and fishing ships carry +15 food
    this->civBonuses[CIV_BONUS_204_FISHERMEN_AND_FISHING_SHIPS_CARRY_15] = {844};

    // Galleys +1 attack
    e.EffectCommands.clear();
    for (int i = 0; i < galleys.size(); i++) {
        e.EffectCommands.push_back(createEC(4, galleys[i], -1, 9, amountTypetoD(1, 3)));
    }
    this->createCivBonus(CIV_BONUS_205_GALLEYS_1_ATTACK, e, "C-Bonus, Galleys +1 attack");

    // Steppe Lancers +10 attack vs. villagers
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["steppe"].size(); i++) {
        e.EffectCommands.push_back(createEC(4, this->unitClasses["steppe"][i], -1, 9, amountTypetoD(10, 10)));
    }
    this->createCivBonus(CIV_BONUS_206_STEPPE_LANCERS_ATTACK_VS_VILS, e, "C-Bonus, Steppe Lancers +attack vs vils");

    // Steppe lancers attack 33% faster
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["steppe"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["steppe"][i], -1, 10, 0.75));
    }
    this->createCivBonus(CIV_BONUS_207_STEPPE_LANCERS_ATTACK_33, e, "C-Bonus, Steppe Lancers attack +33%");

    // Elephant units attack 25% faster
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["elephant"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["elephant"][i], -1, 10, 0.8));
    }
    this->createCivBonus(CIV_BONUS_208_ELEPHANTS_25_ATTACK, e, "C-Bonus, Elephants +25% attack");

    // Stone walls in dark age
    t = Tech();
    t.Name = "C-Bonus, Stone walls in Dark Age";
    t.Civ = 99;
    df->Techs.push_back(t);
    df->Techs[189].RequiredTechs[1] = (int)(df->Techs.size() - 1);
    this->civBonuses[CIV_BONUS_209_STONE_WALLS_AVAILABLE_IN_DARK_AGE] = {(int)(df->Techs.size() - 1)};

    //+50 every resource per advance
    e.EffectCommands.clear();
    for (int i = 0; i < 4; i++) {
        e.EffectCommands.push_back(createEC(1, i, 1, -1, 50));
    }
    for (int i = 0; i < 3; i++) {
        this->createCivBonus(CIV_BONUS_210_UNIT_BONUS, e, "C-Bonus, +50 each res in age " + to_string(101 + i), {101 + i});
    }

    // Villagers return 25 food upon death
    this->civBonuses[CIV_BONUS_211_VILLAGERS_RETURN_25_FOOD_ON_DEATH] = {};

    // Camel units attack 20% faster
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["camel"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["camel"][i], -1, 10, 0.83333));
    }
    this->createCivBonus(CIV_BONUS_212_CAMELS_20_ATTACK_SPEED, e, "C-Bonus, Camels +20% attack speed");

    // Mangonels can cut trees
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, 280, -1, 9, amountTypetoD(100, 18)));
    this->createCivBonus(CIV_BONUS_213_MANGONELS_CUT_TREES, e, "C-Bonus, Mangonels cut trees");

    // Free siege tower in Feudal Age, cost 50%
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(5, 1105, -1, 100, 0.5));
    e.EffectCommands.push_back(createEC(2, 885, 1, -1, 0));
    this->createCivBonus(CIV_BONUS_214_BUILDING_BONUS, e, "C-Bonus, Free siege tower", {101});

    // Rams, Siege Towers x2 garrison space
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["ram"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["ram"][i], -1, 2, 2));
    }
    e.EffectCommands.push_back(createEC(5, 1105, -1, 2, 2));
    this->createCivBonus(CIV_BONUS_215_RAMS_SIEGE_TOWERS_GARRISON, e, "C-Bonus, Rams, Siege Towers +garrison");

    // Towers support 15 population
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(0, -1, 52, 21, 15));
    this->createCivBonus(CIV_BONUS_216_TOWERS_PROVIDE_15_POPULATION, e, "C-Bonus, Towers provide +15 population");

    // Gunpowder units move 20% faster
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["gunpowder"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["gunpowder"][i], -1, 5, 1.2));
    }
    this->createCivBonus(CIV_BONUS_217_GUNPOWDER_20_SPEED, e, "C-Bonus, Gunpowder +20% speed");

    // Castles refund 350 stone
    this->civBonuses[CIV_BONUS_218_COMPLETED_CASTLES_PROVIDE_400_GOLD_AS_LONG] = {};

    // Monk units 20% faster
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(5, -1, 18, 5, 1.2));
    e.EffectCommands.push_back(createEC(5, -1, 43, 5, 1.2));
    e.EffectCommands.push_back(createEC(5, 1811, -1, 5, 1.2));
    this->createCivBonus(CIV_BONUS_219_MONKS_20_SPEED, e, "C-Bonus, Monks +20% speed");

    // Melee cavalry +2 vs skirmishers
    this->civBonuses[CIV_BONUS_220_MELEE_CAVALRY_GAIN_2_BONUS_DAMAGE_VS_SKIRMISHERS] = {877};

    // Pasture upgrades earlier
    this->df->Techs[1014].RequiredTechs.push_back(758);

    t = Tech();
    t.Name = "Pastoralism requirement";
    t.Civ = 99;
    t.RequiredTechs.push_back(101);
    t.RequiredTechs.push_back(1014);
    t.RequiredTechCount = 2;
    setResearchLocation(t, -1, 0, 0);
    this->df->Techs.push_back(t);
    this->df->Techs[1013].RequiredTechs[2] = (int)(this->df->Techs.size() - 1);
    this->civBonuses[CIV_BONUS_105_ECONOMIC_UPGRADES_COST_33_FOOD_AND_AVAILABLE].push_back((int)(this->df->Techs.size() - 1));

    t = Tech();
    t.Name = "Transhumance requirement";
    t.Civ = 99;
    t.RequiredTechs.push_back(102);
    t.RequiredTechs.push_back(1013);
    t.RequiredTechCount = 2;
    setResearchLocation(t, -1, 0, 0);
    this->df->Techs.push_back(t);
    this->df->Techs[1012].RequiredTechs[2] = (int)(this->df->Techs.size() - 1);
    this->civBonuses[CIV_BONUS_105_ECONOMIC_UPGRADES_COST_33_FOOD_AND_AVAILABLE].push_back((int)(this->df->Techs.size() - 1));

    // Barracks upgrades earlier
    vector<int> techIDs = {950, 951, 952, 953, 954, 955, 956};

    t = Tech();
    t.Name = "C-Bonus, Eagle Warriors in Feudal";
    t.Civ = 99;
    t.RequiredTechs.push_back(101);
    t.RequiredTechs.push_back(433);
    t.RequiredTechCount = 2;
    setResearchLocation(t, -1, 0, 0);
    this->df->Techs.push_back(t);
    this->df->Techs[384].RequiredTechs[2] = (int)(this->df->Techs.size() - 1);
    techIDs.push_back((int)(this->df->Techs.size() - 1));

    t = Tech();
    t.Name = "C-Bonus, Elite Eagles in Castle";
    t.Civ = 99;
    t.RequiredTechs.push_back(102);
    t.RequiredTechs.push_back(384);
    t.RequiredTechCount = 2;
    setResearchLocation(t, -1, 0, 0);
    this->df->Techs.push_back(t);
    this->df->Techs[434].RequiredTechs[2] = (int)(this->df->Techs.size() - 1);
    techIDs.push_back((int)(this->df->Techs.size() - 1));

    this->civBonuses[CIV_BONUS_221_SPEARMAN_AND_MILITIA_LINE_UPGRADES_EXCEPT_MAN] = techIDs;

    // Cows from mills
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(2, UNIT_MILL_COW, 1, -1, 0));
    e.EffectCommands.push_back(createEC(2, UNIT_PASTURE_COW, 1, -1, 0));
    this->createCivBonus(CIV_BONUS_222_COWS_MILLS, e, "C-Bonus, Cows from mills");

    // Start with a horse
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(1, 234, 0, -1, 1));
    e.EffectCommands.push_back(createEC(7, 814, 619, 1, 0));
    this->createCivBonus(CIV_BONUS_223_UNIT_SPEED_BONUS, e, "C-Bonus, start with horse", {639, 307});

    // Siege Towers 2x HP
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(5, 1105, -1, 0, 2));
    this->createCivBonus(CIV_BONUS_224_SIEGE_TOWERS_X2_HP, e, "C-Bonus, Siege Towers x2 HP");

    // Siege Towers train 100% faster
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(5, 1105, -1, 101, 0.5));
    this->createCivBonus(CIV_BONUS_225_SIEGE_TOWERS_TRAIN_100_FASTER, e, "C-Bonus, Siege Towers train 100% faster");

    // Siege units cost -33% wood
    this->civBonuses[CIV_BONUS_226_SIEGE_UNITS_COST_33_WOOD] = {876};

    // Cannon galleons get ballistics
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(0, 374, -1, 19, 1));
    e.EffectCommands.push_back(createEC(0, 374, -1, 5, 7));
    this->createCivBonus(CIV_BONUS_227_CANNON_GALLEONS_W_BALLISTICS, e, "C-Bonus, Cannon galleons w/ ballistics");

    // Warships +10 attack vs villagers
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, -1, 22, 9, amountTypetoD(10, 10)));
    this->createCivBonus(CIV_BONUS_228_WARSHIPS_ATTACK_VS_VILS, e, "C-Bonus, Warships +attack vs vils");

    // Rams generate stone when fighting
    this->civBonuses[CIV_BONUS_229_RAMS_GENERATE_STONE_BY_RAMMING] = {}; // empty because its done in `assignCivBonuses` special handling

    // TCs +50% work rate in Imperial
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(5, 142, -1, 13, 1.5));
    this->createCivBonus(CIV_BONUS_230_RESOURCE_BONUS, e, "C-Bonus, Town Center +50% Productivity", {103});

    // Feudal Age cost -25%
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(101, 101, 0, 1, -125));
    this->createCivBonus(CIV_BONUS_231_FEUDAL_COST_25, e, "C-Bonus, Feudal cost -25%");

    // Spearmen and skirmishers train 50% faster
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["spear"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["spear"][i], -1, 101, 0.66));
    }
    for (int i = 0; i < this->unitClasses["skirmisher"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["skirmisher"][i], -1, 101, 0.66));
    }
    this->createCivBonus(CIV_BONUS_232_SPEARMEN_SKIRMS_TRAIN_50_FASTER, e, "C-Bonus, Spearmen and Skirms train 50% faster");

    // Spearman-line +25% HP
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["spear"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["spear"][i], -1, 0, 1.25));
    }
    this->createCivBonus(CIV_BONUS_233_SPEARMEN_25_HP, e, "C-Bonus, Spearmen +25% HP");

    // Market techs cost no gold
    e.EffectCommands.clear();
    for (int i = 0; i < this->df->Techs.size(); i++) {
        if (getResearchLocation(this->df->Techs[i]) == 84) {
            e.EffectCommands.push_back(createEC(101, i, 3, 0, 0));
        }
    }
    this->createCivBonus(CIV_BONUS_234_MARKET_TECHS_COST_NO_GOLD, e, "C-Bonus, Market techs cost no gold");

    // Trees last 100% longer
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(6, 189, -1, -1, 2));
    e.EffectCommands.push_back(createEC(5, 123, -1, 13, 0.5));
    e.EffectCommands.push_back(createEC(5, 218, -1, 13, 0.5));
    this->createCivBonus(CIV_BONUS_235_TREES_LAST_100_LONGER, e, "C-Bonus, Trees last 100% longer");

    // Stone resources last 30% longer
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(6, 79, -1, -1, 1.3));
    e.EffectCommands.push_back(createEC(5, 124, -1, 13, 0.769231));
    e.EffectCommands.push_back(createEC(5, 220, -1, 13, 0.769231));
    this->createCivBonus(CIV_BONUS_236_STONE_RESOURCES_LAST_30_LONGER, e, "C-Bonus, Stone resources last 30% longer");

    // Gold resources last 30% longer
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(6, 47, -1, -1, 1.3));
    e.EffectCommands.push_back(createEC(5, 579, -1, 13, 0.769231));
    e.EffectCommands.push_back(createEC(5, 581, -1, 13, 0.769231));
    this->createCivBonus(CIV_BONUS_237_GOLD_RESOURCES_LAST_30_LONGER, e, "C-Bonus, Gold resources last 30% longer");

    // Berries +35% more food -- have to give foragers a different productivity resource (use with mayans too)
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(6, 198, -1, -1, 1.35));
    e.EffectCommands.push_back(createEC(5, 120, -1, 13, 0.741));
    e.EffectCommands.push_back(createEC(5, 354, -1, 13, 0.741));
    this->createCivBonus(CIV_BONUS_238_BERRIES_CONTAIN_35_FOOD, e, "C-Bonus, Berries contain +35% food");

    // City Walls
    e.EffectCommands.clear();
    e.Name = "City Walls";
    const vector<vector<int>> wallUpgrades = {
        {UNIT_STONE_WALL, UNIT_FORTIFIED_WALL, UNIT_CWAL},
        {UNIT_GTAA2, UNIT_GTAA3, UNIT_CGTAA},
        {UNIT_GATE, UNIT_GTAB3, UNIT_CGTAB},
        {UNIT_GATE_1, UNIT_GTAC3, UNIT_CGTAC},
        {UNIT_GATE_4, UNIT_GTAX3, UNIT_CGTAX},
        {UNIT_GTBA2, UNIT_GTBA3, UNIT_CGTBA},
        {UNIT_GATE_2, UNIT_GTBB3, UNIT_CGTBB},
        {UNIT_GATE_3, UNIT_GTBC3, UNIT_CGTBC},
        {UNIT_GATE_5, UNIT_GTBX3, UNIT_CGTBX},
        {UNIT_GTCA2, UNIT_GTCA3, UNIT_CGTCA},
        {UNIT_GATE_6, UNIT_GTCB3, UNIT_CGTCB},
        {UNIT_GATE_7, UNIT_GTCC3, UNIT_CGTCC},
        {UNIT_GATE_8, UNIT_GTCX3, UNIT_CGTCX},
        {UNIT_GTDA2, UNIT_GTDA3, UNIT_CGTDA},
        {UNIT_GATE_9, UNIT_GTDB3, UNIT_CGTDB},
        {UNIT_GATE_10, UNIT_GTDC3, UNIT_CGTDC},
        {UNIT_GATE_11, UNIT_GTDX3, UNIT_CGTDX}
    };
    for (int i = 0; i < wallUpgrades.size(); i++) {
        e.EffectCommands.push_back(createEC(3, wallUpgrades[i][0], wallUpgrades[i][2], -1, 0));
        e.EffectCommands.push_back(createEC(3, wallUpgrades[i][1], wallUpgrades[i][2], -1, 0));
    }
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "City Walls Requirement";
    t.Civ = 99;
    this->df->Techs.push_back(t);
    this->civBonuses[CIV_BONUS_239_CAN_UPGRADE_FORTIFIED_WALLS_TO_CITY_WALLS] = {(int)(df->Techs.size() - 1)};

    t = Tech();
    t.Name = "City Walls";
    t.LanguageDLLName = 7603;
    t.LanguageDLLDescription = 8603;
    t.LanguageDLLHelp = 107603;
    t.LanguageDLLTechTree = 157603;
    t.RequiredTechs.push_back(103);
    t.RequiredTechs.push_back(194);
    t.RequiredTechs.push_back((int)(df->Techs.size() - 1));
    t.RequiredTechCount = 3;
    t.ResourceCosts[0].Type = 0;
    t.ResourceCosts[0].Amount = 400;
    t.ResourceCosts[0].Flag = 1;
    t.ResourceCosts[1].Type = 1;
    t.ResourceCosts[1].Amount = 400;
    t.ResourceCosts[1].Flag = 1;
    setResearchLocation(t, 209, 200, 8);
    t.IconID = 46;
    t.Civ = -1;
    t.EffectID = (this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    // Add city walls to Jurchen bonus
    int cityWallTech = (int)(this->df->Techs.size() - 1);
    this->df->Effects[995].EffectCommands.push_back(createEC(101, cityWallTech, 1, 2, 0.25));
    this->df->Effects[995].EffectCommands.push_back(createEC(103, cityWallTech, -1, 2, 0.5));

    // Fish +35% more food
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(6, 200, -1, -1, 1.35));
    e.EffectCommands.push_back(createEC(5, 13, -1, 13, 0.741));
    e.EffectCommands.push_back(createEC(5, 56, -1, 13, 0.741));
    e.EffectCommands.push_back(createEC(5, 57, -1, 13, 0.741));
    this->createCivBonus(CIV_BONUS_240_FISH_CONTAIN_35_FOOD, e, "C-Bonus, Fish contain +35% food");

    // Units garrisoned in buildings heal 2x faster
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(5, -1, 52, 108, 2));
    e.EffectCommands.push_back(createEC(5, -1, 3, 108, 2));
    this->createCivBonus(CIV_BONUS_241_UNITS_HEAL_FASTER, e, "C-Bonus, units heal faster");

    // Repairers work 100% faster
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(5, 156, -1, 13, 2));
    e.EffectCommands.push_back(createEC(5, 222, -1, 13, 2));
    this->createCivBonus(CIV_BONUS_242_REPAIR_100_FASTER, e, "C-Bonus, repair 100% faster");

    // Skirmishers +1 attack vs infantry
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["skirmisher"].size(); i++) {
        e.EffectCommands.push_back(createEC(4, this->unitClasses["skirmisher"][i], -1, 9, amountTypetoD(1, 1)));
    }
    this->createCivBonus(CIV_BONUS_243_SKIRMISHERS_1_VS_INFANTRY, e, "C-Bonus, Skirmishers +1 vs infantry");

    // Archery range units +1 pierce attack
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["archery"].size(); i++) {
        e.EffectCommands.push_back(createEC(4, this->unitClasses["archery"][i], -1, 9, amountTypetoD(1, 3)));
    }
    this->createCivBonus(CIV_BONUS_244_ARRG_UNITS_1_ATTACK, e, "C-Bonus, ARRG units +1 attack");

    // Archery range units +1 melee armor per age (starting in Feudal)
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["archery"].size(); i++) {
        e.EffectCommands.push_back(createEC(4, this->unitClasses["archery"][i], -1, 8, amountTypetoD(1, 4)));
    }
    for (int i = 0; i < 3; i++) {
        this->createCivBonus(CIV_BONUS_245_ATTACK_BONUS, e, "C-Bonus, +1 arrg armor in age " + to_string(101 + i), {101 + i});
    }

    // Siege units +1 pierce armor in Castle and Imperial (+2 total)
    e.EffectCommands.clear();
    for (int i = 0; i < siegeClasses.size(); i++) {
        e.EffectCommands.push_back(createEC(4, -1, siegeClasses[i], 8, amountTypetoD(1, 3)));
    }
    this->createCivBonus(CIV_BONUS_246_ARMOR_BONUS, e, "C-Bonus, +1P armor age 102", {102});
    this->createCivBonus(CIV_BONUS_246_ARMOR_BONUS, e, "C-Bonus, +1P armor age 103", {103});

    // Parthian tactics in Castle Age
    t = Tech();
    t.Name = "C-Bonus, Parthian tactics in Castle";
    t.Civ = 99;
    t.RequiredTechs.push_back(102);
    t.RequiredTechCount = 1;
    df->Techs.push_back(t);
    df->Techs[436].RequiredTechs[1] = (int)(df->Techs.size() - 1);
    this->civBonuses[CIV_BONUS_247_PARTHIAN_TACTICS_AVAILABLE_IN_CASTLE_AGE] = {(int)(df->Techs.size() - 1)};

    // Castle Age cost -25%
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(101, 102, 0, 1, -200));
    e.EffectCommands.push_back(createEC(101, 102, 3, 1, -50));
    this->createCivBonus(CIV_BONUS_248_CASTLE_AGE_COST_25, e, "C-Bonus, Castle Age cost -25%");

    // Cavalry +1 attack
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, -1, 12, 9, amountTypetoD(1, 4)));
    e.EffectCommands.push_back(createEC(4, -1, 47, 9, amountTypetoD(1, 4)));
    this->createCivBonus(CIV_BONUS_249_CAVALRY_1_ATTACK, e, "C-Bonus, Cavalry +1 attack");

    // Forging, iron casting, blast furnace add +1 damage vs buildings
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, -1, 6, 9, amountTypetoD(1, 21)));
    e.EffectCommands.push_back(createEC(4, -1, 12, 9, amountTypetoD(1, 21)));
    e.EffectCommands.push_back(createEC(4, -1, 47, 9, amountTypetoD(1, 21)));
    this->createCivBonus(CIV_BONUS_250_ATTACK_AGAINST_BUILDINGS, e, "C-Bonus, +1 building attack age 101", {101});
    this->createCivBonus(CIV_BONUS_250_ATTACK_AGAINST_BUILDINGS, e, "C-Bonus, +1 building attack age 102", {102});
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, -1, 6, 9, amountTypetoD(2, 21)));
    e.EffectCommands.push_back(createEC(4, -1, 12, 9, amountTypetoD(2, 21)));
    e.EffectCommands.push_back(createEC(4, -1, 47, 9, amountTypetoD(2, 21)));
    this->createCivBonus(CIV_BONUS_250_ATTACK_AGAINST_BUILDINGS, e, "C-Bonus, +2 building attack age 103", {103});

    // All buildings +3 pierce armor
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, -1, 3, 8, amountTypetoD(3, 3)));
    e.EffectCommands.push_back(createEC(4, -1, 52, 8, amountTypetoD(3, 3)));
    this->createCivBonus(CIV_BONUS_251_BUILDINGS_3_PIERCE_ARMOR, e, "C-Bonus, buildings +3 pierce armor");

    // Foot archers +5% speed per age (starting in Feudal)
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["footArcher"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["footArcher"][i], -1, 5, 1.05));
    }
    this->createCivBonus(CIV_BONUS_252_TRAINING_SPEED_BONUS, e, "C-Bonus, Archers +5% speed", {101});
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["footArcher"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["footArcher"][i], -1, 5, 1.0476));
    }
    this->createCivBonus(CIV_BONUS_252_TRAINING_SPEED_BONUS, e, "C-Bonus, Archers +10% speed", {102});
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["footArcher"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["footArcher"][i], -1, 5, 1.0455));
    }
    this->createCivBonus(CIV_BONUS_252_TRAINING_SPEED_BONUS, e, "C-Bonus, Archers +15% speed", {103});

    // Foot archers and skirms +1 vs villagers
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["footArcher"].size(); i++) {
        e.EffectCommands.push_back(createEC(4, this->unitClasses["footArcher"][i], -1, 9, amountTypetoD(1, 10)));
    }
    for (int i = 0; i < this->unitClasses["skirmisher"].size(); i++) {
        e.EffectCommands.push_back(createEC(4, this->unitClasses["skirmisher"][i], -1, 9, amountTypetoD(1, 10)));
    }
    this->createCivBonus(CIV_BONUS_253_FOOT_ARCHERS_1_VS_VILS, e, "C-Bonus, foot archers +1 vs vils");

    // Gunpowder +10 bonus vs camels
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["gunpowder"].size(); i++) {
        e.EffectCommands.push_back(createEC(4, this->unitClasses["gunpowder"][i], -1, 9, amountTypetoD(10, 30)));
    }
    this->createCivBonus(CIV_BONUS_254_GUNPOWDER_BONUS_VS_CAMELS, e, "C-Bonus, gunpowder bonus vs camels");

    // Shock Infantry +6 vs stone defenses
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["shock"].size(); i++) {
        e.EffectCommands.push_back(createEC(4, this->unitClasses["shock"][i], -1, 9, amountTypetoD(6, 13)));
        e.EffectCommands.push_back(createEC(4, this->unitClasses["shock"][i], -1, 9, amountTypetoD(3, 22)));
        e.EffectCommands.push_back(createEC(4, this->unitClasses["shock"][i], -1, 9, amountTypetoD(6, 26)));
    }
    this->createCivBonus(CIV_BONUS_255_SHOCK_INFANTRY_BONUS_VS_STONE, e, "C-Bonus, shock infantry bonus vs stone");

    // Scouts, Light Cavalry, Hussar +4 vs stone defenses
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["lightCav"].size(); i++) {
        e.EffectCommands.push_back(createEC(4, this->unitClasses["lightCav"][i], -1, 9, amountTypetoD(4, 13)));
        e.EffectCommands.push_back(createEC(4, this->unitClasses["lightCav"][i], -1, 9, amountTypetoD(2, 22)));
        e.EffectCommands.push_back(createEC(4, this->unitClasses["lightCav"][i], -1, 9, amountTypetoD(4, 26)));
    }
    this->createCivBonus(CIV_BONUS_256_SCOUTS_BONUS_VS_STONE, e, "C-Bonus, scouts bonus vs stone");

    // Villagers work 5% faster
    this->civBonuses[CIV_BONUS_257_ALL_VILLAGERS_WORK_5_FASTER] = {887};

    // Villagers +1 carry capacity per TC tech
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, -1, 4, 14, 1));
    for (int i = 0; i < this->df->Techs.size(); i++) {
        if (getResearchLocation(this->df->Techs[i]) == 109) {
            this->createCivBonus(CIV_BONUS_258_RESOURCE_GENERATION, e, "C-Bonus, +1 capacity TC tech " + to_string(i), {i});
        }
    }

    // Farms 10x HP
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(5, 50, -1, 0, 10));
    e.EffectCommands.push_back(createEC(5, 1187, -1, 0, 10));
    this->createCivBonus(CIV_BONUS_259_FARMS_10X_HP, e, "C-Bonus, Farms 10x HP");

    // Militia-line +2 vs cavalry
    e.EffectCommands.clear();
    for (int i = 0; i < militias.size(); i++) {
        e.EffectCommands.push_back(createEC(4, militias[i], -1, 9, amountTypetoD(2, 8)));
        e.EffectCommands.push_back(createEC(4, militias[i], -1, 9, amountTypetoD(1, 30)));
    }
    this->createCivBonus(CIV_BONUS_260_MILITIALINE_2_VS_CAV, e, "C-Bonus, Militia-line +2 vs cav");

    // Elite steppe lancer free
    e.EffectCommands.clear();
    for (int i = 0; i < 4; i++) {
        e.EffectCommands.push_back(createEC(101, 715, i, 0, 0));
        e.EffectCommands.push_back(createEC(101, royalLancerTech, i, 0, 0));
    }
    e.EffectCommands.push_back(createEC(103, 715, -1, 0, 0));
    e.EffectCommands.push_back(createEC(103, royalLancerTech, -1, 0, 0));
    this->createCivBonus(CIV_BONUS_261_ELITE_STEPPE_LANCER_FREE, e, "C-Bonus, Elite steppe lancer free");

    // Steppe lancers +2 pierce armor
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["steppe"].size(); i++) {
        e.EffectCommands.push_back(createEC(4, this->unitClasses["steppe"][i], -1, 8, amountTypetoD(2, 3)));
    }
    this->createCivBonus(CIV_BONUS_262_STEPPE_LANCERS_2P_ARMOR, e, "C-Bonus, Steppe Lancers +2P armor");

    // Castles and kreposts bonus vs buildings
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, 82, -1, 9, amountTypetoD(100, 11)));
    e.EffectCommands.push_back(createEC(4, 1251, -1, 9, amountTypetoD(50, 11)));
    this->createCivBonus(CIV_BONUS_263_CASTLES_BONUS_VS_BUILDINGS, e, "C-Bonus, Castles bonus vs buildings");

    // All villagers work 10% faster in Imperial Age
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(5, -1, 4, 13, 1.1));
    this->createCivBonus(CIV_BONUS_264_HP_BONUS, e, "C-Bonus, vils work 10% faster in Imp", {103});

    // Outposts +5 garrison space
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, 598, -1, 2, 5));
    e.EffectCommands.push_back(createEC(0, 598, -1, 30, 15));
    this->createCivBonus(CIV_BONUS_265_OUTPOSTS_GARRISON, e, "C-Bonus, Outposts garrison");

    // Builders/repairers +10 pierce armor
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, 118, -1, 8, amountTypetoD(10, 3)));
    e.EffectCommands.push_back(createEC(4, 212, -1, 8, amountTypetoD(10, 3)));
    e.EffectCommands.push_back(createEC(4, 156, -1, 8, amountTypetoD(10, 3)));
    e.EffectCommands.push_back(createEC(4, 222, -1, 8, amountTypetoD(10, 3)));
    this->createCivBonus(CIV_BONUS_266_BUILDERSREPAIRERS_10P_ARMOR, e, "C-Bonus, Builders/Repairers +10P armor");

    // Castles and Kreposts support 50 population
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, 82, -1, 21, 30));
    e.EffectCommands.push_back(createEC(4, 1251, -1, 21, 30));
    this->createCivBonus(CIV_BONUS_267_CASTLES_KREPOSTS_50_POP, e, "C-Bonus, Castles and Kreposts 50 pop");

    // Bombard towers bonus vs rams
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, 236, -1, 9, amountTypetoD(30, 17)));
    this->createCivBonus(CIV_BONUS_268_BOMBARD_TOWERS_BONUS_VS_RAMS, e, "C-Bonus, Bombard towers bonus vs rams");

    // Towers bonus vs cavalry
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, -1, 52, 9, amountTypetoD(6, 8)));
    this->createCivBonus(CIV_BONUS_269_TOWERS_DEAL_EXTRA_DAMAGE_TO_CAVALRY, e, "C-Bonus, Towers bonus vs cavalry");

    // Feudal monks
    techIDs.clear();
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(2, UNIT_FEUDAL_MONK, 1, -1, 0));
    e.Name = "Feudal Monk (make avail)";
    df->Effects.push_back(e);
    t = Tech();
    t.Name = "Feudal Monk (make avail)";
    t.RequiredTechs.push_back(101);
    t.RequiredTechCount = 1;
    t.Civ = 99;
    t.EffectID = (df->Effects.size() - 1);
    df->Techs.push_back(t);
    techIDs.push_back((int)(df->Techs.size() - 1));
    t = Tech();
    t.Name = "C-Bonus, Feudal Monastery";
    t.RequiredTechs.push_back(101);
    t.RequiredTechCount = 1;
    t.Civ = 99;
    t.EffectID = 199;
    df->Techs.push_back(t);
    techIDs.push_back((int)(df->Techs.size() - 1));
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(3, UNIT_FEUDAL_MONK, 125, -1, 0));
    e.Name = "Upgrade monks Castle";
    df->Effects.push_back(e);
    t = Tech();
    t.Name = "Upgrade monks Castle";
    t.RequiredTechs.push_back(102);
    t.RequiredTechs.push_back(techIDs[0]);
    t.RequiredTechs.push_back(157);
    t.RequiredTechCount = 3;
    t.Civ = 99;
    t.EffectID = (df->Effects.size() - 1);
    df->Techs.push_back(t);
    techIDs.push_back((int)(df->Techs.size() - 1));
    t = Tech();
    t.Name = "Feudal Monastery built";
    t.RequiredTechs.push_back(107);
    t.RequiredTechCount = 1;
    t.Civ = 99;
    df->Techs.push_back(t);
    df->Techs[135].RequiredTechs[5] = (int)(df->Techs.size() - 1);
    techIDs.push_back((int)(df->Techs.size() - 1));
    this->civBonuses[CIV_BONUS_270_CAN_BUILD_MONASTERY_IN_FEUDAL_AGE_MONKS] = techIDs;

    // Scorpions and ballistas produced 50% faster
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["scorpion"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["scorpion"][i], -1, 101, 0.66));
    }
    e.EffectCommands.push_back(createEC(5, 1120, -1, 101, 0.66));
    e.EffectCommands.push_back(createEC(5, 1122, -1, 101, 0.66));
    e.EffectCommands.push_back(createEC(5, 827, -1, 101, 0.66));
    e.EffectCommands.push_back(createEC(5, 829, -1, 101, 0.66));
    this->createCivBonus(CIV_BONUS_271_SCORPIONS_PRODUCED_50_FASTER, e, "C-Bonus, Scorpions produced 50% faster");

    // Town Centers fire faster
    e.EffectCommands.clear();
    for (int i = 0; i < townCenters.size(); i++) {
        e.EffectCommands.push_back(createEC(5, townCenters[i], -1, 10, 0.8));
    }
    this->createCivBonus(CIV_BONUS_272_TCS_FIRE_25_FASTER, e, "C-Bonus, TCs fire 25% faster");

    // Trebuchets -50% gold
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["trebuchet"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["trebuchet"][i], -1, 105, 0.5));
    }
    this->createCivBonus(CIV_BONUS_273_TREBUCHETS_50_GOLD, e, "C-Bonus, Trebuchets -50% gold");

    // All explosive units +blast radius
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["explosive"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["explosive"][i], -1, 22, 2));
    }
    this->createCivBonus(CIV_BONUS_274_EXPLOSIVE_UNITS_BLAST_RADIUS, e, "C-Bonus, Explosive units +blast radius");

    // Gunpowder bonus vs buildings
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["gunpowder"].size(); i++) {
        e.EffectCommands.push_back(createEC(4, this->unitClasses["gunpowder"][i], -1, 9, amountTypetoD(8, 11)));
    }
    this->createCivBonus(CIV_BONUS_275_GUNPOWDER_BONUS_VS_BUILDINGS, e, "C-Bonus, Gunpowder bonus vs buildings");

    // Shock Infantry +1 pierce armor
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["shock"].size(); i++) {
        e.EffectCommands.push_back(createEC(4, this->unitClasses["shock"][i], -1, 8, amountTypetoD(1, 3)));
    }
    this->createCivBonus(CIV_BONUS_276_SHOCK_INFANTRY_1P_ARMOR, e, "C-Bonus, Shock Infantry +1P armor");

    // Gunpowder units +1 attack per university tech
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["gunpowder"].size(); i++) {
        int attackType = -1;
        for (int j = 0; j < this->df->Civs[0].Units[this->unitClasses["gunpowder"][i]].Type50.Attacks.size(); j++) {
            unit::AttackOrArmor attack = df->Civs[0].Units[this->unitClasses["gunpowder"][i]].Type50.Attacks[j];
            if (((attack.Class == 4) || (attack.Class == 3)) && (attack.Amount != 0)) { // 4=BaseMelee, 3=BasePierce
                attackType = attack.Class;
                //break; // early exit ??
            }
        }
        if (attackType != -1) {
            //int percentMultiplicator = 105;
            //e.EffectCommands.push_back(createEC(5, this->unitClasses["gunpowder"][i], -1, 9, amountTypetoD(percentMultiplicator, attackType))); // original percentage based
            e.EffectCommands.push_back(createEC(4, this->unitClasses["gunpowder"][i], -1, 9, amountTypetoD(1, attackType)));
        }
    }
    for (int i = 0; i < this->df->Techs.size(); i++) {
        if (getResearchLocation(this->df->Techs[i]) == 209) {
            this->createCivBonus(CIV_BONUS_277_DAMAGE_BONUS, e, "Gunpowder +1% attack for uni tech " + to_string(i), {i});
        }
    }

    // Buildings +3% HP per university tech (cumulative)
    e.EffectCommands.clear();
    for (int i = 0; i < buildingClasses.size(); i++) {
        e.EffectCommands.push_back(createEC(5, -1, buildingClasses[i], 0, 1.03));
    }
    for (int i = 0; i < this->df->Techs.size(); i++) {
        if (getResearchLocation(this->df->Techs[i]) == 209) {
            this->createCivBonus(CIV_BONUS_278_SPEED_BONUS, e, "Building +3% armor for uni tech" + to_string(i), {i});
        }
    }

    // Each monastery tech spawns a monk
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(1, 234, 0, -1, 1));
    e.EffectCommands.push_back(createEC(7, 125, 104, 1, 0));
    e.EffectCommands.push_back(createEC(7, 125, 1806, 1, 0));
    for (int i = 0; i < this->df->Techs.size(); i++) {
        if (getResearchLocation(this->df->Techs[i]) == 104) {
            this->createCivBonus(CIV_BONUS_279_ARMOR_BONUS, e, "Monk for church tech " + to_string(i), {i});
        }
    }

    // Folwark replaces Mill
    // Note: Sicilian farm bonus doesn't compound with Folwark
    this->civBonuses[CIV_BONUS_280_FOLWARK_REPLACES_MILL] = {
        TECH_FOLWARK, TECH_FOLWARK_AGE2_UPGRADE, TECH_FOLWARK_AGE3_UPGRADE, TECH_FOLWARK_AGE4_UPGRADE, 
        TECH_FLEMISH_MILITIA_AGE4, TECH_NEW_RESEARCH_63, TECH_NEW_RESEARCH_64, 
        TECH_NEW_RESEARCH_71, TECH_NEW_RESEARCH_72, TECH_NEW_RESEARCH_73, TECH_NEW_RESEARCH_74
    };

    // Stone miners generate gold
    this->civBonuses[CIV_BONUS_281_STONE_MINERS_GENERATE_GOLD_IN_ADDITION_TO_STONE] = {
        TECH_C_BONUS_STONE_MINERS_GENERATE_GOLD, 
        TECH_STONE_MINING_GOLD_GENERATION_INCREASE, 
        TECH_STONE_SHAFT_MINING_GOLD_GENERATION_INCREASE
    };

    // Winged Hussar replaces Hussar
    this->civBonuses[CIV_BONUS_282_WINGED_HUSSAR_REPLACES_HUSSAR] = {
        TECH_WINGED_HUSSAR_POLES, 
        TECH_WINGED_HUSSAR_P_POST_IMPERIAL
    };

    // Chemistry in Castle Age
    this->civBonuses[CIV_BONUS_283_CHEMISTRY_AND_HAND_CANNONEER_AVAILABLE_IN_CASTLE] = {
        TECH_C_BONUS_EARLIER_CHEMISTRY, 
        TECH_C_BONUS_EARLIER_HAND_CANNON
    };

    // Spearman-line deals +25% bonus damage
    this->civBonuses[CIV_BONUS_284_SPEARMEN_DEALS_25_BONUS_DAMAGE] = {TECH_C_BONUS_BONUS_DAMAGE_INCREASE};

    // Fervor and Sanctity affects villagers
    this->civBonuses[CIV_BONUS_285_FERVOR_AND_SANCTITY_AFFECTS_VILLAGERS] = {
        TECH_C_BONUS_VILLAGER_SANCTITY, 
        TECH_C_BONUS_VILLAGER_FERVOR
    };

    // Houfnice
    this->civBonuses[CIV_BONUS_286_CAN_UPGRADE_BOMBARD_CANNONS_TO_HOUFNICE] = {TECH_HOUFNICE};

    // Caravanserai
    this->civBonuses[CIV_BONUS_287_CAN_BUILD_CARAVANSERI_IN_IMPERIAL_AGE] = {TECH_CARAVANSERAI_MAKE_AVAIL};

    // Gunpowder units +1/+1P
    this->civBonuses[CIV_BONUS_288_GUNPOWDER_UNITS_1_1P_ARMOR] = {TECH_C_BONUS_GUNPOWDER_ARMOR};

    //+200w per age
    this->civBonuses[CIV_BONUS_289_RECEIVE_200_WOOD_WHEN_ADVANCING_TO_THE_NEXT_AGE] = {
        TECH_C_BONUS_PLUS_200W_IN_AGE2, 
        TECH_C_BONUS_PLUS_200W_IN_AGE3, 
        TECH_C_BONUS_PLUS_200W_IN_AGE4
    };

    // Barracks techs cost -50%
    e.EffectCommands.clear();
    e.Name = "C-Bonus, Barracks techs cost -50%";
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "C-Bonus, Barracks techs cost -50%";
    t.EffectID = (this->df->Effects.size() - 1);
    t.Civ = 99;
    this->df->Techs.push_back(t);
    this->civBonuses[CIV_BONUS_290_BARRACKS_TECHNOLOGIES_COST_50] = {(int)(this->df->Techs.size() - 1)};

    // Skirmishers and elephant archers attack 25% faster
    this->civBonuses[CIV_BONUS_291_SKIRMISHERS_AND_ELEPHANT_ARCHERS_ATTACK_25_FASTER] = {TECH_C_BONUS_SKIRM_AND_EA_FASTER_ATTACK};

    // Elephant units -25% bonus damage and conversion resist
    this->civBonuses[CIV_BONUS_292_ELEPHANT_UNITS_RECEIVE_25_LESS_BONUS_DAMAGE] = {TECH_C_BONUS_ELEPHANT_RESISTANCE};

    // Ships regenerate
    this->civBonuses[CIV_BONUS_293_SHIPS_REGENERATE_15_HP_PER_MINUTE] = {TECH_C_BONUS_SHIPS_REGENERATE};

    // Start with 2 forage bushes
    this->civBonuses[CIV_BONUS_294_START_WITH_2_FORAGE_BUSHES] = {TECH_C_BONUS_START_W_AND_2_BUSHES};

    // Livestock garrison mills
    this->civBonuses[CIV_BONUS_295_CAN_GARRISON_MILLS_WITH_LIVESTOCK_TO_PRODUCE_FOOD] = {TECH_C_BONUS_HERDABLES_GARRISON};

    // Mounted units +20/30/40% damage
    this->civBonuses[CIV_BONUS_296_MOUNTED_UNITS_DEAL_20_BONUS_DAMAGE_FEUDAL] = {
        TECH_C_BONUS_PLUS_20_PERCENT_CAV_BONUS_DAMAGE, 
        TECH_C_BONUS_PLUS_30_PERCENT_CAV_BONUS_DAMAGE, 
        TECH_C_BONUS_PLUS_40_PERCENT_CAV_BONUS_DAMAGE
    };

    // Garrison fishing ships
    this->civBonuses[CIV_BONUS_297_CAN_GARRISON_DOCKS_WITH_FISHING_SHIPS] = {TECH_C_BONUS_DOCKS_GARRISON};

    // Thirisadai
    this->civBonuses[CIV_BONUS_298_CAN_TRAIN_THIRISADAI_IN_DOCKS] = {TECH_THIRISADAI_MAKE_AVAIL};

    // Shrivamsha
    this->civBonuses[CIV_BONUS_299_CAN_RECRUIT_SHRIVAMSHA_RIDERS] = {
        TECH_SHRIVAMSHA_RIDER_MAKE_AVAIL, 
        TECH_ELITE_SHRIVAMSHA_RIDER
    };

    // Camel Scouts
    this->civBonuses[CIV_BONUS_300_CAN_RECRUIT_CAMEL_SCOUTS_IN_FEUDAL_AGE] = {
        TECH_MAKE_CAMELS_AVAILABLE, 
        TECH_UPGRADE_CAMEL_SCOUTS_TO_RIDERS, 
        TECH_CAMEL_SCOUT_MAKE_AVAIL
    };

    //+20g per tech
    this->civBonuses[CIV_BONUS_301_GAIN_20_GOLD_FOR_EACH_TECHNOLOGY_RESEARCHED] = {
        TECH_C_BONUS_TECH_REWARD, 
        TECH_EXCLUDE_AGE2_FROM_TECH_REWARD, 
        TECH_EXCLUDE_AGE3_FROM_TECH_REWARD, 
        TECH_EXCLUDE_AGE4_FROM_TECH_REWARD
    };

    // Galleys and Dromons armor
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, 21, -1, 8, amountTypetoD(1, 3)));
    e.EffectCommands.push_back(createEC(4, 21, -1, 8, amountTypetoD(1, 4)));
    e.EffectCommands.push_back(createEC(4, 442, -1, 8, amountTypetoD(2, 3)));
    e.EffectCommands.push_back(createEC(4, 442, -1, 8, amountTypetoD(2, 4)));
    e.EffectCommands.push_back(createEC(4, 1795, -1, 8, amountTypetoD(2, 3)));
    e.EffectCommands.push_back(createEC(4, 1795, -1, 8, amountTypetoD(2, 4)));
    this->createCivBonus(CIV_BONUS_302_NAVY_ARMOR, e, "C-Bonus, Navy armor");

    // Battle Elephants +1/+1P armor
    this->civBonuses[CIV_BONUS_303_ELEPHANT_UNITS_1_1P_ARMOR] = {TECH_C_BONUS_BATTLE_ELEPHANT_ARMOR};

    // Monks +3/+3P armor
    this->civBonuses[CIV_BONUS_304_MONK_UNITS_3_3P_ARMOR] = {TECH_C_BONUS_MONK_ARMOR};

    // Blacksmith double effect
    this->civBonuses[CIV_BONUS_305_INFANTRY_RECEIVES_DOUBLE_EFFECT_FROM_BLACKSMITH_ARMOR] = {
        TECH_C_BONUS_DOUBLE_SCALE_MAIL, 
        TECH_C_BONUS_DOUBLE_CHAIN_MAIL, 
        TECH_C_BONUS_DOUBLE_PLATE_MAIL
    };

    // Scorpions cheap and ballistics
    this->civBonuses[CIV_BONUS_306_SCORPIONS_COST_60_GOLD_AND_BENEFIT_FROM] = {
        TECH_C_BONUS_CHEAPER_SCORPIONS, 
        TECH_RESERVED_2
    };

    // Legionary
    this->civBonuses[CIV_BONUS_307_LEGIONARY_REPLACES_TWO_HANDED_SWORDSMAN_CHAMPION] = {
        TECH_LEGIONARY, 
        TECH_FTT_DISABLE_MILITIA_UPGRADES
    };

    // Cavalry Archers +2 attack vs archers
    this->civBonuses[CIV_BONUS_311_CAVALRY_ARCHERS_2_ATTACK_VS_ARCHERS_EXCEPT] = {TECH_C_BONUS_CA_VS_ARCHERS};

    // Eco buildings cheaper + effectiveness
    this->civBonuses[CIV_BONUS_312_WOOD_AND_MINING_UPGRADES_ARE_40_MORE] = {
        TECH_C_BONUS_CHEAPER_MULE_CART, 
        TECH_C_BONUS_PLUS_PERCENT_DOUBLE_BIT_AXE, 
        TECH_C_BONUS_PLUS_PERCENT_BOW_SAW, 
        TECH_C_BONUS_PLUS_PERCENT_TWO_MAN_SAW, 
        TECH_C_BONUS_PLUS_PERCENT_GOLD_MINING, 
        TECH_C_BONUS_PLUS_PERCENT_GOLD_SHAFT_MINING, 
        TECH_C_BONUS_PLUS_PERCENT_STONE_MINING, 
        TECH_C_BONUS_PLUS_PERCENT_STONE_SHAFT_MINING
    };
    this->df->Effects[953].EffectCommands.clear();
    for (int i = 0; i < ecoBuildings.size(); i++) {
        this->df->Effects[953].EffectCommands.push_back(createEC(5, ecoBuildings[i], -1, 100, 0.75));
    }

    // Free relic
    this->civBonuses[CIV_BONUS_313_FIRST_RELIGIOUS_BUILDING_RECEIVES_A_FREE_RELIC] = {
        TECH_C_BONUS_FREE_RELIC, 
        TECH_C_BONUS_FREE_RELIC2
    };

    // Savar
    this->civBonuses[CIV_BONUS_314_SAVAR_REPLACES_PALADIN] = {
        TECH_SAVAR, 
        TECH_FTT_DISABLE_PALADIN
    };

    // Extra warship missile
    this->civBonuses[CIV_BONUS_315_GALLEY_LINE_AND_DROMONS_FIRE_AN_ADDITIONAL] = {TECH_C_BONUS_NAVY_PLUS_1_PROJECTILE};

    // Fortified church
    this->civBonuses[CIV_BONUS_316_FORTIFIED_CHURCH_REPLACES_MONASTERY] = {TECH_FORTIFIED_CHURCH_GEORGIANS};

    // Mule carts
    this->civBonuses[CIV_BONUS_317_MULE_CARTS_REPLACE_LUMBER_CAMPS_AND_MINING_CAMPS] = {TECH_MULE_CART_MAKE_AVAIL};

    // Start with mule cart
    this->civBonuses[CIV_BONUS_318_START_WITH_A_MULE_CART] = {
        TECH_NEW_RESEARCH_45, 
        TECH_C_BONUS_START_W_AND_MULE_CART
    };

    // Church work bonus area
    this->civBonuses[CIV_BONUS_319_RELIGIOUS_BUILDINGS_PROVIDE_VILLAGERS_IN_AN_8] = {TECH_C_BONUS_FORTIFIED_CHURCH_AREA_EFFECT};

    // Less bonus damage from higher elevation
    this->civBonuses[CIV_BONUS_320_UNITS_AND_BUILDINGS_RECEIVE_15_DAMAGE_WHEN] = {TECH_C_BONUS_ELEVATION_BONUS_DEFENSE};

    // Cavalry regen
    this->civBonuses[CIV_BONUS_321_MOUNTED_UNITS_REGENERATE_2_8_14_HP] = {
        TECH_C_BONUS_CAVALRY_REGENERATION_AGE2, 
        TECH_C_BONUS_CAVALRY_REGENERATION_AGE3, 
        TECH_C_BONUS_CAVALRY_REGENERATION_AGE4
    };

    // Flaming camel bonus
    this->civBonuses[CIV_BONUS_322_FLAMING_CAMELS_AVAILABLE_IN_SIEGE_WORKSHOPS_IN] = {TECH_FLAMING_CAMEL_MAKE_AVAIL};

    // Refund stone
    e.EffectCommands.clear();
    for (int i = 0; i < this->df->Civs[0].Units.size(); i++) {
        bool isBuilding = false;
        for (int j = 0; j < buildingClasses.size(); j++) {
            if (buildingClasses[j] == this->df->Civs[0].Units[i].Class) {
                isBuilding = true;
            }
        }
        if (isBuilding) {
            int buildingWidth = (int)(this->df->Civs[0].Units[i].CollisionSize.x / 0.5);
            int buildingLength = (int)(this->df->Civs[0].Units[i].CollisionSize.y / 0.5);
            int buildingArea = buildingWidth * buildingLength;
            e.EffectCommands.push_back(createEC(0, i, -1, 27, buildingArea));
        }
    }
    this->createCivBonus(CIV_BONUS_323_BUILDINGS_REBATE_STONE, e, "C-Bonus, Buildings rebate stone");

    // Villagers cooperate - "Villagers work faster when nearby other villagers"
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(0, -1, 4, 63, 96));
    this->createCivBonus(CIV_BONUS_324_VILLAGERS_COOPERATE, e, "C-Bonus, Villagers cooperate");

    // Husbandry affects attack speed
    e.EffectCommands.clear();
    e.Name = "Husbandry affects attack speed";
    for (int i = 0; i < this->df->Effects[39].EffectCommands.size(); i++) {
        EffectCommand ec = this->df->Effects[39].EffectCommands[i];
        ec.C = 10;
        ec.D = 0.9090909;
        e.EffectCommands.push_back(ec);
    }
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "C-Bonus, Husbandry affects attack speed";
    t.Civ = 99;
    t.RequiredTechCount = 1;
    t.RequiredTechs.push_back(39);
    t.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);
    this->civBonuses[CIV_BONUS_325_HUSBANDRY_AFFECTS_ATTACK_SPEED] = {(int)(this->df->Techs.size() - 1)};

    // Trade yields stone
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(1, 253, -1, -1, 10));
    this->createCivBonus(CIV_BONUS_326_TRADE_YIELDS_STONE, e, "C-Bonus, Trade yields stone");

    // Blacksmith upgrades affect bonus damage
    techIDs = {};
    // Infantry/cavalry attack
    const vector<int> melee_attack_classes = {6, 12, 47};

    e.EffectCommands.clear();
    e.Name = "+1 bonus attack for melee units";
    for (int i = 0; i < 40; i++) {
        if (i != 4 && i != 3) {
            for (int j = 0; j < melee_attack_classes.size(); j++) {
                e.EffectCommands.push_back(createEC(4, -1, melee_attack_classes[j], 9, amountTypetoD(1, i)));
            }
        }
    }
    this->df->Effects.push_back(e);
    int meleeAttack1 = (int)(this->df->Effects.size() - 1);

    e.EffectCommands.clear();
    e.Name = "+2 bonus attack for melee units";
    for (int i = 0; i < 40; i++) {
        if (i != 4 && i != 3) {
            for (int j = 0; j < melee_attack_classes.size(); j++) {
                e.EffectCommands.push_back(createEC(4, -1, melee_attack_classes[j], 9, amountTypetoD(2, i)));
            }
        }
    }
    this->df->Effects.push_back(e);
    int meleeAttack2 = (int)(this->df->Effects.size() - 1);

    t = Tech();
    t.Name = "Forging gives bonus damage";
    t.RequiredTechCount = 1;
    t.RequiredTechs.push_back(67);
    t.Civ = 99;
    t.EffectID = meleeAttack1;
    this->df->Techs.push_back(t);
    techIDs.push_back((int)(this->df->Techs.size() - 1));

    t = Tech();
    t.Name = "Iron Casting gives bonus damage";
    t.RequiredTechCount = 1;
    t.RequiredTechs.push_back(68);
    t.Civ = 99;
    t.EffectID = meleeAttack1;
    this->df->Techs.push_back(t);
    techIDs.push_back((int)(this->df->Techs.size() - 1));

    t = Tech();
    t.Name = "Blast Furnace gives bonus damage";
    t.RequiredTechCount = 1;
    t.RequiredTechs.push_back(75);
    t.Civ = 99;
    t.EffectID = meleeAttack2;
    this->df->Techs.push_back(t);
    techIDs.push_back((int)(this->df->Techs.size() - 1));

    t = Tech();
    t.Name = "Double forging gives bonus damage";
    t.RequiredTechCount = 1;
    t.RequiredTechs.push_back(998);
    t.Civ = 99;
    t.EffectID = meleeAttack1;
    this->df->Techs.push_back(t);
    techIDs.push_back((int)(this->df->Techs.size() - 1));

    t = Tech();
    t.Name = "Double iron casting gives bonus damage";
    t.RequiredTechCount = 1;
    t.RequiredTechs.push_back(999);
    t.Civ = 99;
    t.EffectID = meleeAttack1;
    this->df->Techs.push_back(t);
    techIDs.push_back((int)(this->df->Techs.size() - 1));

    t = Tech();
    t.Name = "Double blast furnace gives bonus damage";
    t.RequiredTechCount = 1;
    t.RequiredTechs.push_back(1000);
    t.Civ = 99;
    t.EffectID = meleeAttack2;
    this->df->Techs.push_back(t);
    techIDs.push_back((int)(this->df->Techs.size() - 1));

    // Ranged attack
    e.EffectCommands.clear();
    e.Name = "+1 bonus attack for ranged units";
    for (int i = 0; i < 40; i++) {
        if (i != 4 && i != 3) {
            for (int j = 0; j < this->df->Effects[192].EffectCommands.size(); j++) {
                if (this->df->Effects[192].EffectCommands[j].C == 9) {
                    EffectCommand ec = this->df->Effects[192].EffectCommands[j];
                    ec.D = amountTypetoD(1, i);
                    e.EffectCommands.push_back(ec);
                }
            }
        }
    }
    this->df->Effects.push_back(e);
    int rangedAttack1 = (int)(this->df->Effects.size() - 1);

    t = Tech();
    t.Name = "Fletching gives bonus damage";
    t.RequiredTechCount = 1;
    t.RequiredTechs.push_back(199);
    t.Civ = 99;
    t.EffectID = rangedAttack1;
    this->df->Techs.push_back(t);
    techIDs.push_back((int)(this->df->Techs.size() - 1));

    t = Tech();
    t.Name = "Bodkin Arrow gives bonus damage";
    t.RequiredTechCount = 1;
    t.RequiredTechs.push_back(200);
    t.Civ = 99;
    t.EffectID = rangedAttack1;
    this->df->Techs.push_back(t);
    techIDs.push_back((int)(this->df->Techs.size() - 1));

    t = Tech();
    t.Name = "Bracer gives bonus damage";
    t.RequiredTechCount = 1;
    t.RequiredTechs.push_back(201);
    t.Civ = 99;
    t.EffectID = rangedAttack1;
    this->df->Techs.push_back(t);
    techIDs.push_back((int)(this->df->Techs.size() - 1));

    // Infantry armor
    e.EffectCommands.clear();
    e.Name = "+1 bonus armor for infantry units";
    for (int i = 0; i < 40; i++) {
        if (i != 4 && i != 3) {
            e.EffectCommands.push_back(createEC(4, -1, 6, 8, amountTypetoD(1, i)));
            e.EffectCommands.push_back(createEC(4, 1831, -1, 8, amountTypetoD(1, i)));
        }
    }
    this->df->Effects.push_back(e);
    int infantryArmor1 = (int)(this->df->Effects.size() - 1);

    t = Tech();
    t.Name = "Scale Mail Armor gives bonus resistance";
    t.RequiredTechCount = 1;
    t.RequiredTechs.push_back(74);
    t.Civ = 99;
    t.EffectID = infantryArmor1;
    this->df->Techs.push_back(t);
    techIDs.push_back((int)(this->df->Techs.size() - 1));

    t = Tech();
    t.Name = "Chain Mail Armor gives bonus resistance";
    t.RequiredTechCount = 1;
    t.RequiredTechs.push_back(76);
    t.Civ = 99;
    t.EffectID = infantryArmor1;
    this->df->Techs.push_back(t);
    techIDs.push_back((int)(this->df->Techs.size() - 1));

    t = Tech();
    t.Name = "Plate Mail Armor gives bonus resistance";
    t.RequiredTechCount = 1;
    t.RequiredTechs.push_back(77);
    t.Civ = 99;
    t.EffectID = infantryArmor1;
    this->df->Techs.push_back(t);
    techIDs.push_back((int)(this->df->Techs.size() - 1));

    // Cavalry armor
    e.EffectCommands.clear();
    e.Name = "+1 bonus armor for cavalry units";
    for (int i = 0; i < 40; i++) {
        if (i != 4 && i != 3) {
            e.EffectCommands.push_back(createEC(4, -1, 12, 8, amountTypetoD(1, i)));
            e.EffectCommands.push_back(createEC(4, -1, 47, 8, amountTypetoD(1, i)));
            e.EffectCommands.push_back(createEC(4, 1738, -1, 8, amountTypetoD(1, i)));
            e.EffectCommands.push_back(createEC(4, 1740, -1, 8, amountTypetoD(1, i)));
        }
    }
    this->df->Effects.push_back(e);
    int cavalryArmor1 = (int)(this->df->Effects.size() - 1);

    t = Tech();
    t.Name = "Scale Barding Armor gives bonus resistance";
    t.RequiredTechCount = 1;
    t.RequiredTechs.push_back(81);
    t.Civ = 99;
    t.EffectID = cavalryArmor1;
    this->df->Techs.push_back(t);
    techIDs.push_back((int)(this->df->Techs.size() - 1));

    t = Tech();
    t.Name = "Chain Barding Armor gives bonus resistance";
    t.RequiredTechCount = 1;
    t.RequiredTechs.push_back(82);
    t.Civ = 99;
    t.EffectID = cavalryArmor1;
    this->df->Techs.push_back(t);
    techIDs.push_back((int)(this->df->Techs.size() - 1));

    t = Tech();
    t.Name = "Plate Barding Armor gives bonus resistance";
    t.RequiredTechCount = 1;
    t.RequiredTechs.push_back(80);
    t.Civ = 99;
    t.EffectID = cavalryArmor1;
    this->df->Techs.push_back(t);
    techIDs.push_back((int)(this->df->Techs.size() - 1));

    // Archer armor
    e.EffectCommands.clear();
    e.Name = "+1 bonus armor for archer units";
    for (int i = 0; i < 40; i++) {
        if (i != 4 && i != 3) {
            e.EffectCommands.push_back(createEC(4, -1, 0, 8, amountTypetoD(1, i)));
            e.EffectCommands.push_back(createEC(4, -1, 36, 8, amountTypetoD(1, i)));
            e.EffectCommands.push_back(createEC(4, -1, 44, 8, amountTypetoD(1, i)));
            e.EffectCommands.push_back(createEC(4, -1, 23, 8, amountTypetoD(1, i)));
            e.EffectCommands.push_back(createEC(4, 1738, -1, 8, amountTypetoD(1, i)));
            e.EffectCommands.push_back(createEC(4, 1740, -1, 8, amountTypetoD(1, i)));
        }
    }
    this->df->Effects.push_back(e);
    int archerArmor1 = (int)(this->df->Effects.size() - 1);

    t = Tech();
    t.Name = "Padded Archer Armor gives bonus resistance";
    t.RequiredTechCount = 1;
    t.RequiredTechs.push_back(211);
    t.Civ = 99;
    t.EffectID = archerArmor1;
    this->df->Techs.push_back(t);
    techIDs.push_back((int)(this->df->Techs.size() - 1));

    t = Tech();
    t.Name = "Leather Archer Armor gives bonus resistance";
    t.RequiredTechCount = 1;
    t.RequiredTechs.push_back(212);
    t.Civ = 99;
    t.EffectID = archerArmor1;
    this->df->Techs.push_back(t);
    techIDs.push_back((int)(this->df->Techs.size() - 1));

    t = Tech();
    t.Name = "Ring Archer Armor gives bonus resistance";
    t.RequiredTechCount = 1;
    t.RequiredTechs.push_back(219);
    t.Civ = 99;
    t.EffectID = archerArmor1;
    this->df->Techs.push_back(t);
    techIDs.push_back((int)(this->df->Techs.size() - 1));

    this->civBonuses[CIV_BONUS_327_BLACKSMITH_UPGRADES_AFFECT_BONUS_DAMAGE] = techIDs;

    // Cav archers dodge
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(0, -1, 36, 59, 1));
    e.EffectCommands.push_back(createEC(0, -1, 36, 60, 0.05));
    e.EffectCommands.push_back(createEC(0, -1, 36, 61, 0));
    e.EffectCommands.push_back(createEC(0, -1, 36, 62, 4));
    this->createCivBonus(CIV_BONUS_328_CAV_ARCHERS_DODGE, e, "C-Bonus, cav archers dodge");

    // Khmer farms
    techIDs = {654};

    t = Tech();
    t.Name = "Mill requirement";
    t.Civ = 99;
    this->df->Techs.push_back(t);
    this->df->Techs[216].RequiredTechs[2] = (int)(this->df->Techs.size() - 1);
    techIDs.push_back((int)(this->df->Techs.size() - 1));

    this->civBonuses[CIV_BONUS_329_FARMERS_DON_T_REQUIRE_MILLS_TOWN_CENTERS] = techIDs;

    // 2x2 farms
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(3, 50, UNIT_SMALL_FARM, -1, 0));
    e.EffectCommands.push_back(createEC(3, 357, UNIT_SMALL_DEAD_FARM, -1, 0));
    e.EffectCommands.push_back(createEC(3, 1187, UNIT_SMALL_RICE_FARM, -1, 0));
    e.EffectCommands.push_back(createEC(3, 1188, UNIT_SMALL_DEAD_RICE_FARM, -1, 0));
    e.EffectCommands.push_back(createEC(3, 1193, UNIT_SMALL_FARM_DROP, -1, 0));
    e.EffectCommands.push_back(createEC(3, 1194, UNIT_SMALL_FARM_STACK, -1, 0));
    e.EffectCommands.push_back(createEC(3, 1195, UNIT_SMALL_RICE_FARM_DROP, -1, 0));
    this->createCivBonus(CIV_BONUS_330_2X2_FARMS, e, "C-Bonus, 2x2 farms");

    // Archery range techs cost -50%
    e.EffectCommands.clear();
    e.Name = "C-Bonus, Archery techs cost -50%";
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "C-Bonus, Archery techs cost -50%";
    t.EffectID = (this->df->Effects.size() - 1);
    t.Civ = 99;
    this->df->Techs.push_back(t);
    this->civBonuses[CIV_BONUS_290_BARRACKS_TECHNOLOGIES_COST_50] = {(int)(this->df->Techs.size() - 1)};

    // Feudal Knights
    techIDs.clear();
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(2, UNIT_FEUDAL_KNIGHT, 1, -1, 0));
    e.Name = "Feudal Knight (make avail)";
    df->Effects.push_back(e);

    t = Tech();
    t.Name = "Feudal Knight (make avail)";
    t.RequiredTechs.push_back(101);
    t.RequiredTechCount = 1;
    t.Civ = 99;
    t.EffectID = (df->Effects.size() - 1);
    df->Techs.push_back(t);
    techIDs.push_back((int)(df->Techs.size() - 1));

    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(3, UNIT_FEUDAL_KNIGHT, 38, -1, 0));
    e.Name = "Upgrade knights Feudal";
    df->Effects.push_back(e);

    t = Tech();
    t.Name = "Upgrade knights Castle";
    t.RequiredTechs.push_back(102);
    t.RequiredTechs.push_back(techIDs[0]);
    t.RequiredTechs.push_back(166);
    t.RequiredTechCount = 3;
    t.Civ = 99;
    t.EffectID = (df->Effects.size() - 1);
    df->Techs.push_back(t);
    techIDs.push_back((int)(df->Techs.size() - 1));

    this->civBonuses[CIV_BONUS_332_KNIGHTS_AVAILABLE_IN_FEUDAL_AGE_WITH_30HP] = techIDs;

    // Siege Towers shoot bullets
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, 1105, -1, 9, amountTypetoD(6, 3)));
    e.EffectCommands.push_back(createEC(4, 1105, -1, 9, amountTypetoD(6, 11)));
    e.EffectCommands.push_back(createEC(4, UNIT_TC_SIEGE_TOWER, -1, 9, amountTypetoD(6, 3)));
    e.EffectCommands.push_back(createEC(4, UNIT_TC_SIEGE_TOWER, -1, 9, amountTypetoD(6, 11)));
    this->createCivBonus(CIV_BONUS_333_SIEGE_TOWERS_CAN_FIRE_ARROWS, e, "C-Bonus, siege towers fire arrows");

    // Fire lancers/ships move faster
    this->civBonuses[CIV_BONUS_334_FIRE_LANCERS_AND_FIRE_SHIPS_MOVE_5] = {
        TECH_C_BONUS_FIRE_LANCER_AND_SHIP_SPEED_CASTLE, 
        TECH_C_BONUS_FIRE_LANCER_AND_SHIP_SPEED_IMP
    };

    // Archery Unit technologies at the Archery Range and Blacksmith cost -25%
    this->civBonuses[CIV_BONUS_335_ARCHERY_UNIT_TECHNOLOGIES_AT_THE_ARCHERY_RANGE] = {TECH_C_BONUS_CHEAPER_ARCHER_UPG};

    // Siege Weapons and Siege Warships move +10/15% faster in Castle/Imperial Age
    this->civBonuses[CIV_BONUS_336_SIEGE_WEAPONS_AND_SIEGE_WARSHIPS_MOVE_10] = {
        TECH_C_BONUS_SIEGE_PLUS_10_PERCENT_MOVEMENT, 
        TECH_C_BONUS_SIEGE_PLUS_15_PERCENT_MOVEMENT
    };

    // War Chariots
    this->civBonuses[CIV_BONUS_337_CAN_RECRUIT_WAR_CHARIOTS] = {TECH_WAR_CHARIOT_MAKE_AVAIL};

    // Liu Bei
    this->civBonuses[CIV_BONUS_338_GAIN_ACCESS_TO_LIU_BEI] = {TECH_LIU_BEI_MAKE_AVAIL};

    // Military production buildings and Docks provide +65 food
    this->civBonuses[CIV_BONUS_339_MILITARY_PRODUCTION_BUILDINGS_AND_DOCKS_PROVIDE_65] = {TECH_C_BONUS_MILITARY_BUILDINGS_PLUS_65F};

    // Infantry regenerates 10/20/30 HP per minute in Feudal/Castle/Imperial Age
    this->civBonuses[CIV_BONUS_340_INFANTRY_REGENERATES_10_20_30_HP_PER] = {
        TECH_C_BONUS_INF_REGEN_FEUDAL, 
        TECH_C_BONUS_INF_REGEN_CASTLE, 
        TECH_C_BONUS_INF_REGEN_IMP
    };

    // Jian Swordsmen and Hei Guang Cavalry +2 attack in Imperial Age
    this->civBonuses[CIV_BONUS_341_JIAN_SWORDSMEN_AND_HEI_GUANG_CAVALRY_2] = {TECH_C_BONUS_JIAN_HEI_KUANG_ATTACK};

    // Careening, Dry Dock available one age earlier, cost and research time -75%
    this->civBonuses[CIV_BONUS_342_CAREENING_DRY_DOCK_AVAILABLE_ONE_AGE_EARLIER] = {
        TECH_CAREENING_REQUIREMENT, 
        TECH_DRY_DOCK_REQUIREMENT, 
        TECH_C_BONUS_EARLY_CAREENING_DRY_DOCK
    };

    // Jian Swordsmen
    this->civBonuses[CIV_BONUS_343_CAN_RECRUIT_JIAN_SWORDSMEN] = {TECH_JIAN_SWORDSMAN_MAKE_AVAIL};

    // Sun Jian
    this->civBonuses[CIV_BONUS_344_GAIN_ACCESS_TO_SUN_JIAN] = {TECH_SUN_JIAN_MAKE_AVAIL};

    // Receive one free Villager for each Mill, Lumber- and Mining Camp technology researched
    this->civBonuses[CIV_BONUS_345_RECEIVE_ONE_FREE_VILLAGER_FOR_EACH_MILL] = {
        TECH_C_BONUS_FRE_VILL_PLUS_BIT_AXE, 
        TECH_C_BONUS_FRE_VILL_PLUS_BOW_SAW, 
        TECH_C_BONUS_FRE_VILL_PLUS_TWO_MAN_SAW, 
        TECH_C_BONUS_FRE_VILL_PLUS_HORSE_COLLAR, 
        TECH_C_BONUS_FRE_VILL_PLUS_HEAVY_PLOW, 
        TECH_C_BONUS_FRE_VILL_PLUS_CROP_ROTATION, 
        TECH_C_BONUS_FRE_VILL_PLUS_GOLD_MINING, 
        TECH_C_BONUS_FRE_VILL_PLUS_GOLD_SHAFT, 
        TECH_C_BONUS_FRE_VILL_PLUS_STONE_MINING, 
        TECH_C_BONUS_FRE_VILL_PLUS_STONE_SHAFT
    };

    // Hei Guang Cavalry and Xianbei Raider +15/30% HP in Castle/Imperial Age
    this->civBonuses[CIV_BONUS_346_HEI_GUANG_CAVALRY_AND_XIANBEI_RAIDER_15] = {
        TECH_C_BONUS_HEAVY_CAV_PLUS_15_PERCENT_HP_PLUS_BL, 
        TECH_C_BONUS_HEAVY_CAV_PLUS_30_PERCENT_HP_PLUS_BL, 
        TECH_C_BONUS_HEAVY_CAV_PLUS_15_PERCENT_HP, 
        TECH_C_BONUS_HEAVY_CAV_PLUS_30_PERCENT_HP
    };

    // Trebuchet units cost -25%
    this->civBonuses[CIV_BONUS_347_TRACTION_TREBUCHETS_AND_LOU_CHUANS_COST_25] = {TECH_C_BONUS_CHEAPER_TRACTION_TREB};

    // Xianbei Raiders
    this->civBonuses[CIV_BONUS_348_CAN_RECRUIT_XIANBEI_RAIDERS] = {TECH_XIANBEI_RAIDER_MAKE_AVAIL};

    // Cao Cao
    this->civBonuses[CIV_BONUS_349_GAIN_ACCESS_TO_CAO_CAO] = {TECH_CAO_CAO_MAKE_AVAIL};

    // Meat of hunted and livestock animals doesn't decay
    this->civBonuses[CIV_BONUS_350_MEAT_OF_HUNTED_AND_LIVESTOCK_ANIMALS_DOESN_T_DECAY] = {TECH_C_BONUS_ANIMALS_DON_T_DECAY};

    // Mounted units and Fire Lancers attack +20% faster starting in Feudal Age
    this->civBonuses[CIV_BONUS_351_MOUNTED_UNITS_AND_FIRE_LANCERS_ATTACK_20] = {TECH_C_BONUS_CAV_FIRE_LANCER_PLUS_20_PERCENT_ATTACK};

    // Siege Engineers available in Castle Age
    this->civBonuses[CIV_BONUS_352_SIEGE_ENGINEERS_AVAILABLE_IN_CASTLE_AGE] = {TECH_SIEGE_ENGINEERS_REQUIREMENT};

    // Siege and Fortification upgrades cost -75% wood and research +100% faster
    this->civBonuses[CIV_BONUS_353_SIEGE_AND_FORTIFICATION_UPGRADES_COST_75_WOOD] = {TECH_C_BONUS_SIEGE_AND_DEFENSIVE_TECHS};

    // Units receive -50% friendly fire damage
    this->civBonuses[CIV_BONUS_354_UNITS_RECEIVE_50_FRIENDLY_FIRE_DAMAGE] = {TECH_C_BONUS_NO_FRIENDLY_DAMAGE};

    // Grenadiers
    this->civBonuses[CIV_BONUS_355_CAN_RECRUIT_GRENADIERS] = {TECH_GRENADIER_MAKE_AVAIL};

    // Pastures
    this->df->Effects[1008].EffectCommands.push_back(createEC(102, -1, -1, -1, 216));
    this->civBonuses[CIV_BONUS_356_PASTURES_REPLACE_FARMS_AND_MILL_UPGRADES] = {
        TECH_C_BONUS_PASTURES, 
        TECH_TRANSHUMANCE, 
        TECH_PASTORALISM, 
        TECH_DOMESTICATION
    };

    // Shepherds and Herders generate +10% additional food
    this->civBonuses[CIV_BONUS_357_SHEPHERDS_AND_HERDERS_GENERATE_10_ADDITIONAL_FOOD] = {TECH_RESERVED_20};

    // Melee attack upgrade effects are doubled
    this->civBonuses[CIV_BONUS_358_MELEE_ATTACK_UPGRADE_EFFECTS_ARE_DOUBLED] = {
        TECH_C_BONUS_DOUBLE_FORGING, 
        TECH_C_BONUS_DOUBLE_IRON_CASTING, 
        TECH_C_BONUS_DOUBLE_BLAST_FURNACE
    };

    // Skirmishers, Spearman- and Scout Cavalry-line train and upgrade +25% faster
    this->civBonuses[CIV_BONUS_359_SKIRMISHERS_SPEARMAN_AND_SCOUT_CAVALRY_LINE_TRAIN] = {TECH_C_BONUS_SKIRMS_SPEAR_SCOUT_TRAIN_25_PERCENT_FASTER};

    // Heavy Cavalry Archer upgrade available in Castle Age and costs -50%
    this->civBonuses[CIV_BONUS_360_HEAVY_CAVALRY_ARCHER_UPGRADE_AVAILABLE_IN_CASTLE] = {TECH_C_BONUS_EARLY_PLUS_CHEAPER_HCA};

    // Mounted Trebuchets
    this->civBonuses[CIV_BONUS_361_CAN_TRAIN_MOUNTED_TREBUCHETS] = {TECH_MOUNTED_TREBUCHET_MAKE_AVAIL};

    // Make all the trickle bonuses work with each other
    // Stone to gold + roman villagers
    e.EffectCommands.clear();
    e.Name = "Roman workers stone to gold trickle";
    e.EffectCommands.push_back(createEC(6, 241, -1, -1, 1.05));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Roman workers stone to gold trickle";
    t.RequiredTechs.push_back(887);
    t.RequiredTechs.push_back(805);
    t.RequiredTechCount = 2;
    t.EffectID = (this->df->Effects.size() - 1);
    t.Civ = -1;
    this->df->Techs.push_back(t);

    // Lumberjack food + roman villagers
    e.EffectCommands.clear();
    e.Name = "Roman workers food to wood trickle";
    e.EffectCommands.push_back(createEC(6, 502, -1, -1, 1.05));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Roman workers food to wood trickle";
    t.RequiredTechs.push_back(887);
    t.RequiredTechs.push_back(1071);
    t.RequiredTechCount = 2;
    t.EffectID = (this->df->Effects.size() - 1);
    t.Civ = -1;
    this->df->Techs.push_back(t);

    // Lumberjack food + celt lumberjacks
    e.EffectCommands.clear();
    e.Name = "Celt workers food to wood trickle";
    e.EffectCommands.push_back(createEC(6, 502, -1, -1, 1.15));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Celt workers food to wood trickle";
    t.RequiredTechs.push_back(385);
    t.RequiredTechs.push_back(1071);
    t.RequiredTechCount = 2;
    t.EffectID = (this->df->Effects.size() - 1);
    t.Civ = -1;
    this->df->Techs.push_back(t);

    // Stone to gold + stone mining bonus
    e.EffectCommands.clear();
    e.Name = "Stone mining C-Bonus gold generation increase";
    e.EffectCommands.push_back(createEC(6, 241, -1, -1, 1.2));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Stone mining C-Bonus gold generation increase";
    t.RequiredTechs.push_back(805);
    t.RequiredTechs.push_back(this->civBonuses[CIV_BONUS_135_STONE_MINERS_WORK_20_FASTER][0]);
    t.RequiredTechCount = 2;
    t.EffectID = (this->df->Effects.size() - 1);
    t.Civ = -1;
    this->df->Techs.push_back(t);

    // Stone to gold + mule cart effectiveness
    e.EffectCommands.clear();
    e.Name = "Mule cart effectiveness gold generation increase (stone to gold)";
    e.EffectCommands.push_back(createEC(6, 241, -1, -1, 1.05217));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Mule cart effectiveness gold generation increase (stone mining)";
    t.RequiredTechs.push_back(805);
    t.RequiredTechs.push_back(965);
    t.RequiredTechCount = 2;
    t.EffectID = (this->df->Effects.size() - 1);
    t.Civ = -1;
    this->df->Techs.push_back(t);

    t = Tech();
    t.Name = "Mule cart effectiveness gold generation increase (stone shaft mining)";
    t.RequiredTechs.push_back(805);
    t.RequiredTechs.push_back(966);
    t.RequiredTechCount = 2;
    t.EffectID = (this->df->Effects.size() - 1);
    t.Civ = -1;
    this->df->Techs.push_back(t);

    // Wood to gold + Roman workers
    e.EffectCommands.clear();
    e.Name = "Roman workers wood to gold trickle";
    e.EffectCommands.push_back(createEC(6, 266, -1, -1, 1.05));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Roman workers wood to gold trickle";
    t.RequiredTechs.push_back(887);
    t.RequiredTechs.push_back(629);
    t.RequiredTechCount = 2;
    t.EffectID = (this->df->Effects.size() - 1);
    t.Civ = -1;
    this->df->Techs.push_back(t);

    // Wood to gold + mule cart effectiveness
    e.EffectCommands.clear();
    e.Name = "Mule cart effectiveness gold generation increase (wood to gold 1)";
    e.EffectCommands.push_back(createEC(6, 266, -1, -1, 1.06667));
    this->df->Effects.push_back(e);

    e.EffectCommands.clear();
    e.Name = "Mule cart effectiveness gold generation increase (wood to gold 2)";
    e.EffectCommands.push_back(createEC(6, 266, -1, -1, 1.03636));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Mule cart effectiveness gold generation increase (double-bit axe)";
    t.RequiredTechs.push_back(629);
    t.RequiredTechs.push_back(960);
    t.RequiredTechCount = 2;
    t.EffectID = (this->df->Effects.size() - 2);
    t.Civ = -1;
    this->df->Techs.push_back(t);

    t = Tech();
    t.Name = "Mule cart effectiveness gold generation increase (bow saw)";
    t.RequiredTechs.push_back(629);
    t.RequiredTechs.push_back(961);
    t.RequiredTechCount = 2;
    t.EffectID = (this->df->Effects.size() - 2);
    t.Civ = -1;
    this->df->Techs.push_back(t);

    t = Tech();
    t.Name = "Mule cart effectiveness gold generation increase (two-man saw)";
    t.RequiredTechs.push_back(629);
    t.RequiredTechs.push_back(962);
    t.RequiredTechCount = 2;
    t.EffectID = (this->df->Effects.size() - 1);
    t.Civ = -1;
    this->df->Techs.push_back(t);

    // Wood to gold + wood chopping bonus
    e.EffectCommands.clear();
    e.Name = "Wood chopping bonus gold generation increase";
    e.EffectCommands.push_back(createEC(6, 266, -1, -1, 1.15));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Wood chopping bonus gold generation increase";
    t.RequiredTechs.push_back(629);
    t.RequiredTechs.push_back(385);
    t.RequiredTechCount = 2;
    t.EffectID = (this->df->Effects.size() - 1);
    t.Civ = -1;
    this->df->Techs.push_back(t);

    // Berries to wood + Roman workers
    e.EffectCommands.clear();
    e.Name = "Roman workers berries to wood trickle";
    e.EffectCommands.push_back(createEC(6, 267, -1, -1, 1.05));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Roman workers berries to wood trickle";
    t.RequiredTechs.push_back(887);
    t.RequiredTechs.push_back(453);
    t.RequiredTechCount = 2;
    t.EffectID = (this->df->Effects.size() - 1);
    t.Civ = -1;
    this->df->Techs.push_back(t);

    // Berries to gold + foraging bonus
    e.EffectCommands.clear();
    e.Name = "Foraging bonus wood generation increase";
    e.EffectCommands.push_back(createEC(6, 267, -1, -1, 1.1));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Foraging bonus wood generation increase";
    t.RequiredTechs.push_back(453);
    t.RequiredTechs.push_back(524);
    t.RequiredTechCount = 2;
    t.EffectID = (this->df->Effects.size() - 1);
    t.Civ = -1;
    this->df->Techs.push_back(t);

    // Farms to gold + Roman workers
    e.EffectCommands.clear();
    e.Name = "Roman workers farms to gold trickle";
    e.EffectCommands.push_back(createEC(6, 236, -1, -1, 1.05));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Roman workers farms to gold trickle";
    t.RequiredTechs.push_back(887);
    t.RequiredTechs.push_back(754);
    t.RequiredTechCount = 2;
    t.EffectID = (this->df->Effects.size() - 1);
    t.Civ = -1;
    this->df->Techs.push_back(t);

    // Farms to gold + farming bonus
    e.EffectCommands.clear();
    e.Name = "Farming bonus gold generation increase";
    e.EffectCommands.push_back(createEC(6, 236, -1, -1, 1.15));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Farming bonus gold generation increase";
    t.RequiredTechs.push_back(754);
    t.RequiredTechs.push_back(this->civBonuses[CIV_BONUS_120_FARMERS_WORK_15_FASTER][0]);
    t.RequiredTechCount = 2;
    t.EffectID = (this->df->Effects.size() - 1);
    t.Civ = -1;
    this->df->Techs.push_back(t);

    // Make siege towers that have attack affected by other attacks
    e.EffectCommands.clear();
    e.Name = "Siege tower attack + blacksmith attack";
    for (int i = 0; i < siegeTowers.size(); i++) {
        e.EffectCommands.push_back(createEC(4, siegeTowers[i], -1, 9, amountTypetoD(1, 3)));
        e.EffectCommands.push_back(createEC(4, siegeTowers[i], -1, 9, amountTypetoD(1, 11)));
        e.EffectCommands.push_back(createEC(4, siegeTowers[i], -1, 1, 1));
        e.EffectCommands.push_back(createEC(4, siegeTowers[i], -1, 12, 1));
        e.EffectCommands.push_back(createEC(4, siegeTowers[i], -1, 23, 1));
    }
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Siege tower attack + fletching";
    t.Civ = -1;
    t.RequiredTechCount = 2;
    t.RequiredTechs.push_back(this->civBonuses[CIV_BONUS_333_SIEGE_TOWERS_CAN_FIRE_ARROWS][0]);
    t.RequiredTechs.push_back(199);
    t.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    t = Tech();
    t.Name = "Siege tower attack + bodkin arrow";
    t.Civ = -1;
    t.RequiredTechCount = 2;
    t.RequiredTechs.push_back(this->civBonuses[CIV_BONUS_333_SIEGE_TOWERS_CAN_FIRE_ARROWS][0]);
    t.RequiredTechs.push_back(200);
    t.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    t = Tech();
    t.Name = "Siege tower attack + bracer";
    t.Civ = -1;
    t.RequiredTechCount = 2;
    t.RequiredTechs.push_back(this->civBonuses[CIV_BONUS_333_SIEGE_TOWERS_CAN_FIRE_ARROWS][0]);
    t.RequiredTechs.push_back(201);
    t.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    e.EffectCommands.clear();
    e.Name = "Siege tower attack + chemistry";
    for (int i = 0; i < siegeTowers.size(); i++) {
        e.EffectCommands.push_back(createEC(4, siegeTowers[i], -1, 9, amountTypetoD(1, 3)));
        e.EffectCommands.push_back(createEC(4, siegeTowers[i], -1, 9, amountTypetoD(1, 11)));
    }
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Siege tower attack + chemistry";
    t.Civ = -1;
    t.RequiredTechCount = 2;
    t.RequiredTechs.push_back(this->civBonuses[CIV_BONUS_333_SIEGE_TOWERS_CAN_FIRE_ARROWS][0]);
    t.RequiredTechs.push_back(47);
    t.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    e.EffectCommands.clear();
    e.Name = "Siege tower attack + bonus damage vs cav";
    for (int i = 0; i < siegeTowers.size(); i++) {
        e.EffectCommands.push_back(createEC(4, siegeTowers[i], -1, 9, amountTypetoD(6, 8)));
    }
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Siege tower attack + bonus damage vs cav";
    t.Civ = -1;
    t.RequiredTechCount = 2;
    t.RequiredTechs.push_back(this->civBonuses[CIV_BONUS_333_SIEGE_TOWERS_CAN_FIRE_ARROWS][0]);
    t.RequiredTechs.push_back(this->civBonuses[CIV_BONUS_269_TOWERS_DEAL_EXTRA_DAMAGE_TO_CAVALRY][0]);
    t.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    e.EffectCommands.clear();
    e.Name = "Siege tower attack + yasama";
    for (int i = 0; i < siegeTowers.size(); i++) {
        e.EffectCommands.push_back(createEC(4, siegeTowers[i], -1, 102, 2));
        e.EffectCommands.push_back(createEC(4, siegeTowers[i], -1, 107, 2));
    }
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Siege tower attack + yasama";
    t.Civ = -1;
    t.RequiredTechCount = 2;
    t.RequiredTechs.push_back(this->civBonuses[CIV_BONUS_333_SIEGE_TOWERS_CAN_FIRE_ARROWS][0]);
    t.RequiredTechs.push_back(484);
    t.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    e.EffectCommands.clear();
    e.Name = "Siege tower attack + yeomen";
    for (int i = 0; i < siegeTowers.size(); i++) {
        e.EffectCommands.push_back(createEC(4, siegeTowers[i], -1, 9, amountTypetoD(2, 3)));
        e.EffectCommands.push_back(createEC(4, siegeTowers[i], -1, 9, amountTypetoD(2, 11)));
    }
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Siege tower attack + yeomen";
    t.Civ = -1;
    t.RequiredTechCount = 2;
    t.RequiredTechs.push_back(this->civBonuses[CIV_BONUS_333_SIEGE_TOWERS_CAN_FIRE_ARROWS][0]);
    t.RequiredTechs.push_back(3);
    t.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    t = Tech();
    t.Name = "Siege tower attack + svan towers";
    t.Civ = -1;
    t.RequiredTechCount = 2;
    t.RequiredTechs.push_back(this->civBonuses[CIV_BONUS_333_SIEGE_TOWERS_CAN_FIRE_ARROWS][0]);
    t.RequiredTechs.push_back(923);
    t.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    e.EffectCommands.clear();
    e.Name = "Siege tower attack + stronghold";
    for (int i = 0; i < siegeTowers.size(); i++) {
        e.EffectCommands.push_back(createEC(5, siegeTowers[i], -1, 10, 0.75));
    }
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Siege tower attack + stronghold";
    t.Civ = -1;
    t.RequiredTechCount = 2;
    t.RequiredTechs.push_back(this->civBonuses[CIV_BONUS_333_SIEGE_TOWERS_CAN_FIRE_ARROWS][0]);
    t.RequiredTechs.push_back(482);
    t.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    // Hussite Reforms affects all monk units and works with discounts
    this->df->Effects[812].EffectCommands.push_back(createEC(0, 1811, -1, 105, 0));
    this->df->Effects[812].EffectCommands.push_back(createEC(0, 1811, -1, 103, 90));
    this->df->Effects[812].EffectCommands.push_back(createEC(0, 775, -1, 105, 0));
    this->df->Effects[812].EffectCommands.push_back(createEC(0, 775, -1, 103, 100));

    e.EffectCommands.clear();
    e.Name = "Hussite Reforms + Portuguese discount";
    e.EffectCommands.push_back(createEC(5, -1, 18, 103, 0.8));
    e.EffectCommands.push_back(createEC(5, 1811, -1, 103, 0.8));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Hussite Reforms + Portuguese discount";
    t.Civ = -1;
    t.RequiredTechCount = 2;
    t.RequiredTechs.push_back(559);
    t.RequiredTechs.push_back(785);
    t.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    e.EffectCommands.clear();
    e.Name = "Hussite Reforms + Kshatriyas";
    e.EffectCommands.push_back(createEC(5, -1, 18, 103, 0.75));
    e.EffectCommands.push_back(createEC(5, 1811, -1, 103, 0.75));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Hussite Reforms + Kshatriyas";
    t.Civ = -1;
    t.RequiredTechCount = 2;
    t.RequiredTechs.push_back(835);
    t.RequiredTechs.push_back(785);
    t.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    e.EffectCommands.clear();
    e.Name = "Hussite Reforms + Food Discount 0";
    e.EffectCommands.push_back(createEC(5, -1, 18, 103, 0.9));
    e.EffectCommands.push_back(createEC(5, 1811, -1, 103, 0.9));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Hussite Reforms + Food Discount 0";
    t.Civ = -1;
    t.RequiredTechCount = 2;
    t.RequiredTechs.push_back(152);
    t.RequiredTechs.push_back(785);
    t.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    e.EffectCommands.clear();
    e.Name = "Hussite Reforms + Food Discount 1";
    e.EffectCommands.push_back(createEC(5, -1, 18, 103, 0.944));
    e.EffectCommands.push_back(createEC(5, 1811, -1, 103, 0.944));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Hussite Reforms + Food Discount 1";
    t.Civ = -1;
    t.RequiredTechCount = 2;
    t.RequiredTechs.push_back(153);
    t.RequiredTechs.push_back(785);
    t.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    e.EffectCommands.clear();
    e.Name = "Hussite Reforms + Food Discount 2";
    e.EffectCommands.push_back(createEC(5, -1, 18, 103, 0.941));
    e.EffectCommands.push_back(createEC(5, 1811, -1, 103, 0.941));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Hussite Reforms + Food Discount 2";
    t.Civ = -1;
    t.RequiredTechCount = 2;
    t.RequiredTechs.push_back(154);
    t.RequiredTechs.push_back(785);
    t.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    e.EffectCommands.clear();
    e.Name = "Hussite Reforms + Food Discount 3";
    e.EffectCommands.push_back(createEC(5, -1, 18, 103, 0.9375));
    e.EffectCommands.push_back(createEC(5, 1811, -1, 103, 0.9375));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Hussite Reforms + Food Discount 3";
    t.Civ = -1;
    t.RequiredTechCount = 2;
    t.RequiredTechs.push_back(155);
    t.RequiredTechs.push_back(785);
    t.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    // Saracen market + guilds
    e.EffectCommands.clear();
    e.Name = "Guilds + better market rates";
    e.EffectCommands.push_back(createEC(1, 78, 0, -1, 0.025));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Guilds + better market rates";
    t.Civ = -1;
    t.RequiredTechCount = 2;
    t.RequiredTechs.push_back(355);
    t.RequiredTechs.push_back(15);
    t.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    // Folwark + sicilian farm + horse collar
    e.EffectCommands.clear();
    e.Name = "Folwark + sicilian farm bonus + horse collar";
    e.EffectCommands.push_back(createEC(1, 237, 1, -1, 7.5));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Folwark + sicilian farm bonus + horse collar";
    t.Civ = -1;
    t.RequiredTechCount = 2;
    t.RequiredTechs.push_back(793);
    t.RequiredTechs.push_back(772);
    t.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    // Folwark + sicilian farm + heavy plow
    e.EffectCommands.clear();
    e.Name = "Folwark + sicilian farm bonus + heavy plow";
    e.EffectCommands.push_back(createEC(1, 237, 1, -1, 12.5));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Folwark + sicilian farm bonus + heavy plow";
    t.Civ = -1;
    t.RequiredTechCount = 2;
    t.RequiredTechs.push_back(793);
    t.RequiredTechs.push_back(773);
    t.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    // Folwark + sicilian farm + crop rotation
    e.EffectCommands.clear();
    e.Name = "Folwark + sicilian farm bonus + crop rotation";
    e.EffectCommands.push_back(createEC(1, 237, 1, -1, 17.5));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Folwark + sicilian farm bonus + crop rotation";
    t.Civ = -1;
    t.RequiredTechCount = 2;
    t.RequiredTechs.push_back(793);
    t.RequiredTechs.push_back(774);
    t.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    // Folwark + sicilian farm + horse collar + chinese TB
    e.EffectCommands.clear();
    e.Name = "Folwark + sicilian farm bonus + horse collar + chinese TB";
    e.EffectCommands.push_back(createEC(1, 237, 1, -1, 0.75));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Folwark + sicilian farm bonus + horse collar + chinese TB";
    t.Civ = -1;
    t.RequiredTechCount = 3;
    t.RequiredTechs.push_back(793);
    t.RequiredTechs.push_back(232);
    t.RequiredTechs.push_back(772);
    t.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    // Folwark + sicilian farm + heavy plow + chinese TB
    e.EffectCommands.clear();
    e.Name = "Folwark + sicilian farm bonus + heavy plow + chinese TB";
    e.EffectCommands.push_back(createEC(1, 237, 1, -1, 1.25));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Folwark + sicilian farm bonus + heavy plow + chinese TB";
    t.Civ = -1;
    t.RequiredTechCount = 3;
    t.RequiredTechs.push_back(793);
    t.RequiredTechs.push_back(232);
    t.RequiredTechs.push_back(773);
    t.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    // Folwark + sicilian farm + crop rotation + chinese TB
    e.EffectCommands.clear();
    e.Name = "Folwark + sicilian farm bonus + crop rotation + chinese TB";
    e.EffectCommands.push_back(createEC(1, 237, 1, -1, 1.75));
    this->df->Effects.push_back(e);

    t = Tech();
    t.Name = "Folwark + sicilian farm bonus + crop rotation + chinese TB";
    t.Civ = -1;
    t.RequiredTechCount = 3;
    t.RequiredTechs.push_back(793);
    t.RequiredTechs.push_back(232);
    t.RequiredTechs.push_back(774);
    t.EffectID = (int)(this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);
}

void Civbuilder::createTeamBonuses() {
    Effect e = Effect();

    // Scorpions minimum range reduced
    this->teamBonuses[38] = 891;

    // Trade +50 HP
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, -1, 2, 0, 50));
    e.EffectCommands.push_back(createEC(4, -1, 19, 0, 50));
    this->createTeamBonus(39, e, "Trade +50 HP");

    // Houses built +100% faster
    e.EffectCommands.clear();
    for (int i = 0; i < houses.size(); i++) {
        e.EffectCommands.push_back(createEC(5, houses[i], -1, 101, 0.5));
    }
    this->createTeamBonus(40, e, "Houses built +100% faster");

    // Monks +2 LOS
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, -1, 18, 1, 2));
    e.EffectCommands.push_back(createEC(4, -1, 43, 1, 2));
    e.EffectCommands.push_back(createEC(4, 1811, -1, 1, 2));
    this->createTeamBonus(41, e, "Monks +2 LOS");

    // Herdables +2 LOS
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, -1, 58, 1, 2));
    this->createTeamBonus(42, e, "Herdables +2 LOS");

    // Economic buildings built +100% faster
    e.EffectCommands.clear();
    for (int i = 0; i < ecoBuildings.size(); i++) {
        e.EffectCommands.push_back(createEC(5, ecoBuildings[i], -1, 101, 0.5));
    }
    this->createTeamBonus(43, e, "Drop-off buildings built +100% faster");

    // Unique units +5% HP
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["unique"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["unique"][i], -1, 0, 1.05));
    }
    this->createTeamBonus(44, e, "Unique units +5% HP");

    // Trash units train 20% faster
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["spear"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["spear"][i], -1, 101, 0.833));
    }
    for (int i = 0; i < this->unitClasses["skirmisher"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["skirmisher"][i], -1, 101, 0.833));
    }
    for (int i = 0; i < this->unitClasses["lightCav"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["lightCav"][i], -1, 101, 0.833));
    }
    this->createTeamBonus(45, e, "Trash units train 20% faster");

    // Fishing ships +2 LOS
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, -1, 21, 1, 2));
    this->createTeamBonus(46, e, "Fishing ships +2 LOS");

    // Scout-line +2 vs gunpowder
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["lightCav"].size(); i++) {
        e.EffectCommands.push_back(createEC(4, this->unitClasses["lightCav"][i], -1, 9, amountTypetoD(2, 23)));
    }
    this->createTeamBonus(47, e, "Scout-line +2 vs. gunpowder");

    // Infantry +10 vs elephants
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, -1, 6, 9, amountTypetoD(10, 5)));
    this->createTeamBonus(48, e, "Infantry +5 vs. elephants");

    // All explosive units +20% speed
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["explosive"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["explosive"][i], -1, 5, 1.2));
    }
    this->createTeamBonus(49, e, "Explosive units +20% speed");

    // All resources last 5% longer
    e.EffectCommands.clear();
    for (int i = 0; i < productivityRates.size(); i++) {
        e.EffectCommands.push_back(createEC(6, productivityRates[i], -1, -1, 1.05));
    }
    for (int i = 0; i < gatherRates.size(); i++) {
        e.EffectCommands.push_back(createEC(5, gatherRates[i], -1, 13, 0.95238));
    }
    this->createTeamBonus(50, e, "Resources last 5% longer");

    // Castles, Kreposts, Donjons work 10% faster
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(5, 82, -1, 13, 1.1));
    e.EffectCommands.push_back(createEC(5, 1251, -1, 13, 1.1));
    e.EffectCommands.push_back(createEC(5, -1, 52, 13, 1.1));
    this->createTeamBonus(51, e, "Stone production buildings work 10% faster");

    // Markets +80% work rate
    this->teamBonuses[52] = 804;

    // Steppe Lancers +3 LOS
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["steppe"].size(); i++) {
        e.EffectCommands.push_back(createEC(4, this->unitClasses["steppe"][i], -1, 1, 3));
    }
    this->createTeamBonus(53, e, "Steppe Lancers +3 LOS");

    // Spearmen +3 vs cavalry
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["spear"].size(); i++) {
        e.EffectCommands.push_back(createEC(4, this->unitClasses["spear"][i], -1, 9, amountTypetoD(3, 8)));
    }
    this->createTeamBonus(54, e, "Spearmen +3 vs. cavalry");

    // Elephants +4 vs buildings
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["elephant"].size(); i++) {
        e.EffectCommands.push_back(createEC(4, this->unitClasses["elephant"][i], -1, 9, amountTypetoD(4, 21)));
    }
    this->createTeamBonus(55, e, "Elephants +4 vs. buildings");

    // Shock Infantry +2 LOS
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["shock"].size(); i++) {
        e.EffectCommands.push_back(createEC(4, this->unitClasses["shock"][i], -1, 1, 2));
    }
    this->createTeamBonus(56, e, "Shock Infantry +2 LOS");

    // Docks +20% work rate
    e.EffectCommands.clear();
    for (int i = 0; i < docks.size(); i++) {
        e.EffectCommands.push_back(createEC(5, docks[i], -1, 13, 1.2));
    }
    this->createTeamBonus(57, e, "Docks +20% work rate");

    // Monasteries 3x HP
    e.EffectCommands.clear();
    for (int i = 0; i < monasteries.size(); i++) {
        e.EffectCommands.push_back(createEC(5, monasteries[i], -1, 0, 3));
    }
    this->createTeamBonus(58, e, "Monasteries 3x HP");

    // Markets 3x HP
    e.EffectCommands.clear();
    for (int i = 0; i < markets.size(); i++) {
        e.EffectCommands.push_back(createEC(5, markets[i], -1, 0, 3));
    }
    this->createTeamBonus(59, e, "Markets 3x HP");

    // Explosive units +6 LOS
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["explosive"].size(); i++) {
        e.EffectCommands.push_back(createEC(4, this->unitClasses["explosive"][i], -1, 1, 6));
    }
    this->createTeamBonus(60, e, "Explosive units +6 LOS");

    // Outposts and towers built quickly
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(5, 598, -1, 101, 0.1));
    e.EffectCommands.push_back(createEC(5, -1, 52, 101, 0.66));
    this->createTeamBonus(61, e, "Outposts and towers built quickly");

    // Siege Towers +50% garrison capacity
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(5, 1105, -1, 2, 1.5));
    this->createTeamBonus(62, e, "Siege towers +50% garrison capacity");

    // Docks built 100% faster
    e.EffectCommands.clear();
    for (int i = 0; i < docks.size(); i++) {
        e.EffectCommands.push_back(createEC(5, docks[i], -1, 101, 0.5));
    }
    this->createTeamBonus(63, e, "Docks built 100% faster");

    // Infantry +2 LOS
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(4, -1, 6, 1, 2));
    this->createTeamBonus(64, e, "Infantry +2 LOS");

    // Trade carts 20% faster when empty
    e.EffectCommands.clear();
    e.EffectCommands.push_back(createEC(5, 128, -1, 5, 1.2));
    e.EffectCommands.push_back(createEC(5, 128, -1, 13, 1.2));
    this->createTeamBonus(65, e, "Trade 20% faster when empty");

    // Explosive units +40% HP
    e.EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["explosive"].size(); i++) {
        e.EffectCommands.push_back(createEC(5, this->unitClasses["explosive"][i], -1, 0, 1.4));
    }
    this->createTeamBonus(66, e, "Explosive units +40% HP");

    // Town Centers +4 LOS
    e.EffectCommands.clear();
    for (int i = 0; i < townCenters.size(); i++) {
        e.EffectCommands.push_back(createEC(4, townCenters[i], -1, 1, 4));
    }
    this->createTeamBonus(67, e, "Town Centers +4 LOS");

    // Unique Unit Elite Upgrade costs -20%
    e.EffectCommands.clear();
    this->createTeamBonus(68, e, "Elite costs -20%");

    // TC spearmen
    e.EffectCommands.clear();
    e.Name = "TC Spearman (make available)";
    e.EffectCommands.push_back(createEC(2, UNIT_TC_SPEARMAN, 1, -1, 0));
    this->df->Effects.push_back(e);
    Tech t = this->df->Techs[113];
    t.Name = "Dupl. Feudal Age";
    t.RequiredTechs[0] = 101;
    this->df->Techs.push_back(t);

    t = this->df->Techs[522];
    t.Name = "TC Spearman (make available)";
    t.RequiredTechs[0] = (int)(df->Techs.size() - 1);
    t.RequiredTechs[1] = 87;
    t.RequiredTechCount = 2;
    t.EffectID = (df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    e.EffectCommands.clear();
    e.Name = "Team Bonus, TC Spearman";
    e.EffectCommands.push_back(createEC(101, (int)(this->df->Techs.size() - 1), 0, 0, 0));
    e.EffectCommands.push_back(createEC(103, (int)(this->df->Techs.size() - 1), -1, 0, 0));
    this->df->Effects.push_back(e);
    this->teamBonuses[72] = (int)(this->df->Effects.size() - 1);

    // Canoes (stats need adjustment -- make it a trash boat)
    for (Civ &civ : this->df->Civs) {
        setTrainButtonID(civ.Units[778].Creatable, 14);
        setTrainLocationID(civ.Units[778].Creatable, 45);
    }

    e.EffectCommands.clear();
    e.Name = "Canoe (make available)";
    e.EffectCommands.push_back(createEC(2, 778, 1, -1, 0));
    this->df->Effects.push_back(e);
    t = this->df->Techs[113];
    t.Name = "Dupl.2 Feudal Age";
    t.RequiredTechs[0] = 101;
    this->df->Techs.push_back(t);

    t = this->df->Techs[522];
    t.Name = "Canoe (make available)";
    t.RequiredTechs[0] = (int)(this->df->Techs.size() - 1);
    t.EffectID = (this->df->Effects.size() - 1);
    this->df->Techs.push_back(t);

    e.EffectCommands.clear();
    e.Name = "Team Bonus, Canoe";
    e.EffectCommands.push_back(createEC(101, (int)(this->df->Techs.size() - 1), 0, 0, 0));
    e.EffectCommands.push_back(createEC(103, (int)(this->df->Techs.size() - 1), -1, 0, 0));
    this->df->Effects.push_back(e);
    this->teamBonuses[73] = (int)(this->df->Effects.size() - 1);

    // Scouts +1 attack vs. archers
    this->teamBonuses[37] = 802;

    // Dravidians TB
    this->teamBonuses[69] = 839;

    // Bengalis TB
    this->teamBonuses[70] = 841;

    // Gurjaras TB
    this->teamBonuses[71] = 843;

    // Georgians TB
    this->teamBonuses[74] = 928;

    // Mounted archers -50% frame delay
    e.EffectCommands.clear();
    e.Name = "Team Bonus, mounted archers -50% frame delay";
    e.EffectCommands.push_back(createEC(5, -1, 36, 41, 0.5));
    e.EffectCommands.push_back(createEC(5, -1, 23, 41, 0.5));
    this->df->Effects.push_back(e);
    this->teamBonuses[75] = (int)(this->df->Effects.size() - 1);

    // Shu TB
    this->teamBonuses[76] = 1029;

    // Wei TB
    this->teamBonuses[77] = 1027;

    // Jurchen TB
    this->teamBonuses[78] = 987;

    // Khitan TB
    this->teamBonuses[79] = 989;
}

void Civbuilder::reconfigureEffects() {
    cout << "[C++]: Starting reconfigureEffects..." << endl;
    
    // Give classes these bonuses so that they can be modified with effects
    cout << "[C++]: Giving class bonuses..." << endl;
    giveClassNewBonus(this->df, 6, 10);
    giveUnitsNewBonus(this->df, this->unitClasses["steppe"], 10);
    giveClassNewBonus(this->df, 22, 10);
    giveUnitsNewBonus(this->df, this->unitClasses["skirmisher"], 1);
    giveUnitsNewBonus(this->df, this->unitClasses["footArcher"], 10);
    giveUnitsNewBonus(this->df, this->unitClasses["skirmisher"], 10);
    giveUnitsNewBonus(this->df, this->unitClasses["gunpowder"], 30);
    giveUnitsNewBonus(this->df, this->unitClasses["shock"], 13);
    giveUnitsNewBonus(this->df, this->unitClasses["shock"], 22);
    giveUnitsNewBonus(this->df, this->unitClasses["shock"], 26);
    giveUnitsNewBonus(this->df, this->unitClasses["lightCav"], 13);
    giveUnitsNewBonus(this->df, this->unitClasses["lightCav"], 22);
    giveUnitsNewBonus(this->df, this->unitClasses["lightCav"], 26);
    giveUnitsNewBonus(this->df, {82, 1251}, 11);
    giveUnitsNewBonus(this->df, {236}, 17);
    giveClassNewBonus(this->df, 52, 8);
    giveUnitsNewBonus(this->df, this->unitClasses["lightCav"], 23);
    giveClassNewBonus(this->df, 6, 5);
    giveUnitsNewBonus(this->df, this->unitClasses["unique"], 32);
    giveUnitsNewBonus(this->df, this->unitClasses["unique"], 1);
    giveUnitsNewBonus(this->df, siegeTowers, 8);
    giveUnitsNewBonus(this->df, this->unitClasses["unique"], 19);
    giveClassNewBonus(this->df, 52, 19);
    giveClassNewBonus(this->df, 36, 19);

    cout << "[C++]: Recompiling units lists..." << endl;
    // Recompile units list
    vector<int> barracksUnits = {};
    for (int i = 0; i < this->df->Civs[0].Units.size(); i++) {
        if (this->df->Civs[0].Units[i].Creatable.TrainLocations.size() > 0 
            && this->df->Civs[0].Units[i].Creatable.TrainLocations[0].UnitID == 12) {
            barracksUnits.push_back(i);
        }
    }

    vector<int> stableUnits = {};
    for (int i = 0; i < this->df->Civs[0].Units.size(); i++) {
        if (this->df->Civs[0].Units[i].Creatable.TrainLocations.size() > 0 
            && this->df->Civs[0].Units[i].Creatable.TrainLocations[0].UnitID == 101) {
            stableUnits.push_back(i);
        }
    }

    vector<int> rangeUnits = {};
    for (int i = 0; i < this->df->Civs[0].Units.size(); i++) {
        if (this->df->Civs[0].Units[i].Creatable.TrainLocations.size() > 0 
            && this->df->Civs[0].Units[i].Creatable.TrainLocations[0].UnitID == 87) {
            rangeUnits.push_back(i);
        }
    }

    vector<int> workshopUnits = {};
    for (int i = 0; i < this->df->Civs[0].Units.size(); i++) {
        if (this->df->Civs[0].Units[i].Creatable.TrainLocations.size() > 0 
            && this->df->Civs[0].Units[i].Creatable.TrainLocations[0].UnitID == 49) {
            workshopUnits.push_back(i);
        }
    }

    cout << "[C++]: Recreating building bonuses..." << endl;
    // Recreate barracks bonuses
    this->df->Effects[333].EffectCommands.clear();
    this->df->Effects[334].EffectCommands.clear();
    this->df->Effects[618].EffectCommands.clear();
    this->df->Effects[619].EffectCommands.clear();
    this->df->Effects[620].EffectCommands.clear();
    for (int i = 0; i < barracksUnits.size(); i++) {
        // Teuton armor bonus (barracks)
        this->df->Effects[333].EffectCommands.push_back(createEC(4, barracksUnits[i], -1, 8, amountTypetoD(1, 4)));
        this->df->Effects[334].EffectCommands.push_back(createEC(4, barracksUnits[i], -1, 8, amountTypetoD(1, 4)));
        // Malian pierce armor
        this->df->Effects[618].EffectCommands.push_back(createEC(4, barracksUnits[i], -1, 8, amountTypetoD(1, 3)));
        this->df->Effects[619].EffectCommands.push_back(createEC(4, barracksUnits[i], -1, 8, amountTypetoD(1, 3)));
        this->df->Effects[620].EffectCommands.push_back(createEC(4, barracksUnits[i], -1, 8, amountTypetoD(1, 3)));
    }

    // Recreate stable bonuses
    this->df->Effects[610].EffectCommands.clear();
    this->df->Effects[638].EffectCommands.clear();
    for (int i = 0; i < stableUnits.size(); i++) {
        // Teuton armor bonus (stable)
        this->df->Effects[333].EffectCommands.push_back(createEC(4, stableUnits[i], -1, 8, amountTypetoD(1, 4)));
        this->df->Effects[334].EffectCommands.push_back(createEC(4, stableUnits[i], -1, 8, amountTypetoD(1, 4)));
        // Old Indian pierce armor
        this->df->Effects[640].EffectCommands.push_back(createEC(4, stableUnits[i], -1, 8, amountTypetoD(1, 3)));
        this->df->Effects[584].EffectCommands.push_back(createEC(4, stableUnits[i], -1, 8, amountTypetoD(1, 3)));
        // Berber discount
        this->df->Effects[610].EffectCommands.push_back(createEC(5, stableUnits[i], -1, 100, 0.85));
        this->df->Effects[638].EffectCommands.push_back(createEC(5, stableUnits[i], -1, 100, 0.941176));
    }

    // Recreate archery range bonuses
    this->df->Effects[672].EffectCommands.clear();
    for (int i = 0; i < rangeUnits.size(); i++) {
        // Vietnamese HP
        this->df->Effects[672].EffectCommands.push_back(createEC(5, rangeUnits[i], -1, 0, 1.2));
    }
    for (Effect &effect : this->df->Effects) {
        if (effect.Name == "C-Bonus, ARRG units +1 attack") {
            effect.EffectCommands.clear();
            for (int i = 0; i < rangeUnits.size(); i++) {
                effect.EffectCommands.push_back(createEC(4, rangeUnits[i], -1, 9, amountTypetoD(1, 3)));
            }
        } else if (effect.Name.find("C-Bonus, +1 arrg armor in age") != string::npos) {
            effect.EffectCommands.clear();
            for (int i = 0; i < rangeUnits.size(); i++) {
                effect.EffectCommands.push_back(createEC(4, rangeUnits[i], -1, 8, amountTypetoD(1, 4)));
            }
        }
    }

    // Recreate siege workshop bonuses
    this->df->Effects[567].EffectCommands.clear();
    this->df->Effects[239].EffectCommands.clear();
    this->df->Effects[457].EffectCommands.clear();
    for (int i = 0; i < workshopUnits.size(); i++) {
        // Slav discount
        this->df->Effects[567].EffectCommands.push_back(createEC(5, workshopUnits[i], -1, 100, 0.85));
        // Furor celtica
        this->df->Effects[239].EffectCommands.push_back(createEC(5, workshopUnits[i], -1, 0, 1.4));
        // Drill
        this->df->Effects[457].EffectCommands.push_back(createEC(5, workshopUnits[i], -1, 5, 1.5));
    }

    // Ahosi attack
    this->df->Effects[67].EffectCommands.push_back(createEC(4, this->ahosiID, -1, 9, amountTypetoD(1, 3)));
    this->df->Effects[68].EffectCommands.push_back(createEC(4, this->ahosiID, -1, 9, amountTypetoD(1, 3)));
    this->df->Effects[75].EffectCommands.push_back(createEC(4, this->ahosiID, -1, 9, amountTypetoD(1, 3)));
    this->df->Effects[67].EffectCommands.push_back(createEC(4, this->ehosiID, -1, 9, amountTypetoD(1, 3)));
    this->df->Effects[68].EffectCommands.push_back(createEC(4, this->ehosiID, -1, 9, amountTypetoD(1, 3)));
    this->df->Effects[75].EffectCommands.push_back(createEC(4, this->ehosiID, -1, 9, amountTypetoD(1, 3)));

    // Cavalry regen
    // int hpID = -1;
    // int camelID = -1;
    // int zealotryID = -1;
    // for (int i = 0; i < this->df->Effects.size(); i++) {
    // 	if (this->df->Effects[i].Name == "Cavalry +20% HP + regen") {
    // 		hpID = i;
    // 	} else if (this->df->Effects[i].Name == "Camels +25% HP + regen") {
    // 		camelID = i;
    // 	} else if (this->df->Effects[i].Name == "Zealotry + regen") {
    // 		zealotryID = i;
    // 	}
    // }
    // this->df->Effects[954].EffectCommands.clear();
    // this->df->Effects[961].EffectCommands.clear();
    // this->df->Effects[hpID].EffectCommands.clear();
    // this->df->Effects[camelID].EffectCommands.clear();
    // for (int i = 0; i < this->df->Civs[0].Units.size(); i++) {
    // 	if (this->df->Civs[0].Units[i].Class == 12 || this->df->Civs[0].Units[i].Class == 47) {
    // 		this->df->Effects[954].EffectCommands.push_back(createEC(4, i, -1, 109, this->df->Civs[0].Units[i].HitPoints * 0.15));
    // 		this->df->Effects[961].EffectCommands.push_back(createEC(4, i, -1, 109, 3));
    // 		this->df->Effects[hpID].EffectCommands.push_back(createEC(4, i, -1, 109, this->df->Civs[0].Units[i].HitPoints * 0.15 * 0.2));
    // 	}
    // }
    // for (int i = 0; i < this->unitClasses["camel"].size(); i++) {
    // 	this->df->Effects[camelID].EffectCommands.push_back(
    // 		createEC(4, this->unitClasses["camel"][i], -1, 109, this->df->Civs[0].Units[this->unitClasses["camel"][i]].HitPoints * 0.15 * 0.25));
    // 	this->df->Effects[zealotryID].EffectCommands.push_back(createEC(4, this->unitClasses["camel"][i], -1, 109, 3));
    // }

    // Change bonus damage resistance to add
    for (int i = 0; i < this->df->Effects[796].EffectCommands.size(); i++) {
        this->df->Effects[796].EffectCommands[i].Type = 4;
    }

    // Militia-line upgrades free
    this->df->Effects[730].EffectCommands.push_back(createEC(101, 264, 0, 0, 0));
    this->df->Effects[730].EffectCommands.push_back(createEC(101, 264, 3, 0, 0));
    this->df->Effects[730].EffectCommands.push_back(createEC(103, 264, -1, 0, 0));
    this->df->Effects[730].EffectCommands.push_back(createEC(101, 885, 0, 0, 0));
    this->df->Effects[730].EffectCommands.push_back(createEC(101, 885, 3, 0, 0));
    this->df->Effects[730].EffectCommands.push_back(createEC(103, 885, -1, 0, 0));

    // Spearmen upgrades work on spearmen
    this->df->Effects[824].EffectCommands.clear();
    this->df->Effects[729].EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["spear"].size(); i++) {
        for (int j = 0; j < 40; j++) {
            bool hasBonusClass = false;
            for (unit::AttackOrArmor &attack : this->df->Civs[0].Units[this->unitClasses["spear"][i]].Type50.Attacks) {
                if (attack.Class == j && (j != 3) && (j != 4)) {
                    hasBonusClass = true;
                }
            }
            if (hasBonusClass) {
                this->df->Effects[824].EffectCommands.push_back(createEC(5, this->unitClasses["spear"][i], -1, 9, amountTypetoD(125, j)));
            }
        }
        this->df->Effects[729].EffectCommands.push_back(createEC(4, this->unitClasses["spear"][i], -1, 8, amountTypetoD(2, 3)));
    }

    // Skirmisher upgrades work on skirmishers
    this->df->Effects[864].EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["skirmisher"].size(); i++) {
        this->df->Effects[729].EffectCommands.push_back(createEC(4, this->unitClasses["skirmisher"][i], -1, 8, amountTypetoD(2, 3)));
        this->df->Effects[864].EffectCommands.push_back(createEC(5, this->unitClasses["skirmisher"][i], -1, 10, 0.8));
    }
    this->df->Effects[864].EffectCommands.push_back(createEC(5, 873, -1, 10, 0.8));
    this->df->Effects[864].EffectCommands.push_back(createEC(5, 875, -1, 10, 0.8));

    // Byz trash affect imp camel
    this->df->Effects[283].EffectCommands.push_back(createEC(5, 207, -1, 100, 0.75));

    // Camel bonuses to all camels
    this->df->Effects[312].EffectCommands.clear();
    this->df->Effects[459].EffectCommands.clear();
    this->df->Effects[608].EffectCommands.clear();
    this->df->Effects[843].EffectCommands.clear();
    this->df->Effects[855].EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["camel"].size(); i++) {
        // Saracen HP
        this->df->Effects[312].EffectCommands.push_back(createEC(5, this->unitClasses["camel"][i], -1, 0, 1.25));
        // Zealotry
        this->df->Effects[459].EffectCommands.push_back(createEC(4, this->unitClasses["camel"][i], -1, 0, 20));
        // Maghrabi
        this->df->Effects[608].EffectCommands.push_back(createEC(4, this->unitClasses["camel"][i], -1, 109, 15));
        // Gurjaras team bonus (camels)
        this->df->Effects[843].EffectCommands.push_back(createEC(5, this->unitClasses["camel"][i], -1, 101, 0.8));
        // Frontier Guards
        this->df->Effects[855].EffectCommands.push_back(createEC(4, this->unitClasses["camel"][i], -1, 8, amountTypetoD(4, 4)));
    }
    this->df->Effects[855].EffectCommands.push_back(createEC(4, 873, -1, 8, amountTypetoD(4, 4)));
    this->df->Effects[855].EffectCommands.push_back(createEC(4, 875, -1, 8, amountTypetoD(4, 4)));

    // Gunpowder bonuses to all gunpowder
    this->df->Effects[296].EffectCommands.clear();
    this->df->Effects[555].EffectCommands.clear();
    this->df->Effects[794].EffectCommands.clear();
    this->df->Effects[576].EffectCommands.clear();
    this->df->Effects[987].EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["gunpowder"].size(); i++) {
        // Turk HP
        this->df->Effects[296].EffectCommands.push_back(createEC(5, this->unitClasses["gunpowder"][i], -1, 0, 1.25));
        // Italians discount
        this->df->Effects[555].EffectCommands.push_back(createEC(5, this->unitClasses["gunpowder"][i], -1, 100, 0.8));
        // Burgundian +attack
        for (int j = 0; j < 50; j++) {
            this->df->Effects[794].EffectCommands.push_back(createEC(5, this->unitClasses["gunpowder"][i], -1, 9, amountTypetoD(125, j)));
        }
        // Hindustani armor
        this->df->Effects[576].EffectCommands.push_back(createEC(4, this->unitClasses["gunpowder"][i], -1, 8, amountTypetoD(1, 3)));
        this->df->Effects[576].EffectCommands.push_back(createEC(4, this->unitClasses["gunpowder"][i], -1, 8, amountTypetoD(1, 4)));
        // Jurchen TB
        this->df->Effects[987].EffectCommands.push_back(createEC(4, this->unitClasses["gunpowder"][i], -1, 1, 2));
    }

    // Shatagni affects all hand cannons
    this->df->Effects[563].EffectCommands.clear();
    this->df->Effects[563].EffectCommands.push_back(createEC(4, -1, 44, 1, 2));
    this->df->Effects[563].EffectCommands.push_back(createEC(4, -1, 44, 23, 2));
    this->df->Effects[563].EffectCommands.push_back(createEC(4, -1, 44, 12, 2));

    // Japanese discount affects mule carts and folwarks
    this->df->Effects[338].EffectCommands.push_back(createEC(5, 1711, -1, 100, 0.5));
    this->df->Effects[338].EffectCommands.push_back(createEC(5, 1720, -1, 100, 0.5));
    this->df->Effects[338].EffectCommands.push_back(createEC(5, 1734, -1, 100, 0.5));
    this->df->Effects[338].EffectCommands.push_back(createEC(5, 1808, -1, 100, 0.5));

    // Elephant bonuses to all elephants
    this->df->Effects[668].EffectCommands.clear();
    this->df->Effects[666].EffectCommands.clear();
    this->df->Effects[703].EffectCommands.clear();
    this->df->Effects[662].EffectCommands.clear();
    this->df->Effects[695].EffectCommands.clear();
    this->df->Effects[696].EffectCommands.clear();
    this->df->Effects[865].EffectCommands.clear();
    this->df->Effects[850].EffectCommands.clear();
    this->df->Effects[852].EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["elephant"].size(); i++) {
        // Chatras
        this->df->Effects[668].EffectCommands.push_back(createEC(4, this->unitClasses["elephant"][i], -1, 0, 100));
        // Howdah
        this->df->Effects[666].EffectCommands.push_back(createEC(4, this->unitClasses["elephant"][i], -1, 8, amountTypetoD(1, 3)));
        this->df->Effects[666].EffectCommands.push_back(createEC(4, this->unitClasses["elephant"][i], -1, 8, amountTypetoD(1, 4)));
        if (this->df->Civs[0].Units[this->unitClasses["elephant"][i]].Type50.MaxRange <= 0) {
            // Khmer speed
            this->df->Effects[703].EffectCommands.push_back(createEC(5, this->unitClasses["elephant"][i], -1, 5, 1.1));
            // Tusk swords
            this->df->Effects[662].EffectCommands.push_back(createEC(4, this->unitClasses["elephant"][i], -1, 9, amountTypetoD(3, 4)));
        }
        // Malay discount
        this->df->Effects[695].EffectCommands.push_back(createEC(5, this->unitClasses["elephant"][i], -1, 100, 0.7));
        this->df->Effects[696].EffectCommands.push_back(createEC(5, this->unitClasses["elephant"][i], -1, 100, 0.85714));
        // Bengali resistance
        this->df->Effects[865].EffectCommands.push_back(createEC(0, this->unitClasses["elephant"][i], -1, 24, 0.25));
        this->df->Effects[865].EffectCommands.push_back(createEC(4, this->unitClasses["elephant"][i], -1, 111, 1));
        this->df->Effects[865].EffectCommands.push_back(createEC(4, this->unitClasses["elephant"][i], -1, 112, 2));
        // Medical Corps
        this->df->Effects[850].EffectCommands.push_back(createEC(4, this->unitClasses["elephant"][i], -1, 109, 30));
        // Gurjaras team bonus (elephants)
        this->df->Effects[843].EffectCommands.push_back(createEC(5, this->unitClasses["elephant"][i], -1, 101, 0.8));
        // Paiks
        this->df->Effects[852].EffectCommands.push_back(createEC(5, this->unitClasses["elephant"][i], -1, 10, 0.8333333));
    }

    // Battle elephants +1/+1p affects royal
    this->df->Effects[679].EffectCommands.push_back(createEC(4, UNIT_ROYAL_ELEPHANT, -1, 8, amountTypetoD(1, 3)));
    this->df->Effects[679].EffectCommands.push_back(createEC(4, UNIT_ROYAL_ELEPHANT, -1, 8, amountTypetoD(1, 4)));

    // Foot archer bonuses
    this->df->Effects[612].EffectCommands.clear();
    this->df->Effects[380].EffectCommands.clear();
    this->df->Effects[415].EffectCommands.clear();
    this->df->Effects[455].EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["footArcher"].size(); i++) {
        // Ethiopian reload
        this->df->Effects[612].EffectCommands.push_back(createEC(5, this->unitClasses["footArcher"][i], -1, 10, 0.85));
        // British range
        this->df->Effects[380].EffectCommands.push_back(createEC(4, this->unitClasses["footArcher"][i], -1, 12, 1));
        this->df->Effects[380].EffectCommands.push_back(createEC(4, this->unitClasses["footArcher"][i], -1, 1, 1));
        this->df->Effects[380].EffectCommands.push_back(createEC(4, this->unitClasses["footArcher"][i], -1, 23, 1));
        this->df->Effects[415].EffectCommands.push_back(createEC(4, this->unitClasses["footArcher"][i], -1, 12, 1));
        this->df->Effects[415].EffectCommands.push_back(createEC(4, this->unitClasses["footArcher"][i], -1, 1, 1));
        this->df->Effects[415].EffectCommands.push_back(createEC(4, this->unitClasses["footArcher"][i], -1, 23, 1));
        // Yeomen (foot archers)
        this->df->Effects[455].EffectCommands.push_back(createEC(4, this->unitClasses["footArcher"][i], -1, 12, 1));
        this->df->Effects[455].EffectCommands.push_back(createEC(4, this->unitClasses["footArcher"][i], -1, 1, 1));
        this->df->Effects[455].EffectCommands.push_back(createEC(4, this->unitClasses["footArcher"][i], -1, 23, 1));
    }

    // Yeomen (towers)
    this->df->Effects[455].EffectCommands.push_back(createEC(4, 505, -1, 9, amountTypetoD(2, 3)));
    this->df->Effects[455].EffectCommands.push_back(createEC(4, 518, -1, 9, amountTypetoD(2, 3)));
    this->df->Effects[455].EffectCommands.push_back(createEC(4, -1, 52, 9, amountTypetoD(2, 3)));

    // Yeomen (skirmishers)
    for (int i = 0; i < this->unitClasses["skirmisher"].size(); i++) {
        this->df->Effects[455].EffectCommands.push_back(createEC(4, this->unitClasses["skirmisher"][i], -1, 12, 1));
        this->df->Effects[455].EffectCommands.push_back(createEC(4, this->unitClasses["skirmisher"][i], -1, 1, 1));
        this->df->Effects[455].EffectCommands.push_back(createEC(4, this->unitClasses["skirmisher"][i], -1, 23, 1));
    }

    // Steppe lancer effects
    this->df->Effects[387].EffectCommands.push_back(createEC(5, UNIT_ROYAL_LANCER, -1, 0, 1.3));
    this->df->Effects[724].EffectCommands.push_back(createEC(4, UNIT_ROYAL_LANCER, -1, 8, amountTypetoD(1, 3)));
    this->df->Effects[724].EffectCommands.push_back(createEC(4, UNIT_ROYAL_LANCER, -1, 8, amountTypetoD(1, 4)));
    this->df->Effects[726].EffectCommands.push_back(createEC(5, UNIT_ROYAL_LANCER, -1, 101, 0.5));

    // Make scorpion effects apply to imp scorp
    this->df->Effects[647].EffectCommands.push_back(createEC(4, UNIT_IMP_SCORPION, -1, 1, 1));
    this->df->Effects[647].EffectCommands.push_back(createEC(4, UNIT_IMP_SCORPION, -1, 12, 1));
    this->df->Effects[647].EffectCommands.push_back(createEC(4, UNIT_IMP_SCORPION, -1, 23, 1));
    this->df->Effects[663].EffectCommands.push_back(createEC(4, UNIT_IMP_SCORPION, -1, 102, 1));
    this->df->Effects[663].EffectCommands.push_back(createEC(4, UNIT_IMP_SCORPION, -1, 107, 1));
    this->df->Effects[900].EffectCommands.push_back(createEC(5, UNIT_IMP_SCORPION, -1, 105, 0.4));
    this->df->Effects[901].EffectCommands.push_back(createEC(0, UNIT_IMP_SCORPION_PROJECTILE, -1, 19, 1));
    this->df->Effects[901].EffectCommands.push_back(createEC(0, UNIT_IMP_SCORPION_PROJECTILE_FIRE, -1, 19, 1));
    this->df->Effects[483].EffectCommands.clear();
    this->df->Effects[483].EffectCommands.push_back(createEC(4, 279, -1, 9, amountTypetoD(4, 3)));
    this->df->Effects[483].EffectCommands.push_back(createEC(4, 542, -1, 9, amountTypetoD(4, 3)));
    this->df->Effects[483].EffectCommands.push_back(createEC(4, UNIT_IMP_SCORPION, -1, 9, amountTypetoD(4, 3)));
    this->df->Effects[483].EffectCommands.push_back(createEC(4, 1120, -1, 9, amountTypetoD(2, 3)));
    this->df->Effects[483].EffectCommands.push_back(createEC(4, 1122, -1, 9, amountTypetoD(2, 3)));
    this->df->Effects[894].EffectCommands.push_back(createEC(5, UNIT_IMP_SCORPION, -1, 10, 0.75));
    this->df->Effects[891].EffectCommands.push_back(createEC(0, UNIT_IMP_SCORPION, -1, 20, 1));

    // Make monk techs affect monk units
    for (Civ &civ : this->df->Civs) {
        civ.Units[134].ResourceStorages[1].Type = 3;
        civ.Units[134].ResourceStorages[1].Amount = 0;
        civ.Units[134].ResourceStorages[1].Flag = 1;
        civ.Units[776].ResourceStorages[1].Type = 3;
        civ.Units[776].ResourceStorages[1].Amount = 0;
        civ.Units[776].ResourceStorages[1].Flag = 1;
    }
    this->df->Effects[545].EffectCommands.clear();
    this->df->Effects[545].EffectCommands.push_back(createEC(4, 134, -1, 26, 50));
    this->df->Effects[545].EffectCommands.push_back(createEC(4, 776, -1, 26, 50));
    this->df->Effects[28].EffectCommands.clear();
    this->df->Effects[28].EffectCommands.push_back(createEC(0, 125, -1, 63, 32));
    this->df->Effects[28].EffectCommands.push_back(createEC(0, 286, -1, 63, 32));
    this->df->Effects[28].EffectCommands.push_back(createEC(0, 1811, -1, 63, 32));
    this->df->Effects[28].EffectCommands.push_back(createEC(0, 1831, -1, 63, 32));
    this->df->Effects[28].EffectCommands.push_back(createEC(0, 775, -1, 63, 32));
    for (Civ &civ : this->df->Civs) {
        for (int i = 0; i < civ.Units[125].Bird.TaskList.size(); i++) {
            if (civ.Units[125].Bird.TaskList[i].ActionType == 155) {
                civ.Units[1811].Bird.TaskList.push_back(civ.Units[125].Bird.TaskList[i]);
                civ.Units[1831].Bird.TaskList.push_back(civ.Units[125].Bird.TaskList[i]);
                civ.Units[775].Bird.TaskList.push_back(civ.Units[125].Bird.TaskList[i]);
            }
        }
    }
    this->df->Effects[853].EffectCommands.push_back(createEC(0, 1811, -1, 110, -0.9));

    // Make trebuchet things affect all trebuchet units
    this->df->Effects[59].EffectCommands.clear();
    this->df->Effects[59].EffectCommands.push_back(createEC(5, 42, -1, 13, 4));
    for (int i = 0; i < this->unitClasses["trebuchet"].size(); i++) {
        this->df->Effects[59].EffectCommands.push_back(createEC(5, this->unitClasses["trebuchet"][i], -1, 10, 0.75));
    }
    this->df->Effects[725].EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["trebuchet"].size(); i++) {
        this->df->Effects[725].EffectCommands.push_back(createEC(4, this->unitClasses["trebuchet"][i], -1, 12, 2));
        this->df->Effects[725].EffectCommands.push_back(createEC(4, this->unitClasses["trebuchet"][i], -1, 23, 2));
        this->df->Effects[725].EffectCommands.push_back(createEC(4, this->unitClasses["trebuchet"][i], -1, 1, 2));
    }
    this->df->Effects[1060].EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["trebuchet"].size(); i++) {
        this->df->Effects[1060].EffectCommands.push_back(createEC(5, this->unitClasses["trebuchet"][i], -1, 100, 0.75));
    }
    this->df->Effects[1081].EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["trebuchet"].size(); i++) {
        this->df->Effects[1081].EffectCommands.push_back(createEC(4, this->unitClasses["trebuchet"][i], -1, 102, 2));
        this->df->Effects[1081].EffectCommands.push_back(createEC(4, this->unitClasses["trebuchet"][i], -1, 107, 2));
    }
    this->df->Effects[1081].EffectCommands.push_back(createEC(0, 1948, -1, 63, 26));
    this->df->Effects[1081].EffectCommands.push_back(createEC(0, 42, -1, 63, 18));
    this->df->Effects[1081].EffectCommands.push_back(createEC(0, 42, -1, 65, 1934));
    this->df->Effects[540].EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["trebuchet"].size(); i++) {
        this->df->Effects[540].EffectCommands.push_back(createEC(4, this->unitClasses["trebuchet"][i], -1, 22, 0.5));
        this->df->Effects[540].EffectCommands.push_back(createEC(0, this->unitClasses["trebuchet"][i], -1, 11, 100));
    }
    this->df->Effects[480].EffectCommands.clear();
    vector<int> customUnitClass = {280, 550, 588};
    customUnitClass.insert(customUnitClass.begin(), this->unitClasses["trebuchet"].begin(), this->unitClasses["trebuchet"].end());
    for (int i = 0; i < customUnitClass.size(); i++) {
        this->df->Effects[480].EffectCommands.push_back(createEC(5, customUnitClass[i], -1, 9, amountTypetoD(115, 11)));
        this->df->Effects[480].EffectCommands.push_back(createEC(5, customUnitClass[i], -1, 9, amountTypetoD(115, 3)));
        this->df->Effects[480].EffectCommands.push_back(createEC(5, customUnitClass[i], -1, 9, amountTypetoD(115, 20)));
        this->df->Effects[480].EffectCommands.push_back(createEC(5, customUnitClass[i], -1, 9, amountTypetoD(115, 37)));
        this->df->Effects[480].EffectCommands.push_back(createEC(5, customUnitClass[i], -1, 9, amountTypetoD(115, 4)));
    }

    // Make shu bonus affect turtle ships
    this->df->Effects[1068].EffectCommands.push_back(createEC(5, 831, -1, 5, 1.1));
    this->df->Effects[1068].EffectCommands.push_back(createEC(5, 832, -1, 5, 1.1));
    this->df->Effects[1072].EffectCommands.push_back(createEC(5, 831, -1, 5, 1.04545));
    this->df->Effects[1072].EffectCommands.push_back(createEC(5, 832, -1, 5, 1.04545));

    // Pavise apply to archer-line and condottiero
    this->df->Effects[549].EffectCommands.clear();
    customUnitClass = {4, 24, 492, 882};
    for (int i = 0; i < customUnitClass.size(); i++) {
        this->df->Effects[549].EffectCommands.push_back(createEC(4, customUnitClass[i], -1, 8, amountTypetoD(1, 3)));
        this->df->Effects[549].EffectCommands.push_back(createEC(4, customUnitClass[i], -1, 8, amountTypetoD(1, 4)));
    }

    // Fabric shields applies to shock infantry and slingers
    this->df->Effects[573].EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["shock"].size(); i++) {
        this->df->Effects[573].EffectCommands.push_back(createEC(4, this->unitClasses["shock"][i], -1, 8, amountTypetoD(2, 3)));
        this->df->Effects[573].EffectCommands.push_back(createEC(4, this->unitClasses["shock"][i], -1, 8, amountTypetoD(1, 4)));
    }
    this->df->Effects[573].EffectCommands.push_back(createEC(4, 185, -1, 8, amountTypetoD(2, 3)));
    this->df->Effects[573].EffectCommands.push_back(createEC(4, 185, -1, 8, amountTypetoD(1, 4)));

    // Wu bonus affect all shock infantry
    this->df->Effects[1076].EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["shock"].size(); i++) {
        this->df->Effects[1076].EffectCommands.push_back(createEC(4, this->unitClasses["shock"][i], -1, 9, amountTypetoD(2, 4)));
    }
    this->df->Effects[1076].EffectCommands.push_back(createEC(4, 1944, -1, 9, amountTypetoD(2, 4)));
    this->df->Effects[1076].EffectCommands.push_back(createEC(4, 1946, -1, 9, amountTypetoD(2, 4)));

    // Make Wu research bonus actually use the new dat feature
    this->df->Effects[1079].EffectCommands.clear();
    this->df->Effects[1079].EffectCommands.push_back(createEC(8, 374, 17, -1, 0.25));
    this->df->Effects[1079].EffectCommands.push_back(createEC(8, 374, -3, -1, 0.25));
    this->df->Effects[1079].EffectCommands.push_back(createEC(8, 375, 17, -1, 0.25));
    this->df->Effects[1079].EffectCommands.push_back(createEC(8, 375, -3, -1, 0.25));

    // Make Khitan bonuses actually use the new dat feature
    this->df->Effects[1004].EffectCommands.clear();
    this->df->Effects[1004].EffectCommands.push_back(createEC(8, 218, 17, -1, 0.5));

    customUnitClass.clear();
    customUnitClass.insert(customUnitClass.begin(), this->unitClasses["spear"].begin(), this->unitClasses["spear"].end());
    customUnitClass.insert(customUnitClass.begin(), this->unitClasses["skirmisher"].begin(), this->unitClasses["skirmisher"].end());
    customUnitClass.insert(customUnitClass.begin(), this->unitClasses["lightCav"].begin(), this->unitClasses["lightCav"].end());
    this->df->Effects[1011].EffectCommands.clear();
    for (int i = 0; i < customUnitClass.size(); i++) {
        this->df->Effects[1011].EffectCommands.push_back(createEC(5, customUnitClass[i], -1, 101, 0.8));
    }
    this->df->Effects[1011].EffectCommands.push_back(createEC(103, 197, -1, 2, 0.8));
    this->df->Effects[1011].EffectCommands.push_back(createEC(103, 429, -1, 2, 0.8));
    this->df->Effects[1011].EffectCommands.push_back(createEC(103, 98, -1, 2, 0.8));
    this->df->Effects[1011].EffectCommands.push_back(createEC(103, 655, -1, 2, 0.8));
    this->df->Effects[1011].EffectCommands.push_back(createEC(103, 430, -1, 2, 0.8));
    this->df->Effects[1011].EffectCommands.push_back(createEC(103, 254, -1, 2, 0.8));
    this->df->Effects[1011].EffectCommands.push_back(createEC(103, 428, -1, 2, 0.8));
    this->df->Effects[1011].EffectCommands.push_back(createEC(103, 786, -1, 2, 0.8));

    // Make effects that apply to one unique unit apply to all unique units
    this->df->Effects[493].EffectCommands.clear();
    this->df->Effects[571].EffectCommands.clear();
    for (int i = 0; i < this->unitClasses["unique"].size(); i++) {
        // Pavise
        this->df->Effects[549].EffectCommands.push_back(createEC(4, this->unitClasses["unique"][i], -1, 8, amountTypetoD(1, 3)));
        this->df->Effects[549].EffectCommands.push_back(createEC(4, this->unitClasses["unique"][i], -1, 8, amountTypetoD(1, 4)));
        // Logistica
        this->df->Effects[493].EffectCommands.push_back(createEC(4, this->unitClasses["unique"][i], -1, 9, amountTypetoD(6, 1)));
        this->df->Effects[493].EffectCommands.push_back(createEC(4, this->unitClasses["unique"][i], -1, 22, 0.5));
        this->df->Effects[493].EffectCommands.push_back(createEC(0, this->unitClasses["unique"][i], -1, 9, amountTypetoD(10, 32)));
        this->df->Effects[493].EffectCommands.push_back(createEC(0, this->unitClasses["unique"][i], -1, 44, 2));
        this->df->Effects[493].EffectCommands.push_back(createEC(0, this->unitClasses["unique"][i], -1, 115, -5));
        // Fabric Shields
        this->df->Effects[573].EffectCommands.push_back(createEC(4, this->unitClasses["unique"][i], -1, 8, amountTypetoD(2, 3)));
        this->df->Effects[573].EffectCommands.push_back(createEC(4, this->unitClasses["unique"][i], -1, 8, amountTypetoD(1, 4)));
        // Corvinian Army
        int goldCost = 0;
        int trashType = -1;
        for (int j = 0; j < this->df->Civs[0].Units[this->unitClasses["unique"][i]].Creatable.ResourceCosts.size(); j++) {
            auto &uniqueUnit = this->df->Civs[0].Units[this->unitClasses["unique"][i]].Creatable;
            if (uniqueUnit.ResourceCosts[j].Type == 3) {
                // Find out how much gold this unit costs
                goldCost = uniqueUnit.ResourceCosts[j].Amount;
            } else if (uniqueUnit.ResourceCosts[j].Type == 0) {
                // This unit costs food
                trashType = 103;
            } else if (uniqueUnit.ResourceCosts[j].Type == 1) {
                // This unit costs wood
                trashType = 104;
            }
        }
        if (trashType == -1) {
            // If only cost gold (i.e. warrior monk or headhunter), convert to food cost
            trashType = 103;
        }
        // Make it cost no gold
        this->df->Effects[571].EffectCommands.push_back(createEC(0, this->unitClasses["unique"][i], -1, 105, 0));
        // Add the previous gold cost to whatever trash costs it has
        this->df->Effects[571].EffectCommands.push_back(createEC(4, this->unitClasses["unique"][i], -1, trashType, goldCost));

        // Paiks
        this->df->Effects[852].EffectCommands.push_back(createEC(5, this->unitClasses["unique"][i], -1, 10, 0.833333));
    }
    // Coiled Serpent Array
    this->df->Effects[1070].EffectCommands.clear();
    this->df->Effects[1070].EffectCommands.push_back(createEC(0, 93, -1, 63, 96));
    this->df->Effects[1070].EffectCommands.push_back(createEC(0, 358, -1, 63, 96));
    this->df->Effects[1070].EffectCommands.push_back(createEC(0, 359, -1, 63, 96));
    this->df->Effects[1070].EffectCommands.push_back(createEC(0, 1786, -1, 63, 96));
    this->df->Effects[1070].EffectCommands.push_back(createEC(0, 1787, -1, 63, 96));
    this->df->Effects[1070].EffectCommands.push_back(createEC(0, 1788, -1, 63, 96));

    for (int i = 0; i < this->unitClasses["unique"].size(); i++) {
        uint8_t combatAbility = this->df->Civs[0].Units[this->unitClasses["unique"][i]].Type50.BreakOffCombat;
        bool hasInfluenceAbility = (combatAbility & 0x20u) != 0;
        bool hasInverseInfluenceAbility = (combatAbility & 0x40u) != 0;
        if (!hasInfluenceAbility) {
            this->df->Effects[1070].EffectCommands.push_back(createEC(4, this->unitClasses["unique"][i], -1, 63, 32));
        }
        if (!hasInverseInfluenceAbility) {
            this->df->Effects[1070].EffectCommands.push_back(createEC(4, this->unitClasses["unique"][i], -1, 63, 64));
        }
        if (this->unitClasses["unique"][i] != 1959 && this->unitClasses["unique"][i] != 1961) {
            for (Civ &civ : this->df->Civs) {
                for (int j = 0; j < civ.Units[1959].Bird.TaskList.size(); j++) {
                    if (civ.Units[1959].Bird.TaskList[j].ActionType == 155) {
                        civ.Units[this->unitClasses["unique"][i]].Bird.TaskList.push_back(civ.Units[1959].Bird.TaskList[j]);
                    }
                }
            }
        }
    }

    // Rocketry
    addAttacktoUnits(this->df, 483, 2, this->unitClasses["unique"]);
    // Royal Heirs
    customUnitClass = this->unitClasses["camel"];
    for (int i = 0; i < this->unitClasses["unique"].size(); i++) {
        if (find(this->unitClasses["camel"].begin(), this->unitClasses["camel"].end(), this->unitClasses["unique"][i]) == this->unitClasses["camel"].end()) {
            customUnitClass.push_back(this->unitClasses["unique"][i]);
        }
    }
    giveClassNewArmor(this->df, customUnitClass, 39, -3);
    this->df->Effects[603].EffectCommands.clear();
    for (int i = 0; i < customUnitClass.size(); i++) {
        this->df->Effects[603].EffectCommands.push_back(createEC(4, customUnitClass[i], -1, 8, amountTypetoD(3, 39)));
    }
    // Bearded Axe
    this->df->Effects[291].EffectCommands.clear();
    // addAttacktoUnits(this->df, 291, 2, this->unitClasses["unique"]);
    for (int i = 0; i < this->unitClasses["unique"].size(); i++) {
        this->df->Effects[291].EffectCommands.push_back(createEC(4, this->unitClasses["unique"][i], -1, 1, 1));
        this->df->Effects[291].EffectCommands.push_back(createEC(4, this->unitClasses["unique"][i], -1, 12, 1));
        this->df->Effects[291].EffectCommands.push_back(createEC(4, this->unitClasses["unique"][i], -1, 23, 1));
    }
    // Relic Bonus
    customUnitClass = {38, 283, 569};
    customUnitClass.insert(customUnitClass.begin(), this->unitClasses["unique"].begin(), this->unitClasses["unique"].end());
    this->df->Effects[736].EffectCommands.clear();
    this->df->Effects[737].EffectCommands.clear();
    this->df->Effects[738].EffectCommands.clear();
    this->df->Effects[739].EffectCommands.clear();
    addAttacktoUnits(this->df, 736, 1, customUnitClass);
    addAttacktoUnits(this->df, 737, 1, customUnitClass);
    addAttacktoUnits(this->df, 738, 1, customUnitClass);
    addAttacktoUnits(this->df, 739, 1, customUnitClass);
    // Comitatenses
    customUnitClass = {38, 283, 569, 74, 75, 77, 473, 567, 1793};
    customUnitClass.insert(customUnitClass.begin(), this->unitClasses["unique"].begin(), this->unitClasses["unique"].end());
    this->df->Effects[895].EffectCommands.clear();
    for (int i = 0; i < customUnitClass.size(); i++) {
        this->df->Effects[895].EffectCommands.push_back(createEC(5, customUnitClass[i], -1, 101, 0.666666667));
        this->df->Effects[895].EffectCommands.push_back(createEC(4, customUnitClass[i], -1, 59, 5));
        this->df->Effects[895].EffectCommands.push_back(createEC(4, customUnitClass[i], -1, 60, 0.25));
        if (this->df->Civs[0].Units[customUnitClass[i]].Creatable.ChargeType == 0) {
            // If they don't already have a charge attack, create one
            this->df->Effects[895].EffectCommands.push_back(createEC(0, customUnitClass[i], -1, 61, 1));
            this->df->Effects[895].EffectCommands.push_back(createEC(0, customUnitClass[i], -1, 62, 1));
        }
    }

    // Bogsveigar applies to all unique ships
    customUnitClass = this->unitClasses["footArcher"];
    customUnitClass.insert(customUnitClass.begin(), this->unitClasses["uniqueShip"].begin(), this->unitClasses["uniqueShip"].end());
    this->df->Effects[467].EffectCommands.clear();
    addAttacktoUnits(this->df, 467, 1, customUnitClass);

    // Detinets affects Kreposts and Donjons
    this->df->Effects[481].EffectCommands.push_back(createEC(4, 1251, -1, 104, 140));
    this->df->Effects[481].EffectCommands.push_back(createEC(4, 1251, -1, 106, -140));
    this->df->Effects[481].EffectCommands.push_back(createEC(4, 1665, -1, 104, 70));
    this->df->Effects[481].EffectCommands.push_back(createEC(4, 1665, -1, 106, -70));

    // Fortifications built faster affects Kreposts
    this->df->Effects[795].EffectCommands.push_back(createEC(5, 1251, -1, 101, 0.66666667));

    // Great Wall affects Donjons
    this->df->Effects[516].EffectCommands.push_back(createEC(5, 1665, -1, 0, 1.3));

    // Svan Towers and Citadels affects Kreposts
    this->df->Effects[935].EffectCommands.push_back(createEC(4, 1251, -1, 9, amountTypetoD(2, 3)));
    this->df->Effects[935].EffectCommands.push_back(createEC(4, 786, -1, 9, amountTypetoD(2, 3)));
    this->df->Effects[935].EffectCommands.push_back(createEC(4, 787, -1, 9, amountTypetoD(2, 3)));
    this->df->Effects[458].EffectCommands.push_back(createEC(4, 1251, -1, 9, amountTypetoD(4, 3)));
    this->df->Effects[458].EffectCommands.push_back(createEC(4, 1251, -1, 9, amountTypetoD(3, 1)));
    this->df->Effects[458].EffectCommands.push_back(createEC(4, 1251, -1, 9, amountTypetoD(3, 17)));
    this->df->Effects[458].EffectCommands.push_back(createEC(4, 786, -1, 9, amountTypetoD(4, 3)));
    this->df->Effects[458].EffectCommands.push_back(createEC(4, 787, -1, 9, amountTypetoD(4, 3)));
    this->df->Effects[458].EffectCommands.push_back(createEC(0, 1251, -1, 24, 0.25));
    this->df->Effects[458].EffectCommands.push_back(createEC(3, 786, 1830, -1, 0));
    this->df->Effects[593].EffectCommands.push_back(createEC(3, 786, 1830, -1, 0));
    this->df->Effects[593].EffectCommands.push_back(createEC(3, 787, 1830, -1, 0));

    // Eupsong affects donjons
    this->df->Effects[541].EffectCommands.push_back(createEC(4, 1665, -1, 12, 2));
    this->df->Effects[541].EffectCommands.push_back(createEC(4, 1665, -1, 1, 2));
    this->df->Effects[541].EffectCommands.push_back(createEC(4, 1665, -1, 23, 2));

    // Mounted affects missionaries
    this->df->Effects[285].EffectCommands.push_back(createEC(5, 775, -1, 0, 1.2));
    this->df->Effects[748].EffectCommands.push_back(createEC(5, 775, -1, 5, 1.05));
    this->df->Effects[762].EffectCommands.push_back(createEC(5, 775, -1, 5, 1.05));
    this->df->Effects[763].EffectCommands.push_back(createEC(5, 775, -1, 5, 1.05));
    this->df->Effects[936].EffectCommands.push_back(createEC(0, 775, -1, 110, -0.85));

    // Make Kamandaran and Forced Levy not give gold
    this->df->Effects[543].EffectCommands[0].Type = 0;
    this->df->Effects[543].EffectCommands[0].D = 0;
    this->df->Effects[543].EffectCommands[1].Type = 0;
    this->df->Effects[543].EffectCommands[1].D = 0;
    this->df->Effects[543].EffectCommands[2].Type = 0;
    this->df->Effects[543].EffectCommands[2].D = 0;
    this->df->Effects[665].EffectCommands[0].Type = 0;
    this->df->Effects[665].EffectCommands[0].D = 0;
    this->df->Effects[665].EffectCommands[1].Type = 0;
    this->df->Effects[665].EffectCommands[1].D = 0;
    this->df->Effects[665].EffectCommands[2].Type = 0;
    this->df->Effects[665].EffectCommands[2].D = 0;
    this->df->Effects[665].EffectCommands[3].Type = 0;
    this->df->Effects[665].EffectCommands[3].D = 0;
    this->df->Effects[665].EffectCommands[4].Type = 0;
    this->df->Effects[665].EffectCommands[4].D = 0;

    // Grand Trunk Road applies to ALL gold generation techniques
    this->df->Effects[562].EffectCommands.push_back(createEC(6, 241, -1, -1, 1.1));
    this->df->Effects[562].EffectCommands.push_back(createEC(6, 266, -1, -1, 1.1));
    this->df->Effects[562].EffectCommands.push_back(createEC(6, 236, -1, -1, 1.1));
    this->df->Effects[562].EffectCommands.push_back(createEC(6, 213, -1, -1, 1.1));
    this->df->Effects[562].EffectCommands.push_back(createEC(6, 274, -1, -1, 1.1));

    // Stronghold applies to Donjons & Kreposts
    this->df->Effects[537].EffectCommands.clear();
    this->df->Effects[537].EffectCommands.push_back(createEC(5, -1, 52, 10, 0.75));
    this->df->Effects[537].EffectCommands.push_back(createEC(5, 82, -1, 10, 0.75));
    this->df->Effects[537].EffectCommands.push_back(createEC(5, 1251, -1, 10, 0.75));
    this->df->Effects[537].EffectCommands.push_back(createEC(0, 82, -1, 63, 34));
    this->df->Effects[537].EffectCommands.push_back(createEC(0, 1251, -1, 63, 34));

    // Siege tower attack + chemistry
    // Siege tower attack + murder holes
    // Siege tower attack + svan towers
    // Siege tower attack + bonus damage vs cav
    // Siege tower attack + stronghold

    // This has to happen after effects are reconfigured because it uses effects directly
    this->assignTeamBonuses();
}

void Civbuilder::cleanup() {
    applyModifiers(this->df, this->config["modifiers"]["blind"].asBool(), this->config["modifiers"]["building"].asDouble(),
                   this->config["modifiers"]["speed"].asDouble(), this->config["modifiers"]["hp"].asDouble());

    // Apply random costs modifier
    bool randomCosts = this->config["modifiers"]["randomCosts"].asBool();
    if (randomCosts) {
        unitSets[40].push_back(UNIT_ROYAL_ELEPHANT);
        unitSets[41].push_back(UNIT_ROYAL_LANCER);
        unitSets[44].push_back(UNIT_IMP_SCORPION);
        uniqueUnits = this->unitClasses["unique"];
        randomizeCosts(this->df);
    }

    // Give effects that apply to a unique unit to their copies
    this->duplicateUnitEffects();

    // Recalculate tech discounts
    recalculateTechDiscounts(this->df);

    // Multiply effects for repeated bonuses
    multiplyAllEffects(this->df, this->multipliedEffects);

    // Gives all units their original ID (which were changed from copying between entries)
    for (Civ &civ : this->df->Civs) {
        for (int i = 0; i < civ.Units.size(); i++) {
            civ.Units[i].ID = i;
            civ.Units[i].CopyID = i;
            civ.Units[i].BaseID = i;
            civ.Units[i].TelemetryID = i;
        }
    }

    // for (int i = 0; i < 83; i++) {
    // 	int basicUnit = (int) (this->df->Effects[this->df->Techs[this->uuTechIDs[i].first].EffectID].EffectCommands[0].A);
    // 	int eliteUnit = (int) (this->df->Effects[this->df->Techs[this->uuTechIDs[i].second].EffectID].EffectCommands[0].B);

    // 	Value emptyArray;
    // 	emptyArray.append(Value::null);
    // 	emptyArray.clear();

    // 	ai["units"][i]["hp"] = emptyArray;
    // 	ai["units"][i]["hp"].append(this->df->Civs[0].Units[basicUnit].HitPoints);
    // 	if (this->df->Civs[0].Units[basicUnit].HitPoints != this->df->Civs[0].Units[eliteUnit].HitPoints) {
    // 		ai["units"][i]["hp"].append(this->df->Civs[0].Units[eliteUnit].HitPoints);
    // 	}

    // 	ai["units"][i]["range"] = emptyArray;
    // 	ai["units"][i]["range"].append(this->df->Civs[0].Units[basicUnit].Type50.DisplayedRange);
    // 	if (this->df->Civs[0].Units[eliteUnit].Type50.DisplayedRange != this->df->Civs[0].Units[basicUnit].Type50.DisplayedRange) {
    // 		ai["units"][i]["range"].append((int) (this->df->Civs[0].Units[eliteUnit].Type50.DisplayedRange));
    // 	}

    // 	ai["units"][i]["speed"] = emptyArray;
    // 	ai["units"][i]["speed"].append(this->df->Civs[0].Units[basicUnit].Speed);
    // 	if (this->df->Civs[0].Units[basicUnit].Speed != this->df->Civs[0].Units[eliteUnit].Speed) {
    // 		ai["units"][i]["speed"].append(this->df->Civs[0].Units[eliteUnit].Speed);
    // 	}

    // 	ai["units"][i]["reload"] = emptyArray;
    // 	ai["units"][i]["reload"].append(this->df->Civs[0].Units[basicUnit].Type50.ReloadTime);
    // 	if (this->df->Civs[0].Units[basicUnit].Type50.ReloadTime != this->df->Civs[0].Units[eliteUnit].Type50.ReloadTime) {
    // 		ai["units"][i]["reload"].append(this->df->Civs[0].Units[eliteUnit].Type50.ReloadTime);
    // 	}

    // 	ai["units"][i]["cost"] = emptyArray;
    // 	for (int j = 0; j < 4; j++) {
    // 		int costAmount = 0;
    // 		for (int k = 0; k < 3; k++) {
    // 			if (this->df->Civs[0].Units[basicUnit].Creatable.ResourceCosts[k].Amount > 0 &&
    // 				this->df->Civs[0].Units[basicUnit].Creatable.ResourceCosts[k].Type == j &&
    // 				this->df->Civs[0].Units[basicUnit].Creatable.ResourceCosts[k].Flag == 1) {
    // 				costAmount = this->df->Civs[0].Units[basicUnit].Creatable.ResourceCosts[k].Amount;
    // 			}
    // 		}
    // 		ai["units"][i]["cost"].append(costAmount);
    // 	}

    // 	ai["units"][i]["armors"]["basic"] = emptyArray;
    // 	for (int j = 0; j < this->df->Civs[0].Units[basicUnit].Type50.Armours.size(); j++) {
    // 		if (this->df->Civs[0].Units[basicUnit].Type50.Armours[j].Class == 4) {
    // 			ai["units"][i]["armors"]["basic"].append(this->df->Civs[0].Units[basicUnit].Type50.Armours[j].Amount);
    // 		}
    // 	}
    // 	for (int j = 0; j < this->df->Civs[0].Units[basicUnit].Type50.Armours.size(); j++) {
    // 		if (this->df->Civs[0].Units[basicUnit].Type50.Armours[j].Class == 3) {
    // 			ai["units"][i]["armors"]["basic"].append(this->df->Civs[0].Units[basicUnit].Type50.Armours[j].Amount);
    // 		}
    // 	}

    // 	ai["units"][i]["armors"]["elite"] = emptyArray;
    // 	for (int j = 0; j < this->df->Civs[0].Units[eliteUnit].Type50.Armours.size(); j++) {
    // 		if (this->df->Civs[0].Units[eliteUnit].Type50.Armours[j].Class == 4) {
    // 			ai["units"][i]["armors"]["elite"].append(this->df->Civs[0].Units[eliteUnit].Type50.Armours[j].Amount);
    // 		}
    // 	}
    // 	for (int j = 0; j < this->df->Civs[0].Units[eliteUnit].Type50.Armours.size(); j++) {
    // 		if (this->df->Civs[0].Units[eliteUnit].Type50.Armours[j].Class == 3) {
    // 			ai["units"][i]["armors"]["elite"].append(this->df->Civs[0].Units[eliteUnit].Type50.Armours[j].Amount);
    // 		}
    // 	}

    // 	ai["units"][i]["attacks"]["basic"] = emptyArray;
    // 	for (int j = 0; j < this->df->Civs[0].Units[basicUnit].Type50.Attacks.size(); j++) {
    // 		if (this->df->Civs[0].Units[basicUnit].Type50.Attacks[j].Amount > 0) {
    // 			ai["units"][i]["attacks"]["basic"].append(emptyArray);
    // 			ai["units"][i]["attacks"]["basic"][ai["units"][i]["attacks"]["basic"].size() - 1].append(
    // 				this->df->Civs[0].Units[basicUnit].Type50.Attacks[j].Class);
    // 			ai["units"][i]["attacks"]["basic"][ai["units"][i]["attacks"]["basic"].size() - 1].append(
    // 				this->df->Civs[0].Units[basicUnit].Type50.Attacks[j].Amount);
    // 		}
    // 	}

    // 	ai["units"][i]["attacks"]["elite"] = emptyArray;
    // 	for (int j = 0; j < this->df->Civs[0].Units[eliteUnit].Type50.Attacks.size(); j++) {
    // 		if (this->df->Civs[0].Units[eliteUnit].Type50.Attacks[j].Amount > 0) {
    // 			ai["units"][i]["attacks"]["elite"].append(emptyArray);
    // 			ai["units"][i]["attacks"]["elite"][ai["units"][i]["attacks"]["elite"].size() - 1].append(
    // 				this->df->Civs[0].Units[eliteUnit].Type50.Attacks[j].Class);
    // 			ai["units"][i]["attacks"]["elite"][ai["units"][i]["attacks"]["elite"].size() - 1].append(
    // 				this->df->Civs[0].Units[eliteUnit].Type50.Attacks[j].Amount);
    // 		}
    // 	}
    // }
}

void Civbuilder::assignUniqueUnits() {
    for (int i = 0; i < this->config["techtree"].size(); i++) {
        int uniqueUnit = this->config["techtree"][i][0].asInt();
        // Make unique unit available
        allocateTech(this->df, this->uuTechIDs[uniqueUnit].first, i + 1);
        // Give them elite upgrade
        allocateTech(this->df, this->uuTechIDs[uniqueUnit].second, i + 1);
    }
}

void Civbuilder::assignBasicTechs() {
    for (int i = 0; i < this->config["techtree"].size(); i++) {
        for (int j = 0; j < this->config["techtree"][i].size(); j++) {
            if (this->config["techtree"][i][j] == 0) {
                // Disable tech
                if (basicTechs[j] != -1) {
                    ai["civs"][i]["tt"].append(basicTechs[j]);
                    this->df->Effects[techTreeIDs[i]].EffectCommands.push_back(createEC(102, -1, -1, -1, basicTechs[j]));
                }
            }
        }

        // Default: scout start
        this->df->Civs[i + 1].Resources[263] = 448;
        // Eagle start
        for (int j = 0; j < this->config["techtree"][i].size(); j++) {
            if (this->config["techtree"][i][j] == 1 && j == 12) {
                this->df->Civs[i + 1].Resources[263] = 751;
                j = this->config["techtree"][i].size();
            }
        }
        // Camel start
        for (int j = 0; j < this->config["civ_bonus"][i].size(); j++) {
            if (this->config["civ_bonus"][i][j] == 300) {
                this->df->Civs[i + 1].Resources[263] = 1755;
                j = this->config["civ_bonus"][i].size();
            }
        }
    }
}

void Civbuilder::assignUniqueTechs() {
    // Castle age unique techs
    for (int i = 0; i < this->config["castletech"].size(); i++) {
        int uniqueIndex = this->config["techtree"][i][0].asInt();
        int uniqueUnit = this->df->Effects[this->df->Techs[this->uuTechIDs[uniqueIndex].first].EffectID].EffectCommands[0].A;
        int uniqueElite = this->df->Effects[this->df->Techs[this->uuTechIDs[uniqueIndex].second].EffectID].EffectCommands[0].B;

        for (int j = 0; j < this->config["castletech"][i].size(); j++) {
            int castleIndex = -1;
            int castleCopies = -1;
            try {
                castleIndex = this->config["castletech"][i][j].asInt();
                castleCopies = 1;
            } catch (...) {
                castleIndex = this->config["castletech"][i][j][0].asInt();
                castleCopies = this->config["castletech"][i][j][1].asInt();
            }

            Tech &castleTech = this->df->Techs[this->castleUniqueTechIDs[castleIndex]];

            // Actually give the unique tech
            int allocatedTech = allocateTech(this->df, this->castleUniqueTechIDs[castleIndex], i + 1);

            this->multipliedEffects.push_back({allocatedTech, castleCopies});

            // Readjust some of the effects to appropriate the new civ culture
            switch (castleIndex) {
                // Create and give barracks-uniqueunit
                case 12: {
                    for (Civ &civ : this->df->Civs) {
                        civ.Units.push_back(civ.Units[uniqueUnit]);
                        civ.UnitPointers.push_back(1);
                        int duplicateUU = (int)(civ.Units.size() - 1);
                        civ.Units[duplicateUU].Name = "BARRACKSUU" + to_string(i);
                        setTrainLocation(civ.Units[duplicateUU].Creatable, 12, 14);

                        civ.Units.push_back(civ.Units[uniqueElite]);
                        civ.UnitPointers.push_back(1);
                        int duplicateUUelite = (int)(civ.Units.size() - 1);
                        civ.Units[duplicateUUelite].Name = "BARRACKSUUE" + to_string(i);
                        setTrainLocation(civ.Units[duplicateUUelite].Creatable, 12, 14);
                    }
                    int dupUU = (int)(df->Civs[0].Units.size() - 2);
                    int dupUUe = (int)(df->Civs[0].Units.size() - 1);

                    for (Tech &tech : this->df->Techs) {
                        if (tech.Name.find("Gothic Anarchy") != string::npos && tech.Civ == (i + 1)) {
                            Effect enableUnit = Effect();
                            enableUnit.Name = "Enable barracks unit";
                            enableUnit.EffectCommands.push_back(createEC(2, dupUU, 1, -1, 0));
                            this->df->Effects.push_back(enableUnit);
                            tech.EffectID = (int)(this->df->Effects.size() - 1);
                        }
                    }

                    // df->Effects[333].EffectCommands.push_back(createEC(4, dupUU, -1, 8, amountTypetoD(1, 4)));
                    // df->Effects[334].EffectCommands.push_back(createEC(4, dupUU, -1, 8, amountTypetoD(1, 4)));
                    // df->Effects[618].EffectCommands.push_back(createEC(4, dupUU, -1, 8, amountTypetoD(1, 3)));
                    // df->Effects[619].EffectCommands.push_back(createEC(4, dupUU, -1, 8, amountTypetoD(1, 3)));
                    // df->Effects[620].EffectCommands.push_back(createEC(4, dupUU, -1, 8, amountTypetoD(1, 3)));
                    // df->Effects[333].EffectCommands.push_back(createEC(4, dupUUe, -1, 8, amountTypetoD(1, 4)));
                    // df->Effects[334].EffectCommands.push_back(createEC(4, dupUUe, -1, 8, amountTypetoD(1, 4)));
                    // df->Effects[618].EffectCommands.push_back(createEC(4, dupUUe, -1, 8, amountTypetoD(1, 3)));
                    // df->Effects[619].EffectCommands.push_back(createEC(4, dupUUe, -1, 8, amountTypetoD(1, 3)));
                    // df->Effects[620].EffectCommands.push_back(createEC(4, dupUUe, -1, 8, amountTypetoD(1, 3)));

                    this->duplicationUnits.push_back({uniqueUnit, dupUU, dupUUe});
                    this->duplicationUnits.push_back({uniqueElite, dupUUe, -1});
                    break;
                }
                // Turn stable-Tarkan into stable-uniqueunit
                case 13: {
                    for (Civ &civ : this->df->Civs) {
                        civ.Units.push_back(civ.Units[uniqueUnit]);
                        civ.UnitPointers.push_back(1);
                        int duplicateUU = (int)(civ.Units.size() - 1);
                        civ.Units[duplicateUU].Name = "STABLEUU";
                        setTrainLocation(civ.Units[duplicateUU].Creatable, 101, 13);

                        civ.Units.push_back(civ.Units[uniqueElite]);
                        civ.UnitPointers.push_back(1);
                        int duplicateUUelite = (int)(civ.Units.size() - 1);
                        civ.Units[duplicateUUelite].Name = "STABLEUUE";
                        setTrainLocation(civ.Units[duplicateUUelite].Creatable, 101, 13);
                    }
                    int dupUU = (int)(this->df->Civs[0].Units.size() - 2);
                    int dupUUe = (int)(this->df->Civs[0].Units.size() - 1);

                    for (Tech &tech : this->df->Techs) {
                        if (tech.Name.find("Huns UT") != string::npos && tech.Civ == (i + 1)) {
                            Effect enableUnit = Effect();
                            enableUnit.Name = "Enable stable unit";
                            enableUnit.EffectCommands.push_back(createEC(2, dupUU, 1, -1, 0));
                            this->df->Effects.push_back(enableUnit);
                            tech.EffectID = (int)(this->df->Effects.size() - 1);
                        }
                    }

                    // df->Effects[333].EffectCommands.push_back(createEC(4, dupUU, -1, 8, amountTypetoD(1, 4)));
                    // df->Effects[334].EffectCommands.push_back(createEC(4, dupUU, -1, 8, amountTypetoD(1, 4)));
                    // df->Effects[640].EffectCommands.push_back(createEC(4, dupUU, -1, 8, amountTypetoD(1, 3)));
                    // df->Effects[584].EffectCommands.push_back(createEC(4, dupUU, -1, 8, amountTypetoD(1, 3)));
                    // df->Effects[610].EffectCommands.push_back(createEC(5, dupUU, -1, 100, 0.85));
                    // df->Effects[638].EffectCommands.push_back(createEC(5, dupUU, -1, 100, 0.941176));
                    // df->Effects[333].EffectCommands.push_back(createEC(4, dupUUe, -1, 8, amountTypetoD(1, 4)));
                    // df->Effects[334].EffectCommands.push_back(createEC(4, dupUUe, -1, 8, amountTypetoD(1, 4)));
                    // df->Effects[640].EffectCommands.push_back(createEC(4, dupUUe, -1, 8, amountTypetoD(1, 3)));
                    // df->Effects[584].EffectCommands.push_back(createEC(4, dupUUe, -1, 8, amountTypetoD(1, 3)));
                    // df->Effects[610].EffectCommands.push_back(createEC(5, dupUUe, -1, 100, 0.85));
                    // df->Effects[638].EffectCommands.push_back(createEC(5, dupUUe, -1, 100, 0.941176));

                    this->duplicationUnits.push_back({uniqueUnit, dupUU, dupUUe});
                    this->duplicationUnits.push_back({uniqueElite, dupUUe, -1});

                    break;
                }
                // First Crusade
                case 29: {
                    for (Tech &tech : this->df->Techs) {
                        if (tech.Name.find("First Crusade") != string::npos && tech.Civ == (i + 1)) {
                            Effect crusadeUnit = Effect();
                            crusadeUnit.Name = "Enable crusade unit";
                            crusadeUnit.EffectCommands.push_back(createEC(1, 234, 0, -1, 5));
                            crusadeUnit.EffectCommands.push_back(createEC(7, uniqueUnit, 109, 5, 0));
                            crusadeUnit.EffectCommands.push_back(createEC(1, 77, 1, -1, 3));
                            crusadeUnit.EffectCommands.push_back(createEC(1, 178, 1, -1, 2));
                            crusadeUnit.EffectCommands.push_back(createEC(1, 179, 1, -1, 4));
                            this->df->Effects.push_back(crusadeUnit);
                            tech.EffectID = (int)(this->df->Effects.size() - 1);
                        }
                    }
                    break;
                }
            }
        }
    }

    // Imperial age unique techs
    for (int i = 0; i < this->config["imptech"].size(); i++) {
        int uniqueIndex = this->config["techtree"][i][0].asInt();
        int uniqueUnit = this->df->Effects[this->df->Techs[this->uuTechIDs[uniqueIndex].first].EffectID].EffectCommands[0].A;
        int uniqueElite = this->df->Effects[this->df->Techs[this->uuTechIDs[uniqueIndex].second].EffectID].EffectCommands[0].B;

        for (int j = 0; j < this->config["imptech"][i].size(); j++) {
            int impIndex = -1;
            int impCopies = -1;
            try {
                impIndex = this->config["imptech"][i][j].asInt();
                impCopies = 1;
            } catch (...) {
                impIndex = this->config["imptech"][i][j][0].asInt();
                impCopies = this->config["imptech"][i][j][1].asInt();
            }

            Tech &impTech = this->df->Techs[this->impUniqueTechIDs[impIndex]];

            // Actually give the unique tech
            int allocatedTech = allocateTech(this->df, this->impUniqueTechIDs[impIndex], i + 1);

            this->multipliedEffects.push_back({allocatedTech, impCopies});

            switch (impIndex) {
                // Allow teammates to train ten of your unique unit for free
                // Turn the free-kipchak into free-uniqueunit
                case 9: {
                    for (Civ &civ : df->Civs) {
                        civ.Units[1260] = civ.Units[uniqueElite];
                        civ.Units[1260].Name = "MKIPCHAK";
                        // civ.Units[1260].Creatable.TrainLocationID = -1;
                        setTrainLocation(civ.Units[1260].Creatable, 82, 4);
                        civ.Units[1260].Creatable.ResourceCosts[0].Type = 214;
                        civ.Units[1260].Creatable.ResourceCosts[0].Amount = 1;
                        // civ.Units[1260].Creatable.ResourceCosts[1].Type = 215;
                        // civ.Units[1260].Creatable.ResourceCosts[1].Amount = -1;
                    }
                    this->duplicationUnits.push_back({uniqueElite, 1260, -1});
                    break;
                }
            }
        }
    }
}

void Civbuilder::assignCivBonuses() {
    for (int i = 0; i < this->config["civ_bonus"].size(); i++) {
        for (int j = 0; j < this->config["civ_bonus"][i].size(); j++) {
            int civBonusIndex = -1;
            int civBonusCopies = -1;
            try {
                civBonusIndex = this->config["civ_bonus"][i][j].asInt();
                civBonusCopies = 1;
            } catch (...) {
                civBonusIndex = this->config["civ_bonus"][i][j][0].asInt();
                civBonusCopies = this->config["civ_bonus"][i][j][1].asInt();
            }
            ai["civs"][i]["bn"].append(civBonusIndex);

            // Actually give the techs associated with that bonus
            for (int k = 0; k < this->civBonuses[civBonusIndex].size(); k++) {
                int allocatedTech = allocateTech(df, this->civBonuses[civBonusIndex][k], i + 1);
                // Store information so that we can multiply all effects after the effectcommands have been configured correctly
                this->multipliedEffects.push_back({allocatedTech, civBonusCopies});
            }

            // Apply extra necessary effects
            int uniqueIndex = this->config["techtree"][i][0].asInt();
            int uniqueUnit = this->df->Effects[this->df->Techs[this->uuTechIDs[uniqueIndex].first].EffectID].EffectCommands[0].A;
            int uniqueElite = this->df->Effects[this->df->Techs[this->uuTechIDs[uniqueIndex].second].EffectID].EffectCommands[0].B;
            switch (civBonusIndex) {
                // If they have Kreposts, let them train their unique unit in them!
                case 93: {
                    for (Civ &civ : this->df->Civs) {
                        civ.Units.push_back(civ.Units[uniqueUnit]);
                        civ.UnitPointers.push_back(1);
                        int duplicateUU = (int)(civ.Units.size() - 1);
                        civ.Units[duplicateUU].Name = "KREPOSTUNIT" + to_string(i);
                        setTrainLocation(civ.Units[duplicateUU].Creatable, 1251, 1);

                        civ.Units.push_back(civ.Units[uniqueElite]);
                        civ.UnitPointers.push_back(1);
                        int duplicateUUelite = (int)(civ.Units.size() - 1);
                        civ.Units[duplicateUUelite].Name = "EKREPOSTUNIT" + to_string(i);
                        setTrainLocation(civ.Units[duplicateUUelite].Creatable, 1251, 1);
                    }
                    int dupUU = (int)(this->df->Civs[0].Units.size() - 2);
                    int dupUUe = (int)(this->df->Civs[0].Units.size() - 1);

                    for (Tech &tech : this->df->Techs) {
                        if (tech.Name.find("C-Bonus, Enable Krepost") != string::npos && tech.Civ == (i + 1)) {
                            Effect enableUnit = Effect();
                            enableUnit.Name = "Enable Krepost & Unit";
                            enableUnit.EffectCommands.push_back(createEC(2, 1251, 1, -1, 0));
                            enableUnit.EffectCommands.push_back(createEC(2, dupUU, 1, -1, 0));
                            this->df->Effects.push_back(enableUnit);
                            tech.EffectID = (int)(this->df->Effects.size() - 1);
                        }
                    }

                    duplicationUnits.push_back({uniqueUnit, dupUU, dupUUe});
                    duplicationUnits.push_back({uniqueElite, dupUUe, -1});
                    break;
                }
                // If they have Donjons, let them train their unique unit in them!
                case 109: {
                    for (Civ &civ : this->df->Civs) {
                        civ.Units.push_back(civ.Units[uniqueUnit]);
                        civ.UnitPointers.push_back(1);
                        int duplicateUU = (int)(civ.Units.size() - 1);
                        civ.Units[duplicateUU].Name = "DONJONUNIT" + to_string(i);
                        setTrainLocation(civ.Units[duplicateUU].Creatable, 1665, 1);

                        civ.Units.push_back(civ.Units[uniqueElite]);
                        civ.UnitPointers.push_back(1);
                        int duplicateUUelite = (int)(civ.Units.size() - 1);
                        civ.Units[duplicateUUelite].Name = "EDONJONUNIT" + to_string(i);
                        setTrainLocation(civ.Units[duplicateUUelite].Creatable, 1665, 1);
                    }
                    int dupUU = (int)(this->df->Civs[0].Units.size() - 2);
                    int dupUUe = (int)(this->df->Civs[0].Units.size() - 1);

                    for (Tech &tech : this->df->Techs) {
                        if (tech.Name.find("Enable Donjon Unit") != string::npos && tech.Civ == (i + 1)) {
                            Effect enableUnit = Effect();
                            enableUnit.Name = "Enable Donjon Unit";
                            enableUnit.EffectCommands.push_back(createEC(2, dupUU, 1, -1, 0));
                            this->df->Effects.push_back(enableUnit);
                            tech.EffectID = (int)(this->df->Effects.size() - 1);
                            if (uniqueUnit == 1658) {
                                tech.RequiredTechs[0] = 101;
                            } else {
                                tech.RequiredTechs[0] = 102;
                            }
                        }
                    }

                    duplicationUnits.push_back({uniqueUnit, dupUU, dupUUe});
                    duplicationUnits.push_back({uniqueElite, dupUUe, -1});

                    break;
                }
                // Wonder provides +50 bonus pop
                case 140: {
                    // Use the "ore storage" resource to cap at 1 wonder
                    Civ &civ = this->df->Civs[i + 1];
                    civ.Resources[56] = 1.1;
                    civ.Units[276].ResourceStorages[0].Type = 32;
                    civ.Units[276].ResourceStorages[0].Amount = 50;
                    civ.Units[276].ResourceStorages[0].Flag = 4;
                    civ.Units[276].ResourceStorages[1].Type = 56;
                    civ.Units[276].ResourceStorages[1].Amount = -1;
                    civ.Units[276].ResourceStorages[1].Flag = 2;
                    civ.Units[276].Creatable.ResourceCosts[0] = civ.Units[276].Creatable.ResourceCosts[2];
                    civ.Units[276].Creatable.ResourceCosts[2].Type = 56;
                    civ.Units[276].Creatable.ResourceCosts[2].Amount = 1;
                    civ.Units[276].Creatable.ResourceCosts[2].Flag = 0;
                    break;
                }
                // Villagers give 25 food on death
                case 211: {
                    Civ &civ = this->df->Civs[i + 1];
                    const vector<int> vil_d = {58, 60, 224, 225, 353, 227, 228, 229, 215, 217, 219, 221, 213, 226, 211, 355, 229, 591, 593};
                    for (int k = 0; k < vil_d.size(); k++) {
                        civ.Units[vil_d[k]].ResourceStorages[1].Type = 0;
                        civ.Units[vil_d[k]].ResourceStorages[1].Amount = 25;
                        civ.Units[vil_d[k]].ResourceStorages[1].Flag = 1;
                    }
                    break;
                }
                // Mangonels can cut trees
                case 213: {
                    Civ &civ = this->df->Civs[i + 1];
                    civ.Units[280].Bird.TaskList[5].ClassID = 15;
                    civ.Units[280].Type50.BlastAttackLevel = 1;
                    break;
                }
                // Refund castle stone
                case 218: {
                    Civ &civ = this->df->Civs[i + 1];
                    //					civ.Units[1430].ResourceStorages[1].Type = 2;
                    //					civ.Units[1430].ResourceStorages[1].Amount = 350;
                    //					civ.Units[1430].ResourceStorages[1].Flag = 1;
                    civ.Units[82].ResourceStorages[1].Type = 3;
                    civ.Units[82].ResourceStorages[1].Amount = 400;
                    civ.Units[82].ResourceStorages[1].Flag = 4;
                    break;
                }
                // Rams generate stone
                case 229: {
                    Civ &civ = this->df->Civs[i + 1];
                    for (int k = 0; k < this->unitClasses["ram"].size(); k++) {
                        civ.Units[this->unitClasses["ram"][k]].Bird.TaskList[civ.Units[this->unitClasses["ram"][k]].Bird.TaskList.size() - 1].ClassID = 3;
                    }
                    break;
                }
            }
        }
    }
}

void Civbuilder::assignTeamBonuses() {
    for (int i = 0; i < this->config["team_bonus"].size(); i++) {
        // Create a new effect with multiple team bonuses
        Effect tbEffect = Effect();
        tbEffect.Name = "Team Bonus, " + to_string(i) + " set";
        for (int j = 0; j < this->config["team_bonus"][i].size(); j++) {
            int teamBonusIndex = -1;
            int teamBonusCopies = -1;
            try {
                teamBonusIndex = this->config["team_bonus"][i][j].asInt();
                teamBonusCopies = 1;
            } catch (...) {
                teamBonusIndex = this->config["team_bonus"][i][j][0].asInt();
                teamBonusCopies = this->config["team_bonus"][i][j][1].asInt();
            }
            for (int k = 0; k < this->df->Effects[this->teamBonuses[teamBonusIndex]].EffectCommands.size(); k++) {
                for (int l = 0; l < teamBonusCopies; l++) {
                    tbEffect.EffectCommands.push_back(this->df->Effects[this->teamBonuses[teamBonusIndex]].EffectCommands[k]);
                }
            }
            switch (teamBonusIndex) {
                case 30: {
                    allocateTech(this->df, 721, i + 1);
                    break;
                }
                case 68: {
                    tbEffect.Name += ", Elite costs -20%.";
                    break;
                }
            }
            ai["civs"][i]["tb"].append(this->config["team_bonus"][i][j]);
        }
        this->df->Effects.push_back(tbEffect);
        this->df->Civs[i + 1].TeamBonusID = (this->df->Effects.size() - 1);
    }
}

// Any and all effects that apply to units should apply to their barracks/stable/krepost/donjon/copy equivalent
void Civbuilder::duplicateUnitEffects() {
    const vector<int> copyEffectTypes = {0, 3, 4, 5, 10, 13, 14, 15, 20, 23, 24, 25, 30, 33, 34, 35, 40, 43, 44, 45};
    for (int i = 0; i < this->duplicationUnits.size(); i++) {
        // Re-copy the unit stats (if we added any new attack classes or armor classes)
        for (Civ &civ : this->df->Civs) {
            civ.Units[this->duplicationUnits[i][1]].Type50.Attacks = civ.Units[this->duplicationUnits[i][0]].Type50.Attacks;
            civ.Units[this->duplicationUnits[i][1]].Type50.Armours = civ.Units[this->duplicationUnits[i][0]].Type50.Armours;
        }

        // Copy any area of effect tasks that apply to each duplicated unit
        for (Civ &civ : this->df->Civs) {
            for (Unit &unit : civ.Units) {
                int taskListInitialSize = unit.Bird.TaskList.size();
                for (int j = 0; j < taskListInitialSize; j++) {
                    if (unit.Bird.TaskList[j].UnitID == this->duplicationUnits[i][0]) {
                        // Check if we already have a task for the copy equivalent
                        bool hasTask = false;
                        for (int k = 0; k < taskListInitialSize; k++) {
                            if (unit.Bird.TaskList[k].UnitID == this->duplicationUnits[i][1] &&
                                unit.Bird.TaskList[k].ActionType == unit.Bird.TaskList[j].ActionType &&
                                unit.Bird.TaskList[k].SearchWaitTime == unit.Bird.TaskList[j].SearchWaitTime &&
                                unit.Bird.TaskList[k].TargetDiplomacy == unit.Bird.TaskList[j].TargetDiplomacy &&
                                unit.Bird.TaskList[k].WorkRange == unit.Bird.TaskList[j].WorkRange) {
                                hasTask = true;
                            }
                        }

                        // Duplicate the task for the new unit
                        if (!hasTask) {
                            Task copyTask = unit.Bird.TaskList[j];
                            copyTask.UnitID = this->duplicationUnits[i][1];
                            unit.Bird.TaskList.push_back(copyTask);
                        }
                    }
                }
            }
        }

        for (Effect &effect : df->Effects) {
            int numEffectCommands = effect.EffectCommands.size();
            for (int j = 0; j < numEffectCommands; j++) {
                // Check if this effect command applies to the unit who's effects we're duplicating, and that it's an attribute effect command
                if ((effect.EffectCommands[j].A == this->duplicationUnits[i][0]) &&
                    (find(copyEffectTypes.begin(), copyEffectTypes.end(), effect.EffectCommands[j].Type) != copyEffectTypes.end())) {
                    if (effect.EffectCommands[j].Type % 10 != 3) {
                        // Not an upgrade, so copy the effect fully
                        EffectCommand copyEC = effect.EffectCommands[j];
                        copyEC.A = this->duplicationUnits[i][1];
                        bool alreadyHasEC = false;
                        for (int k = 0; k < numEffectCommands; k++) {
                            if (copyEC.Type == effect.EffectCommands[k].Type && copyEC.A == effect.EffectCommands[k].A &&
                                copyEC.B == effect.EffectCommands[k].B && copyEC.C == effect.EffectCommands[k].C && copyEC.D == effect.EffectCommands[k].D) {
                                alreadyHasEC = true;
                                k = numEffectCommands;
                            }
                        }
                        if (!alreadyHasEC) {
                            effect.EffectCommands.push_back(copyEC);
                        }
                    } else if (this->duplicationUnits[i][2] != -1) {
                        // This is an upgrade, so copy the effect so that the duplicate unit gets upgraded to the duplicate's upgrade, not the original unit's
                        // upgrade
                        EffectCommand copyEC = effect.EffectCommands[j];
                        copyEC.A = this->duplicationUnits[i][1];
                        copyEC.B = this->duplicationUnits[i][2];
                        bool alreadyHasEC = false;
                        for (int k = 0; k < numEffectCommands; k++) {
                            if (copyEC.Type == effect.EffectCommands[k].Type && copyEC.A == effect.EffectCommands[k].A &&
                                /*copyEC.B == effect.EffectCommands[k].B && */ copyEC.C == effect.EffectCommands[k].C &&
                                copyEC.D == effect.EffectCommands[k].D) {
                                alreadyHasEC = true;
                                k = numEffectCommands;
                            }
                        }
                        if (!alreadyHasEC) {
                            effect.EffectCommands.push_back(copyEC);
                        }
                    }
                }
            }
        }
    }
}
