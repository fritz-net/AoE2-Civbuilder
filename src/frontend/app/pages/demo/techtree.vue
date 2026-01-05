<template>
  <div class="techtree-demo">
    <!-- Settings Panel -->
    <div class="settings-panel">
      <h2>⚙️ Tech Tree Demo Settings</h2>
      
      <div class="setting-group">
        <label class="setting-label">Mode:</label>
        <div class="radio-group">
          <label class="radio-option">
            <input 
              type="radio" 
              v-model="mode" 
              value="build"
              @change="handleModeChange"
            />
            <span>Build Mode</span>
            <span class="mode-description">(Start at 0, count up, unlimited)</span>
          </label>
          <label class="radio-option">
            <input 
              type="radio" 
              v-model="mode" 
              value="draft"
              @change="handleModeChange"
            />
            <span>Draft Mode</span>
            <span class="mode-description">(Start at limit, count down)</span>
          </label>
        </div>
      </div>
      
      <div class="setting-group">
        <label class="setting-label" for="points-input">
          {{ mode === 'build' ? 'Initial Points (Build starts at 0):' : 'Point Limit:' }}
        </label>
        <input 
          id="points-input"
          type="number" 
          v-model.number="pointLimit" 
          min="0"
          max="10000"
          :disabled="mode === 'build'"
          class="number-input"
        />
        <span v-if="mode === 'build'" class="info-text">Build mode always starts at 0</span>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">
          <input type="checkbox" v-model="editable" />
          Editable
        </label>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">Test Bonuses:</label>
        <div class="bonus-checkboxes">
          <div v-for="group in testBonusesGrouped" :key="group.title" class="bonus-group">
            <h4 class="bonus-group-title">{{ group.title }}</h4>
            <label v-for="bonus in group.bonuses" :key="bonus.id" class="bonus-option">
              <input 
                type="checkbox" 
                :checked="selectedBonuses.civ.includes(bonus.id)"
                @change="toggleBonus(bonus.id)"
              />
              <span>{{ bonus.name }}</span>
            </label>
          </div>
        </div>
      </div>
      
      <button @click="resetTree" class="reset-button">🔄 Reset Tree</button>
      
      <div class="info-box">
        <h3>Current State:</h3>
        <ul>
          <li><strong>Mode:</strong> {{ mode }}</li>
          <li><strong>Points:</strong> {{ currentPoints }}</li>
          <li><strong>Label:</strong> {{ pointsLabel }}</li>
          <li><strong>Techs Enabled:</strong> {{ enabledTechCount }}</li>
        </ul>
      </div>
    </div>
    
    <!-- Tech Tree Component -->
    <div class="techtree-container">
      <TechTree
        ref="techTreeRef"
        :key="treeKey"
        :initial-tree="currentTree"
        :editable="editable"
        :points="initialPoints"
        :mode="mode"
        :relative-path="relativePath"
        :sidebar-content="sidebarContent"
        :sidebar-title="sidebarTitle"
        :selected-bonuses="selectedBonuses"
        @done="handleDone"
        @update:tree="handleTreeUpdate"
        @update:points="handlePointsUpdate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const config = useRuntimeConfig()
const techTreeRef = ref<any>(null)
const treeKey = ref(0) // Key to force re-render when needed

// Settings
const mode = ref<'build' | 'draft'>('build')
const pointLimit = ref(250)
const editable = ref(true)

// Selected bonuses for testing
const selectedBonuses = ref<{
  civ: number[]
  uu: number[]
  castle: number[]
  imp: number[]
  team: number[]
}>({
  civ: [],
  uu: [],
  castle: [],
  imp: [],
  team: [],
})

// Test bonuses - grouped by type for easier navigation
const testBonusesGrouped = [
  {
    title: 'Can recruit units',
    bonuses: [
      { id: 51, name: 'Can recruit Longboats' },
      { id: 61, name: 'Can recruit Slingers' },
      { id: 193, name: 'Can recruit Warrior Priests' },
      { id: 299, name: 'Can recruit Shrivamsha Riders' },
      { id: 300, name: 'Can recruit Camel Scouts' },
      { id: 337, name: 'Can recruit War Chariots' },
      { id: 343, name: 'Can recruit Jian Swordsmen' },
      { id: 348, name: 'Can recruit Xianbei Raiders' },
      { id: 355, name: 'Can recruit Grenadiers' },
      { id: 142, name: 'Can recruit Missionaries' },
    ]
  },
  {
    title: 'Can train units',
    bonuses: [
      { id: 50, name: 'Can train Turtle Ships' },
      { id: 298, name: 'Can train Thirisadai' },
      { id: 361, name: 'Can train Mounted Trebuchets' },
    ]
  },
  {
    title: 'Can upgrade to units',
    bonuses: [
      { id: 53, name: 'Can upgrade to Imperial Camel Riders' },
      { id: 286, name: 'Can upgrade to Houfnice' },
      { id: 309, name: 'Can upgrade to Royal Battle Elephants' },
      { id: 310, name: 'Can upgrade to Royal Lancers' },
    ]
  },
  {
    title: 'Replacement units',
    bonuses: [
      { id: 282, name: 'Winged Hussar replaces Hussar' },
      { id: 307, name: 'Legionary replaces Two-Handed Swordsman' },
      { id: 314, name: 'Savar replaces Paladin' },
    ]
  },
  {
    title: 'Replacement buildings',
    bonuses: [
      { id: 280, name: 'Folwark replaces Mill' },
      { id: 316, name: 'Fortified Church replaces Monastery' },
    ]
  },
  {
    title: 'Other',
    bonuses: [
      { id: 356, name: 'Pastures' },
      { id: 68, name: 'Can build Feitoria' },
      { id: 69, name: 'Can build Caravels' },
      { id: 93, name: 'Can build Krepost' },
      { id: 109, name: 'Can build Donjon' },
    ]
  },
]

// State
const currentPoints = ref(0)
const currentTree = ref<number[][]>([
  [13, 17, 21, 74, 545, 539, 331, 125, 83, 128, 440],
  [12, 45, 49, 50, 68, 70, 72, 79, 82, 84, 87, 101, 103, 104, 109, 199, 209, 276, 562, 584, 598, 621, 792],
  [22, 101, 102, 103, 408],
])

// Computed
const relativePath = computed(() => {
  const baseURL = config.app.baseURL || '/v2/'
  const parentPath = baseURL.replace(/\/v2\/?$/, '') || '/'
  return parentPath.replace(/\/$/, '') + '/aoe2techtree'
})

const initialPoints = computed(() => {
  return mode.value === 'build' ? 0 : pointLimit.value
})

const pointsLabel = computed(() => {
  if (mode.value === 'build') {
    return 'Points Spent'
  }
  return editable.value ? 'Points Remaining' : 'Points Spent'
})

const enabledTechCount = computed(() => {
  return currentTree.value.reduce((sum, arr) => sum + arr.length, 0)
})

const sidebarTitle = 'Tech Tree Demo'

const sidebarContent = computed(() => `
<span>Demo Civilization</span>
<p><em>Testing ${mode.value} mode with bonus-granted units</em></p>

<h3>Mode Information</h3>
<ul>
  <li><strong>Mode:</strong> ${mode.value === 'build' ? 'Build (unlimited)' : 'Draft (limited)'}</li>
  <li><strong>Points:</strong> ${currentPoints.value} ${pointsLabel.value.toLowerCase()}</li>
  <li><strong>Editable:</strong> ${editable.value ? 'Yes' : 'No'}</li>
  <li><strong>Selected Bonuses:</strong> ${selectedBonuses.value.civ.length}</li>
</ul>

<hr>

<h3>Test Instructions</h3>
<ol>
  <li>Select bonuses from the sidebar</li>
  <li>Granted units/techs will auto-enable with <strong>0 cost</strong></li>
  <li>For example, select "Can recruit Slingers" to see Slingers enabled for free</li>
  <li>Switch between Build and Draft modes</li>
  <li>Notice how granted units don't consume points</li>
</ol>
`)

// Methods
function toggleBonus(bonusId: number) {
  const index = selectedBonuses.value.civ.indexOf(bonusId)
  if (index === -1) {
    selectedBonuses.value.civ.push(bonusId)
  } else {
    selectedBonuses.value.civ.splice(index, 1)
  }
  // Force re-render to apply changes
  treeKey.value++
}

function handleModeChange() {
  // Reset points when mode changes
  currentPoints.value = initialPoints.value
  treeKey.value++ // Force re-render with new mode
}

function handleDone(tree: number[][], points: number) {
  console.log('Tech tree completed:', { mode: mode.value, tree, points })
  alert(`Tech tree completed!\nMode: ${mode.value}\nPoints: ${points}\nTechs: ${enabledTechCount.value}`)
}

function handleTreeUpdate(tree: number[][]) {
  currentTree.value = tree
  console.log('Tree updated:', tree)
}

function handlePointsUpdate(points: number) {
  currentPoints.value = points
  console.log('Points updated:', { mode: mode.value, points })
}

function resetTree() {
  currentTree.value = [
    [13, 17, 21, 74, 545, 539, 331, 125, 83, 128, 440],
    [12, 45, 49, 50, 68, 70, 72, 79, 82, 84, 87, 101, 103, 104, 109, 199, 209, 276, 562, 584, 598, 621, 792],
    [22, 101, 102, 103, 408],
  ]
  currentPoints.value = initialPoints.value
  treeKey.value++
}

// Watch for point limit changes in draft mode
watch(pointLimit, (newLimit) => {
  if (mode.value === 'draft') {
    treeKey.value++
  }
})
</script>

<style scoped>
.techtree-demo {
  display: flex;
  gap: 1rem;
  min-height: 100vh;
  background: #2a2a2a;
}

.settings-panel {
  width: 350px;
  background: linear-gradient(135deg, #3a3a3a 0%, #2a2a2a 100%);
  border-right: 3px solid #d4af37;
  padding: 1.5rem;
  overflow-y: auto;
  flex-shrink: 0;
}

.settings-panel h2 {
  color: #d4af37;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.setting-group {
  margin-bottom: 1.5rem;
}

.setting-label {
  display: block;
  color: #e0e0e0;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.radio-option {
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  background: #1a1a1a;
  border: 2px solid #4a4a4a;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.radio-option:hover {
  border-color: #d4af37;
  background: #252525;
}

.radio-option input[type="radio"] {
  margin-right: 0.5rem;
}

.radio-option span:first-of-type {
  color: #e0e0e0;
  font-weight: 600;
}

.mode-description {
  font-size: 0.85rem;
  color: #999;
  margin-left: 1.5rem;
  margin-top: 0.25rem;
}

.number-input {
  width: 100%;
  padding: 0.5rem;
  border: 2px solid #4a4a4a;
  border-radius: 6px;
  background: #1a1a1a;
  color: #e0e0e0;
  font-size: 1rem;
}

.number-input:focus {
  outline: none;
  border-color: #d4af37;
}

.number-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.info-text {
  display: block;
  font-size: 0.85rem;
  color: #999;
  margin-top: 0.5rem;
  font-style: italic;
}

.reset-button {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
  border: none;
  border-radius: 8px;
  color: #1a1a1a;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1.5rem;
}

.reset-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(212, 175, 55, 0.4);
}

.reset-button:active {
  transform: translateY(0);
}

.info-box {
  background: #1a1a1a;
  border: 2px solid #d4af37;
  border-radius: 8px;
  padding: 1rem;
}

.info-box h3 {
  color: #d4af37;
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
}

.info-box ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-box li {
  color: #e0e0e0;
  padding: 0.4rem 0;
  border-bottom: 1px solid #3a3a3a;
  font-size: 0.9rem;
}

.info-box li:last-child {
  border-bottom: none;
}

.bonus-group {
  margin-bottom: 1rem;
}

.bonus-group-title {
  color: #d4af37;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid #3a3a3a;
}

.bonus-group:last-child {
  margin-bottom: 0;
}

.info-box strong {
  color: #d4af37;
}

.bonus-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #1a1a1a;
  border: 2px solid #4a4a4a;
  border-radius: 6px;
}

.bonus-option {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #252525;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.bonus-option:hover {
  background: #2a2a2a;
}

.bonus-option input[type="checkbox"] {
  margin-top: 0.2rem;
  cursor: pointer;
}

.bonus-option span {
  color: #e0e0e0;
  font-size: 0.85rem;
  line-height: 1.3;
}

.techtree-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* Responsive design */
@media (max-width: 1024px) {
  .techtree-demo {
    flex-direction: column;
  }
  
  .settings-panel {
    width: 100%;
    border-right: none;
    border-bottom: 3px solid #d4af37;
  }
}
</style>
