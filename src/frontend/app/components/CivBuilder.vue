<template>
  <div class="civ-builder">
    <div class="civ-builder-header">
      <h1 class="civ-builder-title">{{ readOnly ? 'View Civilization' : 'Create Your Civilization' }}</h1>
    </div>
    
    <!-- Stepper Navigation -->
    <Stepper
      :steps="stepLabels"
      v-model:current-step="currentStep"
      :allow-navigation="!readOnly"
    />
    
    <!-- Step 1: Basic Info -->
    <div v-show="currentStep === 0" class="step-content">
      <div class="civ-builder-content">
        <!-- Left Column: Flag Creator -->
        <div class="builder-column flag-column">
          <FlagCreator
            v-model="civConfig.flag_palette"
            v-model:custom-flag="civConfig.customFlag"
            v-model:custom-flag-data="civConfig.customFlagData"
            :disabled="readOnly"
          />
          
          <!-- Civ Name Input -->
          <div class="civ-name-section">
            <label class="input-label" for="civName">Civilization Name</label>
            <input
              id="civName"
              v-model="civConfig.alias"
              type="text"
              class="civ-name-input"
              placeholder="Enter civilization name"
              maxlength="30"
              :readonly="readOnly"
            />
          </div>
          
          <!-- Description Input -->
          <div class="civ-description-section">
            <label class="input-label" for="civDescription">Civilization Type</label>
            <input
              id="civDescription"
              v-model="civConfig.description"
              type="text"
              class="civ-description-input"
              placeholder="e.g. Infantry"
              maxlength="30"
              :readonly="readOnly"
            />
          </div>
        </div>
        
        <!-- Right Column: Selectors -->
        <div class="builder-column selectors-column">
          <ArchitectureSelector v-model="civConfig.architecture" :disabled="readOnly" />
          
          <div class="advanced-toggle">
            <button class="toggle-btn" @click="showAdvanced = !showAdvanced">
              {{ showAdvanced ? 'Hide Advanced' : 'Show Advanced' }}
            </button>
          </div>
          
          <div v-if="showAdvanced" class="advanced-options">
            <LanguageSelector v-model="civConfig.language" :disabled="readOnly" />
            <WonderSelector v-model="civConfig.wonder" :disabled="readOnly" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Step 2: Civilization Bonuses -->
    <div v-show="currentStep === 1" class="step-content">
      <BonusSelectorGrid
        title="Civilization Bonuses"
        subtitle="Select up to 6 bonuses, each can be multiplied up to 255 times"
        bonus-type="civ"
        :bonuses="civBonuses"
        v-model="selectedCivBonuses"
        mode="multi"
        :max-unique-selections="bonusMaxSelections.civ.maxUniqueSelections"
        :max-total-selections="bonusMaxSelections.civ.maxTotalSelections"
        :disabled="readOnly"
        :allow-multiplier="true"
      />
    </div>
    
    <!-- Step 3: Unique Unit -->
    <div v-show="currentStep === 2" class="step-content">
      <BonusSelectorGrid
        title="Unique Unit"
        subtitle="Select one unique unit for your civilization"
        bonus-type="uu"
        :bonuses="uniqueUnits"
        v-model="selectedUniqueUnit"
        mode="single"
        :max-unique-selections="bonusMaxSelections.uu.maxUniqueSelections"
        :max-total-selections="bonusMaxSelections.uu.maxTotalSelections"
        :disabled="readOnly"
        :allow-multiplier="false"
      />
    </div>

    <!-- Step 4: Castle Age Tech -->
    <div v-show="currentStep === 3" class="step-content">
      <BonusSelectorGrid
        title="Castle Age Unique Tech"
        subtitle="Select one technology, can be multiplied up to 255 times"
        bonus-type="castle"
        :bonuses="castleTechs"
        v-model="selectedCastleTech"
        mode="single"
        :max-unique-selections="bonusMaxSelections.castle.maxUniqueSelections"
        :max-total-selections="bonusMaxSelections.castle.maxTotalSelections"
        :disabled="readOnly"
        :allow-multiplier="true"
      />
    </div>

    <!-- Step 5: Imperial Age Tech -->
    <div v-show="currentStep === 4" class="step-content">
      <BonusSelectorGrid
        title="Imperial Age Unique Tech"
        subtitle="Select one technology, can be multiplied up to 255 times"
        bonus-type="imp"
        :bonuses="impTechs"
        v-model="selectedImpTech"
        mode="single"
        :max-unique-selections="bonusMaxSelections.imp.maxUniqueSelections"
        :max-total-selections="bonusMaxSelections.imp.maxTotalSelections"
        :disabled="readOnly"
        :allow-multiplier="true"
      />
    </div>

    <!-- Step 6: Team Bonus -->
    <div v-show="currentStep === 5" class="step-content">
      <BonusSelectorGrid
        title="Team Bonus"
        subtitle="Select one bonus, can be multiplied up to 255 times"
        bonus-type="team"
        :bonuses="teamBonuses"
        v-model="selectedTeamBonus"
        mode="single"
        :max-unique-selections="bonusMaxSelections.team.maxUniqueSelections"
        :max-total-selections="bonusMaxSelections.team.maxTotalSelections"
        :disabled="readOnly"
        :allow-multiplier="true"
      />
    </div>

    <!-- Step 7: Tech Tree -->
    <div v-show="currentStep === 6" class="step-content techtree-step">
      <TechTree
        ref="techTreeRef"
        :initial-tree="techtreeData"
        :editable="!readOnly"
        :points="techtreePoints"
        :relative-path="techtreePath"
        :sidebar-content="sidebarContent"
        :sidebar-title="civConfig.alias || 'Custom Civilization'"
        :show-pastures="showPasturesInTechtree"
        @done="handleTechtreeDone"
        @update:tree="handleTechtreeUpdate"
        @update:points="handlePointsUpdate"
      />
    </div>

    <!-- Step 8: Review -->
    <div v-show="currentStep === 7" class="step-content">
      <div class="review-section">
        <h2 class="review-title">Review Your Civilization</h2>
        
        <div class="review-grid">
          <div class="review-item">
            <span class="review-label">Name:</span>
            <span class="review-value">{{ civConfig.alias || 'Not set' }}</span>
          </div>
          <div class="review-item">
            <span class="review-label">Type:</span>
            <span class="review-value">{{ civConfig.description || 'Not set' }}</span>
          </div>
          <div class="review-item">
            <span class="review-label">Architecture:</span>
            <span class="review-value">{{ architectures[civConfig.architecture - 1] }}</span>
          </div>
          <div class="review-item">
            <span class="review-label">Language:</span>
            <span class="review-value">{{ languages[civConfig.language] }}</span>
          </div>
          <div class="review-item">
            <span class="review-label">Wonder:</span>
            <span class="review-value">{{ wonders[civConfig.wonder] }}</span>
          </div>
          <div class="review-item">
            <span class="review-label">Civ Bonuses:</span>
            <span class="review-value">{{ selectedCivBonuses.length }} selected</span>
          </div>
          <div class="review-item">
            <span class="review-label">Unique Unit:</span>
            <span class="review-value">{{ selectedUniqueUnit.length > 0 ? getUniqueUnitName() : 'Not set' }}</span>
          </div>
          <div class="review-item">
            <span class="review-label">Castle Tech:</span>
            <span class="review-value">{{ selectedCastleTech.length > 0 ? 'Selected' : 'Not set' }}</span>
          </div>
          <div class="review-item">
            <span class="review-label">Imperial Tech:</span>
            <span class="review-value">{{ selectedImpTech.length > 0 ? 'Selected' : 'Not set' }}</span>
          </div>
          <div class="review-item">
            <span class="review-label">Team Bonus:</span>
            <span class="review-value">{{ selectedTeamBonus.length > 0 ? 'Selected' : 'Not set' }}</span>
          </div>
          <div class="review-item">
            <span class="review-label">Tech Tree Points:</span>
            <span class="review-value">{{ techtreePointsRemaining }} remaining</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Navigation Buttons -->
    <div class="civ-builder-actions">
      <div class="nav-buttons">
        <button 
          v-if="currentStep > 0"
          class="action-btn secondary-btn" 
          @click="previousStep"
        >
          ← Previous
        </button>
        
        <button 
          v-if="currentStep < stepLabels.length - 1"
          class="action-btn primary-btn" 
          @click="nextStep"
          :disabled="!canProceed"
        >
          Next →
        </button>
        
        <button 
          v-if="currentStep === stepLabels.length - 1 && !readOnly"
          class="action-btn primary-btn" 
          @click="handleFinish"
          :disabled="isLoading"
        >
          {{ nextButtonText }}
        </button>
      </div>
      
      <div class="secondary-actions">
        <!-- Load Config Button -->
        <label v-if="!readOnly" class="action-btn secondary-btn import-label">
          <span>📁 Load Config</span>
          <input 
            type="file" 
            accept=".json"
            @change="handleFileImport"
            ref="fileInput"
          />
        </label>
        <button class="action-btn secondary-btn" @click="handleDownload">
          Download Config
        </button>
        <button v-if="!readOnly" class="action-btn secondary-btn" @click="handleReset">
          Reset
        </button>
      </div>
      
      <!-- Autosave Toggle -->
      <div v-if="!readOnly" class="autosave-section">
        <label class="autosave-toggle">
          <input type="checkbox" v-model="autosaveEnabled" @change="handleAutosaveToggle" />
          <span class="autosave-label">💾 Autosave to browser</span>
        </label>
        <span v-if="autosaveEnabled && lastSaved" class="autosave-status">
          Last saved: {{ formatLastSaved() }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { createDefaultCiv, architectures, languages, wonders, type CivConfig } from '~/composables/useCivData'
import { getBonusCards, maxSelections as bonusMaxSelections } from '~/composables/useBonusData'
import { BONUS_INDEX } from '~/../../shared/bonusConstants'

const props = withDefaults(defineProps<{
  initialConfig?: Partial<CivConfig>
  nextButtonText?: string
  readOnly?: boolean
  isLoading?: boolean
}>(), {
  nextButtonText: 'Create Civilization',
  readOnly: false,
  isLoading: false
})

const emit = defineEmits<{
  (e: 'next', config: CivConfig): void
  (e: 'download', config: CivConfig): void
  (e: 'reset'): void
  (e: 'configLoaded', config: CivConfig): void
}>()

// Local storage keys and autosave config
const STORAGE_KEY = 'aoe2-civbuilder-config'
const AUTOSAVE_KEY = 'aoe2-civbuilder-autosave'

// Steps: Basic Info, Civ Bonuses, Unique Unit, Castle Tech, Imperial Tech, Team Bonus, Tech Tree, Review
const stepLabels = ['Basic Info', 'Civ Bonuses', 'Unique Unit', 'Castle Tech', 'Imperial Tech', 'Team Bonus', 'Tech Tree', 'Review']
const currentStep = ref(0)
const showAdvanced = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const autosaveEnabled = ref(false)
const lastSaved = ref<Date | null>(null)
const isRestoring = ref(true)  // Start as true to prevent autosave until initial restore/setup is complete
const techTreeRef = ref<any>(null)

// Tech tree state
const techtreePath = '/civbuilder/aoe2techtree'
const techtreePoints = ref(100)
const techtreePointsRemaining = ref(100)

const civConfig = reactive<CivConfig>({
  ...createDefaultCiv(),
  ...props.initialConfig
})

// Use computed getter/setter to sync techtreeData with civConfig.tree
const techtreeData = computed({
  get: () => civConfig.tree,
  set: (value: number[][]) => {
    civConfig.tree = value
  }
})

// Bonus sources from composable
const civBonuses = computed(() => getBonusCards('civ'))
const uniqueUnits = computed(() => getBonusCards('uu'))
const castleTechs = computed(() => getBonusCards('castle'))
const impTechs = computed(() => getBonusCards('imp'))
const teamBonuses = computed(() => getBonusCards('team'))

const selectedCivBonuses = ref<(number | [number, number])[]>([])
const selectedUniqueUnit = ref<(number | [number, number])[]>([])
const selectedCastleTech = ref<(number | [number, number])[]>([])
const selectedImpTech = ref<(number | [number, number])[]>([])
const selectedTeamBonus = ref<(number | [number, number])[]>([])

// Computed sidebar content for techtree
const sidebarContent = computed(() => {
  // Helper to extract ID from bonus entry (could be number or [id, multiplier] tuple)
  const getBonusId = (entry: number | [number, number]): number => {
    return Array.isArray(entry) ? entry[0] : entry
  }
  const getMultiplier = (entry: number | [number, number]): number => {
    return Array.isArray(entry) ? entry[1] : 1
  }

  const bonusList = selectedCivBonuses.value
    .map(entry => {
      const bonusId = getBonusId(entry)
      const multiplier = getMultiplier(entry)
      const bonus = civBonuses.value.find(b => b.id === bonusId)
      if (!bonus) return ''
      const multiplierSuffix = multiplier > 1 ? ` [x${multiplier}]` : ''
      return `<li>${bonus.name}${multiplierSuffix}</li>`
    })
    .join('')
  
  const teamBonusHtml = selectedTeamBonus.value
    .map(entry => {
      const bonusId = getBonusId(entry)
      const multiplier = getMultiplier(entry)
      const bonus = teamBonuses.value.find(b => b.id === bonusId)
      if (!bonus) return ''
      const multiplierSuffix = multiplier > 1 ? ` [x${multiplier}]` : ''
      return `<p>${bonus.name}${multiplierSuffix}</p>`
    })
    .join('')

  // Get unique unit name
  const uniqueUnitName = selectedUniqueUnit.value.length > 0
    ? (() => {
        const unitId = getBonusId(selectedUniqueUnit.value[0])
        const unit = uniqueUnits.value.find(u => u.id === unitId)
        return unit?.name || 'Unknown'
      })()
    : null

  // Get castle tech name
  const castleTechName = selectedCastleTech.value.length > 0
    ? (() => {
        const techId = getBonusId(selectedCastleTech.value[0])
        const tech = castleTechs.value.find(t => t.id === techId)
        return tech?.name || 'Unknown'
      })()
    : null

  // Get imperial tech name
  const impTechName = selectedImpTech.value.length > 0
    ? (() => {
        const techId = getBonusId(selectedImpTech.value[0])
        const tech = impTechs.value.find(t => t.id === techId)
        return tech?.name || 'Unknown'
      })()
    : null

  return `
<span>${civConfig.alias || 'Custom Civilization'}</span>
<p><em>${civConfig.description || 'Custom civilization'}</em></p>

<h3>Civilization Bonuses</h3>
<ul>
${bonusList || '<li>No bonuses selected</li>'}
</ul>

<hr>

<h3>Unique Unit</h3>
<p>${uniqueUnitName || 'No unique unit selected'}</p>

<hr>

<h3>Castle Age Tech</h3>
<p>${castleTechName || 'No castle tech selected'}</p>

<hr>

<h3>Imperial Age Tech</h3>
<p>${impTechName || 'No imperial tech selected'}</p>

<hr>

<h3>Team Bonus</h3>
${teamBonusHtml || '<p>No team bonus selected</p>'}
`
})

// CIV_BONUS_356_PASTURES_REPLACE_FARMS_AND_MILL_UPGRADES is "Pastures replace Farms and Mill upgrades"
// When this bonus is selected, we should show Pasture building and pasture techs instead of Farm and farm techs
const PASTURES_BONUS_ID = 356

const showPasturesInTechtree = computed(() => {
  // Check if bonus 356 is selected in civ bonuses
  return selectedCivBonuses.value.some(entry => {
    const bonusId = Array.isArray(entry) ? entry[0] : entry
    return bonusId === PASTURES_BONUS_ID
  })
})

const canProceed = computed(() => {
  if (currentStep.value === 0) {
    return civConfig.alias && civConfig.alias.length > 0
  }
  return true
})

// Helper function to get unique unit name for review
function getUniqueUnitName(): string {
  if (!selectedUniqueUnit.value || selectedUniqueUnit.value.length === 0) return 'Not set'
  const firstUnit = selectedUniqueUnit.value[0]
  if (!firstUnit) return 'Not set'
  const unitId = Array.isArray(firstUnit) 
    ? firstUnit[0] 
    : firstUnit
  if (unitId === undefined || unitId === null) return 'Not set'
  const units = uniqueUnits.value
  const unit = units.find(u => u.id === unitId)
  return unit?.name || 'Unknown'
}

function nextStep() {
  if (currentStep.value === 0 && !validateStep1()) return
  if (currentStep.value < stepLabels.length - 1) {
    currentStep.value++
  }
}

function previousStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function handleTechtreeDone(tree: number[][], points: number) {
  techtreeData.value = tree
  techtreePointsRemaining.value = points
  // Move to next step (currentStep is 4 for techtree, so next is 5 for review)
  nextStep()
}

function handleTechtreeUpdate(tree: number[][]) {
  techtreeData.value = tree
}

function handlePointsUpdate(points: number) {
  techtreePointsRemaining.value = points
}

function validateStep1(): boolean {
  if (!civConfig.alias) {
    alert('Please enter a civilization name')
    return false
  }
  
  const nameRGEX = /^[a-zA-Z0-9][a-zA-Z0-9 ]*$/
  if (!nameRGEX.test(civConfig.alias)) {
    alert('Please enter a valid civilization name (alphanumeric characters only)')
    return false
  }
  
  return true
}

function handleFileImport(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || !input.files[0]) return
  
  const file = input.files[0]
  const reader = new FileReader()
  
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const loadedConfig = JSON.parse(content) as Partial<CivConfig>
      
      // Merge loaded config with defaults
      Object.assign(civConfig, createDefaultCiv(), loadedConfig)
      
      // Restore bonus selections from loaded config
      restoreBonusSelections()
      
      // Reset to first step
      currentStep.value = 0
      
      emit('configLoaded', { ...civConfig })
    } catch (error) {
      console.error('Failed to load configuration:', error)
      const errorMessage = error instanceof SyntaxError 
        ? 'Invalid JSON format in the configuration file.'
        : 'Failed to load configuration file. Please ensure it is a valid JSON file.'
      alert(errorMessage)
    }
  }
  
  reader.readAsText(file)
  
  // Reset file input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

/**
 * Restore bonus selections from civConfig.bonuses
 * The legacy format stores bonuses with indices defined in BONUS_INDEX:
 * - CIV (0): civ bonuses - can be number or [id, multiplier]
 * - UNIQUE_UNIT (1): unique units - always plain number (not tuple)
 * - CASTLE_TECH (2): castle techs - can be number or [id, multiplier]
 * - IMPERIAL_TECH (3): imp techs - can be number or [id, multiplier]
 * - TEAM (4): team bonuses - can be number or [id, multiplier]
 */
function restoreBonusSelections() {
  if (civConfig.bonuses && Array.isArray(civConfig.bonuses)) {
    // Convert loaded bonuses to the expected format
    selectedCivBonuses.value = normalizeBonus(civConfig.bonuses[BONUS_INDEX.CIV])
    // Unique units are plain numbers in legacy format, but we normalize to [id, 1] internally
    selectedUniqueUnit.value = normalizeBonus(civConfig.bonuses[BONUS_INDEX.UNIQUE_UNIT])
    selectedCastleTech.value = normalizeBonus(civConfig.bonuses[BONUS_INDEX.CASTLE_TECH])
    selectedImpTech.value = normalizeBonus(civConfig.bonuses[BONUS_INDEX.IMPERIAL_TECH])
    selectedTeamBonus.value = normalizeBonus(civConfig.bonuses[BONUS_INDEX.TEAM])
  }
}

/**
 * Normalize bonus array to always be [id, multiplier] format
 * Legacy format might have just number (id) or [id, multiplier]
 */
function normalizeBonus(bonuses: (number | number[])[] | undefined): [number, number][] {
  if (!bonuses || !Array.isArray(bonuses)) return []
  
  return bonuses.map(bonus => {
    if (Array.isArray(bonus) && bonus.length >= 1) {
      // Already in [id, multiplier] format - use length check for safety
      const id = bonus[0]
      const multiplier = bonus.length >= 2 ? bonus[1] : 1
      return [id, multiplier || 1] as [number, number]
    }
    // Just a number (id), add default multiplier of 1
    return [bonus as number, 1] as [number, number]
  })
}

function updateBonusesInConfig() {
  // Update bonuses in config (matching legacy format order)
  // Use BONUS_INDEX constants for clarity
  civConfig.bonuses = [
    selectedCivBonuses.value,
    // Unique units should be stored as plain numbers in legacy format (not tuples)
    selectedUniqueUnit.value.map(entry => entry[0]), // Extract just the ID
    selectedCastleTech.value,
    selectedImpTech.value,
    selectedTeamBonus.value
  ]
}

function handleFinish() {
  updateBonusesInConfig()
  emit('next', { ...civConfig })
}

function handleDownload() {
  if (!civConfig.alias) {
    alert('Please enter a civilization name')
    return
  }
  
  updateBonusesInConfig()
  
  const dataStr = JSON.stringify(civConfig, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `${civConfig.alias}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  emit('download', { ...civConfig })
}

function handleReset() {
  const defaults = createDefaultCiv()
  Object.assign(civConfig, defaults)
  selectedCivBonuses.value = []
  selectedUniqueUnit.value = []
  selectedCastleTech.value = []
  selectedImpTech.value = []
  selectedTeamBonus.value = []
  techtreePointsRemaining.value = techtreePoints.value
  currentStep.value = 0
  
  // Clear local storage if autosave was enabled
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
  
  emit('reset')
}

// Autosave functions
function saveToLocalStorage() {
  // Don't save during restore or on server
  if (typeof window === 'undefined' || !autosaveEnabled.value || isRestoring.value) return
  
  updateBonusesInConfig()
  
  const saveData = {
    config: { ...civConfig },
    currentStep: currentStep.value,
    timestamp: new Date().toISOString()
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))
  lastSaved.value = new Date()
}

function loadFromLocalStorage(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  
  const savedData = localStorage.getItem(STORAGE_KEY)
  if (!savedData) return false
  
  try {
    const parsed = JSON.parse(savedData)
    if (parsed.config) {
      // Use Object.keys to iterate and assign properties individually
      // This ensures Vue's reactivity system properly tracks the changes
      const mergedConfig = { ...createDefaultCiv(), ...parsed.config }
      Object.keys(mergedConfig).forEach(key => {
        ;(civConfig as Record<string, unknown>)[key] = mergedConfig[key as keyof typeof mergedConfig]
      })
      
      restoreBonusSelections()
      if (parsed.currentStep !== undefined) {
        currentStep.value = parsed.currentStep
      }
      if (parsed.timestamp) {
        lastSaved.value = new Date(parsed.timestamp)
      }
      return true
    }
  } catch (e) {
    console.error('Failed to load saved config:', e)
  }
  return false
}

function handleAutosaveToggle() {
  if (typeof window === 'undefined') return
  
  localStorage.setItem(AUTOSAVE_KEY, autosaveEnabled.value ? 'true' : 'false')
  
  if (autosaveEnabled.value) {
    saveToLocalStorage()
  }
}

function formatLastSaved(): string {
  if (!lastSaved.value) return ''
  const now = new Date()
  const diff = now.getTime() - lastSaved.value.getTime()
  const seconds = Math.floor(diff / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return lastSaved.value.toLocaleTimeString()
}

// Debounced autosave to prevent performance issues
let autosaveTimeout: ReturnType<typeof setTimeout> | null = null
function debouncedSave() {
  // Don't save during restore
  if (isRestoring.value) return
  
  if (autosaveTimeout) {
    clearTimeout(autosaveTimeout)
  }
  autosaveTimeout = setTimeout(() => {
    saveToLocalStorage()
  }, 1000) // Debounce for 1 second
}

// Watch for changes and autosave
watch([civConfig, selectedCivBonuses, selectedUniqueUnit, selectedTeamBonus, currentStep], () => {
  if (autosaveEnabled.value) {
    debouncedSave()
  }
}, { deep: true })

// Handle page unload - save before leaving
function handleBeforeUnload() {
  if (autosaveEnabled.value) {
    saveToLocalStorage()
  }
}

// Watch for initial config changes
watch(() => props.initialConfig, (newConfig) => {
  if (newConfig) {
    Object.assign(civConfig, createDefaultCiv(), newConfig)
    // Restore bonus selections when config changes
    restoreBonusSelections()
  }
}, { deep: true })

// Lifecycle hooks
onMounted(() => {
  if (typeof window !== 'undefined') {
    // Load autosave preference (defaults to true if not set)
    const savedAutosave = localStorage.getItem(AUTOSAVE_KEY)
    autosaveEnabled.value = savedAutosave !== 'false'
    
    // Check if initialConfig has any meaningful properties (not just an empty object)
    const hasInitialConfig = props.initialConfig && Object.keys(props.initialConfig).length > 0
    
    // Try to restore from local storage if autosave is enabled and no initial config was provided
    if (autosaveEnabled.value && !hasInitialConfig) {
      nextTick(() => {
        loadFromLocalStorage()
        // Re-enable autosave after restore is complete, with a delay to ensure
        // any pending debounced saves from initialization have been processed
        setTimeout(() => {
          isRestoring.value = false
        }, 1100) // Just slightly longer than the 1000ms debounce
      })
    } else {
      // No restore needed, enable autosave after initial debounce period
      setTimeout(() => {
        isRestoring.value = false
      }, 1100)
    }
    
    // Add beforeunload listener
    window.addEventListener('beforeunload', handleBeforeUnload)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  }
  // Clear any pending autosave timeout
  if (autosaveTimeout) {
    clearTimeout(autosaveTimeout)
    autosaveTimeout = null
  }
})

// Expose civConfig for parent component access if needed
defineExpose({
  civConfig,
  handleFinish,
  handleDownload,
  handleReset
})
</script>

<style scoped>
.civ-builder {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.civ-builder-header {
  text-align: center;
  margin-bottom: 2rem;
}

.civ-builder-title {
  font-size: 2.5rem;
  color: hsl(52, 100%, 50%);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.civ-builder-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.builder-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.civ-name-section,
.civ-description-section {
  background: rgba(139, 69, 19, 0.75);
  border: 2px solid hsl(52, 100%, 50%);
  padding: 1rem;
  border-radius: 8px;
}

.input-label {
  display: block;
  color: hsl(52, 100%, 50%);
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  text-align: center;
}

.civ-name-input,
.civ-description-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1.1rem;
  font-family: 'Cinzel', serif;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  color: hsl(52, 100%, 50%);
  text-align: center;
  box-sizing: border-box;
}

.civ-name-input::placeholder,
.civ-description-input::placeholder {
  color: hsla(52, 100%, 50%, 0.5);
}

.civ-name-input:focus,
.civ-description-input:focus {
  outline: none;
  border-color: hsl(52, 100%, 60%);
  box-shadow: 0 0 8px hsla(52, 100%, 50%, 0.5);
}

.advanced-toggle {
  text-align: center;
}

.toggle-btn {
  padding: 0.5rem 1.5rem;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  color: hsl(52, 100%, 50%);
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: linear-gradient(to bottom, rgba(160, 82, 45, 0.95), rgba(139, 69, 19, 0.95));
  transform: translateY(-2px);
}

.advanced-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.civ-builder-actions {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.action-btn {
  padding: 1rem 2rem;
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid hsl(52, 100%, 50%);
}

.primary-btn {
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  color: hsl(52, 100%, 50%);
  min-width: 200px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
}

.primary-btn:hover {
  background: linear-gradient(to bottom, rgba(160, 82, 45, 0.95), rgba(139, 69, 19, 0.95));
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.6);
}

.secondary-actions {
  display: flex;
  gap: 1rem;
}

.secondary-btn {
  background: rgba(0, 0, 0, 0.5);
  color: hsl(52, 100%, 50%);
  font-size: 1rem;
  padding: 0.75rem 1.5rem;
}

.secondary-btn:hover {
  background: rgba(139, 69, 19, 0.6);
  transform: translateY(-2px);
}

@media (max-width: 900px) {
  .civ-builder-content {
    grid-template-columns: 1fr;
  }
  
  .civ-builder-title {
    font-size: 1.8rem;
  }
  
  .bonuses-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .secondary-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
  
  .nav-buttons {
    flex-direction: column;
    width: 100%;
  }
}

/* Import section */
.import-section {
  margin-top: 1rem;
}

.import-btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid hsl(52, 100%, 50%);
  color: hsl(52, 100%, 50%);
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.import-btn:hover {
  background: rgba(139, 69, 19, 0.6);
}

.import-btn input {
  display: none;
}

/* Step content */
.step-content {
  min-height: 400px;
}

.bonuses-layout {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.techtree-step {
  margin: -2rem -2rem 0;
  padding: 0;
  min-height: 100vh;
}

/* Bonuses grid */
.bonuses-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

/* Review section */
.review-section {
  background: rgba(139, 69, 19, 0.75);
  border: 2px solid hsl(52, 100%, 50%);
  padding: 2rem;
  border-radius: 8px;
  max-width: 600px;
  margin: 0 auto;
}

.review-title {
  color: hsl(52, 100%, 50%);
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
}

.review-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.review-label {
  color: hsla(52, 100%, 50%, 0.8);
  font-size: 0.95rem;
}

.review-value {
  color: hsl(52, 100%, 50%);
  font-size: 0.95rem;
  font-weight: bold;
}

/* Navigation buttons */
.nav-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Read-only styles */
.civ-name-input:read-only,
.civ-description-input:read-only {
  cursor: not-allowed;
  opacity: 0.8;
}

/* Import label styled as button */
.import-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.import-label input {
  display: none;
}

/* Autosave section */
.autosave-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  border: 1px solid hsla(52, 100%, 50%, 0.3);
}

.autosave-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: hsl(52, 100%, 50%);
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
}

.autosave-toggle input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: hsl(52, 100%, 50%);
  cursor: pointer;
}

.autosave-label {
  user-select: none;
}

.autosave-status {
  color: hsla(52, 100%, 50%, 0.7);
  font-size: 0.85rem;
  font-style: italic;
}
</style>
