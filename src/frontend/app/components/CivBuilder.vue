<template>
  <div class="civ-builder">
    <div class="civ-builder-header">
      <h1 class="civ-builder-title">{{ readOnly ? 'View Civilization' : 'Create Your Civilization' }}</h1>
      
      <!-- File Import Button -->
      <div v-if="!readOnly" class="import-section">
        <label class="import-btn">
          <span>📁 Load Config</span>
          <input 
            type="file" 
            accept=".json"
            @change="handleFileImport"
            ref="fileInput"
          />
        </label>
      </div>
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
    
    <!-- Step 2: Bonuses -->
    <div v-show="currentStep === 1" class="step-content">
      <div class="bonuses-layout">
        <BonusSelectorGrid
          title="Civilization Bonuses"
          subtitle="Select up to 6 bonuses for your civilization"
          bonus-type="civ"
          :bonuses="civBonuses"
          v-model="selectedCivBonuses"
          mode="multi"
          :max-selections="bonusMaxSelections.civ"
          :disabled="readOnly"
          :allow-multiplier="true"
        />
        
        <BonusSelectorGrid
          title="Team Bonus"
          subtitle="Select one team bonus"
          bonus-type="team"
          :bonuses="teamBonuses"
          v-model="selectedTeamBonus"
          mode="single"
          :max-selections="bonusMaxSelections.team"
          :disabled="readOnly"
          :allow-multiplier="true"
        />
      </div>
    </div>
    
    <!-- Step 3: Review -->
    <div v-show="currentStep === 2" class="step-content">
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
            <span class="review-label">Team Bonus:</span>
            <span class="review-value">{{ selectedTeamBonus.length > 0 ? 'Selected' : 'Not set' }}</span>
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
        >
          {{ nextButtonText }}
        </button>
      </div>
      
      <div class="secondary-actions">
        <button class="action-btn secondary-btn" @click="handleDownload">
          Download Config
        </button>
        <button v-if="!readOnly" class="action-btn secondary-btn" @click="handleReset">
          Reset
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { createDefaultCiv, architectures, languages, wonders, type CivConfig } from '~/composables/useCivData'
import { getBonusCards, maxSelections as bonusMaxSelections } from '~/composables/useBonusData'

const props = withDefaults(defineProps<{
  initialConfig?: Partial<CivConfig>
  nextButtonText?: string
  readOnly?: boolean
}>(), {
  nextButtonText: 'Create Civilization',
  readOnly: false
})

const emit = defineEmits<{
  (e: 'next', config: CivConfig): void
  (e: 'download', config: CivConfig): void
  (e: 'reset'): void
  (e: 'configLoaded', config: CivConfig): void
}>()

const stepLabels = ['Basic Info', 'Bonuses', 'Review']
const currentStep = ref(0)
const showAdvanced = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const civConfig = reactive<CivConfig>({
  ...createDefaultCiv(),
  ...props.initialConfig
})

// Get bonus cards from the composable
const civBonuses = computed(() => getBonusCards('civ'))
const teamBonuses = computed(() => getBonusCards('team'))

const selectedCivBonuses = ref<(number | [number, number])[]>([])
const selectedTeamBonus = ref<(number | [number, number])[]>([])

const canProceed = computed(() => {
  if (currentStep.value === 0) {
    return civConfig.alias && civConfig.alias.length > 0
  }
  return true
})

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
 * The legacy format stores bonuses as (number | [number, number])[][]
 * where index 0 = civ bonuses, index 4 = team bonuses
 */
function restoreBonusSelections() {
  if (civConfig.bonuses && Array.isArray(civConfig.bonuses)) {
    // Convert loaded bonuses to the expected format
    // Each bonus can be either a number (id) or [id, multiplier]
    selectedCivBonuses.value = normalizeBonus(civConfig.bonuses[0])
    selectedTeamBonus.value = normalizeBonus(civConfig.bonuses[4])
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

function handleFinish() {
  // Update bonuses in config (matching legacy format order)
  // Index: 0 = civ, 1 = unique units, 2 = castle techs, 3 = imp techs, 4 = team
  civConfig.bonuses = [
    selectedCivBonuses.value,
    [],  // unique units (not implemented yet)
    [],  // castle techs (not implemented yet)
    [],  // imp techs (not implemented yet)
    selectedTeamBonus.value
  ]
  
  emit('next', { ...civConfig })
}

function handleDownload() {
  if (!civConfig.alias) {
    alert('Please enter a civilization name')
    return
  }
  
  // Update bonuses before download (matching legacy format order)
  // Index: 0 = civ, 1 = unique units, 2 = castle techs, 3 = imp techs, 4 = team
  civConfig.bonuses = [
    selectedCivBonuses.value,
    [],  // unique units (not implemented yet)
    [],  // castle techs (not implemented yet)
    [],  // imp techs (not implemented yet)
    selectedTeamBonus.value
  ]
  
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
  selectedTeamBonus.value = []
  currentStep.value = 0
  emit('reset')
}

// Watch for initial config changes
watch(() => props.initialConfig, (newConfig) => {
  if (newConfig) {
    Object.assign(civConfig, createDefaultCiv(), newConfig)
    // Restore bonus selections when config changes
    restoreBonusSelections()
  }
}, { deep: true })

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

/* Bonuses layout */
.bonuses-layout {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Bonuses grid - keeping for backwards compatibility */
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
</style>
