# AoE2-Civbuilder
Hosted at https://krakenmeister.com/civbuilder

This project includes both a legacy frontend and a new Vue3/Nuxt4 frontend:
- **Legacy Frontend**: Available at `/` (or `/civbuilder/`)
- **New Vue3 Frontend**: Available at `/v2` (in parallel development)

If you want to host the project locally, note that there are a few absolute paths in server.js and createModFolder.sh. All of the necessary C++ files are already compiled, but if you want to recompile them, make sure to clone the submodules and run './modding/scripts/build.sh'.

# How it works

## Overview

The entire website runs on server.js. The other .js files in the '.' directory are helper functions for various actions the server wants to complete. All of the webpages that are loaded are in './public', as well as assets for those webpages. All of the C++ files for editing .dat files are in './modding'. Copies of mods created by users are stored in './modding/requested_mods'. Information about all previous and ongoing drafts is stored in './database.json'.

## Server

server.js handles any and all client requests to the server. For randomized civilizations, the process is executed in the following order:

1. Create a mod directory in './modding/requested_mods' with a requested ID. The folder structure should mimic the game's files and is broken down into a data mod folder and a UI mod folder. Any files that are always included in the generated mods are created here. Executes './createModFolder.sh'.
2. Generate aesthetically acceptable random flags and place them into the folder structure with the right names and the right places. Executes './random_icon.js'.
3. Randomly generate a data.json file. All data.json files contain the name, architecture set, tech tree, civilization bonuses, unique unit, unique techs, and team bonus for each civilization to be added. It also stores whether or not to generate random costs for all units, buildings, and techs. Executes './random_json.js' to generate the .json, which itself executes './random_name.js' and './random_techtree.js' as helper functions.
4. Use information in the data.json file to create the modded text file. Includes civilization names, civilization descriptions, and custom techs/units. Executes './mod_strings.js'.
5. Use information in the data.json file to give all civilizations the right unique unit icon in the civilization selection screen.
6. Use information in the data.json file to create the right tech trees for each civilization in-game. Unfortunately DE is bugged at the moment and this file won't do anything unless you copy it and overwrite your own game files. Executes './mod_civTechTree.js'.
7. Edit a vanilla game file according to specifications in the data.json file so as to create a data mod with all of the custom civilizations. Executes C++ files in './modding'.
8. Zip up the mod directory, and clear it. The requested .zip file should remain in './modding/requested_mods' for later users to retrieve (or me to download and look at to debug certain issues). I regularly clear out the directory manually, but will eventually task a cronjob for this once I feel like I'm done adding updates.

For pre-constructed civilizations to be combined into a mod, the steps are the same except for 2. and 3. which use requested information rather than random generation.

For drafts, information is passed between clients and server via socket.io. Each draft is stored in './database.json' and has an ID, a game preset, a list of players, and the current gamestate. Each player has a name, a civilization name, flag, tech tree, list of civilization bonuses, unique unit, unique techs, and team bonus. The gamestate holds the current phase, turn number, cards to display, and cards remaining in the deck. Once a draft is created, players that join are accepted by setting their cookies so that temporary disconnections aren't fatal. Once a draft is started, a socket.io room is opened with the draft ID so that the server can receive player actions and send out new gamestates to all players. Once the gamestate reaches phase 3, a mod is created just as above (using player information for steps 2. and 3.) which can be downloaded by players.

## Public

The './public/aoe2techtree' folder contains functions used to display tech trees everywhere on the site. It is mostly code from Hszemi's https://github.com/SiegeEngineers/aoe2techtree but contains a few modifications so that tech trees can be edited and saved. The .css files are a mess as this was my first ever web development project. The .js files are slightly more organized, but I'm sure there are easier ways to code websites than to build each web element from scratch in javascript pretty much every time a change is made. The three main .js files are './public/client.js' which loads the homepage, './public/builder.js' which loads the civilization builder page, and './public/draft.js' which shows a game once it's reached phase 2 (i.e. picking cards). Also, any shared constants or functions between those pages is in './public/common.js'.

## Modding

The editing of .dat files is done in C++ because it uses the genieutils library. create-data-mod takes as input a vanilla .dat file, a data.json file for what changes to make (uses jsoncpp library to process this), and the path of the output edited .dat file. For debugging purposes, './logs.txt' is used. It makes changes in the following order:

1. Clear the bonuses, unique units, and tech trees for all civilizations.
2. Create new bonuses, technologies, units, etc. and make all bonuses work together (i.e. Mahouts affect elephant archers, or Frank bonus affect Missionaries).
3. Get the building graphics of each custom civilization's architecture.
4. Give each civilization its unique unit, tech tree, unique techs, civilization bonuses, and team bonus.
5. Randomize the costs of all units if the data.json requested it.


# Vue3/Nuxt4 Frontend

A new modern frontend is being developed using Vue 3 and Nuxt 4. See `./src/frontend/README.md` for details.

## Quick Start - New Frontend
```bash
# Build the Nuxt app
npm run build:nuxt

# Start the server (serves both old and new frontends)
npm start
```

The new frontend will be available at http://localhost:4000/v2

## Development - New Frontend
```bash
# Run Nuxt in dev mode (hot reload)
npm run dev:nuxt
```

## Run with Docker
```bash
docker run --rm -e CIVBUILDER_HOSTNAME=http://localhost:4000 -p 4000:4000 ghcr.io/fritz-net/aoe2-civbuilder:latest
```

Both frontends (old and new Vue3) are included in the Docker image.