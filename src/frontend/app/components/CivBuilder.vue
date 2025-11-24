<template>
  <div class="civ-builder">
    <div class="civ-builder-header">
      <h1 class="civ-builder-title">Create Your Civilization</h1>
    </div>
    
    <div class="civ-builder-content">
      <!-- Left Column: Flag Creator -->
      <div class="builder-column flag-column">
        <FlagCreator
          v-model="civConfig.flag_palette"
          v-model:custom-flag="civConfig.customFlag"
          v-model:custom-flag-data="civConfig.customFlagData"
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
          />
        </div>
      </div>
      
      <!-- Right Column: Selectors -->
      <div class="builder-column selectors-column">
        <ArchitectureSelector v-model="civConfig.architecture" />
        
        <div class="advanced-toggle">
          <button class="toggle-btn" @click="showAdvanced = !showAdvanced">
            {{ showAdvanced ? 'Hide Advanced' : 'Show Advanced' }}
          </button>
        </div>
        
        <div v-if="showAdvanced" class="advanced-options">
          <LanguageSelector v-model="civConfig.language" />
          <WonderSelector v-model="civConfig.wonder" />
        </div>
      </div>
    </div>
    
    <!-- Action Buttons -->
    <div class="civ-builder-actions">
      <button class="action-btn primary-btn" @click="handleNext">
        {{ nextButtonText }}
      </button>
      
      <div class="secondary-actions">
        <button class="action-btn secondary-btn" @click="handleDownload">
          Download Config
        </button>
        <button class="action-btn secondary-btn" @click="handleReset">
          Reset
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { createDefaultCiv, type CivConfig } from '~/composables/useCivData'

const props = withDefaults(defineProps<{
  initialConfig?: Partial<CivConfig>
  nextButtonText?: string
}>(), {
  nextButtonText: 'Next'
})

const emit = defineEmits<{
  (e: 'next', config: CivConfig): void
  (e: 'download', config: CivConfig): void
  (e: 'reset'): void
}>()

const showAdvanced = ref(false)

const civConfig = reactive<CivConfig>({
  ...createDefaultCiv(),
  ...props.initialConfig
})

function validateName(value: string): boolean {
  const nameRGEX = /^[a-zA-Z0-9][a-zA-Z0-9 ]*$/
  if (!nameRGEX.test(value)) {
    alert('Please enter a valid civilization name (alphanumeric characters only)')
    return false
  }
  if (value.length > 30) {
    alert('Please enter a shorter name')
    return false
  }
  return true
}

function validateDescription(value: string): boolean {
  const nameRGEX = /^[a-zA-Z0-9 ]*$/
  if (value && !nameRGEX.test(value)) {
    alert('Please enter a valid description (alphanumeric characters only)')
    return false
  }
  if (value.length > 30) {
    alert('Please enter a shorter description')
    return false
  }
  return true
}

function handleNext() {
  if (!civConfig.alias) {
    alert('Please enter a civilization name')
    return
  }
  
  if (!validateName(civConfig.alias)) {
    return
  }
  
  if (!validateDescription(civConfig.description)) {
    return
  }
  
  emit('next', { ...civConfig })
}

function handleDownload() {
  if (!civConfig.alias) {
    alert('Please enter a civilization name')
    return
  }
  
  if (!validateName(civConfig.alias)) {
    return
  }
  
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
  emit('reset')
}

// Expose civConfig for parent component access if needed
defineExpose({
  civConfig,
  handleNext,
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
  color: #d4af37;
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
  background: rgba(139, 69, 19, 0.3);
  border: 2px solid #d4af37;
  padding: 1rem;
  border-radius: 8px;
}

.input-label {
  display: block;
  color: #d4af37;
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
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid #d4af37;
  border-radius: 4px;
  color: #d4af37;
  text-align: center;
  box-sizing: border-box;
}

.civ-name-input::placeholder,
.civ-description-input::placeholder {
  color: rgba(212, 175, 55, 0.5);
}

.civ-name-input:focus,
.civ-description-input:focus {
  outline: none;
  border-color: #f4cf47;
  box-shadow: 0 0 8px rgba(212, 175, 55, 0.5);
}

.advanced-toggle {
  text-align: center;
}

.toggle-btn {
  padding: 0.5rem 1.5rem;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  color: #d4af37;
  border: 2px solid #d4af37;
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
  border: 2px solid #d4af37;
}

.primary-btn {
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  color: #d4af37;
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
  background: rgba(0, 0, 0, 0.4);
  color: #d4af37;
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
}

@media (max-width: 600px) {
  .secondary-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
}
</style>
