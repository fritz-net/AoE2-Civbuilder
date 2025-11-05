#include "civbuilder.h"
#include "genie/dat/DatFile.h"
#include <fstream>
#include <iostream>
#include <jsoncpp/json/json.h>
#include <string>
#include <stdexcept>
#include <memory>

#define SLOBYTE(x) (*((int8_t *)&(x)))
#define HIBYTE(x) (*((uint8_t *)&(x) + 1))

using namespace std;
using namespace Json;
using namespace genie;

int main(int argc, char **argv) {
  try {
    auto df = make_unique<DatFile>();
    df->setGameVersion(GV_LatestDE2);

    df->load(argv[2]);

    Value cfg;
    // Reader reader;
    ifstream cfgfile(argv[1]);
    // reader.parse(cfgfile, cfg);
    cfgfile >> cfg;
    Civbuilder cb = Civbuilder(df.get(), cfg, "logs.txt", argv[4]);

    cout << "[C++]: Modify dat = " << cfg["modifyDat"] << endl;

    if (cfg["modifyDat"].asBool()) {
      cb.configure();
    } else {
      applyModifiers(df.get(), cfg["modifiers"]["blind"].asBool(),
                     cfg["modifiers"]["building"].asDouble(),
                     cfg["modifiers"]["speed"].asDouble(),
                     cfg["modifiers"]["hp"].asDouble());
      if (cfg["modifiers"]["randomCosts"].asBool()) {
        randomizeCosts(df.get());
      }
    }

    cout << "[C++]: Writing file to " << argv[3] << endl;
    df->saveAs(argv[3]);

    return 0;
  } catch (const std::length_error& e) {
    cerr << "[C++]: Error loading dat file: " << e.what() << endl;
    cerr << "[C++]: This dat file is not supported or corrupted." << endl;
    cerr << "[C++]: Dat file: " << argv[2] << endl;
    return 2; // Exit code 2 for unsupported dat file
  } catch (const std::exception& e) {
    cerr << "[C++]: Unexpected error: " << e.what() << endl;
    return 1; // Exit code 1 for other errors
  }
}
