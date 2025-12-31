<template>
  <div class="combine-page">
    <div class="combine-header">
      <h1 class="combine-title">Combine Civilizations into Mod</h1>
      <p class="combine-subtitle">
        Upload multiple civilization JSON files to combine them into a single mod package
      </p>
    </div>

    <div class="combine-content">
      <!-- Upload Section -->
      <div 
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
            @click="handleDownloadVanilla"
            title="Download all vanilla Age of Empires II civilizations as JSON files"
          >
            ⬇️ Get Vanilla Civs
          </button>
        </div>
        <p class="upload-hint">Select one or more .json civilization files</p>
        <p class="drag-hint">or drag and drop JSON files here</p>
      </div>

      <!-- Civs List -->
      <div v-if="civs.length > 0" class="civs-section">
        <h2>Loaded Civilizations ({{ civs.length }})</h2>
        <div class="civs-list">
          <div 
            v-for="(civ, index) in civs" 
            :key="index"
            class="civ-card"
          >
            <div class="civ-info">
              <h3>{{ civ.alias || 'Unnamed Civ' }}</h3>
              <p>{{ civ.description || 'No description' }}</p>
            </div>
            <button 
              class="remove-btn"
              @click="removeCiv(index)"
              title="Remove civilization"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <p>No civilizations loaded yet</p>
        <p class="empty-hint">Upload JSON files to get started</p>
      </div>

      <!-- Warning/Error Messages for Civ Limit -->
      <div v-if="civs.length >= 45" class="limit-warning">
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
import { normalizeDescription } from '~/utils/civDataUtils'

const { isCreating, error, createMod } = useModApi()
const fileInput = ref<HTMLInputElement | null>(null)
const civs = ref<CivConfig[]>([])
const isDragging = ref(false)

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

function processFiles(files: File[]) {
  // Check if adding these files would exceed the 50 civ limit
  const totalAfterAdd = civs.value.length + files.length
  if (totalAfterAdd > 50) {
    const available = 50 - civs.value.length
    alert(`Cannot add ${files.length} civilization${files.length > 1 ? 's' : ''}. You currently have ${civs.value.length} civilizations loaded. You can only add ${available} more to reach the maximum of 50 civilizations.`)
    return
  }

  const readers = files.map(file => {
    return new Promise<CivConfig>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const config = JSON.parse(content) as CivConfig
          
          // Normalize description field using shared utility
          config.description = normalizeDescription(config.description)
          
          resolve(config)
        } catch (err) {
          console.error('Failed to parse file:', file.name, err)
          reject(new Error(`Failed to parse ${file.name}`))
        }
      }
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
      reader.readAsText(file)
    })
  })

  Promise.all(readers)
    .then(loadedCivs => {
      civs.value.push(...loadedCivs)
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
    const seed = await createMod(civs.value)
    
    // Navigate to download success page with civ names
    const civNames = civs.value.map(c => c.alias).join(',')
    const router = useRouter()
    router.push({
      path: '/download-success',
      query: {
        civs: civNames,
        filename: `${seed}.zip`
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
}

.civs-section h2 {
  color: hsl(52, 100%, 50%);
  margin-bottom: 1.5rem;
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

.civ-info h3 {
  color: hsl(52, 100%, 50%);
  font-size: 1.2rem;
  margin-bottom: 0.25rem;
}

.civ-info p {
  color: hsla(52, 100%, 50%, 0.7);
  font-size: 0.9rem;
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
  background: rgba(139, 69, 19, 0.3);
  border-left: 4px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  margin-bottom: 1rem;
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
