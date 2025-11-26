<template>
  <div class="updates-page">
    <h1 class="page-title">Update Log</h1>
    
    <div class="content-wrapper">
      <div class="changelog-content" v-if="changelogHtml">
        <div v-html="changelogHtml"></div>
      </div>
      <div v-else-if="loading" class="loading">
        Loading changelog...
      </div>
      <div v-else class="error">
        Failed to load changelog. Please try again later.
      </div>
      
      <div class="back-button-wrapper">
        <NuxtLink to="/" class="back-button">Back to Home</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const changelogHtml = ref('')
const loading = ref(true)
const error = ref(false)

// Internal sections to ignore
const IGNORED_SECTIONS = ['Reverts', 'Performance Improvements', 'Code Refactoring', 'Documentation', 'Styles', 'Tests', 'Build System', 'Continuous Integration', 'Chores']

// Helper function to compare semantic versions
function compareVersion(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(p => parseInt(p, 10))
  const parts2 = v2.split('.').map(p => parseInt(p, 10))
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0
    const p2 = parts2[i] || 0
    
    if (p1 > p2) return 1
    if (p1 < p2) return -1
  }
  
  return 0
}

// Helper function to parse changelog markdown and convert to HTML
function parseChangelogMarkdown(markdown: string): string {
  // Matches both: ## [version](link) (YYYY-MM-DD) and ## [version] (YYYY-MM-DD)
  const VERSION_PATTERN = /^## \[([^\]]+)\](?:\([^)]+\))? \((\d{4}-\d{2}-\d{2})\)/
  const VERSION_PATTERN_UNRELEASED = /^## \[Unreleased\]/i
  const SECTION_PATTERN = /^### (.+)/
  const BULLET_PATTERN = /^[-*] /
  const SKIP_PATTERNS = [
    /^# Changelog/,
    /^All notable changes/,
    /^The format is based on/
  ]
  
  const lines = markdown.split('\n')
  let html = ''
  let inList = false
  let currentSection = ''
  let skipSection = false
  let inUnreleased = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Skip empty lines
    if (line === '') {
      continue
    }
    
    // Skip header and preamble lines
    if (SKIP_PATTERNS.some(pattern => pattern.test(line))) {
      continue
    }
    
    // Check for Unreleased section
    if (VERSION_PATTERN_UNRELEASED.test(line)) {
      inUnreleased = true
      continue
    }
    
    // Match version headers: ## [version](link) (YYYY-MM-DD) or ## [version] (YYYY-MM-DD)
    const versionMatch = line.match(VERSION_PATTERN)
    
    if (versionMatch) {
      inUnreleased = false
      if (inList) {
        html += '<br>'
        inList = false
      }
      const version = versionMatch[1]
      const date = versionMatch[2]
      
      // Reset section state
      currentSection = ''
      skipSection = false
      
      // Compare version to 0.1.0 to determine if we should add a GitHub release link
      const shouldLink = compareVersion(version, '0.1.0') > 0
      
      if (shouldLink) {
        html += `<div class="version-header"><span class="version-date">${date}</span> - <a href="https://github.com/fritz-net/AoE2-Civbuilder/releases/tag/v${version}" target="_blank" rel="noopener noreferrer" class="version-link">v${version}</a></div>`
      } else {
        html += `<div class="version-header"><span class="version-date">${date}</span> - <span class="version-number">v${version}</span></div>`
      }
      continue
    }
    
    // Skip content in Unreleased section
    if (inUnreleased) {
      continue
    }
    
    // Match section headers like ### Added, ### Fixed
    const sectionMatch = line.match(SECTION_PATTERN)
    if (sectionMatch) {
      currentSection = sectionMatch[1]
      skipSection = IGNORED_SECTIONS.some(s => currentSection.toLowerCase().includes(s.toLowerCase()))
      
      if (!skipSection) {
        if (inList) {
          html += '<br>'
          inList = false
        }
        html += `<div class="section-header">${currentSection}</div>`
      }
      continue
    }
    
    // Skip bullets in ignored sections
    if (skipSection) {
      continue
    }
    
    // Match bullet points
    if (BULLET_PATTERN.test(line)) {
      let content = line.substring(2).trim()
      // Replace markdown links with HTML links
      content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="changelog-link">$1</a>')
      html += `<div class="changelog-item">• ${content}</div>`
      inList = true
      continue
    }
  }
  
  return html
}

onMounted(async () => {
  try {
    const response = await fetch('/civbuilder/CHANGELOG.md')
    if (!response.ok) {
      throw new Error('Failed to load changelog')
    }
    const markdownText = await response.text()
    changelogHtml.value = parseChangelogMarkdown(markdownText)
    loading.value = false
  } catch (err) {
    console.error('Error loading changelog:', err)
    error.value = true
    loading.value = false
  }
})
</script>

<style scoped>
.updates-page {
  padding: 2rem;
  padding-bottom: 4rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
}

.page-title {
  font-size: clamp(2rem, 5vw, 3rem);
  color: hsl(52, 100%, 50%);
  text-align: center;
  margin-bottom: 2rem;
  text-shadow: 3px 3px 5px black;
  font-family: 'Cinzel', serif;
}

.content-wrapper {
  background: rgba(0, 0, 0, 0.8);
  border: 3px solid hsl(52, 100%, 50%);
  border-radius: 8px;
  padding: 2rem;
}

.changelog-content {
  color: #ffffff;
  font-size: 1.1rem;
  line-height: 1.6;
}

.changelog-content :deep(.version-header) {
  color: hsl(52, 100%, 50%);
  font-size: 1.3rem;
  font-weight: bold;
  margin-top: 2rem;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid hsl(52, 100%, 50%, 0.3);
}

.changelog-content :deep(.version-header:first-child) {
  margin-top: 0;
}

.changelog-content :deep(.version-date) {
  color: hsl(52, 100%, 60%);
}

.changelog-content :deep(.version-link),
.changelog-content :deep(.version-number) {
  color: hsl(52, 100%, 50%);
}

.changelog-content :deep(.version-link) {
  text-decoration: none;
  transition: color 0.2s ease;
}

.changelog-content :deep(.version-link:hover) {
  color: hsl(52, 100%, 70%);
  text-decoration: underline;
}

.changelog-content :deep(.section-header) {
  color: hsl(52, 100%, 70%);
  font-size: 1.1rem;
  font-weight: bold;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  padding-left: 0.5rem;
}

.changelog-content :deep(.changelog-item) {
  margin-left: 1.5rem;
  margin-bottom: 0.3rem;
}

.changelog-content :deep(.changelog-link) {
  color: hsl(52, 100%, 60%);
  text-decoration: none;
  transition: color 0.2s ease;
}

.changelog-content :deep(.changelog-link:hover) {
  color: hsl(52, 100%, 70%);
  text-decoration: underline;
}

.loading,
.error {
  color: #ffffff;
  font-size: 1.2rem;
  text-align: center;
  padding: 2rem;
}

.error {
  color: #ff6b6b;
}

.back-button-wrapper {
  margin-top: 2rem;
  text-align: center;
}

.back-button {
  padding: 1rem 2rem;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.85), rgba(101, 67, 33, 0.85));
  color: hsl(52, 100%, 50%);
  border: 3px solid hsl(52, 100%, 50%);
  border-radius: 6px;
  font-size: 1.1rem;
  font-family: 'Cinzel', serif;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: linear-gradient(to bottom, rgba(160, 82, 45, 0.95), rgba(139, 69, 19, 0.95));
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.6);
}

@media (max-width: 768px) {
  .updates-page {
    padding: 1rem;
    padding-bottom: 3rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .changelog-content {
    font-size: 1rem;
  }
}
</style>
