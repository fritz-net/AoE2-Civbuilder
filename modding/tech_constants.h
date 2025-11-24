/*
 * tech_constants.h
 * 
 * Tech ID constants with TECH_ prefix to avoid conflicts with unit_ids.h
 * This file provides access to tech enum values without including tech_ids.h
 * which would conflict with unit_ids.h that's already included via civbuilder.h
 */

#ifndef TECH_CONSTANTS_H
#define TECH_CONSTANTS_H

// Technology IDs - prefixed with TECH_ to avoid naming conflicts
// Values extracted from tech_ids.h

// Non-conflicting tech names can be used directly from this namespace
namespace TechConstants {
    // Common techs without conflicts
    const int KAMANDARAN = 488;
    const int C_BONUS___5_MONK_HP_6 = 38;
    const int CUMAN_MERC_PART2 = 707;
    const int LECHITIC_LEGACY = 783;
    const int MALAY = 651;
    const int C_BONUS__FREE_HAND_CART = 400;
    const int C_BONUS___15__FARMERS = 401;
    const int C_BONUS__HUNTING_BONUSES = 402;
    const int C_BONUS__CAVALRY__5__SPEED_AGE2 = 711;
    const int BOGSVEIGAR = 49;
    const int C_BONUS__ARCHER_RANGE__1 = 403;
    const int C_BONUS__DOMINANT_LOS = 405;
    const int YASAMA = 484;
    const int EL_DORADO = 4;
    const int CRENELLATIONS = 11;
    const int C_BONUS___10_POP = 406;
    const int C_BONUS__INF__1_ATTACK_CASTLE = 647;
    const int C_BONUS__CAMEL_RIDER_ATTACK_SPEED = 505;
    const int RENAME_UNITS = 713;
    const int DRILL = 6;
    const int C_BONUS__MONASTERY_TECHS__50__COST = 649;
    const int C_BONUS___1_INF_ATTK_1 = 43;
    const int IRONCLAD = 489;
    const int MONK_RANGED_HEAL = 407;
    const int SPIES_TREASON = 408;
    const int C_BONUS___5_MONK_HP_3 = 32;
    const int C_BONUS__TC_AND_DOCK_WORK_RATE = 409;
    const int HUSSITE_REFORMS = 785;
    const int SARACEN_ZEALOTRY = 9;
    const int SARACENS_UT = 490;
    const int C_BONUS__FEUDAL_TC = 709;
    const int C_BONUS__GALLEY__20__FIRE = 404;
    const int C_BONUS__TC__15 = 410;
    const int VIETNAMESE = 653;
    const int C_BONUS__TC__20 = 411;
    
    // Techs with TECH_ prefix to avoid conflicts with unit IDs
    const int TECH_BERSERK = 399;  // Conflicts with unit BERSERK
    const int TECH_ELITE_TARKAN = 2;  // Conflicts with unit
    
    // Castle Age Unique Techs
    const int ATLATL = 460;
    const int KASBAH = 578;
    const int YEOMEN = 3;
    const int STIRRUPS = 685;
    const int BURGUNDIAN_VINEYARDS = 754;
    const int MANIPUR_CAVALRY = 627;
    const int GREEK_FIRE = 464;
    const int STRONGHOLD = 482;
    const int GREAT_WALL = 462;
    const int STEPPE_HUSBANDRY = 689;
    const int ROYAL_HEIRS = 574;
    const int BEARDED_AXE = 83;
    const int ANARCHY = 16;
    const int MARAUDERS = 483;
    const int ANDEAN_SLING = 516;
    const int GRAND_TRUNK_ROAD = 506;
    const int PAVISE = 494;
    const int TUSK_SWORDS = 622;
    const int EUPSEONG = 486;
    const int HILL_FORTS = 691;
    const int CORVINIAN_ARMY = 514;
    const int THALASSOCRACY = 624;
    const int TIGUI = 576;
    const int HUL_CHE_JAVELINEERS = 485;
    const int NOMADS = 487;
    const int CARRACK = 572;
    const int FIRST_CRUSADE = 756;
    const int SLAVS_UT = 512;
    const int INQUISITION = 492;
    const int SILK_ARMOR = 687;
    const int CITADELS = 7;
    const int BALLISTAS = 883;
    const int FERETERS = 921;
    const int CILICIAN_FLEET = 922;
    const int SVAN_TOWERS = 923;
    const int AZNAURI_CAVALRY = 924;
    const int SILK_ROAD = 499;
    const int COILED_SERPENT_ARRAY = 1070;
    const int RED_CLIFFS_TACTICS = 1080;
    const int TUNTIAN = 1061;
    const int FORTIFIED_BASTIONS = 996;
    const int LAMELLAR_ARMOR = 1006;
    
    // Imperial Age Unique Techs
    const int GARLAND_WARS = 24;
    const int MAGHREBI_CAMELS = 579;
    const int WARWOLF = 461;
    const int BAGAINS = 686;
    const int FLEMISH_REVOLUTION = 755;
    const int HOWDAH = 626;
    const int LOGISTICA = 61;
    const int FUROR_CELTICA = 5;
    const int ROCKETRY = 52;
    const int CUMAN_MERCENARIES = 690;
    const int TORSION_ENGINES = 575;
    const int CHIVALRY = 493;
    const int PERFUSION = 457;
    const int ATHEISM = 21;
    const int FABRIC_SHIELDS = 517;
    const int SHATAGNI = 507;
    const int PIROTECHNIA = 902;
    const int KATAPARUTO = 59;
    const int DOUBLE_CROSSBOW = 623;
    const int SHINKICHON = 445;
    const int TOWER_SHIELDS = 692;
    const int RECURVE_BOW = 515;
    const int FORCED_LEVY = 625;
    const int FARIMBA = 577;
    const int EL_DORADO_IMP = 4;  // Same as castle
    const int DRILL_IMP = 6;  // Same as team bonus
    const int COUNTERWEIGHTS = 454;  // Teutons
    const int ARQUEBUS = 573;
    const int HAUBERK = 757;
    const int DRUZHINA = 513;
    const int SUPREMACY = 440;
    const int TIMURID_SIEGECRAFT = 688;
    const int CRENELLATIONS_IMP = 11;  // Same value, different context
    const int ARTILLERY = 10;
    const int CHATRAS = 628;
    const int CHIEFTAINS = 463;
    const int LECHITIC_LEGACY_IMP = 783;  // Poles
    const int HUSSITE_REFORMS_IMP = 785;  // Bohemians
    const int MEDICAL_CORPS = 831;
    const int WOOTZ_STEEL = 832;
    const int PAIKS = 833;
    const int MAHAYANA = 834;
    const int KSHATRIYAS = 835;
    const int FRONTIER_GUARDS = 836;
    const int DETINETS = 455;
    const int BIMARISTAN = 28;
    const int COMITATENSES = 884;
    const int BOLT_MAGAZINE = 1069;
    const int SITTING_TIGER = 1081;
    const int MING_GUANG_ARMOR = 1062;
    const int THUNDERCLAP_BOMBS = 997;
    const int ORDO_CAVALRY = 1007;
    
    // Unique Unit Tech IDs (for enabling units)
    const int LONGBOW__MAKE_AVAIL = 263;
    const int THROWING_AXEMEN__MAKE_AVAIL = 275;
    const int HUSKARL__MAKE_AVAIL = 446;
    const int TEUTONIC_KNIGHT__MAKE_AVAIL = 276;
    const int SAMURAI__MAKE_AVAIL = 262;
    const int CHU_KO_NU__MAKE_AVAIL = 268;
    const int CATAPHRACT__MAKE_AVAIL = 267;
    const int MAMELUKE__MAKE_AVAIL = 269;
    const int WAR_ELEPHANT__MAKE_AVAIL = 274;
    const int JANNISARY__MAKE_AVAIL = 271;
    const int BERSERK__MAKE_AVAIL = 399;  // Note: conflicts with unit name
    const int MOBILE_SIEGE_UNIT__MAKE_AVAIL = 273;
    const int WOAD_BERSERKER__MAKE_AVAIL = 277;
    const int CONQUISTADOR__MAKE_AVAIL = 58;
    const int JAGUAR_MAN = 431;
    const int PLUMED_ARCHER__MAKE_AVAIL = 26;
    const int TARKAN__MAKE_AVAIL = 1;
    const int TECH_WAR_WAGON = 449;  // Conflicts with unit
    const int GENOESE_BOW__MAKE_AVAIL = 467;
    const int GHULAM__MAKE_AVAIL = 839;
    const int KAMAYUK__MAKE_AVAIL = 508;
    const int MAGYAR_HUSZAR__MAKE_AVAIL = 471;
    const int BOYAR__MAKE_AVAIL = 503;
    const int ORGAN_GUN__MAKE_AVAIL = 562;
    const int SHOTEL_WARRIOR__MAKE_AVAIL = 568;
    const int GBETO__MAKE_AVAIL = 566;
    const int CAMEL_ARCHER__MAKE_AVAIL = 564;
    const int BALLISTA_ELEPHANT__MAKE_AVAIL = 614;
    const int KARAMBIT_WARRIOR__MAKE_AVAIL = 616;
    const int ARAMBAI__MAKE_AVAIL = 618;
    const int RATTAN_ARCHER__MAKE_AVAIL = 620;
    const int KONNIK__MAKE_AVAIL = 677;
    const int KESHIK__MAKE_AVAIL = 679;
    const int KIPCHAK__MAKE_AVAIL = 681;
    const int LEITIS__MAKE_AVAIL = 683;
    const int COUSTILLIER__MAKE_AVAIL = 750;
    const int SERJEANT__MAKE_AVAIL = 752;
    const int OBUCH__MAKE_AVAIL = 778;
    const int HUSSITE_WAGON__MAKE_AVAIL = 780;
    const int CHAKRAM_THROWER__MAKE_AVAIL = 829;
    const int URUMI_SWORDSMAN__MAKE_AVAIL = 825;
    const int RATHA__MAKE_AVAIL = 827;
    const int COMPOSITE_BOWMAN__MAKE_AVAIL = 917;
    const int MONASPA__MAKE_AVAIL = 919;
    const int WHITE_FEATHER_GUARD__MAKE_AVAIL = 1063;
    const int FIRE_ARCHER__MAKE_AVAIL = 1073;
    const int TIGER_CAVALRY__MAKE_AVAIL = 1035;
    const int IRON_PAGODA__MAKE_AVAIL = 990;
    const int LIAO_DAO__MAKE_AVAIL = 1001;
    
    // Elite versions - many conflict with unit names, using TECH_ prefix
    const int TECH_ELITE_LONGBOW = 360;
    const int ELITE_THROWING_AXEMEN = 363;
    const int TECH_ELITE_HUSKARL = 365;
    const int TECH_ELITE_TEUTONIC_KNIGHT = 364;
    const int TECH_ELITE_SAMURAI = 366;
    const int TECH_ELITE_CHU_KO_NU = 362;
    const int TECH_ELITE_CATAPHRACT = 361;
    const int TECH_ELITE_MAMELUKE = 368;
    const int TECH_ELITE_WAR_ELEPHANT = 367;
    const int ELITE_JANNISARY = 369;
    const int TECH_ELITE_BERSERK = 398;
    const int TECH_ELITE_MANGUDAI = 371;
    const int TECH_ELITE_WOAD_RAIDER = 370;
    const int TECH_ELITE_CONQUISTADOR = 60;
    const int ELITE_JAGUAR_MAN = 432;
    const int TECH_ELITE_PLUMED_ARCHER = 27;
    const int TECH_ELITE_WAR_WAGON = 450;
    const int TECH_ELITE_GENOESE_BOW = 468;
    const int TECH_ELITE_GHULAM = 840;
    const int TECH_ELITE_KAMAYUK = 509;
    const int TECH_ELITE_MAGYAR_HUSZAR = 472;
    const int ELITE_BOYAR = 504;
    const int TECH_ELITE_ORGAN_GUN = 563;
    const int ELITE_SHOTEL_WARRIOR = 569;
    const int ELITE_GBETO = 567;
    const int TECH_ELITE_CAMEL_ARCHER = 565;
    const int TECH_ELITE_BALLISTA_ELEPHANT = 615;
    const int TECH_ELITE_KARAMBIT_WARRIOR = 617;
    const int TECH_ELITE_ARAMBAI = 619;
    const int TECH_ELITE_RATTAN_ARCHER = 621;
    const int TECH_ELITE_KONNIK = 678;
    const int TECH_ELITE_KESHIK = 680;
    const int TECH_ELITE_KIPCHAK = 682;
    const int TECH_ELITE_LEITIS = 684;
    const int TECH_ELITE_COUSTILLIER = 751;
    const int TECH_ELITE_SERJEANT = 753;
    const int TECH_ELITE_OBUCH = 779;  // Conflicts with unit
    const int TECH_ELITE_HUSSITE_WAGON = 781;
    const int TECH_ELITE_CHAKRAM_THROWER = 830;
    const int TECH_ELITE_URUMI_SWORDSMAN = 826;
    const int TECH_ELITE_RATHA = 828;
    const int TECH_ELITE_COMPOSITE_BOWMAN = 918;
    const int TECH_ELITE_MONASPA = 920;
    const int TECH_ELITE_WHITE_FEATHER_GUARD = 1064;
    const int TECH_ELITE_FIRE_ARCHER = 1074;
    const int TECH_ELITE_TIGER_CAVALRY = 1036;
    const int TECH_ELITE_IRON_PAGODA = 991;
    const int TECH_ELITE_LIAO_DAO = 1002;
}

#endif // TECH_CONSTANTS_H
