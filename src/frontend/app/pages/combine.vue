<template>
  <div class="combine-page">
    <div class="combine-header">
      <h1 class="combine-title">Combine Civilizations into Mod</h1>
      <p class="combine-subtitle">
        Upload multiple civilization JSON files to combine them into a single mod package
      </p>
    </div>

    <div class="combine-content">
      <!-- Upload Section (Custom Mode) -->
      <div 
        v-if="mode === 'custom'"
        class="upload-section"
        @drop.prevent="handleDrop"
        @dragover.prevent="handleDragOver"
        @dragenter.prevent="handleDragEnter"
        @dragleave.prevent="handleDragLeave"
        :class="{ 'drag-over': isDragging }"
      >
        <h2>Add Civilizations</h2>
        <div class="upload-buttons">
          <label class="upload-btn">
            <input 
              type="file" 
              accept=".json"
              multiple
              @change="handleFileUpload"
              ref="fileInput"
            />
            <span>📁 Choose JSON Files</span>
          </label>
          <button 
            class="vanilla-btn"
            @click="switchMode('vanilla')"
            title="Load all vanilla Age of Empires II civilizations"
          >
            🏰 Use Vanilla Civs
          </button>
        </div>
        <p class="upload-hint">Select one or more .json civilization files</p>
        <p class="download-hint">
          or <a href="/vanilla" @click.prevent="handleDownloadVanilla" class="download-link">download vanilla civs</a> to customize locally
        </p>
        <p class="drag-hint">or drag and drop JSON files here</p>
      </div>

      <!-- Civs List -->
      <div 
        v-if="civs.length > 0" 
        class="civs-section"
        @drop.prevent="handleCivsSectionDrop"
        @dragover.prevent="handleCivsSectionDragOver"
        @dragenter.prevent="handleCivsSectionDragEnter"
        @dragleave.prevent="handleCivsSectionDragLeave"
        :class="{ 'drag-over': isCivsSectionDragging && civs.length < 50 }"
      >
        <div class="civs-header">
          <h2>Loaded Civilizations ({{ civs.length }})</h2>
          <button 
            v-if="mode === 'vanilla'"
            class="switch-mode-btn"
            @click="switchMode('custom')"
            title="Switch to custom mode"
          >
            📂 Switch to Custom Mode
          </button>
        </div>
        <div class="civs-list">
          <div 
            v-for="(civ, index) in civs" 
            :key="index"
            class="civ-card"
            @drop.prevent="handleCivCardDrop($event, index)"
            @dragover.prevent="handleCivCardDragOver"
            @dragenter.prevent="handleCivCardDragEnter($event, index)"
            @dragleave.prevent="handleCivCardDragLeave($event, index)"
            :class="{ 'drag-over-card': dragOverCardIndex === index }"
          >
            <div class="civ-info">
              <h3>{{ civ.alias || 'Unnamed Civ' }}</h3>
              <p>{{ civ.description || 'No description' }}</p>
            </div>
            <div class="civ-actions">
              <button 
                v-if="mode === 'vanilla'"
                class="replace-btn"
                @click="replaceCiv(index)"
                title="Replace this civilization with a custom one"
              >
                🔄 Replace
              </button>
              <button 
                class="remove-btn"
                @click="removeCiv(index)"
                :title="mode === 'vanilla' ? 'Remove civilization (will not be replaced)' : 'Remove civilization'"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
        <p v-if="civs.length < 50" class="drop-hint">💡 Drag and drop JSON files here to add more civilizations</p>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <p>No civilizations loaded yet</p>
        <p class="empty-hint">Upload JSON files to get started</p>
      </div>

      <!-- Warning/Error Messages for Civ Limit -->
      <div v-if="civs.length >= 51" class="limit-warning">
        <div v-if="civs.length <= 50" class="warning-message">
          <p>⚠️ <strong>Warning:</strong> You have {{ civs.length }}/50 civilizations loaded. Age of Empires II currently does not support more than 50 civilizations in a single mod.</p>
        </div>
        <div v-else class="error-message-limit">
          <p>❌ <strong>Limit Exceeded:</strong> You have {{ civs.length }} civilizations loaded, but Age of Empires II does not support more than 50 civilizations in a single mod. Please remove {{ civs.length - 50 }} civilization{{ civs.length - 50 > 1 ? 's' : '' }} before creating your mod.</p>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="civs.length > 0" class="actions-section">
        <button 
          class="action-btn primary-btn"
          @click="handleCreateMod"
          :disabled="isCreating || civs.length === 0 || civs.length > 50"
        >
          {{ isCreating ? 'Creating Mod...' : `Create Combined Mod (${civs.length} ${civs.length === 1 ? 'Civ' : 'Civs'})` }}
        </button>
        <button 
          class="action-btn secondary-btn"
          @click="handleClearAll"
          :disabled="isCreating"
        >
          Clear All
        </button>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="error-message">
        <p>❌ {{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CivConfig } from '~/composables/useCivData'
import { useModApi } from '~/composables/useModApi'
import { normalizeDescription, parseCivJson } from '~/utils/civDataUtils'

const { isCreating, error, createMod } = useModApi()
const fileInput = ref<HTMLInputElement | null>(null)
const civs = ref<CivConfig[]>([])
const isDragging = ref(false)
const isCivsSectionDragging = ref(false)
const dragOverCardIndex = ref<number | null>(null)
const mode = ref<'custom' | 'vanilla'>('custom')

// List of vanilla civ names in game order
const vanillaCivNames = [
  'Britons', // 1
  'Franks', // 2
  'Goths', // 3
  'Teutons', // 4
  'Japanese', // 5
  'Chinese', // 6
  'Byzantines', // 7
  'Persians', // 8
  'Saracens', // 9
  'Turks', // 10
  'Vikings', // 11
  'Mongols', // 12
  'Celts', // 13
  'Spanish', // 14
  'Aztecs', // 15
  'Mayans', // 16
  'Huns', // 17
  'Koreans', // 18
  'Italians', // 19
  'Hindustanis', // 20
  'Incas', // 21
  'Magyars', // 22
  'Slavs', // 23
  'Portuguese', // 24
  'Ethiopians', // 25
  'Malians', // 26
  'Berbers', // 27
  'Khmer', // 28
  'Malay', // 29
  'Burmese', // 30
  'Vietnamese', // 31
  'Bulgarians', // 32
  'Tatars', // 33
  'Cumans', // 34
  'Lithuanians', // 35
  'Burgundians', // 36
  'Sicilians', // 37
  'Poles', // 38
  'Bohemians', // 39
  'Dravidians', // 40
  'Bengalis', // 41
  'Gurjaras', // 42
  'Romans', // 43
  'Armenians', // 44
  'Georgians', // 45
  // Chronicle civs (not included):
  // 'Archaemenids', // 46
  // 'Athenians', // 47
  // 'Spartans', // 48
  'Shu', // 49
  'Wu', // 50
  'Wei', // 51
  'Jurchens', // 52
  'Khitans', // 53
  // Chronicle civs (not included):
  // 'Macedonians', // 54
  // 'Thracians', // 55
  // 'Puru', // 56
]

async function loadVanillaCivs() {
  // Load all vanilla civs in parallel for better performance
  // Promise.all maintains the order of results matching vanillaCivNames array
  const promises = vanillaCivNames.map(async (civName) => {
    try {
      const response = await fetch(`/v2/vanillaFiles/vanillaCivs/VanillaJson/${civName}.json`)
      if (response.ok) {
        const config = await response.json() as CivConfig
        config.description = normalizeDescription(config.description)
        return config
      }
      return null
    } catch (err) {
      console.error(`Failed to load vanilla civ: ${civName}`, err)
      return null
    }
  })
  
  const results = await Promise.all(promises)
  // Filter out any failed loads (null values)
  // Order is preserved: backend receives civs in the same order as vanillaCivNames
  return results.filter((civ): civ is CivConfig => civ !== null)
}

async function switchMode(newMode: 'custom' | 'vanilla') {
  if (newMode === mode.value) return
  
  // Warn user if switching away from a mode with loaded civs
  if (civs.value.length > 0 && newMode === 'custom') {
    const confirmSwitch = confirm(
      `Switching to Custom Mode will clear all currently loaded civilizations. Are you sure?`
    )
    if (!confirmSwitch) return
  }
  
  mode.value = newMode
  
  if (newMode === 'vanilla') {
    // Load all vanilla civs
    civs.value = await loadVanillaCivs()
  } else {
    // Clear civs for custom mode
    civs.value = []
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
}

function handleDragEnter(event: DragEvent) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  // Only set to false if we're leaving the upload section entirely
  if (event.target === event.currentTarget) {
    isDragging.value = false
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return
  
  // Filter for JSON files only
  const jsonFiles = Array.from(files).filter(file => 
    file.name.toLowerCase().endsWith('.json')
  )
  
  if (jsonFiles.length === 0) {
    alert('Please drop only JSON files')
    return
  }
  
  processFiles(jsonFiles)
}

// Handler for dragging over the civs section (to add new civs)
function handleCivsSectionDragOver(event: DragEvent) {
  event.preventDefault()
  // Only allow drop if we have space for more civs
  if (civs.value.length < 50) {
    event.dataTransfer!.dropEffect = 'copy'
  } else {
    event.dataTransfer!.dropEffect = 'none'
  }
}

function handleCivsSectionDragEnter(event: DragEvent) {
  event.preventDefault()
  // Only show drag effect if we have space
  if (civs.value.length < 50) {
    isCivsSectionDragging.value = true
  }
}

function handleCivsSectionDragLeave(event: DragEvent) {
  event.preventDefault()
  // Only reset if leaving the section entirely
  if (event.target === event.currentTarget) {
    isCivsSectionDragging.value = false
  }
}

function handleCivsSectionDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  isCivsSectionDragging.value = false
  
  // Only process if we have space
  if (civs.value.length >= 50) {
    alert('Cannot add more civilizations. Maximum of 50 civilizations reached.')
    return
  }
  
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return
  
  // Filter for JSON files only
  const jsonFiles = Array.from(files).filter(file => 
    file.name.toLowerCase().endsWith('.json')
  )
  
  if (jsonFiles.length === 0) {
    alert('Please drop only JSON files')
    return
  }
  
  processFiles(jsonFiles)
}

// Handler for dragging over a specific civ card (to replace it)
function handleCivCardDragOver(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  event.dataTransfer!.dropEffect = 'copy'
}

function handleCivCardDragEnter(event: DragEvent, index: number) {
  event.preventDefault()
  event.stopPropagation()
  dragOverCardIndex.value = index
  // Don't show the civs section drag effect when over a card
  isCivsSectionDragging.value = false
}

function handleCivCardDragLeave(event: DragEvent, index: number) {
  event.preventDefault()
  event.stopPropagation()
  // Only reset if leaving the card entirely
  if (event.target === event.currentTarget) {
    dragOverCardIndex.value = null
  }
}

function handleCivCardDrop(event: DragEvent, index: number) {
  event.preventDefault()
  event.stopPropagation()
  dragOverCardIndex.value = null
  
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return
  
  // Only accept one file for replacement
  if (files.length > 1) {
    alert('Please drop only one JSON file to replace this civilization')
    return
  }
  
  const file = files[0]
  if (!file.name.toLowerCase().endsWith('.json')) {
    alert('Please drop a JSON file')
    return
  }
  
  // Read and replace the civ at this index
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const config = JSON.parse(content) as CivConfig
      config.description = normalizeDescription(config.description)
      
      // Replace the civ at the specified index
      civs.value[index] = config
    } catch (err) {
      console.error('Failed to parse file:', file.name, err)
      alert(`Failed to parse ${file.name}`)
    }
  }
  reader.onerror = () => {
    alert(`Failed to read ${file.name}`)
  }
  reader.readAsText(file)
}

function processFiles(files: File[]) {
  const fileReaders = files.map(file => {
    return new Promise<CivConfig[]>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const json = JSON.parse(content)
          
          // Parse JSON - handles both single civ and multi-civ data.json
          const configs = parseCivJson(json)
          
          resolve(configs)
        } catch (err) {
          console.error('Failed to parse file:', file.name, err)
          reject(new Error(`Failed to parse ${file.name}`))
        }
      }
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
      reader.readAsText(file)
    })
  })

  Promise.all(fileReaders)
    .then(civConfigArrays => {
      // Flatten array of arrays into single array of civs
      const allCivs = civConfigArrays.flat()
      
      // Check if adding these civs would exceed the 50 civ limit
      const totalAfterAdd = civs.value.length + allCivs.length
      if (totalAfterAdd > 50) {
        const available = 50 - civs.value.length
        alert(`Cannot add ${allCivs.length} civilization${allCivs.length > 1 ? 's' : ''}. You currently have ${civs.value.length} civilizations loaded. You can only add ${available} more to reach the maximum of 50 civilizations.`)
        return
      }
      
      civs.value.push(...allCivs)
      // Reset file input
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    })
    .catch(err => {
      alert(`Error loading files: ${err.message}`)
    })
}

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  processFiles(Array.from(input.files))
}

function removeCiv(index: number) {
  civs.value.splice(index, 1)
}

function replaceCiv(index: number) {
  // Create a hidden file input for replacing a specific civ
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (event: Event) => {
    const target = event.target as HTMLInputElement
    if (!target.files || target.files.length === 0) return
    
    const file = target.files[0]
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const config = JSON.parse(content) as CivConfig
          config.description = normalizeDescription(config.description)
          
          // Replace the civ at the specified index
          civs.value[index] = config
        } catch (err) {
          console.error('Failed to parse file:', file.name, err)
          alert(`Failed to parse ${file.name}`)
        }
      }
      reader.readAsText(file)
    } catch (err) {
      alert(`Error loading file: ${err}`)
    }
  }
  input.click()
}

function handleClearAll() {
  if (confirm('Are you sure you want to clear all loaded civilizations?')) {
    civs.value = []
  }
}

async function handleCreateMod() {
  if (civs.value.length === 0) {
    alert('Please load at least one civilization first')
    return
  }

  try {
    const filename = await createMod(civs.value)
    
    // Navigate to download success page with civ names
    const civNames = civs.value.map(c => c.alias).join(',')
    const router = useRouter()
    router.push({
      path: '/download-success',
      query: {
        civs: civNames,
        filename: filename
      }
    })
  } catch (err) {
    console.error('Error creating combined mod:', err)
    alert(`Failed to create mod: ${error.value || 'Unknown error'}`)
  }
}

function handleDownloadVanilla() {
  // Create a form and submit it to download the vanilla civs zip
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = '/vanilla'
  form.style.display = 'none'
  document.body.appendChild(form)
  try {
    form.submit()
  } finally {
    // Clean up the form element
    document.body.removeChild(form)
  }
}
</script>

<style scoped>
.combine-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
}

.combine-header {
  text-align: center;
  margin-bottom: 3rem;
}

.combine-title {
  font-size: 2.5rem;
  color: hsl(52, 100%, 50%);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  margin-bottom: 1rem;
}

.combine-subtitle {
  font-size: 1.1rem;
  color: hsla(52, 100%, 50%, 0.8);
  line-height: 1.6;
}

.combine-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.upload-section {
  background: rgba(139, 69, 19, 0.75);
  border: 3px solid hsl(52, 100%, 50%);
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  transition: all 0.2s ease;
}

.upload-section h2 {
  color: hsl(52, 100%, 50%);
  margin-bottom: 1.5rem;
}

.upload-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.upload-btn {
  display: inline-block;
  padding: 1rem 2rem;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  color: hsl(52, 100%, 50%);
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.upload-btn:hover {
  background: linear-gradient(to bottom, rgba(160, 82, 45, 0.95), rgba(139, 69, 19, 0.95));
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.6);
}

.vanilla-btn {
  display: inline-block;
  padding: 1rem 2rem;
  background: linear-gradient(to bottom, rgba(30, 80, 120, 0.9), rgba(20, 60, 90, 0.9));
  color: hsl(52, 100%, 50%);
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.vanilla-btn:hover {
  background: linear-gradient(to bottom, rgba(40, 100, 140, 0.95), rgba(30, 80, 120, 0.95));
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.6);
}

.upload-btn input {
  display: none;
}

.upload-hint {
  margin-top: 1rem;
  color: hsla(52, 100%, 50%, 0.7);
  font-size: 0.9rem;
}

.download-hint {
  margin-top: 0.5rem;
  color: hsla(52, 100%, 50%, 0.7);
  font-size: 0.9rem;
}

.download-link {
  color: hsl(52, 100%, 60%);
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.2s ease;
}

.download-link:hover {
  color: hsl(52, 100%, 70%);
}

.drag-hint {
  margin-top: 0.5rem;
  color: hsla(52, 100%, 50%, 0.6);
  font-size: 0.85rem;
  font-style: italic;
}

.upload-section.drag-over {
  background: rgba(160, 82, 45, 0.85);
  border-color: hsl(52, 100%, 60%);
  border-style: dashed;
  /* Keep border-width at 3px - same as default to prevent shift */
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  transition: all 0.2s ease;
}

.civs-section {
  background: rgba(139, 69, 19, 0.75);
  border: 2px solid hsl(52, 100%, 50%);
  padding: 2rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.civs-section.drag-over {
  background: rgba(160, 82, 45, 0.85);
  border-color: hsl(52, 100%, 60%);
  border-style: dashed;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.civs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.civs-section h2 {
  color: hsl(52, 100%, 50%);
  margin: 0;
}

.switch-mode-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  color: hsl(52, 100%, 50%);
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.switch-mode-btn:hover {
  background: linear-gradient(to bottom, rgba(160, 82, 45, 0.95), rgba(139, 69, 19, 0.95));
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
}

.civs-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.civ-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid hsla(52, 100%, 50%, 0.3);
  border-radius: 4px;
  transition: all 0.2s ease;
}

.civ-card:hover {
  background: rgba(0, 0, 0, 0.4);
  border-color: hsla(52, 100%, 50%, 0.5);
}

.civ-card.drag-over-card {
  background: rgba(50, 150, 200, 0.4);
  border: 2px dashed hsl(200, 80%, 60%);
  box-shadow: 0 0 15px rgba(100, 180, 230, 0.6);
  transform: scale(1.02);
}

.civ-info {
  flex: 1;
}

.civ-info h3 {
  color: hsl(52, 100%, 50%);
  font-size: 1.2rem;
  margin-bottom: 0.25rem;
}

.civ-info p {
  color: hsla(52, 100%, 50%, 0.7);
  font-size: 0.9rem;
}

.civ-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.replace-btn {
  padding: 0.5rem 1rem;
  background: rgba(50, 150, 200, 0.6);
  color: white;
  border: 1px solid rgba(50, 150, 200, 0.8);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.replace-btn:hover {
  background: rgba(50, 150, 200, 0.8);
  transform: scale(1.05);
}

.remove-btn {
  padding: 0.5rem 0.75rem;
  background: rgba(200, 50, 50, 0.6);
  color: white;
  border: 1px solid rgba(200, 50, 50, 0.8);
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background: rgba(200, 50, 50, 0.8);
  transform: scale(1.1);
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  background: rgba(139, 69, 19, 0.5);
  border: 2px dashed hsla(52, 100%, 50%, 0.3);
  border-radius: 8px;
}

.empty-state p {
  color: hsla(52, 100%, 50%, 0.7);
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.empty-hint {
  font-size: 0.9rem !important;
  opacity: 0.8;
}

.drop-hint {
  margin-top: 1rem;
  padding: 0.75rem;
  text-align: center;
  color: hsla(52, 100%, 50%, 0.8);
  font-size: 0.95rem;
  font-style: italic;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  border: 1px dashed hsla(52, 100%, 50%, 0.3);
}

.actions-section {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  padding: 1rem 2rem;
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid hsl(52, 100%, 50%);
}

.primary-btn {
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  color: hsl(52, 100%, 50%);
  min-width: 250px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
}

.primary-btn:hover:not(:disabled) {
  background: linear-gradient(to bottom, rgba(160, 82, 45, 0.95), rgba(139, 69, 19, 0.95));
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.6);
}

.secondary-btn {
  background: rgba(0, 0, 0, 0.5);
  color: hsl(52, 100%, 50%);
}

.secondary-btn:hover:not(:disabled) {
  background: rgba(139, 69, 19, 0.6);
  transform: translateY(-2px);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  padding: 1rem;
  background: rgba(200, 50, 50, 0.2);
  border: 2px solid rgba(200, 50, 50, 0.5);
  border-radius: 4px;
  text-align: center;
}

.error-message p {
  color: hsl(52, 100%, 50%);
  font-size: 1.1rem;
}

.error-message {
  padding: 1rem;
  background: rgba(200, 50, 50, 0.2);
  border: 2px solid rgba(200, 50, 50, 0.5);
  border-radius: 4px;
  text-align: center;
}

.error-message p {
  color: hsl(52, 100%, 50%);
  font-size: 1.1rem;
}

.limit-warning {
  margin-top: 1rem;
}

.warning-message {
  padding: 1rem;
  background: rgba(139, 69, 19, 0.7);
  border-left: 4px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.warning-message p {
  color: #ffffff;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
}

.error-message-limit {
  padding: 1rem;
  background: rgba(200, 50, 50, 0.2);
  border: 2px solid rgba(200, 50, 50, 0.5);
  border-radius: 4px;
  margin-bottom: 1rem;
}

.error-message-limit p {
  color: hsl(52, 100%, 50%);
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
}

@media (max-width: 768px) {
  .combine-page {
    padding: 1rem;
  }

  .combine-title {
    font-size: 1.8rem;
  }

  .actions-section {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }
}
</style>
