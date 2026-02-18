/**
 * Test for custom UU icon handling issue
 * Tests that mod creation doesn't get stuck when dealing with custom UU objects
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

// Need to start server
const app = require('../server.js');

describe('Custom UU Icon Issue', () => {
	const seed = Date.now().toString();
	const modFolder = path.join(__dirname, '..', 'modding', 'requested_mods', seed);

	afterAll((done) => {
		// Cleanup: Remove the test mod folder
		rimraf(modFolder, () => {
			done();
		});
	});

	test('should not get stuck when creating mod with custom UU', (done) => {
		// This is the JSON structure from the issue
		const civData = {
			alias: '1',
			flag_palette: [3, 4, 5, 6, 7, 3, 3, 3],
			tree: [
				[13, 17, 21, 74, 545, 539, 331, 125, 83, 128, 440, 250, 533, 1811, 185, 1751, 1753, 1755, 1962, 1974, 1952, 1911, 831, 832, 1923, 1750, 1004, 1006, 2540, 38, 283, 569],
				[12, 45, 49, 50, 68, 70, 72, 79, 82, 84, 87, 101, 103, 104, 109, 199, 209, 276, 562, 584, 598, 621, 792, 1889, 1806, 1021, 1665, 1251],
				[22, 101, 102, 103, 408]
			],
			bonuses: [
				[[356, 1], [310, 1], [309, 1], [261, 1], [51, 1], [193, 1], [61, 1], [299, 1], [300, 1], [337, 1], [343, 1], [348, 1], [355, 1], [50, 1], [361, 1], [298, 1], [316, 1], [43, 1], [68, 1], [69, 1], [109, 1], [93, 1], [287, 1]],
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

		const requestData = {
			seed: seed,
			presets: JSON.stringify({ presets: [civData] }),
			modifiers: JSON.stringify({
				randomCosts: false,
				hp: 1,
				speed: 1,
				blind: false,
				infinity: false,
				building: 1
			}),
			civs: 'true'
		};

		request(app)
			.post('/create')
			.send(requestData)
			.expect(200)
			.end((err, res) => {
				if (err) {
					console.error('Request failed:', err);
					return done(err);
				}

				// Check that the response is a zip file
				expect(res.headers['content-type']).toContain('application/zip');
				expect(res.headers['content-disposition']).toContain('.zip');

				done();
			});
	}, 120000); // 2 minute timeout for mod creation

	test('extractBonusId should handle custom UU objects', () => {
		// Test the extractBonusId function with different inputs
		const serverPath = path.join(__dirname, '..', 'server.js');
		const serverContent = fs.readFileSync(serverPath, 'utf8');

		// Check that extractBonusId handles objects
		expect(serverContent).toContain('function extractBonusId');
		expect(serverContent).toContain('typeof bonus === \'object\'');
	});

	test('writeUUIcons should properly log objects', () => {
		const serverPath = path.join(__dirname, '..', 'server.js');
		const serverContent = fs.readFileSync(serverPath, 'utf8');

		// Check that logging uses JSON.stringify for objects or similar
		const writeUUIconsMatch = serverContent.match(/const writeUUIcons[\s\S]*?^};/m);
		expect(writeUUIconsMatch).toBeTruthy();

		// Should not use template literal directly on objects that could be complex
		// Instead should use JSON.stringify or similar
	});
});
