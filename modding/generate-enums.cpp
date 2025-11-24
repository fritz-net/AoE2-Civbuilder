/*
 * generate-enums.cpp
 * 
 * Generates C++ enum header files from the JSON output of extract-dat-info
 * 
 * Usage: ./generate-enums <input_json_file> <output_directory>
 * 
 * Example:
 *   ./generate-enums dat_export.json enums/
 */

#include <fstream>
#include <iostream>
#include <jsoncpp/json/json.h>
#include <map>
#include <regex>
#include <set>
#include <string>
#include <algorithm>
#include <cctype>

using namespace std;
using namespace Json;

// Convert name to valid C++ enum identifier
// Note: prefix should be provided in uppercase (e.g., "UNIT_", "TECH_", "EFFECT_")
string toEnumName(const string& name, int id, const string& prefix = "") {
  string result;
  
  // Replace special characters with meaningful words before general replacement
  for (size_t i = 0; i < name.length(); i++) {
    char c = name[i];
    
    // Handle special characters with meaningful replacements
    if (c == '%') {
      result += "_PERCENT";
    } else if (c == '+') {
      result += "_PLUS_";
    } else if (c == '-' && i > 0 && i < name.length() - 1 && isdigit(name[i-1]) && isdigit(name[i+1])) {
      // Keep minus sign between numbers as is, will be replaced by underscore
      result += c;
    } else if (c == '/') {
      result += "_AND_";
    } else if (isalnum(c) || c == '_') {
      result += c;
    } else {
      // Replace all other non-alphanumeric characters with underscore
      result += '_';
    }
  }
  
  // Collapse multiple consecutive underscores into single underscore
  string collapsed;
  bool prevWasUnderscore = false;
  for (char c : result) {
    if (c == '_') {
      if (!prevWasUnderscore) {
        collapsed += c;
        prevWasUnderscore = true;
      }
    } else {
      collapsed += c;
      prevWasUnderscore = false;
    }
  }
  result = collapsed;
  
  // Remove leading/trailing underscores
  while (!result.empty() && result[0] == '_') {
    result = result.substr(1);
  }
  while (!result.empty() && result.back() == '_') {
    result.pop_back();
  }
  
  // Convert to uppercase
  transform(result.begin(), result.end(), result.begin(), ::toupper);
  
  // Always prepend the prefix if provided
  if (!prefix.empty()) {
    result = prefix + result;
  }
  
  return result;
}

// Generate unique enum name by adding suffix if needed
string makeUnique(const string& name, set<string>& usedNames, int id, const string& prefix = "") {
  string enumName = toEnumName(name, id, prefix);
  string original = enumName;
  int suffix = 1;
  
  while (usedNames.count(enumName) > 0) {
    enumName = original + "_" + to_string(suffix);
    suffix++;
  }
  
  usedNames.insert(enumName);
  return enumName;
}

int main(int argc, char** argv) {
  if (argc != 3) {
    cerr << "Usage: " << argv[0] << " <input_json_file> <output_directory>" << endl;
    cerr << "Example: " << argv[0] << " dat_export.json enums/" << endl;
    return 1;
  }
  
  string inputFile = argv[1];
  string outputDir = argv[2];
  
  // Ensure output directory ends with /
  if (!outputDir.empty() && outputDir.back() != '/') {
    outputDir += '/';
  }
  
  // Load JSON file
  ifstream jsonFile(inputFile);
  if (!jsonFile.is_open()) {
    cerr << "Error: Could not open input file: " << inputFile << endl;
    return 1;
  }
  
  Value root;
  jsonFile >> root;
  jsonFile.close();
  
  cout << "Loaded JSON from " << inputFile << endl;
  
  // Generate units enum
  {
    set<string> usedNames;
    
    // Read existing file to preserve custom content after marker
    string customContent;
    string existingFilePath = outputDir + "unit_ids.h";
    ifstream existingFile(existingFilePath);
    if (existingFile.is_open()) {
      string line;
      bool inCustomSection = false;
      while (getline(existingFile, line)) {
        // Look for the custom content marker
        if (line.find("// BEGIN_CUSTOM_CONTENT") != string::npos) {
          inCustomSection = true;
          customContent += line + "\n";
          continue;
        }
        if (inCustomSection) {
          // Stop before the closing }; of the enum
          if (line.find("};") != string::npos) {
            break;
          }
          customContent += line + "\n";
        }
      }
      existingFile.close();
    }
    
    ofstream outFile(existingFilePath);
    if (!outFile.is_open()) {
      cerr << "Error: Could not create output file: " << existingFilePath << endl;
      return 1;
    }
    
    outFile << "/*\n";
    outFile << " * unit_ids.h\n";
    outFile << " * \n";
    outFile << " * Auto-generated enum for unit IDs\n";
    outFile << " * Generated from: " << inputFile << "\n";
    outFile << " * \n";
    outFile << " * DO NOT EDIT ABOVE BEGIN_CUSTOM_CONTENT MARKER\n";
    outFile << " * Content between BEGIN_CUSTOM_CONTENT and enum closing will be preserved\n";
    outFile << " */\n\n";
    outFile << "#ifndef UNIT_IDS_H\n";
    outFile << "#define UNIT_IDS_H\n\n";
    outFile << "enum UnitID {\n";
    
    const Value& units = root["units"];
    for (unsigned int i = 0; i < units.size(); i++) {
      const Value& unit = units[i];
      int id = unit["id"].asInt();
      string name = unit["name"].asString();
      
      // Use display name if available, otherwise internal name
      if (unit.isMember("display_name") && !unit["display_name"].asString().empty()) {
        name = unit["display_name"].asString();
      }
      
      string enumName = makeUnique(name, usedNames, id, "UNIT_");
      outFile << "    " << enumName << " = " << id;
      
      // Always add comma after auto-generated entries
      outFile << ",";
      
      // Add comment with internal name if display name was used
      if (unit.isMember("display_name") && !unit["display_name"].asString().empty() && 
          unit["name"].asString() != unit["display_name"].asString()) {
        outFile << " // " << unit["name"].asString();
      }
      
      outFile << "\n";
    }
    
    // Add preserved custom content if any
    if (!customContent.empty()) {
      outFile << "\n" << customContent;
    }
    
    outFile << "};\n\n";
    outFile << "#endif // UNIT_IDS_H\n";
    outFile.close();
    
    cout << "Generated " << outputDir << "unit_ids.h with " << units.size() << " units";
    if (!customContent.empty()) {
      cout << " (preserved custom content)";
    }
    cout << endl;
  }
  
  // Generate techs enum
  {
    set<string> usedNames;
    ofstream outFile(outputDir + "tech_ids.h");
    if (!outFile.is_open()) {
      cerr << "Error: Could not create output file: " << outputDir << "tech_ids.h" << endl;
      return 1;
    }
    
    outFile << "/*\n";
    outFile << " * tech_ids.h\n";
    outFile << " * \n";
    outFile << " * Auto-generated enum for tech IDs\n";
    outFile << " * Generated from: " << inputFile << "\n";
    outFile << " * \n";
    outFile << " * DO NOT EDIT THIS FILE MANUALLY\n";
    outFile << " */\n\n";
    outFile << "#ifndef TECH_IDS_H\n";
    outFile << "#define TECH_IDS_H\n\n";
    outFile << "enum TechID {\n";
    
    const Value& techs = root["techs"];
    for (unsigned int i = 0; i < techs.size(); i++) {
      const Value& tech = techs[i];
      int id = tech["id"].asInt();
      string name = tech["name"].asString();
      
      // Use display name if available, otherwise internal name
      if (tech.isMember("display_name") && !tech["display_name"].asString().empty()) {
        name = tech["display_name"].asString();
      }
      
      string enumName = makeUnique(name, usedNames, id, "TECH_");
      outFile << "    " << enumName << " = " << id;
      
      if (i < techs.size() - 1) {
        outFile << ",";
      }
      
      // Add comment with internal name if display name was used and different
      if (tech.isMember("display_name") && !tech["display_name"].asString().empty() && 
          tech["name"].asString() != tech["display_name"].asString()) {
        outFile << " // " << tech["name"].asString();
      }
      
      outFile << "\n";
    }
    
    outFile << "};\n\n";
    outFile << "#endif // TECH_IDS_H\n";
    outFile.close();
    
    cout << "Generated " << outputDir << "tech_ids.h with " << techs.size() << " techs" << endl;
  }
  
  // Generate effects enum
  {
    set<string> usedNames;
    ofstream outFile(outputDir + "effect_ids.h");
    if (!outFile.is_open()) {
      cerr << "Error: Could not create output file: " << outputDir << "effect_ids.h" << endl;
      return 1;
    }
    
    outFile << "/*\n";
    outFile << " * effect_ids.h\n";
    outFile << " * \n";
    outFile << " * Auto-generated enum for effect IDs\n";
    outFile << " * Generated from: " << inputFile << "\n";
    outFile << " * \n";
    outFile << " * DO NOT EDIT THIS FILE MANUALLY\n";
    outFile << " */\n\n";
    outFile << "#ifndef EFFECT_IDS_H\n";
    outFile << "#define EFFECT_IDS_H\n\n";
    outFile << "enum EffectID {\n";
    
    const Value& effects = root["effects"];
    for (unsigned int i = 0; i < effects.size(); i++) {
      const Value& effect = effects[i];
      int id = effect["id"].asInt();
      string name = effect["name"].asString();
      
      string enumName = makeUnique(name, usedNames, id, "EFFECT_");
      outFile << "    " << enumName << " = " << id;
      
      if (i < effects.size() - 1) {
        outFile << ",";
      }
      
      outFile << "\n";
    }
    
    outFile << "};\n\n";
    outFile << "#endif // EFFECT_IDS_H\n";
    outFile.close();
    
    cout << "Generated " << outputDir << "effect_ids.h with " << effects.size() << " effects" << endl;
  }
  
  cout << "Enum generation complete!" << endl;
  return 0;
}
