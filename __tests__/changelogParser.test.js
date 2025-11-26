/**
 * Tests for changelog parser functions
 */

describe('Changelog Parser', () => {
  // Helper function to compare semantic versions
  function compareVersion(v1, v2) {
    const parts1 = v1.split('.').map(p => parseInt(p, 10));
    const parts2 = v2.split('.').map(p => parseInt(p, 10));
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    
    return 0;
  }

  // Legacy UI parser (from public/js/client.js)
  function parseChangelogMarkdownLegacy(markdown) {
    // Matches both: ## [version](link) (YYYY-MM-DD) and ## [version] (YYYY-MM-DD)
    const VERSION_PATTERN = /^## \[([^\]]+)\](?:\([^)]+\))? \((\d{4}-\d{2}-\d{2})\)/;
    const VERSION_PATTERN_UNRELEASED = /^## \[Unreleased\]/i;
    const SECTION_PATTERN = /^### /;
    const BULLET_PATTERN = /^- /;
    const SKIP_PATTERNS = [
      /^# Changelog/,
      /^All notable changes/,
      /^The format is based on/
    ];
    
    const lines = markdown.split('\n');
    let html = '';
    let inList = false;
    let inUnreleased = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === '') {
        continue;
      }
      
      if (SKIP_PATTERNS.some(pattern => pattern.test(line))) {
        continue;
      }
      
      if (VERSION_PATTERN_UNRELEASED.test(line)) {
        inUnreleased = true;
        continue;
      }
      
      const versionMatch = line.match(VERSION_PATTERN);
      
      if (versionMatch) {
        inUnreleased = false;
        if (inList) {
          html += '<br>';
          inList = false;
        }
        const version = versionMatch[1];
        const date = versionMatch[2];
        
        const shouldLink = compareVersion(version, '0.1.0') > 0;
        
        if (shouldLink) {
          html += `<b>${date} - <a href="https://github.com/fritz-net/AoE2-Civbuilder/releases/tag/v${version}" target="_blank" rel="noopener noreferrer">v${version}</a></b><br>`;
        } else {
          html += `<b>${date} - v${version}</b><br>`;
        }
        continue;
      }
      
      if (inUnreleased) {
        continue;
      }
      
      if (SECTION_PATTERN.test(line)) {
        continue;
      }
      
      if (BULLET_PATTERN.test(line)) {
        const content = line.substring(2);
        html += `&emsp;&emsp;• ${content}<br>`;
        inList = true;
        continue;
      }
    }
    
    return html;
  }

  // Vue UI parser (from src/frontend/app/pages/updates.vue)
  function parseChangelogMarkdownVue(markdown) {
    // Matches both: ## [version](link) (YYYY-MM-DD) and ## [version] (YYYY-MM-DD)
    const VERSION_PATTERN = /^## \[([^\]]+)\](?:\([^)]+\))? \((\d{4}-\d{2}-\d{2})\)/;
    const VERSION_PATTERN_UNRELEASED = /^## \[Unreleased\]/i;
    const SECTION_PATTERN = /^### (.+)/;
    const BULLET_PATTERN = /^[-*] /;
    const SKIP_PATTERNS = [
      /^# Changelog/,
      /^All notable changes/,
      /^The format is based on/
    ];
    
    const IGNORED_SECTIONS = ['Reverts', 'Performance Improvements', 'Code Refactoring', 'Documentation', 'Styles', 'Tests', 'Build System', 'Continuous Integration', 'Chores'];
    
    const lines = markdown.split('\n');
    let html = '';
    let inList = false;
    let currentSection = '';
    let skipSection = false;
    let inUnreleased = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === '') {
        continue;
      }
      
      if (SKIP_PATTERNS.some(pattern => pattern.test(line))) {
        continue;
      }
      
      if (VERSION_PATTERN_UNRELEASED.test(line)) {
        inUnreleased = true;
        continue;
      }
      
      const versionMatch = line.match(VERSION_PATTERN);
      
      if (versionMatch) {
        inUnreleased = false;
        if (inList) {
          html += '<br>';
          inList = false;
        }
        const version = versionMatch[1];
        const date = versionMatch[2];
        
        currentSection = '';
        skipSection = false;
        
        const shouldLink = compareVersion(version, '0.1.0') > 0;
        
        if (shouldLink) {
          html += `<div class="version-header"><span class="version-date">${date}</span> - <a href="https://github.com/fritz-net/AoE2-Civbuilder/releases/tag/v${version}" target="_blank" rel="noopener noreferrer" class="version-link">v${version}</a></div>`;
        } else {
          html += `<div class="version-header"><span class="version-date">${date}</span> - <span class="version-number">v${version}</span></div>`;
        }
        continue;
      }
      
      if (inUnreleased) {
        continue;
      }
      
      const sectionMatch = line.match(SECTION_PATTERN);
      if (sectionMatch) {
        currentSection = sectionMatch[1];
        skipSection = IGNORED_SECTIONS.some(s => currentSection.toLowerCase().includes(s.toLowerCase()));
        
        if (!skipSection) {
          if (inList) {
            html += '<br>';
            inList = false;
          }
          html += `<div class="section-header">${currentSection}</div>`;
        }
        continue;
      }
      
      if (skipSection) {
        continue;
      }
      
      if (BULLET_PATTERN.test(line)) {
        let content = line.substring(2).trim();
        content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="changelog-link">$1</a>');
        html += `<div class="changelog-item">• ${content}</div>`;
        inList = true;
        continue;
      }
    }
    
    return html;
  }

  describe('compareVersion', () => {
    test('compares versions correctly', () => {
      expect(compareVersion('1.3.0', '0.1.0')).toBe(1);
      expect(compareVersion('0.1.0', '1.3.0')).toBe(-1);
      expect(compareVersion('1.2.1', '1.2.1')).toBe(0);
      expect(compareVersion('1.2.0', '1.2.1')).toBe(-1);
    });
  });

  describe('Legacy UI Parser', () => {
    test('parses new release-please format', () => {
      const markdown = `## [1.3.0](https://github.com/fritz-net/AoE2-Civbuilder/compare/v1.2.1...v1.3.0) (2025-11-26)

### Features

- new UI feature ([#88](https://github.com/fritz-net/AoE2-Civbuilder/issues/88)) ([86278a8](https://github.com/fritz-net/AoE2-Civbuilder/commit/86278a8))`;
      
      const result = parseChangelogMarkdownLegacy(markdown);
      
      expect(result).toContain('2025-11-26');
      expect(result).toContain('v1.3.0');
      expect(result).toContain('new UI feature');
    });

    test('parses old format', () => {
      const markdown = `## [0.1.0] (2025-05-02)

### Added
- Updated website with 3K DLC content`;
      
      const result = parseChangelogMarkdownLegacy(markdown);
      
      expect(result).toContain('2025-05-02');
      expect(result).toContain('v0.1.0');
      expect(result).toContain('Updated website with 3K DLC content');
    });

    test('skips Unreleased versions', () => {
      const markdown = `## [Unreleased]

### Added
- Something new

## [1.0.0] (2024-01-01)

### Added
- Released feature`;
      
      const result = parseChangelogMarkdownLegacy(markdown);
      
      expect(result).not.toContain('Unreleased');
      expect(result).not.toContain('Something new');
      expect(result).toContain('v1.0.0');
      expect(result).toContain('Released feature');
    });
  });

  describe('Vue UI Parser', () => {
    test('parses new release-please format', () => {
      const markdown = `## [1.3.0](https://github.com/fritz-net/AoE2-Civbuilder/compare/v1.2.1...v1.3.0) (2025-11-26)

### Features

* new UI feature ([#88](https://github.com/fritz-net/AoE2-Civbuilder/issues/88))`;
      
      const result = parseChangelogMarkdownVue(markdown);
      
      expect(result).toContain('2025-11-26');
      expect(result).toContain('v1.3.0');
      expect(result).toContain('new UI feature');
      expect(result).toContain('version-header');
    });

    test('parses old format', () => {
      const markdown = `## [0.1.0] (2025-05-02)

### Added
- Updated website with 3K DLC content`;
      
      const result = parseChangelogMarkdownVue(markdown);
      
      expect(result).toContain('2025-05-02');
      expect(result).toContain('v0.1.0');
      expect(result).toContain('Updated website with 3K DLC content');
    });

    test('skips Unreleased versions', () => {
      const markdown = `## [Unreleased]

### Added
- Something new

## [1.0.0] (2024-01-01)

### Added
- Released feature`;
      
      const result = parseChangelogMarkdownVue(markdown);
      
      expect(result).not.toContain('Unreleased');
      expect(result).not.toContain('Something new');
      expect(result).toContain('v1.0.0');
      expect(result).toContain('Released feature');
    });
  });
});
