const os = require("os");

const http = require("http");
const express = require("express");
const fs = require("fs");
const parser = require("body-parser");
const app = (module.exports = require("express")());
const exec = require("child_process").exec;
const { execSync } = require("child_process");
const path = require("path");
const icons = require("./process_mod/random/random_icon.js");
const zip = require("express-easy-zip");
const cookieParser = require("cookie-parser");
const process = require("process");

const makejson = require("./process_mod/random/random_json.js");
const modStrings = require("./process_mod/modStrings.js");
const createTechtreeJson = require("./process_mod/createTechtreeJson.js");
const makeai = require("./process_mod/modAI.js");
const { numBonuses, numBasicTechs, nameArr, colours, iconids, blanks, indexDictionary } = require("./process_mod/constants.js");
const { createCivilizationsJson } = require("./process_mod/createCivilizationsJson.js");
const { normalizeDescription } = require("./process_mod/civDataUtils.js");
const commonJs = require("./public/js/common.js");
const { integrateNuxt } = require("./nuxt-integration.js");
const { BONUS_INDEX } = require("./src/shared/bonusConstants.js");
const { generateModFilename, generateModFilenameNoExt } = require("./process_mod/modFilename.js");

console.log("Starting server...");

const server = require("http").Server(app);
const io = require("socket.io")(server);


const tempdir = path.join(os.tmpdir(), "civbuilder");
const hostname = process.env.CIVBUILDER_HOSTNAME || "https://krakenmeister.com/civbuilder";
const routeSubdir = new URL(hostname).pathname.replace(/\/$/, "") || "/";
const port = 4000;

console.log("running with hostname:", hostname);
console.log("route subdir:", routeSubdir);
console.log("temp directory:", tempdir);

// create temp directory if it doesn't exist
if (!fs.existsSync(tempdir)) {
	console.log("Creating temp directory:", tempdir);
	fs.mkdirSync(tempdir);

	// Ensure drafts directory exists
	fs.mkdirSync(`${tempdir}/drafts`, { recursive: true });
}

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

const router = express.Router();
app.use(
	parser.urlencoded({
		extended: false,
		limit: "20mb",
	})
);
app.use(parser.json({ limit: "20mb" }));
// Serve dynamic common.js with correct hostname and route
// TODO maybe always set those lines on top without replacing at all? or inject them into index html script tag
app.get(path.join(routeSubdir, "js/common.js"), (req, res) => {
	const defaultHostname = "https://krakenmeister.com";
	const defaultRoute = "/civbuilder";
	const jsPath = path.join(__dirname, "public/js/common.js");
	fs.readFile(jsPath, "utf8", (err, data) => {
		if (err) return res.status(500).send("Error loading common.js");
		let lines = data.split("\n");
		let needsReplace =
			hostname !== (defaultHostname + defaultRoute) ||
			routeSubdir !== defaultRoute;
		if (needsReplace) {
			lines[0] = `const hostname = "${hostname.replace(/\/$/, "")}";`;

			// subdir should NOT end with /; remove LAST slash if any
			let cleanSubdir = routeSubdir.replace(/\/$/, "");
			lines[1] = `const route = "${cleanSubdir}";`;
		}
		res.type("application/javascript").send(lines.join("\n"));
	});
});

// Helper function to serve changelog
const serveChangelog = (req, res) => {
	const changelogPath = path.join(__dirname, "CHANGELOG.md");
	fs.readFile(changelogPath, "utf8", (err, data) => {
		if (err) {
			console.error("Error reading CHANGELOG.md:", err);
			return res.status(500).send("Error loading changelog: " + err.message);
		}
		res.type("text/plain").send(data);
	});
};

// Serve changelog at all relevant paths to support different configurations
// 1. At the configured routeSubdir (e.g., /civbuilder/CHANGELOG.md)
app.get(path.join(routeSubdir, "CHANGELOG.md"), serveChangelog);

// 2. At root for Vue UI and direct access
if (routeSubdir !== "/") {
	app.get("/CHANGELOG.md", serveChangelog);
	console.log("[Changelog] Available at both", path.join(routeSubdir, "CHANGELOG.md"), "and /CHANGELOG.md");
}

// 3. At /v2 for Vue UI references
app.get("/v2/CHANGELOG.md", serveChangelog);
console.log("[Changelog] Also available at /v2/CHANGELOG.md");

// Static file configuration for all paths
const staticOptions = {
	maxAge: "1y", // Cache images for a year
	immutable: false, // Allow query string versioning to work
	etag: true, // Enable cache revalidation
	lastModified: true, // Allow Last-Modified-based revalidation
	setHeaders: (res, path) => {
		if (path.endsWith(".png") || path.endsWith(".jpg")) {
			res.set("Cache-Control", "public, must-revalidate, max-age=31536000");
		} else {
			res.set("Cache-Control", "no-cache, must-revalidate");
		}
	},
};

// Serve static files at configured route (e.g., /civbuilder)
app.use(
	routeSubdir,
	express.static(path.join(__dirname, "/public"), staticOptions)
);

// Also serve static files at root / for legacy references
if (routeSubdir !== "/") {
	app.use("/", express.static(path.join(__dirname, "/public"), staticOptions));
	console.log(`[Static] Files available at both ${routeSubdir} and / (root)`);
}

// Also serve at /v2 for Vue UI references to /v2/img/...
app.use("/v2", express.static(path.join(__dirname, "/public"), staticOptions));
console.log("[Static] Files also available at /v2 (for Vue UI)");

// Mount router at the configured routeSubdir (e.g., /civbuilder for legacy UI)
app.use(routeSubdir, router);

// Also mount router and static files at root for Vue UI (which is at /v2)
// This ensures API endpoints and static assets work for both:
// - Legacy UI can use /civbuilder/create and /civbuilder/css/styles.css
// - Vue UI can use /create and /css/styles.css
if (routeSubdir !== "/") {
	app.use("/", express.static(path.join(__dirname, "/public"), staticOptions));
	app.use("/", router);
	console.log(`[API] Routes and static files available at both ${routeSubdir} and / (for Vue UI)`);
}

app.use(zip());
app.use(cookieParser());

// Integrate Vue3/Nuxt4 frontend at /v2 routes
integrateNuxt(app);

function os_func() {
	this.execCommand = function (cmd, callback, failure) {
		// Always execute commands from the app directory to enable parallel execution
		// This avoids using process.chdir() which is not safe for concurrent requests
		exec(cmd, { cwd: __dirname }, (error, stdout, stderr) => {
			if (error) {
				console.log(`stdout: ${stdout}`);
				console.error(`exec error: ${error}`);
				console.error(`failed command: ${cmd}`);
				if (typeof failure === 'function') {
					failure();
				} else {
					// If no failure callback provided, log error and continue
					console.error('Command failed but no failure callback provided');
				}
			}
			if (stdout) {
				console.log(stdout);
			}
			callback();
		});
	};
}

var osUtil = new os_func();

function retrieveCookies(header) {
	let pairs = header.split(";");
	let cookies = {};
	for (let i = 0; i < pairs.length; i++) {
		let nameValue = pairs[i].split("=");
		cookies[nameValue[0].trim()] = nameValue[1];
	}
	return cookies;
}

const createDraft = (req, res, next) => {
	let uniqueID = false;
	let id;
	while (uniqueID == false) {
		id = "";
		for (let i = 0; i < 15; i++) {
			let rand = Math.floor(Math.random() * 10);
			id += rand;
		}
		uniqueID = true;
		uniqueID = !fs.existsSync(`${tempdir}/drafts/${id}.json`);
	}

	let draft = {};
	draft["id"] = id;
	draft["timestamp"] = Date.now();

	let available_rarities = req.body.allowed_rarities.split(",");
	for (let i = 0; i < available_rarities.length; i++) {
		available_rarities[i] = available_rarities[i] == "true";
	}

	let preset = {};
	preset["slots"] = parseInt(req.body.num_players, 10);
	preset["points"] = parseInt(req.body.techtree_currency, 10);
	preset["rounds"] = parseInt(req.body.rounds, 10);
	preset["rarities"] = available_rarities;
	// UU edition settings (default both enabled for backward compatibility)
	// Only set to false if explicitly provided as "false" string, otherwise default to true
	preset["allow_base_edition_uu"] = (req.body.allow_base_edition_uu === undefined || req.body.allow_base_edition_uu === null || req.body.allow_base_edition_uu === "true");
	preset["allow_first_edition_uu"] = (req.body.allow_first_edition_uu === undefined || req.body.allow_first_edition_uu === null || req.body.allow_first_edition_uu === "true");
	// Timer settings (default disabled for backward compatibility)
	preset["timer_enabled"] = req.body.timer_enabled === "true";
	preset["timer_duration"] = preset["timer_enabled"] ? parseInt(req.body.timer_duration || "60", 10) : 0;
	// Blind picks setting (default disabled for backward compatibility)
	preset["blind_picks"] = req.body.blind_picks === "true";
	// Snake draft setting (default disabled for backward compatibility)
	preset["snake_draft"] = req.body.snake_draft === "true";
	// Number of cards to show per roll (default 3 if not specified)
	preset["cards_per_roll"] = req.body.cards_per_roll ? parseInt(req.body.cards_per_roll, 10) : 3;
	// Number of bonuses displayed per page/round (default 30 if not specified)
	preset["bonuses_per_page"] = req.body.bonuses_per_page ? parseInt(req.body.bonuses_per_page, 10) : 30;
	// Optional: Force specific bonuses to appear in first roll (for testing)
	// Expected format: comma-separated bonus IDs like "356,123" or empty string
	preset["required_first_roll"] = req.body.required_first_roll ? req.body.required_first_roll.split(",").map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id)) : [];
	draft["preset"] = preset;

	let players = [];
	for (let i = 0; i < parseInt(req.body.num_players, 10); i++) {
		let player = {};
		player["ready"] = 0;
		player["name"] = "";
		player["alias"] = "";
		player["description"] = "";
		player["wonder"] = 0;
		player["castle"] = 0;
		//Palette (color1, color2, color3, color4, color5), division, overlay, symbol
		player["flag_palette"] = [3, 4, 5, 6, 7, 3, 3, 3];
		//Units, buildings, techs
		player["tree"] = [
			[13, 17, 21, 74, 545, 539, 331, 125, 83, 128, 440],
			[12, 45, 49, 50, 68, 70, 72, 79, 82, 84, 87, 101, 103, 104, 109, 199, 209, 276, 562, 584, 598, 621, 792],
			[22, 101, 102, 103, 408],
		];
		player["architecture"] = 1;
		player["language"] = 0;
		player["priority"] = -1;
		player["bonuses"] = [[], [], [], [], []];
		players.push(player);
	}
	draft["players"] = players;

	var gamestate = {};
	gamestate["phase"] = 0;
	gamestate["turn"] = 0;
	gamestate["available_cards"] = [];
	for (var i = 0; i < 5; i++) {
		var available_bonuses = [];
		var numBonus;
		numBonus = numBonuses[i];
		for (var j = 0; j < numBonus; j++) {
			// Check rarity filter
			if (!draft["preset"]["rarities"][commonJs.card_descriptions[i][j][1]]) {
				continue;
			}
			
			// For unique units (roundType 1), check edition filter
			if (i === 1) {
				var edition = commonJs.card_descriptions[i][j][2];
				// Negative edition = base/vanilla civ, positive edition = first edition
				var isBaseEdition = edition < 0;
				var isFirstEdition = edition >= 0;
				
				// Check edition filters (should already be set as booleans in preset)
				if (isBaseEdition && draft["preset"]["allow_base_edition_uu"] === false) {
					continue;
				}
				if (isFirstEdition && draft["preset"]["allow_first_edition_uu"] === false) {
					continue;
				}
			}
			
			available_bonuses.push(j);
		}
		gamestate["available_cards"].push(available_bonuses);
	}
	gamestate["cards"] = [];
	gamestate["order"] = [];
	gamestate["highlighted"] = [];
	// Timer state
	gamestate["timer_paused"] = false;
	gamestate["timer_remaining"] = preset["timer_duration"];
	gamestate["timer_last_update"] = null;
	draft["gamestate"] = gamestate;
	fs.writeFileSync(`${tempdir}/drafts/${id}.json`, JSON.stringify(draft, null, 2));
	req.playerlink = `${hostname}/draft/player/${id}`;
	req.hostlink = `${hostname}/draft/host/${id}`;
	req.spectatorlink = `${hostname}/draft/${id}`;
	next();
};

const checkCookies = (req, res, next) => {
	if (req.headers.cookie) {
		let cookies = retrieveCookies(req.headers.cookie);
		if (cookies["draftID"] && cookies["draftID"] == parseInt(req.params.id, 10) && cookies["playerNumber"] && cookies["playerNumber"] >= 0) {
			req.authenticated = -1;
		}
	}
	next();
};

const authenticateDraft = (req, res, next) => {
	if (req.authenticated == -1) {
		return next();
	}
	req.authenticated = 0;
	if (fs.existsSync(`${tempdir}/drafts/${req.params.id}.json`)) {
		req.authenticated = 1;
	}
	next();
};

function getDraft(id) {
	if (!fs.existsSync(`${tempdir}/drafts/${id}.json`)) {
		return -1;
	}
	let data = fs.readFileSync(`${tempdir}/drafts/${id}.json`);
	let draft = JSON.parse(data);
	return draft;
}

const setID = (req, res, next) => {
	req.params.id = req.body.draftID;
	next();
};

//Check if there's room in the lobby for another player
const checkSpace = (req, res, next) => {
	if (req.authenticated == -1) {
		return next();
	}
	if (!fs.existsSync(`${tempdir}/drafts/${req.body.draftID}.json`)) {
		console.log("Draft authentication failed");
		return next();
	}

	let data = fs.readFileSync(`${tempdir}/drafts/${req.body.draftID}.json`);
	let draft = JSON.parse(data);
	if (req.body.joinType == 0) {
		//Joining as a host
		if (draft["players"][0]["name"] == "") {
			draft["players"][0]["name"] = req.body.civ_name;
			fs.writeFileSync(`${tempdir}/drafts/${req.body.draftID}.json`, JSON.stringify(draft, null, 2));
			req.playerNumber = 0;
		} else {
			req.authenticated = 2;
		}
		next();
	} else {
		//Joining as a player
		for (var i = 1; i < draft["preset"]["slots"]; i++) {
			if (draft["players"][i]["name"] == "") {
				draft["players"][i]["name"] = req.body.civ_name;
				req.playerNumber = i;
				fs.writeFileSync(`${tempdir}/drafts/${req.body.draftID}.json`, JSON.stringify(draft, null, 2));
				return next();
			}
		}
		req.authenticated = 3;
		next();
	}
};

//Refill available cards with any and all cards that players don't own and aren't currently on the board
function reshuffleCards(draft) {
	console.log("Reshuffling cards");
	var numPlayers = draft["preset"]["slots"];
	var roundType = Math.max(Math.floor(draft["gamestate"]["turn"] / numPlayers) - (draft["preset"]["rounds"] - 1), 0);

	var available_bonuses = [];
	var numBonus;

	numBonus = numBonuses[roundType];
	for (var i = 0; i < numBonus; i++) {
		var discarded = 1;
		for (var j = 0; j < numPlayers; j++) {
			if (draft["players"][j]["bonuses"][roundType].includes(i)) {
				discarded = 0;
			}
		}
		if (draft["gamestate"]["cards"].includes(i)) {
			discarded = 0;
		}
		if (discarded == 1) {
			// Check rarity filter
			if (!draft["preset"]["rarities"][commonJs.card_descriptions[roundType][i][1]]) {
				continue;
			}
			
			// For unique units (roundType 1), check edition filter
			if (roundType === 1) {
				var edition = commonJs.card_descriptions[roundType][i][2];
				// Negative edition = base/vanilla civ, positive edition = first edition
				var isBaseEdition = edition < 0;
				var isFirstEdition = edition >= 0;
				
				// Default to true if settings don't exist (backward compatibility)
				// Use explicit checks to match createDraft logic
				var allowBaseEdition = (draft["preset"]["allow_base_edition_uu"] === undefined || draft["preset"]["allow_base_edition_uu"] === null || draft["preset"]["allow_base_edition_uu"] === true);
				var allowFirstEdition = (draft["preset"]["allow_first_edition_uu"] === undefined || draft["preset"]["allow_first_edition_uu"] === null || draft["preset"]["allow_first_edition_uu"] === true);
				
				if (isBaseEdition && !allowBaseEdition) {
					continue;
				}
				if (isFirstEdition && !allowFirstEdition) {
					continue;
				}
			}
			
			available_bonuses.push(i);
		}
	}
	return available_bonuses;
}

// Note: chToTmpDir and chToAppDir have been removed.
// All commands now use { cwd: __dirname } option to enable parallel execution.
// Using process.chdir() is not safe for concurrent requests as it changes global state.

const createModFolder = (req, res, next) => {
	console.log(`[${req.body.seed}]: creating mod folder`);
	if (req.body.civs === "false") {
		execSync(`bash ./process_mod/createModFolder.sh ./modding/requested_mods ${req.body.seed} ${__dirname} 0`, { cwd: __dirname });
	} else {
		execSync(`bash ./process_mod/createModFolder.sh ./modding/requested_mods ${req.body.seed} ${__dirname} 1`, { cwd: __dirname });
	}
	next();
};

const createCivIcons = (req, res, next) => {
	if (req.body.civs === "false") {
		next();
		return;
	}

	console.log(`[${req.body.seed}]: Creating civ icons...`);
	icons.generateFlags(`./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/menu/civs`, `./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons`, `./public/img/symbols`);
	next();
};

const copyCivIcons = (req, res, next) => {
	if (req.body.civs === "false") {
		next();
		return;
	}

	console.log(`[${req.body.seed}]: Copying civ icons...`);
	osUtil.execCommand(`cp -r ./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/. ./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/resources/_common/wpfg/resources/civ_techtree`, function () {
		next();
	});
};

const generateJson = (req, res, next) => {
	console.log(`[${req.body.seed}]: Generating data json...`);
	makejson.createJson(`./modding/requested_mods/${req.body.seed}/data.json`, req.body.civs, req.body.modifiers);
	next();
};

const writeNames = (req, res, next) => {
	if (req.body.civs === "false") {
		next();
		return;
	}

	console.log(`[${req.body.seed}]: Writing strings...`);
	modStrings.interperateLanguage(`./modding/requested_mods/${req.body.seed}/data.json`, `./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/resources/en/strings/key-value/key-value-modded-strings-utf8.txt`);
	next();
};

const copyNames = (req, res, next) => {
	if (req.body.civs === "false") {
		next();
		return;
	}

	console.log(`[${req.body.seed}]: Copying strings...`);
	osUtil.execCommand(`sh ./process_mod/copyLanguages.sh ./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/resources`, function () {
		next();
	});
};

const addVoiceFiles = (req, res, next) => {
	if (req.body.civs === "false") {
		next();
		return;
	}

	console.log(`[${req.body.seed}]: Adding voice files...`);
	let command = `sh ./process_mod/copyVoices.sh ./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/resources/_common/drs/sounds ./public/vanillaFiles/voiceFiles`;
	let data = fs.readFileSync(path.join(__dirname, `/modding/requested_mods/${req.body.seed}/data.json`));
	let info = JSON.parse(data);

	let uniqueLanguages = [];

	for (var i = 0; i < info.language.length; i++) {
		if (uniqueLanguages.indexOf(info.language[i]) == -1) {
			uniqueLanguages.push(info.language[i]);
			command += ` ${info.language[i]}`;
		}
	}

	osUtil.execCommand(command, function () {
		next();
	});
};

const writeUUIcons = (req, res, next) => {
	if (req.body.civs === "false") {
		next();
		return;
	}

	console.log(`[${req.body.seed}]: Writing UU icons...`);
	for (var i = 0; i < blanks.length; i++) {
		osUtil.execCommand(`cp ./public/img/uniticons/blank.png ./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/resources/_common/wpfg/resources/uniticons/${blanks[i]}_50730.png`, function () {});
	}
	var data = fs.readFileSync(`./modding/requested_mods/${req.body.seed}/data.json`);
	var civ = JSON.parse(data);
	for (var i = 0; i < civ.techtree.length; i++) {
		//Persians and Saracens are index 7 & 8 but War Elephants and Mamelukes are index 8 & 7
		var unitId = civ.techtree[i][0];
		
		// Validate that unitId is defined and within valid range
		if (unitId === undefined || unitId === null) {
			console.error(`[${req.body.seed}]: Warning - Unit ID is undefined for civ techtree index ${i}`);
			continue;
		}
		
		var iconsrc = iconids[unitId];
		
		// Validate that icon source exists
		if (iconsrc === undefined) {
			console.error(`[${req.body.seed}]: Warning - No icon found for unit ID ${unitId} at techtree index ${i}`);
			continue;
		}
		
		if (i == civ.techtree.length - 1) {
			osUtil.execCommand(`cp ./public/img/uniticons/${iconsrc}_50730.png ./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/resources/_common/wpfg/resources/uniticons/${iconsrc}_50730.png`, function () {
				next();
			});
		} else {
			osUtil.execCommand(`cp ./public/img/uniticons/${iconsrc}_50730.png ./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/resources/_common/wpfg/resources/uniticons/${iconsrc}_50730.png`, function () {});
		}
	}
};

const writeCivilizations = (req, res, next) => {
	if (req.body.civs === "false") {
		next();
		return;
	}

	console.log(`[${req.body.seed}]: Writing civilizations json...`);
	createCivilizationsJson(`./modding/requested_mods/${req.body.seed}/data.json`, `./modding/requested_mods/${req.body.seed}/${req.body.seed}-data/resources/_common/dat/civilizations.json`);
	next();
};

const writeTechTree = (req, res, next) => {
	if (req.body.civs === "false") {
		next();
		return;
	}

	console.log(`[${req.body.seed}]: Writing tech tree...`);
	createTechtreeJson.createTechtreeJson(`./modding/requested_mods/${req.body.seed}/data.json`, `./modding/requested_mods/${req.body.seed}/${req.body.seed}-data/resources/_common/dat/civTechTrees.json`);
	next();
};

const writeDatFile = async (req, res, next) => {
	console.log(`[${req.body.seed}]: Writing dat file (with gdb)...`);
	const cmd = `./modding/build/create-data-mod ./modding/requested_mods/${req.body.seed}/data.json ./public/vanillaFiles/empires2_x2_p1.dat ./modding/requested_mods/${req.body.seed}/${req.body.seed}-data/resources/_common/dat/empires2_x2_p1.dat ./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/resources/_common/ai/aiconfig.json`;
	osUtil.execCommand(
		cmd,
		() => {
			next();
		},
		(error) => {
			console.error(`[${req.body.seed}]: Failed to create data mod:`, error);
			res.status(500).send("Mod creation failed: Unable to generate data mod");
		}
	);
};

const writeAIFiles = (req, res, next) => {
	if (req.body.civs === "false") {
		next();
		return;
	}

	console.log(`[${req.body.seed}]: Writing AI files...`);
	makeai.createAI(`./modding/requested_mods/${req.body.seed}/data.json`, `./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/resources/_common/ai`);
	next();
};

const zipModFolder = (req, res, next) => {
	console.log(`[${req.body.seed}]: Zipping folder...`);
	
	// Generate new filename with version, datetime, and hex
	const newFilename = generateModFilenameNoExt(__dirname);
	req.modFilename = newFilename; // Store for download route
	
	if (req.body.civs === "false") {
		osUtil.execCommand(`bash ./process_mod/zipModFolder.sh ${req.body.seed} 0 ${newFilename}`, function () {
			next();
		});
	} else {
		osUtil.execCommand(`bash ./process_mod/zipModFolder.sh ${req.body.seed} 1 ${newFilename}`, function () {
			next();
		});
	}
};

/**
 * Helper function to extract bonus ID from bonus data
 * Bonus data can be either a number (legacy) or [id, multiplier] (new UI)
 * @param {number|number[]} bonus - Either a number (legacy format) or [id, multiplier] array (new UI format)
 * @param {string} [context] - Optional context for error messages (e.g., "civ bonus", "unique unit")
 * @returns {number} - The bonus ID
 */
function extractBonusId(bonus, context) {
	const errorContext = context ? ` in ${context}` : '';
	if (Array.isArray(bonus)) {
		// Validate array has at least one element
		if (bonus.length === 0) {
			console.error(`Warning: Empty bonus array encountered${errorContext}`);
			return 0;
		}
		return bonus[0]; // Return the ID from [id, multiplier]
	}
	// Handle null/undefined
	if (bonus === null || bonus === undefined) {
		console.error(`Warning: Null or undefined bonus encountered${errorContext}`);
		return 0;
	}
	return bonus; // Return the number directly
}

/**
 * Safely parse JSON from request body
 * @param {string} fieldName - Name of the field being parsed (for error messages)
 * @param {string} jsonString - The JSON string to parse
 * @param {*} defaultValue - Default value to return if parsing fails
 * @returns {*} Parsed JSON or default value
 */
function safeJsonParse(fieldName, jsonString, defaultValue = null) {
	if (jsonString === undefined || jsonString === null || jsonString === 'undefined') {
		console.error(`Invalid input: ${fieldName} is ${jsonString}`);
		return defaultValue;
	}
	
	try {
		return JSON.parse(jsonString);
	} catch (error) {
		console.error(`Failed to parse ${fieldName}: ${error.message}`);
		return defaultValue;
	}
}

const writeIconsJson = async (req, res, next) => {
	console.log(`[${req.body.seed}]: Writing icons and json...`);
	
	// Validate required fields
	if (!req.body.modifiers || req.body.modifiers === 'undefined') {
		console.error(`[${req.body.seed}]: Missing or invalid modifiers field`);
		return res.status(400).json({ error: 'Missing or invalid modifiers field' });
	}
	
	if (!req.body.presets || req.body.presets === 'undefined') {
		console.error(`[${req.body.seed}]: Missing or invalid presets field`);
		return res.status(400).json({ error: 'Missing or invalid presets field' });
	}
	
	// Parse and validate modifiers
	const modifiers = safeJsonParse('modifiers', req.body.modifiers);
	if (!modifiers) {
		return res.status(400).json({ error: 'Invalid modifiers JSON' });
	}
	console.log(modifiers);
	
	//Parse multiple Json civ presets
	var raw_presets = safeJsonParse('presets', req.body.presets);
	if (!raw_presets || !raw_presets["presets"]) {
		return res.status(400).json({ error: 'Invalid presets JSON or missing presets array' });
	}
	var civs = raw_presets["presets"];
	//Create Civ Icons
	var blankOthers = false;
	for (var i = 0; i < civs.length; i++) {
		var civName = nameArr[i];
		// Ensure flag_palette exists with default values if missing
		if (!civs[i]["flag_palette"] || !Array.isArray(civs[i]["flag_palette"]) || civs[i]["flag_palette"].length < 8) {
			civs[i]["flag_palette"] = [3, 4, 5, 6, 7, 3, 3, 3]; // Default flag palette
		}
		if (civs[i]["flag_palette"][0] == -1) {
			//Secret password unlocked a vanilla flag
			if (civName == "berber" || civName == "inca") {
				execSync(`cp ./public/vanillaFiles/vanillaCivs/flag_${civs[i]["flag_palette"][1]}.png ./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/menu/civs/${civName}s.png`, { cwd: __dirname });
			} else {
				execSync(`cp ./public/vanillaFiles/vanillaCivs/flag_${civs[i]["flag_palette"][1]}.png ./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/menu/civs/${civName}.png`, { cwd: __dirname });
			}
			execSync(`cp ./public/vanillaFiles/vanillaCivs/flag_${civs[i]["flag_palette"][1]}.png ./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/menu_techtree_${civName}.png`, { cwd: __dirname });
			execSync(`cp ./public/vanillaFiles/vanillaCivs/flag_${civs[i]["flag_palette"][1]}.png ./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/menu_techtree_${civName}_hover.png`, { cwd: __dirname });
			execSync(`cp ./public/vanillaFiles/vanillaCivs/flag_${civs[i]["flag_palette"][1]}.png ./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/menu_techtree_${civName}_pressed.png`, { cwd: __dirname });
			execSync(`cp ./public/vanillaFiles/vanillaCivs/flag_${civs[i]["flag_palette"][1]}.png ./modding/requested_mods/${req.body.seed}/${req.body.seed}-data/resources/_common/wpfg/resources/civ_techtree/menu_techtree_${civName}.png`, { cwd: __dirname });
			execSync(`cp ./public/vanillaFiles/vanillaCivs/flag_${civs[i]["flag_palette"][1]}.png ./modding/requested_mods/${req.body.seed}/${req.body.seed}-data/resources/_common/wpfg/resources/civ_techtree/menu_techtree_${civName}_hover.png`, { cwd: __dirname });
			execSync(`cp ./public/vanillaFiles/vanillaCivs/flag_${civs[i]["flag_palette"][1]}.png ./modding/requested_mods/${req.body.seed}/${req.body.seed}-data/resources/_common/wpfg/resources/civ_techtree/menu_techtree_${civName}_pressed.png`, { cwd: __dirname });
			blankOthers = true;
		} else if (civs[i]["customFlag"] && civs[i]["customFlagData"]) {
			// Load in custom image for flag

			//let regex = /^data:.+\/(.+);base64,(.*)$/;

			//let matches = civs[i]["customFlagData"].match(regex);
			//let ext = matches[1];
			let data = civs[i]["customFlagData"].split(",")[1];
			let buffer = Buffer.from(data, "base64");

			let writePromises = [];
			if (civName == "berber" || civName == "inca") {
				writePromises.push(
					new Promise(function (resolve, reject) {
						fs.writeFile(`./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/menu/civs/${civName}s.png`, buffer, (err) => {
							if (err) reject(err);
							else resolve(buffer);
						});
					})
				);
			} else {
				writePromises.push(
					new Promise(function (resolve, reject) {
						fs.writeFile(`./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/menu/civs/${civName}.png`, buffer, (err) => {
							if (err) reject(err);
							else resolve(buffer);
						});
					})
				);
			}
			writePromises.push(
				new Promise(function (resolve, reject) {
					fs.writeFile(`./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/menu_techtree_${civName}.png`, buffer, (err) => {
						if (err) reject(err);
						else resolve(buffer);
					});
				})
			);
			writePromises.push(
				new Promise(function (resolve, reject) {
					fs.writeFile(`./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/menu_techtree_${civName}_hover.png`, buffer, (err) => {
						if (err) reject(err);
						else resolve(buffer);
					});
				})
			);
			writePromises.push(
				new Promise(function (resolve, reject) {
					fs.writeFile(`./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/menu_techtree_${civName}_pressed.png`, buffer, (err) => {
						if (err) reject(err);
						else resolve(buffer);
					});
				})
			);
			writePromises.push(
				new Promise(function (resolve, reject) {
					fs.writeFile(`./modding/requested_mods/${req.body.seed}/${req.body.seed}-data/resources/_common/wpfg/resources/civ_techtree/menu_techtree_${civName}.png`, buffer, (err) => {
						if (err) reject(err);
						else resolve(buffer);
					});
				})
			);
			writePromises.push(
				new Promise(function (resolve, reject) {
					fs.writeFile(`./modding/requested_mods/${req.body.seed}/${req.body.seed}-data/resources/_common/wpfg/resources/civ_techtree/menu_techtree_${civName}_hover.png`, buffer, (err) => {
						if (err) reject(err);
						else resolve(buffer);
					});
				})
			);
			writePromises.push(
				new Promise(function (resolve, reject) {
					fs.writeFile(`./modding/requested_mods/${req.body.seed}/${req.body.seed}-data/resources/_common/wpfg/resources/civ_techtree/menu_techtree_${civName}_pressed.png`, buffer, (err) => {
						if (err) reject(err);
						else resolve(buffer);
					});
				})
			);

			await Promise.all(writePromises);
		} else {
			//Draw the customized flag
			var seed = [[colours[civs[i]["flag_palette"][0]], colours[civs[i]["flag_palette"][1]], colours[civs[i]["flag_palette"][2]], colours[civs[i]["flag_palette"][3]], colours[civs[i]["flag_palette"][4]]], civs[i]["flag_palette"][5], civs[i]["flag_palette"][6]];
			var symbol = civs[i]["flag_palette"][7] - 1;

			if (civName == "berber" || civName == "inca") {
				icons.drawFlag(
					seed,
					symbol,
					[
						`./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/menu/civs/${civName}s.png`,
						`./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/menu_techtree_${civName}.png`,
						`./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/menu_techtree_${civName}_hover.png`,
						`./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/menu_techtree_${civName}_pressed.png`,
						`./modding/requested_mods/${req.body.seed}/${req.body.seed}-data/resources/_common/wpfg/resources/civ_techtree/menu_techtree_${civName}.png`,
						`./modding/requested_mods/${req.body.seed}/${req.body.seed}-data/resources/_common/wpfg/resources/civ_techtree/menu_techtree_${civName}_hover.png`,
						`./modding/requested_mods/${req.body.seed}/${req.body.seed}-data/resources/_common/wpfg/resources/civ_techtree/menu_techtree_${civName}_pressed.png`,
					],
					`./public/img/symbols`
				);
			} else {
				icons.drawFlag(
					seed,
					symbol,
					[
						`./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/menu/civs/${civName}.png`,
						`./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/menu_techtree_${civName}.png`,
						`./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/menu_techtree_${civName}_hover.png`,
						`./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/menu_techtree_${civName}_pressed.png`,
						`./modding/requested_mods/${req.body.seed}/${req.body.seed}-data/resources/_common/wpfg/resources/civ_techtree/menu_techtree_${civName}.png`,
						`./modding/requested_mods/${req.body.seed}/${req.body.seed}-data/resources/_common/wpfg/resources/civ_techtree/menu_techtree_${civName}_hover.png`,
						`./modding/requested_mods/${req.body.seed}/${req.body.seed}-data/resources/_common/wpfg/resources/civ_techtree/menu_techtree_${civName}_pressed.png`,
					],
					`./public/img/symbols`
				);
			}
		}
	}
	// if (blankOthers) {
	//   //If there was a vanilla civ amongst the bunch, blank out all others to make it clearer
	//   for (var i = civs.length; i < 39; i++) {
	//     if (nameArr[i] == "berber" || nameArr[i] == "inca") {
	//       execSync(`cp ./public/vanillaFiles/vanillaCivs/blank.png ./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/menu/civs/${nameArr[i]}s.png`);
	//     } else {
	//       execSync(`cp ./public/vanillaFiles/vanillaCivs/blank.png ./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/menu/civs/${nameArr[i]}.png`);
	//     }
	//     execSync(
	//       `cp ./public/vanillaFiles/vanillaCivs/blank.png ./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/menu_techtree_${nameArr[i]}.png`
	//     );
	//     execSync(
	//       `cp ./public/vanillaFiles/vanillaCivs/blank.png ./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/menu_techtree_${nameArr[i]}_hover.png`
	//     );
	//     execSync(
	//       `cp ./public/vanillaFiles/vanillaCivs/blank.png ./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/menu_techtree_${nameArr[i]}_pressed.png`
	//     );
	//   }
	// }
	//Copy Civ Icons
	osUtil.execCommand(`cp -r ./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/. ./modding/requested_mods/${req.body.seed}/${req.body.seed}-ui/resources/_common/wpfg/resources/civ_techtree`, function () {
		//Generate Json
		var mod_data = {};
		mod_data.name = [];
		mod_data.description = [];
		mod_data.techtree = [];
		mod_data.castletech = [];
		mod_data.imptech = [];
		mod_data.civ_bonus = [];
		mod_data.team_bonus = [];
		mod_data.architecture = [];
		mod_data.language = [];
		mod_data.wonder = [];
		mod_data.castle = [];
		mod_data.modifiers = modifiers;
		mod_data.modifyDat = true;
		for (var i = 0; i < civs.length; i++) {
			// Name
			mod_data.name.push(civs[i]["alias"]);

			// Description - normalize to ensure it's always a string
			civs[i]["description"] = normalizeDescription(civs[i]["description"]);
			mod_data.description.push(civs[i]["description"]);

			// Wonder
			if (!civs[i]["wonder"]) {
				civs[i]["wonder"] = 0;
			}
			mod_data.wonder.push(civs[i]["wonder"]);

			// Castle
			if (!civs[i]["castle"]) {
				civs[i]["castle"] = 0;
			}
			mod_data.castle.push(civs[i]["castle"]);

			var player_techtree = [];
			for (var j = 0; j < numBasicTechs; j++) {
				player_techtree.push(0);
			}

			//Unique Unit
			if (civs[i]["bonuses"] && civs[i]["bonuses"][BONUS_INDEX.UNIQUE_UNIT] && civs[i]["bonuses"][BONUS_INDEX.UNIQUE_UNIT].length != 0) {
				// Extract ID from bonus data (could be number or [id, multiplier])
				player_techtree[0] = extractBonusId(civs[i]["bonuses"][BONUS_INDEX.UNIQUE_UNIT][0], `unique unit for civ ${i}`);
			} else {
				player_techtree[0] = 0;
			}

			//Castle Tech
			if (civs[i]["bonuses"] && civs[i]["bonuses"][BONUS_INDEX.CASTLE_TECH] && civs[i]["bonuses"][BONUS_INDEX.CASTLE_TECH].length != 0) {
				var castletechs = [];
				for (var j = 0; j < civs[i]["bonuses"][BONUS_INDEX.CASTLE_TECH].length; j++) {
					// Preserve the original entry so multipliers ([id, copies]) are kept for the C++ builder
					castletechs.push(civs[i]["bonuses"][BONUS_INDEX.CASTLE_TECH][j]);
				}
				mod_data.castletech.push(castletechs);
			} else {
				mod_data.castletech.push([0]);
			}

			//Imp Tech
			if (civs[i]["bonuses"] && civs[i]["bonuses"][BONUS_INDEX.IMPERIAL_TECH] && civs[i]["bonuses"][BONUS_INDEX.IMPERIAL_TECH].length != 0) {
				var imptechs = [];
				for (var j = 0; j < civs[i]["bonuses"][BONUS_INDEX.IMPERIAL_TECH].length; j++) {
					// Preserve [id, multiplier] tuples when provided
					imptechs.push(civs[i]["bonuses"][BONUS_INDEX.IMPERIAL_TECH][j]);
				}
				mod_data.imptech.push(imptechs);
			} else {
				mod_data.imptech.push([0]);
			}

			//Tech Tree
			if (civs[i]["tree"] && Array.isArray(civs[i]["tree"])) {
				for (var j = 0; j < civs[i]["tree"].length; j++) {
					for (var k = 0; k < civs[i]["tree"][j].length; k++) {
						player_techtree[indexDictionary[j][civs[i]["tree"][j][k].toString()]] = 1;
					}
				}
			}
			mod_data.techtree.push(player_techtree);

			// Civ bonuses - these can be multiplier tuples too
			var civBonuses = [];
			if (civs[i]["bonuses"] && civs[i]["bonuses"][BONUS_INDEX.CIV] && Array.isArray(civs[i]["bonuses"][BONUS_INDEX.CIV])) {
				for (var j = 0; j < civs[i]["bonuses"][BONUS_INDEX.CIV].length; j++) {
					// Keep multiplier tuples intact (e.g. [id, copies]) so the C++ builder can multiply effects
					civBonuses.push(civs[i]["bonuses"][BONUS_INDEX.CIV][j]);
				}
			}
			mod_data.civ_bonus.push(civBonuses);
			
			if (civs[i]["bonuses"] && civs[i]["bonuses"][BONUS_INDEX.TEAM] && civs[i]["bonuses"][BONUS_INDEX.TEAM].length != 0) {
				var team_bonuses = [];
				for (var j = 0; j < civs[i]["bonuses"][BONUS_INDEX.TEAM].length; j++) {
					team_bonuses.push(civs[i]["bonuses"][BONUS_INDEX.TEAM][j]);
				}
				mod_data.team_bonus.push(team_bonuses);
			} else {
				mod_data.team_bonus.push([0]);
			}
			if (civs[i]["architecture"] === undefined) {
				mod_data.architecture.push(1);
			} else {
				mod_data.architecture.push(civs[i]["architecture"]);
			}
			if (civs[i]["language"] === undefined) {
				mod_data.language.push(0);
			} else {
				mod_data.language.push(civs[i]["language"]);
			}
		}
		fs.writeFileSync(`./modding/requested_mods/${req.body.seed}/data.json`, JSON.stringify(mod_data, null, 2));
		next();
	});
};

router.get("/", function (req, res) {
	res.sendFile(__dirname + "/public/html/civbuilder_home.html");
	//res.sendFile(__dirname + "/public/html/updating.html");
	// res.sendFile(__dirname + "/public/html/donation.html");
});

router.get("/build", function (req, res) {
	//res.sendFile(__dirname + "/public/html/updating.html");
	res.sendFile(__dirname + "/public/html/civbuilder.html");
	// res.sendFile(__dirname + "/public/html/donation.html");
});

router.post("/random", createModFolder, createCivIcons, copyCivIcons, generateJson, writeNames, copyNames, addVoiceFiles, writeUUIcons, writeCivilizations, writeTechTree, writeDatFile, writeAIFiles, zipModFolder, (req, res) => {
	console.log(`[${req.body.seed}]: Completed generation!`);
	const filename = req.modFilename || req.body.seed;
	res.download(__dirname + "/modding/requested_mods/" + filename + ".zip");
});

router.post("/create", createModFolder, writeIconsJson, writeNames, copyNames, addVoiceFiles, writeUUIcons, writeCivilizations, writeTechTree, writeDatFile, writeAIFiles, zipModFolder, (req, res) => {
	console.log(`[${req.body.seed}]: Completed generation!`);
	const filename = req.modFilename || req.body.seed;
	res.download(__dirname + "/modding/requested_mods/" + filename + ".zip");
});

router.post("/setCookie", (req, res) => {
	res.cookie(req.body.cookie, req.body.value);
	res.send("Cookie set");
});

router.post("/draft", createDraft, (req, res) => {
	res.render(__dirname + "/public/pug/draft_links", { playerlink: req.playerlink, hostlink: req.hostlink, spectatorlink: req.spectatorlink });
});

router.post("/vanilla", (req, res) => {
	res.download(__dirname + "/public/vanillaFiles/vanillaCivs/VanillaJson.zip");
});

router.get("/view", function (req, res) {
	res.sendFile(__dirname + "/public/html/view.html");
});

router.post("/view", (req, res) => {
	res.sendFile(__dirname + "/public/html/view.html", req.body.civ);
});

router.get("/edit", function (req, res) {
	res.sendFile(__dirname + "/public/html/edit.html");
});

router.post("/edit", (req, res) => {
	res.sendFile(__dirname + "/public/html/edit.html", req.body.civ);
});

router.get("/draft/host/:id", checkCookies, authenticateDraft, function (req, res) {
	if (req.authenticated == -1) {
		res.redirect(path.join(hostname, "/draft/" + req.params.id));
	} else if (req.authenticated == 0) {
		res.render(__dirname + "/public/pug/error", { error: "Draft does not exist" });
	} else if (req.authenticated == 1) {
		res.sendFile(__dirname + "/public/html/join.html");
	}
});

router.get("/draft/player/:id", checkCookies, authenticateDraft, function (req, res) {
	if (req.authenticated == -1) {
		res.redirect(new URL(`/draft/${req.params.id}`, hostname).toString());
	} else if (req.authenticated == 0) {
		res.render(__dirname + "/public/pug/error", { error: "Draft does not exist" });
	} else if (req.authenticated == 1) {
		res.sendFile(__dirname + "/public/html/join.html");
	}
});

router.post("/join", setID, checkCookies, authenticateDraft, checkSpace, (req, res) => {
	if (req.authenticated == -1) {
		res.redirect(new URL(`/draft/${req.body.draftID}`, hostname).toString());
	} else if (req.authenticated == 0) {
		res.render(__dirname + "/public/pug/error", { error: "Draft does not exist" });
	} else if (req.authenticated == 1) {
		res.cookie("playerNumber", req.playerNumber);
		res.cookie("draftID", req.body.draftID);
		res.redirect(new URL(`/draft/${req.body.draftID}`, hostname).toString());
	} else if (req.authenticated == 2) {
		res.render(__dirname + "/public/pug/error", { error: "Host already joined" });
	} else if (req.authenticated == 3) {
		res.render(__dirname + "/public/pug/error", { error: "Lobby full" });
	}
});

router.get("/draft/:id", checkCookies, authenticateDraft, function (req, res) {
	if (req.authenticated == -1) {
		res.sendFile(__dirname + "/public/html/draft.html");
	} else if (req.authenticated == 0) {
		res.render(__dirname + "/public/pug/error", { error: "Draft does not exist" });
	} else if (req.authenticated == 1) {
		res.cookie("playerNumber", -1);
		res.cookie("draftID", req.params.id);
		res.sendFile(__dirname + "/public/html/draft.html");
	}
});

// API endpoint to get draft data as JSON for Vue UI
router.get("/api/draft/:id", checkCookies, authenticateDraft, function (req, res) {
	if (req.authenticated == 0) {
		res.status(404).json({ error: "Draft does not exist" });
	} else {
		const draft = getDraft(req.params.id);
		if (draft === -1) {
			res.status(404).json({ error: "Draft does not exist" });
		} else {
			res.json(draft);
		}
	}
});

router.post("/download", (req, res) => {
	// Try to load draft to get the stored filename
	const draft = getDraft(req.body.draftID);
	const filename = (draft && draft.modFilename) ? draft.modFilename : req.body.draftID;
	res.download(__dirname + "/modding/requested_mods/" + filename + ".zip");
});

// Helper function to update timer_remaining based on elapsed time
function updateTimerRemaining(draft) {
	if (!draft || draft === -1) return;
	if (!draft["preset"] || !draft["preset"]["timer_enabled"]) return;
	if (!draft["gamestate"] || draft["gamestate"]["phase"] !== 2) return; // Only in picking phase
	if (draft["gamestate"]["timer_paused"]) return;
	
	var lastUpdate = draft["gamestate"]["timer_last_update"];
	if (!lastUpdate) {
		draft["gamestate"]["timer_last_update"] = Date.now();
		return;
	}
	
	var now = Date.now();
	var elapsed = Math.floor((now - lastUpdate) / 1000); // seconds elapsed
	
	if (elapsed > 0) {
		draft["gamestate"]["timer_remaining"] = Math.max(0, draft["gamestate"]["timer_remaining"] - elapsed);
		draft["gamestate"]["timer_last_update"] = now;
	}
}

// Helper function to determine current player's turn based on round type
function getCurrentPlayer(draft) {
	var numPlayers = draft["preset"]["slots"];
	var roundType = Math.max(Math.floor(draft["gamestate"]["turn"] / numPlayers) - (draft["preset"]["rounds"] - 1), 0);
	var turnModPlayers = draft["gamestate"]["turn"] % numPlayers;
	var player = draft["gamestate"]["order"][turnModPlayers];
	
	// Snake draft mode: alternate direction every round
	if (draft["preset"]["snake_draft"]) {
		// Calculate which round we're in (0-indexed)
		var currentRound = Math.floor(draft["gamestate"]["turn"] / numPlayers);
		// Reverse order on odd rounds (1, 3, 5, ...)
		if (currentRound % 2 === 1) {
			player = draft["gamestate"]["order"][numPlayers - 1 - turnModPlayers];
		}
	} else {
		// Legacy mode: only reverse on specific round types
		if (roundType == 2 || roundType == 4) {
			player = draft["gamestate"]["order"][numPlayers - 1 - turnModPlayers];
		}
	}
	
	return { player, roundType, numPlayers };
}

// Helper function to process a card pick (used by both end turn and timer expired)
function processCardPick(draft, pick) {
	var { player, roundType, numPlayers } = getCurrentPlayer(draft);
	
	draft["gamestate"]["highlighted"] = [];
	
	// Give the player the card they chose
	draft["players"][player]["bonuses"][roundType].push(pick);
	
	// If it's the last turn of a round, distribute new cards, otherwise make the card unavailable to others
	if ((roundType > 0 || Math.floor(draft["gamestate"]["turn"] / numPlayers) == draft["preset"]["rounds"] - 1) && draft["gamestate"]["turn"] % numPlayers == numPlayers - 1) {
		if (roundType == 4) {
			// Last turn of the game
			draft["gamestate"]["phase"] = 3;
		} else {
			draft["gamestate"]["cards"] = [];
			// Use configurable bonuses_per_page, default to 30 for backward compatibility
			var bonusesPerPage = draft["preset"]["bonuses_per_page"] !== undefined ? draft["preset"]["bonuses_per_page"] : 30;
			// For subsequent rounds after first, use a smaller base value (2/3 of bonuses_per_page rounded down)
			var subsequentBase = Math.floor(bonusesPerPage * 2 / 3);
			for (var i = 0; i < 2 * numPlayers + subsequentBase; i++) {
				var rand = Math.floor(Math.random() * draft["gamestate"]["available_cards"][roundType + 1].length);
				draft["gamestate"]["cards"].push(draft["gamestate"]["available_cards"][roundType + 1][rand]);
				draft["gamestate"]["available_cards"][roundType + 1].splice(rand, 1);
			}
		}
	} else {
		var pickIndex = draft["gamestate"]["cards"].indexOf(pick);
		if (pickIndex != -1) {
			draft["gamestate"]["cards"][pickIndex] = -1;
		} else {
			return { success: false, error: "Card not found" };
		}
	}
	
	// Increment the turn
	draft["gamestate"]["turn"]++;
	if (draft["gamestate"]["phase"] == 3) {
		for (var i = 0; i < numPlayers; i++) {
			draft["players"][i]["ready"] = 0;
		}
	}
	
	// Reset timer for next turn if timer is enabled
	if (draft["preset"]["timer_enabled"]) {
		draft["gamestate"]["timer_remaining"] = draft["preset"]["timer_duration"];
		draft["gamestate"]["timer_last_update"] = Date.now();
		draft["gamestate"]["timer_paused"] = false;
	}
	
	return { success: true };
}

function draftIO(io) {
	io.on("connection", function (socket) {
		socket.on("join room", (roomID) => {
			socket.join(roomID);
		});
		socket.on("get gamestate", (roomID, playerNumber) => {
			let draft = getDraft(roomID);
			
			// Check if draft exists
			if (!draft || draft === -1) {
				console.log(`Draft not found: ${roomID}`);
				io.to(socket.id).emit("draft not found", roomID);
				return;
			}
			
			// Update timer based on elapsed time
			updateTimerRemaining(draft);
			
			// Check if timer expired and auto-select if needed
			if (draft["preset"]["timer_enabled"] && 
			    draft["gamestate"]["phase"] === 2 && 
			    draft["gamestate"]["timer_remaining"] === 0 &&
			    !draft["gamestate"]["timer_paused"]) {
				// Timer expired, trigger auto-selection
				console.log(`Timer expired on get gamestate, auto-selecting card for turn ${draft["gamestate"]["turn"]}`);
				
				// Select a random available card from highlighted indices
				var availableCards = [];
				var highlighted = draft["gamestate"]["highlighted"] || [];
				
				if (highlighted.length === 0) {
					for (var i = 0; i < draft["gamestate"]["cards"].length; i++) {
						if (draft["gamestate"]["cards"][i] !== -1) {
							availableCards.push(draft["gamestate"]["cards"][i]);
						}
					}
				} else {
					for (var i = 0; i < highlighted.length; i++) {
						var cardIndex = highlighted[i];
						if (cardIndex < draft["gamestate"]["cards"].length && draft["gamestate"]["cards"][cardIndex] !== -1) {
							availableCards.push(draft["gamestate"]["cards"][cardIndex]);
						}
					}
				}
				
				if (availableCards.length > 0) {
					var randomPick = availableCards[Math.floor(Math.random() * availableCards.length)];
					console.log(`Auto-selecting card: ${randomPick} from ${availableCards.length} available cards`);
					processCardPick(draft, randomPick);
					fs.writeFileSync(`${tempdir}/drafts/${roomID}.json`, JSON.stringify(draft, null, 2));
				}
			}

			if (playerNumber >= 0) {
				io.in(roomID).emit("set gamestate", draft);
			} else {
				io.to(socket.id).emit("set gamestate", draft);
			}
		});
		socket.on("get private gamestate", (roomID) => {
			var draft = getDraft(roomID);
			
			// Check if draft exists
			if (!draft || draft === -1) {
				console.log(`Draft not found: ${roomID}`);
				io.to(socket.id).emit("draft not found", roomID);
				return;
			}
			
			updateTimerRemaining(draft);
			io.to(socket.id).emit("set gamestate", draft);
		});
		socket.on("toggle ready", (roomID, playerNumber) => {
			let draft = getDraft(roomID);
			
			// Check if draft exists
			if (!draft || draft === -1) {
				console.log(`Draft not found: ${roomID}`);
				io.to(socket.id).emit("draft not found", roomID);
				return;
			}

			if (playerNumber < 0) {
				console.log("spectator can't be ready");
			}
			draft["players"][playerNumber]["ready"] = (draft["players"][playerNumber]["ready"] + 1) % 2;
			fs.writeFileSync(`${tempdir}/drafts/${roomID}.json`, JSON.stringify(draft, null, 2));
			io.in(roomID).emit("set gamestate", draft);
		});
		socket.on("start draft", (roomID) => {
			let draft = getDraft(roomID);
			
			// Check if draft exists
			if (!draft || draft === -1) {
				console.log(`Draft not found: ${roomID}`);
				io.to(socket.id).emit("draft not found", roomID);
				return;
			}

			draft["gamestate"]["phase"] = 1;
			for (var i = 0; i < draft["preset"]["slots"]; i++) {
				draft["players"][i]["ready"] = 0;
			}
			fs.writeFileSync(`${tempdir}/drafts/${roomID}.json`, JSON.stringify(draft, null, 2));
			io.in(roomID).emit("set gamestate", draft);
		});
		socket.on("update civ info", (roomID, playerNumber, civ_name, flag_palette, architecture, language, wonder = 0) => {
			let draft = getDraft(roomID);
			
			// Check if draft exists
			if (!draft || draft === -1) {
				console.log(`Draft not found: ${roomID}`);
				io.to(socket.id).emit("draft not found", roomID);
				return;
			}
			
			var numPlayers = draft["preset"]["slots"];

			draft["players"][playerNumber]["ready"] = 1;
			draft["players"][playerNumber]["alias"] = civ_name;
			draft["players"][playerNumber]["flag_palette"] = flag_palette;
			draft["players"][playerNumber]["architecture"] = architecture;
			draft["players"][playerNumber]["language"] = language;
			draft["players"][playerNumber]["wonder"] = wonder;

			var nextPhase = 1;
			for (var i = 0; i < numPlayers; i++) {
				if (draft["players"][i]["ready"] != 1) {
					nextPhase = 0;
				}
			}

			if (nextPhase == 1) {
				draft["gamestate"]["phase"] = 2;
				for (var i = 0; i < numPlayers; i++) {
					draft["players"][i]["ready"] = 0;
				}

				//Distribute the first set of civ bonus cards
				// First, add any required cards for testing
				if (draft["preset"]["required_first_roll"] && draft["preset"]["required_first_roll"].length > 0) {
					for (var reqCard of draft["preset"]["required_first_roll"]) {
						// Check if card is available
						var cardIndex = draft["gamestate"]["available_cards"][0].indexOf(reqCard);
						if (cardIndex !== -1) {
							draft["gamestate"]["cards"].push(reqCard);
							draft["gamestate"]["available_cards"][0].splice(cardIndex, 1);
						}
					}
				}
				
				// Then fill the rest randomly
				// Use configurable bonuses_per_page, default to 30 for backward compatibility
				var bonusesPerPage = draft["preset"]["bonuses_per_page"] !== undefined ? draft["preset"]["bonuses_per_page"] : 30;
				var cardsNeeded = (draft["preset"]["rounds"] - 1) * numPlayers + bonusesPerPage - draft["gamestate"]["cards"].length;
				for (var i = 0; i < cardsNeeded; i++) {
					if (draft["gamestate"]["available_cards"][0].length > 0) {
						var rand = Math.floor(Math.random() * draft["gamestate"]["available_cards"][0].length);
						draft["gamestate"]["cards"].push(draft["gamestate"]["available_cards"][0][rand]);
						draft["gamestate"]["available_cards"][0].splice(rand, 1);
					}
				}

				//Give each player a ranking based off how many techtree points they spent
				//Edit: we do this randomly now because techtrees are made afterwards
				var priorities = [];
				for (var i = 0; i < numPlayers; i++) {
					priorities.push(Math.random());
				}
				for (var i = 0; i < numPlayers; i++) {
					var maxIndex = 0;
					for (var j = 0; j < numPlayers; j++) {
						if (priorities[j] > priorities[maxIndex]) {
							maxIndex = j;
						} else if (priorities[j] == priorities[maxIndex]) {
							//50/50 switching in ties is good enough *cries in perfectionist*
							//In the long run it advantages players that join the later
							var rand = Math.floor(Math.random() * 2);
							if (rand == 0) {
								maxIndex = j;
							}
						}
					}
					draft["gamestate"]["order"].push(maxIndex);
					priorities[maxIndex] = -1;
				}
				fs.writeFileSync(`${tempdir}/drafts/${roomID}.json`, JSON.stringify(draft, null, 2));
				io.in(roomID).emit("set gamestate", draft);
			} else {
				fs.writeFileSync(`${tempdir}/drafts/${roomID}.json`, JSON.stringify(draft, null, 2));
			}
		});
		socket.on("update tree", (roomID, playerNumber, tree) => {
			let draft = getDraft(roomID);
			
			// Check if draft exists
			if (!draft || draft === -1) {
				console.log(`Draft not found: ${roomID}`);
				io.to(socket.id).emit("draft not found", roomID);
				return;
			}
			
			var numPlayers = draft["preset"]["slots"];

			draft["players"][playerNumber]["tree"] = tree;
			draft["players"][playerNumber]["ready"] = 1;

			var nextPhase = 1;
			for (var i = 0; i < numPlayers; i++) {
				if (draft["players"][i]["ready"] != 1) {
					nextPhase = 0;
				}
			}

			if (nextPhase == 1) {
				draft["gamestate"]["phase"] = 5;
				fs.writeFileSync(`${tempdir}/drafts/${draft["id"]}.json`, JSON.stringify(draft, null, 2));
				io.in(roomID).emit("set gamestate", draft);

				// Create the mod by executing a series of steps:
				// 1. Create mod folder structure
				// 2. Generate civ icons
				// 3. Generate data.json
				// 4. Write language strings
				// 5. Write unit icons
				// 6. Write tech tree and civilizations JSON
				// 7. Create DAT file
				// 8. Zip the mod
				
				//Create Mod Folder
				osUtil.execCommand(`bash ./process_mod/createModFolder.sh ./modding/requested_mods ${draft["id"]} ${__dirname} 1`, function () {
					//Create Civ Icons
					for (var i = 0; i < numPlayers; i++) {
						var civName = nameArr[i];
						var seed = [[colours[draft["players"][i]["flag_palette"][0]], colours[draft["players"][i]["flag_palette"][1]], colours[draft["players"][i]["flag_palette"][2]], colours[draft["players"][i]["flag_palette"][3]], colours[draft["players"][i]["flag_palette"][4]]], draft["players"][i]["flag_palette"][5], draft["players"][i]["flag_palette"][6]];
						var symbol = draft["players"][i]["flag_palette"][7] - 1;
						if (civName == "berber" || civName == "inca") { // TODO why do we have this here? both branches have exactly the same code
							icons.drawFlag(
								seed,
								symbol,
								[
									`./modding/requested_mods/${draft["id"]}/${draft["id"]}-ui/widgetui/textures/menu/civs/${civName}s.png`,
									`./modding/requested_mods/${draft["id"]}/${draft["id"]}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/menu_techtree_${civName}.png`,
									`./modding/requested_mods/${draft["id"]}/${draft["id"]}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/menu_techtree_${civName}_hover.png`,
									`./modding/requested_mods/${draft["id"]}/${draft["id"]}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/menu_techtree_${civName}_pressed.png`,
									`./modding/requested_mods/${draft["id"]}/${draft["id"]}-data/resources/_common/wpfg/resources/civ_techtree/menu_techtree_${civName}.png`,
									`./modding/requested_mods/${draft["id"]}/${draft["id"]}-data/resources/_common/wpfg/resources/civ_techtree/menu_techtree_${civName}_hover.png`,
									`./modding/requested_mods/${draft["id"]}/${draft["id"]}-data/resources/_common/wpfg/resources/civ_techtree/menu_techtree_${civName}_pressed.png`,
								],
								`./public/img/symbols`
							);
						} else {
							icons.drawFlag(
								seed,
								symbol,
								[
									`./modding/requested_mods/${draft["id"]}/${draft["id"]}-ui/widgetui/textures/menu/civs/${civName}s.png`,
									`./modding/requested_mods/${draft["id"]}/${draft["id"]}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/menu_techtree_${civName}.png`,
									`./modding/requested_mods/${draft["id"]}/${draft["id"]}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/menu_techtree_${civName}_hover.png`,
									`./modding/requested_mods/${draft["id"]}/${draft["id"]}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/menu_techtree_${civName}_pressed.png`,
									`./modding/requested_mods/${draft["id"]}/${draft["id"]}-data/resources/_common/wpfg/resources/civ_techtree/menu_techtree_${civName}.png`,
									`./modding/requested_mods/${draft["id"]}/${draft["id"]}-data/resources/_common/wpfg/resources/civ_techtree/menu_techtree_${civName}_hover.png`,
									`./modding/requested_mods/${draft["id"]}/${draft["id"]}-data/resources/_common/wpfg/resources/civ_techtree/menu_techtree_${civName}_pressed.png`,
								],
								`./public/img/symbols`
							);
						}
					}
					//Copy Civ Icons
					osUtil.execCommand(`cp -r ./modding/requested_mods/${draft["id"]}/${draft["id"]}-ui/widgetui/textures/ingame/icons/civ_techtree_buttons/. ./modding/requested_mods/${draft["id"]}/${draft["id"]}-ui/resources/_common/wpfg/resources/civ_techtree`, function () {
						//Generate Json
						var mod_data = {};
						mod_data.name = [];
						mod_data.description = [];
						mod_data.techtree = [];
						mod_data.castletech = [];
						mod_data.imptech = [];
						mod_data.civ_bonus = [];
						mod_data.team_bonus = [];
						mod_data.architecture = [];
						mod_data.language = [];
						mod_data.castle = [];
						mod_data.wonder = [];
						mod_data.modifiers = {
							randomCosts: false,
							hp: 1,
							speed: 1,
							blind: false,
							infinity: false,
							building: 1,
						};
						mod_data.modifyDat = true;
						for (var i = 0; i < numPlayers; i++) {
							mod_data.name.push(draft["players"][i]["alias"]);
							var player_techtree = [];
							for (var j = 0; j < numBasicTechs; j++) {
								player_techtree.push(0);
							}
							// Normalize description to ensure it's always a string
							draft["players"][i]["description"] = normalizeDescription(draft["players"][i]["description"]);
							mod_data.description.push(draft["players"][i]["description"]);
							mod_data.castle.push(draft["players"][i]["castle"]);
							mod_data.wonder.push(draft["players"][i]["wonder"]);
							//Unique Unit
							if (draft["players"][i]["bonuses"] && draft["players"][i]["bonuses"][1] && draft["players"][i]["bonuses"][1][0] !== undefined) {
								player_techtree[0] = extractBonusId(draft["players"][i]["bonuses"][1][0], "unique unit");
							}
							//Castle Tech
							var castletechs = [];
							if (draft["players"][i]["bonuses"] && draft["players"][i]["bonuses"][2] && draft["players"][i]["bonuses"][2][0] !== undefined) {
								// Preserve [id, multiplier] tuples when written to mod_data
								castletechs.push(draft["players"][i]["bonuses"][2][0]);
							} else {
								castletechs.push(0);
							}
							mod_data.castletech.push(castletechs);
							//Imp Tech
							var imptechs = [];
							if (draft["players"][i]["bonuses"] && draft["players"][i]["bonuses"][3] && draft["players"][i]["bonuses"][3][0] !== undefined) {
								imptechs.push(draft["players"][i]["bonuses"][3][0]);
							} else {
								imptechs.push(0);
							}
							mod_data.imptech.push(imptechs);
							//Tech Tree
							for (var j = 0; j < draft["players"][i]["tree"].length; j++) {
								for (var k = 0; k < draft["players"][i]["tree"][j].length; k++) {
									player_techtree[indexDictionary[j][draft["players"][i]["tree"][j][k].toString()]] = 1;
								}
							}
							mod_data.techtree.push(player_techtree);
							// Civ bonuses - these can be multiplier tuples too
							var civBonuses = [];
							if (draft["players"][i]["bonuses"] && draft["players"][i]["bonuses"][0] && Array.isArray(draft["players"][i]["bonuses"][0])) {
								for (var j = 0; j < draft["players"][i]["bonuses"][0].length; j++) {
									civBonuses.push(draft["players"][i]["bonuses"][0][j]);
								}
							}
							mod_data.civ_bonus.push(civBonuses);
							mod_data.architecture.push(draft["players"][i]["architecture"]);
							mod_data.language.push(draft["players"][i]["language"]);
							var team_bonuses = [];
							if (draft["players"][i]["bonuses"] && draft["players"][i]["bonuses"][4] && draft["players"][i]["bonuses"][4][0] !== undefined) {
								team_bonuses.push(draft["players"][i]["bonuses"][4][0]);
							} else {
								team_bonuses.push(0);
							}
							mod_data.team_bonus.push(team_bonuses);
						}
						console.log(JSON.stringify(mod_data, null, 2));
						fs.writeFileSync(`./modding/requested_mods/${draft["id"]}/data.json`, JSON.stringify(mod_data, null, 2));
						//Write Names
						modStrings.interperateLanguage(`./modding/requested_mods/${draft["id"]}/data.json`, `./modding/requested_mods/${draft["id"]}/${draft["id"]}-ui/resources/en/strings/key-value/key-value-modded-strings-utf8.txt`);
						//Copy Names
						osUtil.execCommand(`sh ./process_mod/copyLanguages.sh ./modding/requested_mods/${draft["id"]}/${draft["id"]}-ui/resources`, function () {
							//Write UUIcons
							for (var i = 0; i < blanks.length; i++) {
								osUtil.execCommand(`cp ./public/img/uniticons/blank.png ./modding/requested_mods/${draft["id"]}/${draft["id"]}-ui/resources/_common/wpfg/resources/uniticons/${blanks[i]}_50730.png`, function () {});
							}
							for (var i = 0; i < mod_data.techtree.length; i++) {
								var unitId = mod_data.techtree[i][0];
								
								// Validate that unitId is defined and within valid range
								if (unitId === undefined || unitId === null) {
									console.error(`[${draft["id"]}]: Warning - Unit ID is undefined for civ techtree index ${i}`);
									continue;
								}
								
								var iconsrc = iconids[unitId];
								
								// Validate that icon source exists
								if (iconsrc === undefined) {
									console.error(`[${draft["id"]}]: Warning - No icon found for unit ID ${unitId} at techtree index ${i}`);
									continue;
								}
								
								if (i == mod_data.techtree.length - 1) {
									osUtil.execCommand(`cp ./public/img/uniticons/${iconsrc}_50730.png ./modding/requested_mods/${draft["id"]}/${draft["id"]}-ui/resources/_common/wpfg/resources/uniticons/${iconsrc}_50730.png`, function () {
										//Write Tech Tree
										createTechtreeJson.createTechtreeJson(`./modding/requested_mods/${draft["id"]}/data.json`, `./modding/requested_mods/${draft["id"]}/${draft["id"]}-data/resources/_common/dat/civTechTrees.json`);
										createCivilizationsJson(`./modding/requested_mods/${draft["id"]}/data.json`, `./modding/requested_mods/${draft["id"]}/${draft["id"]}-data/resources/_common/dat/civilizations.json`);
										//Add voices
										let command = `sh ./process_mod/copyVoices.sh ./modding/requested_mods/${draft["id"]}/${draft["id"]}-ui/resources/_common/drs/sounds ./public/vanillaFiles/voiceFiles`;
										let uniqueLanguages = [];
										for (var i = 0; i < mod_data.language.length; i++) {
											if (uniqueLanguages.indexOf(mod_data.language[i]) == -1) {
												uniqueLanguages.push(mod_data.language[i]);
												command += ` ${mod_data.language[i]}`;
											}
										}
										osUtil.execCommand(command, function () {
											//Write Dat File
											osUtil.execCommand(`./modding/build/create-data-mod ./modding/requested_mods/${draft["id"]}/data.json ./public/vanillaFiles/empires2_x2_p1.dat ./modding/requested_mods/${draft["id"]}/${draft["id"]}-data/resources/_common/dat/empires2_x2_p1.dat ./modding/requested_mods/${draft["id"]}/${draft["id"]}-ui/resources/_common/ai/aiconfig.json`, function () {
												// Copy JSON files to mod folder for user reference
												try {
													const sourcePath = path.join(tempdir, 'drafts', `${draft["id"]}.json`);
													const destPath = path.join(__dirname, 'modding', 'requested_mods', draft["id"], 'draft-config.json');
													
													// Check if source file exists before copying
													if (!fs.existsSync(sourcePath)) {
														console.error(`[${draft["id"]}]: Source draft JSON not found at ${sourcePath}`);
													} else {
														fs.copyFileSync(sourcePath, destPath);
														
														// Create individual civ JSON files for each player (for combine compatibility)
														draft["players"].forEach((player, index) => {
															const civJson = {
																alias: player.alias || `Civ${index + 1}`,
																description: player.description || '',
																flag_palette: player.flag_palette,
																tree: player.tree,
																bonuses: player.bonuses,
																architecture: player.architecture,
																language: player.language,
																wonder: player.wonder,
																castle: player.castle,
																customFlag: player.customFlag || false,
																customFlagData: player.customFlagData || ''
															};
															
															// Create filename based on player alias, sanitized for filesystem
															const safeName = (player.alias || `Civ${index + 1}`)
																.replace(/[^a-zA-Z0-9_-]/g, '_')
																.substring(0, 50);
															const civFilePath = path.join(__dirname, 'modding', 'requested_mods', draft["id"], `${safeName}.json`);
															fs.writeFileSync(civFilePath, JSON.stringify(civJson, null, 2));
														});
														
														console.log(`[${draft["id"]}]: Added draft-config.json, data.json, and ${draft["players"].length} individual civ JSON file(s) to mod folder`);
													}
												} catch (error) {
													console.error(`[${draft["id"]}]: Error copying JSON files from ${error.path || 'unknown path'}:`, error.message);
												}
												
												//Zip Files with new filename format
												const newFilename = generateModFilenameNoExt(__dirname);
												draft["modFilename"] = newFilename; // Store filename in draft for download
												osUtil.execCommand(`bash ./process_mod/zipModFolder.sh ${draft["id"]} 1 ${newFilename}`, function () {
													draft["gamestate"]["phase"] = 6;
													fs.writeFileSync(`${tempdir}/drafts/${draft["id"]}.json`, JSON.stringify(draft, null, 2));
													io.in(roomID).emit("set gamestate", draft);
												});
											});
										});
									});
								} else {
									osUtil.execCommand(`cp ./public/img/uniticons/${iconsrc}_50730.png ./modding/requested_mods/${draft["id"]}/${draft["id"]}-ui/resources/_common/wpfg/resources/uniticons/${iconsrc}_50730.png`, function () {});
								}
							}
						});
					});
				});
				// fs.writeFileSync(`${dir}/drafts/${roomID}.json`, JSON.stringify(draft, null, 2));
				// io.in(roomID).emit("set gamestate", draft);
			} else {
				fs.writeFileSync(`${tempdir}/drafts/${roomID}.json`, JSON.stringify(draft, null, 2));
			}
		});
		socket.on("update tree progress", (roomID, playerNumber, tree) => {
			let draft = getDraft(roomID);
			
			// Check if draft exists
			if (!draft || draft === -1) {
				console.log(`Draft not found: ${roomID}`);
				io.to(socket.id).emit("draft not found", roomID);
				return;
			}
			
			// Only update the tree in memory, don't mark player as ready
			// This is for intermediate updates while player is still editing
			draft["players"][playerNumber]["tree"] = tree;
			
			// Broadcast the updated gamestate to all clients in the room
			// This allows spectators and other players to see real-time updates
			io.in(roomID).emit("set gamestate", draft);
		});
		socket.on("end turn", (roomID, pick, client_turn) => {
			let draft = getDraft(roomID);
			
			// Check if draft exists
			if (!draft || draft === -1) {
				console.log(`Draft not found: ${roomID}`);
				io.to(socket.id).emit("draft not found", roomID);
				return;
			}

			var bug = 0;
			if (client_turn == draft["gamestate"]["turn"]) {
				var result = processCardPick(draft, pick);
				if (!result.success) {
					bug = 1;
					console.log("THE BUG HAPPENED");
					console.log("RoomID: " + roomID);
					console.log("Pick: " + pick);
					console.log("Draft State: ", draft["gamestate"]);
				}
				
				fs.writeFileSync(`${tempdir}/drafts/${roomID}.json`, JSON.stringify(draft, null, 2));
				io.in(roomID).emit("set gamestate", draft);
			} else {
				console.log("Duplicate socket messages, THE BUG avoided");
			}

			if (bug == 1) {
				io.in(roomID).emit("bug");
			}
		});
		socket.on("refill", (roomID) => {
			let draft = getDraft(roomID);
			
			// Check if draft exists
			if (!draft || draft === -1) {
				console.log(`Draft not found: ${roomID}`);
				io.to(socket.id).emit("draft not found", roomID);
				return;
			}
			
			var numPlayers = draft["preset"]["slots"];

			//Repopulate empty card slots and keep track of the indices of refilled cards in highlighted array
			draft["gamestate"]["highlighted"] = [];
			var roundType = Math.max(Math.floor(draft["gamestate"]["turn"] / numPlayers) - (draft["preset"]["rounds"] - 1), 0);
			for (var i = 0; i < draft["gamestate"]["cards"].length; i++) {
				if (draft["gamestate"]["cards"][i] == -1) {
					if (draft["gamestate"]["available_cards"][roundType].length <= 0) {
						draft["gamestate"]["available_cards"][roundType] = reshuffleCards(draft);
					}
					var rand = Math.floor(Math.random() * draft["gamestate"]["available_cards"][roundType].length);
					draft["gamestate"]["cards"][i] = draft["gamestate"]["available_cards"][roundType][rand];
					draft["gamestate"]["available_cards"][roundType].splice(rand, 1);
					draft["gamestate"]["highlighted"].push(i);
				}
			}
			fs.writeFileSync(`${tempdir}/drafts/${roomID}.json`, JSON.stringify(draft, null, 2));
			io.in(roomID).emit("set gamestate", draft);
		});
		socket.on("clear", (roomID) => {
			let draft = getDraft(roomID);
			
			// Check if draft exists
			if (!draft || draft === -1) {
				console.log(`Draft not found: ${roomID}`);
				io.to(socket.id).emit("draft not found", roomID);
				return;
			}
			
			var numPlayers = draft["preset"]["slots"];
			var cardsPerRoll = draft["preset"]["cards_per_roll"] || 3;

			//Clear out cards and highlight based on cards_per_roll setting
			draft["gamestate"]["highlighted"] = [];
			for (var i = 0; i < cardsPerRoll; i++) {
				draft["gamestate"]["highlighted"].push(i);
			}
			var roundType = Math.max(Math.floor(draft["gamestate"]["turn"] / numPlayers) - (draft["preset"]["rounds"] - 1), 0);
			for (var i = 0; i < draft["gamestate"]["cards"].length; i++) {
				if (draft["gamestate"]["available_cards"][roundType].length <= 0) {
					draft["gamestate"]["available_cards"][roundType] = reshuffleCards(draft);
				}
				var rand = Math.floor(Math.random() * draft["gamestate"]["available_cards"][roundType].length);
				draft["gamestate"]["cards"][i] = draft["gamestate"]["available_cards"][roundType][rand];
				draft["gamestate"]["available_cards"][roundType].splice(rand, 1);
			}
			fs.writeFileSync(`${tempdir}/drafts/${roomID}.json`, JSON.stringify(draft, null, 2));
			io.in(roomID).emit("set gamestate", draft);
		});
		
		// Timer control - pause (host only)
		socket.on("pause timer", (roomID) => {
			let draft = getDraft(roomID);
			if (!draft || !draft["preset"]["timer_enabled"]) return;
			
			// Update timer before pausing to save current state
			updateTimerRemaining(draft);
			draft["gamestate"]["timer_paused"] = true;
			draft["gamestate"]["timer_last_update"] = Date.now();
			fs.writeFileSync(`${tempdir}/drafts/${roomID}.json`, JSON.stringify(draft, null, 2));
			io.in(roomID).emit("set gamestate", draft);
		});
		
		// Timer control - resume (host only)
		socket.on("resume timer", (roomID) => {
			let draft = getDraft(roomID);
			if (!draft || !draft["preset"]["timer_enabled"]) return;
			
			draft["gamestate"]["timer_paused"] = false;
			draft["gamestate"]["timer_last_update"] = Date.now();
			fs.writeFileSync(`${tempdir}/drafts/${roomID}.json`, JSON.stringify(draft, null, 2));
			io.in(roomID).emit("set gamestate", draft);
		});
		
		// Get timer sync - lightweight update for timer only
		socket.on("sync timer", (roomID) => {
			let draft = getDraft(roomID);
			if (!draft || !draft["preset"]["timer_enabled"]) return;
			
			updateTimerRemaining(draft);
			
			// Check if timer expired and auto-select if needed
			if (draft["gamestate"]["phase"] === 2 && 
			    draft["gamestate"]["timer_remaining"] === 0 &&
			    !draft["gamestate"]["timer_paused"]) {
				// Timer expired, trigger auto-selection
				console.log(`Timer expired on sync, auto-selecting card for turn ${draft["gamestate"]["turn"]}`);
				
				var availableCards = [];
				var highlighted = draft["gamestate"]["highlighted"] || [];
				
				if (highlighted.length === 0) {
					for (var i = 0; i < draft["gamestate"]["cards"].length; i++) {
						if (draft["gamestate"]["cards"][i] !== -1) {
							availableCards.push(draft["gamestate"]["cards"][i]);
						}
					}
				} else {
					for (var i = 0; i < highlighted.length; i++) {
						var cardIndex = highlighted[i];
						if (cardIndex < draft["gamestate"]["cards"].length && draft["gamestate"]["cards"][cardIndex] !== -1) {
							availableCards.push(draft["gamestate"]["cards"][cardIndex]);
						}
					}
				}
				
				if (availableCards.length > 0) {
					var randomPick = availableCards[Math.floor(Math.random() * availableCards.length)];
					console.log(`Auto-selecting card: ${randomPick}`);
					processCardPick(draft, randomPick);
					fs.writeFileSync(`${tempdir}/drafts/${roomID}.json`, JSON.stringify(draft, null, 2));
					// Broadcast to all clients
					io.in(roomID).emit("set gamestate", draft);
					return;
				}
			}
			
			// Save updated timer state
			fs.writeFileSync(`${tempdir}/drafts/${roomID}.json`, JSON.stringify(draft, null, 2));
			// Send just timer update to requesting client
			io.to(socket.id).emit("timer update", {
				timer_remaining: draft["gamestate"]["timer_remaining"],
				timer_paused: draft["gamestate"]["timer_paused"]
			});
		});
		
		// Timer expired - make random selection
		socket.on("timer expired", (roomID, client_turn) => {
			let draft = getDraft(roomID);
			if (!draft || !draft["preset"]["timer_enabled"]) return;
			
			// Only process if it's the correct turn (prevent duplicate processing)
			if (client_turn !== draft["gamestate"]["turn"]) {
				console.log("Timer expired for wrong turn, ignoring");
				return;
			}
			
			// Check if we're in the picking phase (phase 2)
			if (draft["gamestate"]["phase"] !== 2) {
				console.log("Timer expired but not in picking phase");
				return;
			}
			
			// Select a random available card from highlighted indices
			var availableCards = [];
			var highlighted = draft["gamestate"]["highlighted"] || [];
			
			// If highlighted is empty, all non-(-1) cards are available
			if (highlighted.length === 0) {
				for (var i = 0; i < draft["gamestate"]["cards"].length; i++) {
					if (draft["gamestate"]["cards"][i] !== -1) {
						availableCards.push(draft["gamestate"]["cards"][i]);
					}
				}
			} else {
				// Only select from highlighted card indices
				for (var i = 0; i < highlighted.length; i++) {
					var cardIndex = highlighted[i];
					if (cardIndex < draft["gamestate"]["cards"].length && draft["gamestate"]["cards"][cardIndex] !== -1) {
						availableCards.push(draft["gamestate"]["cards"][cardIndex]);
					}
				}
			}
			
			if (availableCards.length === 0) {
				console.log("No available cards for random selection");
				return;
			}
			
			var randomPick = availableCards[Math.floor(Math.random() * availableCards.length)];
			console.log(`Timer expired, auto-selecting card: ${randomPick} from ${availableCards.length} available cards`);
			
			// Process the pick using the same helper function
			processCardPick(draft, randomPick);
			
			fs.writeFileSync(`${tempdir}/drafts/${roomID}.json`, JSON.stringify(draft, null, 2));
			io.in(roomID).emit("set gamestate", draft);
		});
	});
}
draftIO(io);

module.exports = {
	io: draftIO,
	router: router,
};

server.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});

// Graceful shutdown on Ctrl+C
process.on('SIGINT', () => {
	console.log('Received SIGINT, shutting down...');
	server.close(() => {
		console.log('HTTP server closed.');
		process.exit(0);
	});
	// If socket.io is still running, close it
	if (io && typeof io.close === 'function') {
		io.close();
	}
	// Fallback: force exit after 3s if not closed
	setTimeout(() => {
		console.error('Force exiting...');
		process.exit(1);
	}, 3000);
});
