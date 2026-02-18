const fs = require('fs');
const path = require('path');

/**
 * Test suite for custom UU disable flags
 * Tests DISABLE_CUSTOM_UU_BUILD and DISABLE_CUSTOM_UU_DRAFT environment variables
 */

describe('Custom UU Disable Flags', () => {
	describe('Environment variable configuration', () => {
		it('should define DISABLE_CUSTOM_UU_BUILD environment variable in server.js', () => {
			const serverPath = path.join(__dirname, '..', 'server.js');
			const serverContent = fs.readFileSync(serverPath, 'utf8');
			
			expect(serverContent).toContain('DISABLE_CUSTOM_UU_BUILD');
			expect(serverContent).toContain('disableCustomUUBuild');
		});

		it('should define DISABLE_CUSTOM_UU_DRAFT environment variable in server.js', () => {
			const serverPath = path.join(__dirname, '..', 'server.js');
			const serverContent = fs.readFileSync(serverPath, 'utf8');
			
			expect(serverContent).toContain('DISABLE_CUSTOM_UU_DRAFT');
			expect(serverContent).toContain('disableCustomUUDraft');
		});

		it('should have validateCustomUU middleware in server.js', () => {
			const serverPath = path.join(__dirname, '..', 'server.js');
			const serverContent = fs.readFileSync(serverPath, 'utf8');
			
			expect(serverContent).toContain('validateCustomUU');
			expect(serverContent).toContain('Custom Unique Units are disabled');
		});

		it('should apply validateCustomUU middleware to /create endpoint', () => {
			const serverPath = path.join(__dirname, '..', 'server.js');
			const serverContent = fs.readFileSync(serverPath, 'utf8');
			
			// Check that the middleware is in the /create route chain
			const createRouteMatch = serverContent.match(/router\.post\("\/create",\s*([^)]+)/);
			expect(createRouteMatch).toBeTruthy();
			expect(createRouteMatch[1]).toContain('validateCustomUU');
		});

		it('should enforce custom_uu_mode flag in draft creation', () => {
			const serverPath = path.join(__dirname, '..', 'server.js');
			const serverContent = fs.readFileSync(serverPath, 'utf8');
			
			// Check that custom_uu_mode is set based on disableCustomUUDraft
			expect(serverContent).toContain('preset["custom_uu_mode"] = disableCustomUUDraft ? false');
		});
	});

	describe('Frontend configuration', () => {
		it('should define NUXT_PUBLIC_DISABLE_CUSTOM_UU_BUILD in nuxt.config.ts', () => {
			const configPath = path.join(__dirname, '..', 'src', 'frontend', 'nuxt.config.ts');
			const configContent = fs.readFileSync(configPath, 'utf8');
			
			expect(configContent).toContain('NUXT_PUBLIC_DISABLE_CUSTOM_UU_BUILD');
			expect(configContent).toContain('disableCustomUUBuild');
		});

		it('should define NUXT_PUBLIC_DISABLE_CUSTOM_UU_DRAFT in nuxt.config.ts', () => {
			const configPath = path.join(__dirname, '..', 'src', 'frontend', 'nuxt.config.ts');
			const configContent = fs.readFileSync(configPath, 'utf8');
			
			expect(configContent).toContain('NUXT_PUBLIC_DISABLE_CUSTOM_UU_DRAFT');
			expect(configContent).toContain('disableCustomUUDraft');
		});

		it('should check isCustomUUDisabled in CivBuilder.vue', () => {
			const componentPath = path.join(__dirname, '..', 'src', 'frontend', 'app', 'components', 'CivBuilder.vue');
			const componentContent = fs.readFileSync(componentPath, 'utf8');
			
			expect(componentContent).toContain('isCustomUUDisabled');
			expect(componentContent).toContain('config.public.disableCustomUUBuild');
		});

		it('should conditionally hide custom UU toggle in CivBuilder.vue based on flag', () => {
			const componentPath = path.join(__dirname, '..', 'src', 'frontend', 'app', 'components', 'CivBuilder.vue');
			const componentContent = fs.readFileSync(componentPath, 'utf8');
			
			// Check that the toggle is conditionally rendered
			expect(componentContent).toContain('v-if="!isCustomUUDisabled"');
		});

		it('should check isCustomUUDisabled in draft create page', () => {
			const pagePath = path.join(__dirname, '..', 'src', 'frontend', 'app', 'pages', 'draft', 'create.vue');
			const pageContent = fs.readFileSync(pagePath, 'utf8');
			
			expect(pageContent).toContain('isCustomUUDisabled');
			expect(pageContent).toContain('config.public.disableCustomUUDraft');
		});

		it('should conditionally hide custom UU mode checkbox in draft create page', () => {
			const pagePath = path.join(__dirname, '..', 'src', 'frontend', 'app', 'pages', 'draft', 'create.vue');
			const pageContent = fs.readFileSync(pagePath, 'utf8');
			
			// Check that the checkbox is conditionally rendered
			expect(pageContent).toContain('v-if="!isCustomUUDisabled"');
		});
	});

	describe('validateCustomUU middleware logic', () => {
		it('should detect custom UU data by checking type property', () => {
			const serverPath = path.join(__dirname, '..', 'server.js');
			const serverContent = fs.readFileSync(serverPath, 'utf8');
			
			// Check that validation looks for type: 'custom'
			expect(serverContent).toContain("uuData.type === 'custom'");
		});

		it('should return 403 status when custom UU is detected and disabled', () => {
			const serverPath = path.join(__dirname, '..', 'server.js');
			const serverContent = fs.readFileSync(serverPath, 'utf8');
			
			// Check that 403 status is returned
			expect(serverContent).toContain('res.status(403)');
			expect(serverContent).toContain('Custom Unique Units are disabled');
		});
	});
});
