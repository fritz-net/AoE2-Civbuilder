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
        <label class="setting-label">
          <input type="checkbox" v-model="showPastures" />
          Show Pastures
        </label>
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
        :show-pastures="showPastures"
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
const showPastures = ref(false)

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
<p><em>Testing ${mode.value} mode</em></p>

<h3>Mode Information</h3>
<ul>
  <li><strong>Mode:</strong> ${mode.value === 'build' ? 'Build (unlimited)' : 'Draft (limited)'}</li>
  <li><strong>Points:</strong> ${currentPoints.value} ${pointsLabel.value.toLowerCase()}</li>
  <li><strong>Editable:</strong> ${editable.value ? 'Yes' : 'No'}</li>
</ul>

<hr>

<h3>Test Instructions</h3>
<ol>
  <li>Switch between Build and Draft modes</li>
  <li>Click on techs to enable/disable them</li>
  <li>Watch how points change in each mode</li>
  <li>Build mode: points increase from 0</li>
  <li>Draft mode: points decrease from limit</li>
</ol>
`)

// Methods
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

.info-box strong {
  color: #d4af37;
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
