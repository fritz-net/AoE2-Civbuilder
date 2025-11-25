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
      <div class="bonuses-grid">
        <BonusSelector
          title="Civilization Bonuses"
          subtitle="Select up to 5 bonuses for your civilization"
          :bonuses="civBonuses"
          v-model="selectedCivBonuses"
          mode="multi"
          :max-selections="5"
          :disabled="readOnly"
        />
        
        <BonusSelector
          title="Team Bonus"
          subtitle="Select one team bonus"
          :bonuses="teamBonuses"
          v-model="selectedTeamBonus"
          mode="single"
          :disabled="readOnly"
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

// Sample bonuses - these would typically come from the backend
const civBonuses = ref([
  { id: 1, name: 'Infantry +10% HP', description: 'All infantry units have +10% hit points' },
  { id: 2, name: 'Archer +1 range', description: 'Archery range units have +1 range' },
  { id: 3, name: 'Cavalry +15% speed', description: 'Cavalry units move 15% faster' },
  { id: 4, name: 'Siege +20% attack', description: 'Siege weapons deal 20% more damage' },
  { id: 5, name: 'Villager +10% work rate', description: 'Villagers work 10% faster' },
  { id: 6, name: 'Buildings +15% HP', description: 'All buildings have +15% hit points' },
  { id: 7, name: 'Monks +50% healing', description: 'Monks heal 50% faster' },
  { id: 8, name: 'Ships +1 pierce armor', description: 'All ships have +1 pierce armor' },
])

const teamBonuses = ref([
  { id: 101, name: 'Team Infantry +2 attack', description: 'Team infantry +2 attack' },
  { id: 102, name: 'Team Archers +1 LOS', description: 'Team archery units +1 line of sight' },
  { id: 103, name: 'Team Cavalry +1 armor', description: 'Team cavalry +1 armor' },
  { id: 104, name: 'Team Monks +3 healing range', description: 'Team monks +3 healing range' },
])

const selectedCivBonuses = ref<number[]>([])
const selectedTeamBonus = ref<number[]>([])

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

function handleFinish() {
  // Update bonuses in config
  civConfig.bonuses = [
    selectedCivBonuses.value,
    selectedTeamBonus.value,
    [],
    [],
    []
  ]
  
  emit('next', { ...civConfig })
}

function handleDownload() {
  if (!civConfig.alias) {
    alert('Please enter a civilization name')
    return
  }
  
  // Update bonuses before download
  civConfig.bonuses = [
    selectedCivBonuses.value,
    selectedTeamBonus.value,
    [],
    [],
    []
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
</style>
