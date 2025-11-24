/*
 * extract-dat-info.cpp
 * 
 * Helper program to extract unit names, tech names, and effect names from
 * Age of Empires 2 DAT files. Outputs machine and human-readable JSON format.
 * 
 * Usage: ./extract-dat-info <input_dat_file> <output_json_file> [strings_json_file]
 * 
 * Example:
 *   ./extract-dat-info ../public/vanillaFiles/empires2_x2_p1.dat units.json
 *   ./extract-dat-info ../public/vanillaFiles/empires2_x2_p1.dat units.json ../public/aoe2techtree/data/locales/en/strings.json
 */

#include "genie/dat/DatFile.h"
#include <fstream>
#include <iostream>
#include <jsoncpp/json/json.h>
#include <map>
#include <memory>
#include <string>

using namespace std;
using namespace Json;
using namespace genie;

// Helper function to load strings from strings.json
map<int, string> loadStrings(const string& stringsPath) {
  map<int, string> strings;
  
  ifstream stringsFile(stringsPath);
  if (!stringsFile.is_open()) {
    cerr << "Warning: Could not open strings file: " << stringsPath << endl;
    cerr << "Display names will not be available." << endl;
    return strings;
  }
  
  try {
    Value stringsRoot;
    stringsFile >> stringsRoot;
    stringsFile.close();
    
    for (auto const& key : stringsRoot.getMemberNames()) {
      try {
        int id = stoi(key);
        strings[id] = stringsRoot[key].asString();
      } catch (...) {
        // Skip invalid keys
      }
    }
    
    cout << "Loaded " << strings.size() << " string translations" << endl;
  } catch (const exception& e) {
    cerr << "Warning: Failed to parse strings file: " << e.what() << endl;
    cerr << "Display names will not be available." << endl;
    stringsFile.close();
    return {}; // Return empty map
  }
  
  return strings;
}

int main(int argc, char **argv) {
  // Check arguments
  if (argc < 3 || argc > 4) {
    cerr << "Usage: " << argv[0] << " <input_dat_file> <output_json_file> [strings_json_file]" << endl;
    cerr << "Example: " << argv[0] << " ../public/vanillaFiles/empires2_x2_p1.dat output.json" << endl;
    cerr << "Example: " << argv[0] << " ../public/vanillaFiles/empires2_x2_p1.dat output.json ../public/aoe2techtree/data/locales/en/strings.json" << endl;
    return 1;
  }

  // Load strings if provided
  map<int, string> strings;
  if (argc == 4) {
    strings = loadStrings(argv[3]);
  }

  // Load DAT file using smart pointer for automatic memory management
  auto df = make_unique<DatFile>();
  df->setGameVersion(GV_LatestDE2);

  cout << "Loading DAT file: " << argv[1] << endl;
  try {
    df->load(argv[1]);
  } catch (const exception &e) {
    cerr << "Error loading DAT file: " << e.what() << endl;
    return 1;
  }

  cout << "DAT file loaded successfully!" << endl;
  cout << "Extracting data..." << endl;

  // Create JSON root object
  Value root;
  root["metadata"]["source_file"] = argv[1];
  root["metadata"]["game_version"] = "LatestDE2";
  // Note: This is the compilation date, not the extraction date
  root["metadata"]["compilation_date"] = __DATE__;
  root["metadata"]["has_display_names"] = !strings.empty();

  // Extract units from Civ[0] (Gaia/template civ)
  // This contains all available units in the game
  if (df->Civs.size() > 0) {
    Value unitsArray(Json::arrayValue);
    
    for (size_t i = 0; i < df->Civs[0].Units.size(); i++) {
      Unit &unit = df->Civs[0].Units[i];
      
      // Skip invalid/placeholder units
      // Negative IDs indicate unused unit slots in the DAT file structure
      // Empty names indicate units that haven't been properly initialized
      if (unit.ID < 0 || unit.Name.empty()) continue;
      
      Value unitObj;
      unitObj["id"] = unit.ID;
      unitObj["name"] = unit.Name;
      unitObj["language_dll_name"] = unit.LanguageDLLName;
      unitObj["language_dll_creation"] = unit.LanguageDLLCreation;
      unitObj["type"] = (int)unit.Type;
      unitObj["class"] = unit.Class;
      
      // Add display name if available
      if (!strings.empty() && strings.find(unit.LanguageDLLName) != strings.end()) {
        unitObj["display_name"] = strings[unit.LanguageDLLName];
      }
      
      // Add train locations array for creatable units (UT_Creatable=70, UT_Building=80)
      if (unit.Type == UT_Creatable || unit.Type == UT_Building) {
        Value trainLocationsArray(Json::arrayValue);
        
        for (const auto& trainLoc : unit.Creatable.TrainLocations) {
          Value trainLocObj;
          trainLocObj["unit_id"] = trainLoc.UnitID;
          trainLocObj["button_id"] = trainLoc.ButtonID;
          trainLocObj["train_time"] = trainLoc.TrainTime;
          trainLocObj["hotkey_id"] = trainLoc.HotKeyID;
          trainLocationsArray.append(trainLocObj);
        }
        
        // Only include the array if it has training locations
        if (trainLocationsArray.size() > 0) {
          unitObj["train_locations"] = trainLocationsArray;
        }
      }
      
      unitsArray.append(unitObj);
    }
    
    root["units"] = unitsArray;
    cout << "Extracted " << unitsArray.size() << " units" << endl;
  }

  // Extract techs/researches
  Value techsArray(Json::arrayValue);
  for (size_t i = 0; i < df->Techs.size(); i++) {
    Tech &tech = df->Techs[i];
    
    Value techObj;
    techObj["id"] = (int)i;
    techObj["name"] = tech.Name;
    techObj["language_dll_name"] = tech.LanguageDLLName;
    techObj["language_dll_description"] = tech.LanguageDLLDescription;
    techObj["civ"] = tech.Civ;
    techObj["research_time"] = tech.ResearchTime;
    techObj["research_location"] = tech.ResearchLocation;
    
    // Add display name if available
    if (!strings.empty() && strings.find(tech.LanguageDLLName) != strings.end()) {
      techObj["display_name"] = strings[tech.LanguageDLLName];
    }
    
    // Add research locations array (new structure)
    Value researchLocationsArray(Json::arrayValue);
    for (const auto& resLoc : tech.ResearchLocations) {
      Value resLocObj;
      resLocObj["location_id"] = resLoc.LocationID;
      resLocObj["button_id"] = resLoc.ButtonID;
      resLocObj["research_time"] = resLoc.ResearchTime;
      researchLocationsArray.append(resLocObj);
    }
    
    // Only include the array if it has research locations
    if (researchLocationsArray.size() > 0) {
      techObj["research_locations"] = researchLocationsArray;
    }
    
    techsArray.append(techObj);
  }
  
  root["techs"] = techsArray;
  cout << "Extracted " << techsArray.size() << " techs" << endl;

  // Extract effects
  Value effectsArray(Json::arrayValue);
  for (size_t i = 0; i < df->Effects.size(); i++) {
    Effect &effect = df->Effects[i];
    
    Value effectObj;
    effectObj["id"] = (int)i;
    effectObj["name"] = effect.Name;
    effectObj["num_commands"] = (int)effect.EffectCommands.size();
    
    effectsArray.append(effectObj);
  }
  
  root["effects"] = effectsArray;
  cout << "Extracted " << effectsArray.size() << " effects" << endl;

  // Write JSON to output file
  cout << "Writing to file: " << argv[2] << endl;
  ofstream outputFile(argv[2]);
  if (!outputFile.is_open()) {
    cerr << "Error: Could not open output file: " << argv[2] << endl;
    cerr << "Possible causes: file path doesn't exist, insufficient permissions, or disk full" << endl;
    return 1;
  }

  // Use styled writer for human-readable output
  StreamWriterBuilder builder;
  builder["commentStyle"] = "None";
  builder["indentation"] = "  ";
  unique_ptr<Json::StreamWriter> writer(builder.newStreamWriter());
  writer->write(root, &outputFile);
  outputFile << endl;
  
  outputFile.close();
  cout << "Data extraction complete!" << endl;
  cout << "Output written to: " << argv[2] << endl;

  // Smart pointer df will be automatically cleaned up
  return 0;
}
