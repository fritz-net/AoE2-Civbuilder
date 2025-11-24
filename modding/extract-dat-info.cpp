/*
 * extract-dat-info.cpp
 * 
 * Helper program to extract unit names, tech names, and effect names from
 * Age of Empires 2 DAT files. Outputs machine and human-readable JSON format.
 * 
 * Usage: ./extract-dat-info <input_dat_file> <output_json_file>
 * 
 * Example:
 *   ./extract-dat-info ../public/vanillaFiles/empires2_x2_p1.dat units.json
 */

#include "genie/dat/DatFile.h"
#include <fstream>
#include <iostream>
#include <jsoncpp/json/json.h>
#include <string>

using namespace std;
using namespace Json;
using namespace genie;

int main(int argc, char **argv) {
  // Check arguments
  if (argc != 3) {
    cerr << "Usage: " << argv[0] << " <input_dat_file> <output_json_file>" << endl;
    cerr << "Example: " << argv[0] << " ../public/vanillaFiles/empires2_x2_p1.dat output.json" << endl;
    return 1;
  }

  // Load DAT file
  auto *df = new DatFile();
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
  root["metadata"]["extraction_date"] = __DATE__;

  // Extract units from Civ[0] (Gaia/template civ)
  // This contains all available units in the game
  if (df->Civs.size() > 0) {
    Value unitsArray(Json::arrayValue);
    
    for (size_t i = 0; i < df->Civs[0].Units.size(); i++) {
      Unit &unit = df->Civs[0].Units[i];
      
      // Skip units with invalid IDs or no name
      if (unit.ID < 0) continue;
      
      Value unitObj;
      unitObj["id"] = unit.ID;
      unitObj["name"] = unit.Name;
      unitObj["language_dll_name"] = unit.LanguageDLLName;
      unitObj["language_dll_creation"] = unit.LanguageDLLCreation;
      unitObj["type"] = (int)unit.Type;
      unitObj["class"] = unit.Class;
      
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
    delete df;
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

  delete df;
  return 0;
}
