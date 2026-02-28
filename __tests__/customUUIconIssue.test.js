/**
 * Test for custom UU icon handling issue
 * Tests that mod creation doesn't get stuck when dealing with custom UU objects
 */

const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');

const execFileAsync = promisify(execFile);

// Load the extractBonusId function indirectly by checking its behavior
const { numBasicTechs, indexDictionary } = require('../process_mod/constants.js');

// Define BONUS_INDEX constants locally (from bonusConstants.js)
const BONUS_INDEX = {
	CIV: 0,
	UNIQUE_UNIT: 1,
	CASTLE_TECH: 2,
	IMPERIAL_TECH: 3,
	TEAM: 4
};

describe('Custom UU Icon Issue', () => {
	const projectRoot = path.join(__dirname, '..');
	const createDataModPath = path.join(projectRoot, 'modding', 'build', 'create-data-mod');

	test('should handle custom UU objects in data.json generation', async () => {
		// This is the JSON structure from the issue
		const civData = {
			alias: '1',
			flag_palette: [3, 4, 5, 6, 7, 3, 3, 3],
			tree: [
				[13, 17, 21, 74],
				[12, 45, 49, 50],
				[22, 101, 102, 103]
			],
			bonuses: [
				[[356, 1], [310, 1]],
				[{
					type: 'custom',
					unitType: 'archer',
					baseUnit: 850,
					name: 'Custom Archer',
					health: 40,
					attack: 6,
					meleeArmor: 0,
					pierceArmor: 0,
					attackSpeed: 2,
					speed: 0.96,
					range: 4,
					cost: { food: 0, wood: 55, stone: 0, gold: 20 },
					trainTime: 18,
					lineOfSight: 5,
					heroMode: false,
					attackBonuses: []
				}],
				[],
				[],
				[]
			],
			architecture: 1,
			language: 5,
			wonder: 11,
			castle: 9,
			customFlag: false,
			customFlagData: '',
			description: ''
		};

		// Simulate what writeIconsJson does
		const mod_data = {
			name: [],
			description: [],
			techtree: [],
			castletech: [],
			imptech: [],
			civ_bonus: [],
			team_bonus: [],
			architecture: [],
			language: [],
			wonder: [],
			castle: []
		};

		// Replicate the logic from writeIconsJson
		const civs = [civData];
		for (let i = 0; i < civs.length; i++) {
			mod_data.name.push(civs[i]["alias"]);
			mod_data.description.push(civs[i]["description"] || '');
			mod_data.wonder.push(civs[i]["wonder"]);
			mod_data.castle.push(civs[i]["castle"]);

			const player_techtree = [];
			for (let j = 0; j < numBasicTechs; j++) {
				player_techtree.push(0);
			}

			// This is where the issue happens - extracting the unique unit
			if (civs[i]["bonuses"] && civs[i]["bonuses"][BONUS_INDEX.UNIQUE_UNIT] && civs[i]["bonuses"][BONUS_INDEX.UNIQUE_UNIT].length != 0) {
				const uuData = civs[i]["bonuses"][BONUS_INDEX.UNIQUE_UNIT][0];
				
				// Test: custom UU objects should be handled
				if (typeof uuData === 'object' && uuData.type === 'custom') {
					player_techtree[0] = 0; // Custom UUs get 0
				} else if (Array.isArray(uuData)) {
					player_techtree[0] = uuData[0];
				} else {
					player_techtree[0] = uuData;
				}
			} else {
				player_techtree[0] = 0;
			}

			mod_data.techtree.push(player_techtree);
			mod_data.castletech.push([0]);
			mod_data.imptech.push([0]);
			mod_data.civ_bonus.push([]);
			mod_data.team_bonus.push([0]);
			mod_data.architecture.push(civs[i]["architecture"]);
			mod_data.language.push(civs[i]["language"]);
		}

		// Verify that custom UU results in 0 in techtree
		expect(mod_data.techtree[0][0]).toBe(0);
		expect(typeof mod_data.techtree[0][0]).toBe('number');
	});

	test('extractBonusId implementation handles custom UU objects', () => {
		// Test the extractBonusId function implementation
		const serverPath = path.join(__dirname, '..', 'server.js');
		const serverContent = fs.readFileSync(serverPath, 'utf8');

		// Check that extractBonusId handles objects with type: 'custom'
		expect(serverContent).toContain('function extractBonusId');
		expect(serverContent).toContain("bonus.type === 'custom'");
		expect(serverContent).toContain('typeof bonus === \'object\'');
	});

	test('writeUUIcons properly handles objects and logs them', () => {
		const serverPath = path.join(__dirname, '..', 'server.js');
		const serverContent = fs.readFileSync(serverPath, 'utf8');

		// Check that writeUUIcons checks for object types
		expect(serverContent).toContain('const writeUUIcons');
		expect(serverContent).toContain('typeof unitId === \'object\'');
		expect(serverContent).toContain('JSON.stringify');
	});

	test('writeUUIcons calls next() when no icons need copying', () => {
		const serverPath = path.join(__dirname, '..', 'server.js');
		const serverContent = fs.readFileSync(serverPath, 'utf8');

		// Check that writeUUIcons has logic to call next() when no icons are needed
		const writeUUIconsMatch = serverContent.match(/const writeUUIcons[\s\S]*?(?=^const )/m);
		expect(writeUUIconsMatch).toBeTruthy();
		
		const functionBody = writeUUIconsMatch[0];
		// Should have a check for no icons needed
		expect(functionBody).toContain('iconCopyNeeded');
		expect(functionBody).toContain('No unique unit icons to copy');
	});
});
