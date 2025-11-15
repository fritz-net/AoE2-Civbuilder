#ifndef CIVBUILDER_H
#define CIVBUILDER_H

#include <jsoncpp/json/json.h>
#include <math.h>
#include <time.h>

#include <algorithm>
#include <cmath>
#include <fstream>
#include <iostream>
#include <map>
#include <string>
#include <typeinfo>

#include "genie/dat/DatFile.h"
#include "helpers.h"

using namespace std;
using namespace genie;
using namespace Json;

class Civbuilder {
   private:
    map<int, vector<int>> civBonuses;
    map<int, pair<int, int>> uuTechIDs;
    map<int, int> castleUniqueTechIDs;
    map<int, int> impUniqueTechIDs;
    map<int, int> teamBonuses;
    map<string, vector<int>> unitClasses;

    int ahosiID = -1;
    int ehosiID = -1;
    int vilspear = -1;
    int vilpike = -1;
    int vilhalb = -1;

    int numPlayerCivs;

    vector<vector<int>> duplicationUnits;
    vector<vector<int>> multipliedEffects;

    vector<Unit> castleGraphics;
    vector<Unit> wonderGraphics;

    Value config;
    DatFile *df;
    ofstream logfile;
    Value ai;
    string aipath;

    // Helper methods for TrainLocation manipulation
    void ensureTrainLocation(unit::Creatable& creatable);
    void setTrainLocationID(unit::Creatable& creatable, int16_t unitID);
    void setTrainButtonID(unit::Creatable& creatable, uint8_t buttonID);
    void setTrainLocation(unit::Creatable& creatable, int16_t unitID, uint8_t buttonID, int32_t HotKeyID = 16000);
    void setTrainTime(unit::Creatable& creatable, int16_t trainTime);

    // Helper methods for ResearchLocation manipulation
    void ensureResearchLocation(Tech& tech);
    void setResearchLocation(Tech& tech, int16_t locationID, int16_t researchTime, uint8_t buttonID);
    int16_t getResearchLocation(const Tech& tech);

   public:
    Civbuilder(DatFile *df, Value config, string logpath, string aipath);
    ~Civbuilder();
    void initialize();
    void configure();
    void createUT(int civbuilderID, int type, Effect utEffect, string name, vector<int> techCosts, int techTime, int techDLL);
    void createCivBonus(int civbuilderID, Effect e, string name, vector<int> requirements);
    void createTeamBonus(int civbuilderID, Effect e, string name);
    void createUU(int civbuilderID, int baseID, string name, vector<int> techCosts, int techTime, int techDLL);
    void setupData();
    void createData();
    void assignData();
    void createNewUnits();
    void createUniqueTechs();
    void createCivBonuses();
    void createTeamBonuses();
    void reconfigureEffects();
    void assignArchitectures();
    void assignLanguages();
    void assignWonders();
    void assignCastles();
    void assignUniqueUnits();
    void assignBasicTechs();
    void assignUniqueTechs();
    void assignCivBonuses();
    void assignTeamBonuses();
    void duplicateUnitEffects();
    void cleanup();
};

#endif
