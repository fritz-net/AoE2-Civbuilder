<template>
  <div class="create-draft-page">
    <h1 class="page-title">Create Draft</h1>

    <div class="draft-form">
      <!-- Drop Zone for Draft Settings -->
      <div 
        class="drop-zone"
        :class="{ 'drop-zone-active': isDragging, 'drop-zone-error': uploadError }"
        @drop.prevent="handleDrop"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
      >
        <div class="drop-zone-content">
          <span class="drop-zone-icon">📁</span>
          <p class="drop-zone-text">
            <strong>Drop draft-config.json here</strong>
          </p>
          <p class="drop-zone-subtext">or click to browse</p>
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            @change="handleFileSelect"
            class="file-input-hidden"
          />
          <button 
            type="button"
            @click="$refs.fileInput.click()"
            class="browse-button"
          >
            Browse Files
          </button>
        </div>
        <p v-if="uploadSuccess" class="upload-message success">✓ Settings loaded successfully!</p>
        <p v-if="uploadError" class="upload-message error">{{ uploadError }}</p>
      </div>

      <div class="form-section">
        <label for="numPlayers" class="form-label">Number of Players:</label>
        <input
          id="numPlayers"
          v-model.number="draftSettings.numPlayers"
          type="number"
          min="1"
          max="8"
          class="form-input"
        />
      </div>

      <div class="form-section">
        <label for="bonusesPerPlayer" class="form-label">Bonuses per Player:</label>
        <input
          id="bonusesPerPlayer"
          v-model.number="draftSettings.rounds"
          type="number"
          min="2"
          max="6"
          class="form-input"
        />
      </div>

      <div class="form-section">
        <label for="techTreePoints" class="form-label">Starting Tech Tree Points:</label>
        <input
          id="techTreePoints"
          v-model.number="draftSettings.techTreePoints"
          type="number"
          min="25"
          max="500"
          class="form-input"
        />
      </div>

      <!-- Advanced Settings (collapsed by default) -->
      <details class="form-section advanced-section">
        <summary class="form-label collapsible-summary">Advanced Settings</summary>
        
        <div class="form-section rarities-section">
          <label class="form-label">Allowed Ranks:</label>
          <div class="rarities-checkboxes">
            <label v-for="(rarity, index) in rarityTexts" :key="index" class="rarity-checkbox">
              <input
                v-model="draftSettings.allowedRarities[index]"
                type="checkbox"
                :id="`rarity-${index}`"
              />
              <span>{{ rarity }}</span>
            </label>
          </div>
        </div>

        <div class="form-section uu-edition-section">
          <label class="form-label">Available Unique Units:</label>
          <div class="uu-edition-checkboxes">
            <label class="uu-edition-checkbox">
              <input
                v-model="draftSettings.allowBaseEditionUU"
                type="checkbox"
                id="baseEditionUU"
              />
              <span>Base Edition (Vanilla UUs)</span>
            </label>
            <label class="uu-edition-checkbox">
              <input
                v-model="draftSettings.allowFirstEditionUU"
                type="checkbox"
                id="firstEditionUU"
              />
              <span>First Edition (Custom UUs)</span>
            </label>
          </div>
          <div class="timer-help-text">
            Select which unique units should be available in the draft pool.
          </div>
        </div>

        <div class="form-section custom-uu-mode-section">
          <label class="form-label">
            <input
              v-model="draftSettings.customUUMode"
              type="checkbox"
              id="customUUMode"
              class="timer-checkbox"
            />
            Enable Custom UU Designer Mode
          </label>
          <div class="timer-help-text">
            When enabled, players design their own custom unique units during the draft instead of selecting from existing ones. Each player creates their own custom UU with a 100 point budget.
          </div>
        </div>

        <div class="form-section timer-section">
          <label class="form-label">
            <input
              v-model="draftSettings.timerEnabled"
              type="checkbox"
              id="timerEnabled"
              class="timer-checkbox"
            />
            Enable Timer for Picking Phase
          </label>
          <div v-if="draftSettings.timerEnabled" class="timer-input-group">
            <label for="timerDuration" class="timer-sublabel">Time per Pick (seconds):</label>
            <input
              id="timerDuration"
              v-model.number="draftSettings.timerDuration"
              type="number"
              min="5"
              max="300"
              class="form-input"
            />
            <div class="timer-help-text">
              Players must pick within this time, or a random bonus/tech will be selected automatically.
            </div>
          </div>
        </div>

        <div class="form-section blind-picks-section">
          <label class="form-label">
            <input
              v-model="draftSettings.blindPicks"
              type="checkbox"
              id="blindPicks"
              class="timer-checkbox"
            />
            Enable Blind Picks
          </label>
          <div class="timer-help-text">
            When enabled, players cannot view other players' bonuses during the draft. Spectators can always view all players.
          </div>
        </div>

        <div class="form-section snake-draft-section">
          <label class="form-label">
            <input
              v-model="draftSettings.snakeDraft"
              type="checkbox"
              id="snakeDraft"
              class="timer-checkbox"
            />
            Enable Snake Draft
          </label>
          <div class="timer-help-text">
            When enabled, the draft order alternates every round (e.g., 1234→4321→1234 for 4 players). When disabled, uses the default order pattern where only specific round types (Castle Age and Imperial Age unique techs) reverse the order.
          </div>
        </div>

        <div class="form-section">
          <label for="cardsPerRoll" class="form-label">Cards Per Roll:</label>
          <input
            id="cardsPerRoll"
            v-model.number="draftSettings.cardsPerRoll"
            type="number"
            min="1"
            max="10"
            class="form-input"
          />
          <p class="form-help">Number of highlighted cards after refill/clear (default: 3)</p>
        </div>

        <div class="form-section">
          <label for="bonusesPerPage" class="form-label">Bonuses Per Page:</label>
          <input
            id="bonusesPerPage"
            v-model.number="draftSettings.bonusesPerPage"
            type="number"
            min="10"
            max="100"
            class="form-input"
          />
          <p class="form-help">Total number of bonus cards displayed on the draft board (default: 30)</p>
        </div>
      </details>
      
      <!-- Testing Settings (collapsed by default) -->
      <details class="form-section required-bonuses-section">
        <summary class="form-label collapsible-summary">Testing Settings</summary>
        
        <div class="form-section">
          <label for="requiredFirstRoll" class="form-label">Required Bonus IDs:</label>
          <input
            id="requiredFirstRoll"
            v-model="draftSettings.requiredFirstRoll"
            type="text"
            placeholder="e.g., 356 (pasture bonus)"
            class="form-input"
          />
          <p class="form-help">Comma-separated bonus IDs to force into first roll (for testing)</p>
        </div>
      </details>

      <button
        class="submit-button"
        :disabled="isCreating"
        @click="createDraft"
      >
        {{ isCreating ? 'Creating...' : 'Start Draft' }}
      </button>

      <button
        class="back-button"
        @click="goBack"
      >
        Back
      </button>
    </div>

    <!-- Success Modal -->
    <div v-if="draftLinks" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>Draft Created!</h2>
        
        <div class="link-section">
          <label for="hostLink">Host Link</label>
          <div class="link-input-group">
            <input
              id="hostLink"
              :value="draftLinks.host"
              readonly
              class="link-input"
            />
            <button @click="copyLink('host')" class="copy-button">
              {{ copiedLink === 'host' ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>

        <div class="link-section">
          <label for="playerLink">Player Link</label>
          <div class="link-input-group">
            <input
              id="playerLink"
              :value="draftLinks.player"
              readonly
              class="link-input"
            />
            <button @click="copyLink('player')" class="copy-button">
              {{ copiedLink === 'player' ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>

        <div class="link-section">
          <label for="spectatorLink">Spectator Link</label>
          <div class="link-input-group">
            <input
              id="spectatorLink"
              :value="draftLinks.spectator"
              readonly
              class="link-input"
            />
            <button @click="copyLink('spectator')" class="copy-button">
              {{ copiedLink === 'spectator' ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>

        <div class="modal-actions">
          <a :href="draftLinks.host" class="action-button primary">
            Go to Host Page
          </a>
          <button @click="closeModal" class="action-button secondary">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const rarityTexts = ['Ordinary', 'Distinguished', 'Superior', 'Epic', 'Legendary']

const draftSettings = ref({
  numPlayers: 2,
  rounds: 4,
  techTreePoints: 200,
  allowedRarities: [true, true, true, true, true],
  allowBaseEditionUU: true, // Base Edition (Vanilla Civs) unique units
  allowFirstEditionUU: true, // First Edition (Custom Civs) unique units
  customUUMode: false, // Enable custom UU designer mode
  timerEnabled: false,
  timerDuration: 60,
  blindPicks: false,
  snakeDraft: false,
  cardsPerRoll: 3, // Optional: number of cards to show per roll
  bonusesPerPage: 30, // Optional: total number of bonus cards displayed on the draft board
  requiredFirstRoll: '', // Optional: comma-separated bonus IDs for testing (e.g., "356" for pasture bonus)
})

const draftLinks = ref<{
  host: string
  player: string
  spectator: string
} | null>(null)

const isCreating = ref(false)
const error = ref<string | null>(null)
const copiedLink = ref<string | null>(null)
const isDragging = ref(false)
const uploadSuccess = ref(false)
const uploadError = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    await processFile(files[0])
  }
}

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    await processFile(files[0])
  }
}

const processFile = async (file: File) => {
  uploadSuccess.value = false
  uploadError.value = null
  
  try {
    // Define interface for draft config structure
    interface DraftConfig {
      preset?: {
        slots?: number
        rounds?: number
        points?: number
        rarities?: boolean[]
        allow_base_edition_uu?: boolean
        allow_first_edition_uu?: boolean
        timer_enabled?: boolean
        timer_duration?: number
        blind_picks?: boolean
        snake_draft?: boolean
        cards_per_roll?: number
        bonuses_per_page?: number
        required_first_roll?: number[]
      }
    }
    
    let configData: DraftConfig | null = null
    
    if (file.name.endsWith('.json')) {
      // Direct JSON file
      const text = await file.text()
      try {
        configData = JSON.parse(text) as DraftConfig
      } catch (parseError) {
        uploadError.value = 'Failed to parse JSON file. Please ensure it\'s a valid draft-config.json file.'
        return
      }
    } else {
      uploadError.value = 'Invalid file type. Please upload a .json file.'
      return
    }
    
    // Load settings from config
    if (configData && configData.preset) {
      const preset = configData.preset
      
      // Map preset fields to draftSettings
      if (preset.slots !== undefined) draftSettings.value.numPlayers = preset.slots
      if (preset.rounds !== undefined) draftSettings.value.rounds = preset.rounds
      if (preset.points !== undefined) draftSettings.value.techTreePoints = preset.points
      if (preset.rarities !== undefined && Array.isArray(preset.rarities)) {
        draftSettings.value.allowedRarities = preset.rarities
      }
      if (preset.allow_base_edition_uu !== undefined) {
        draftSettings.value.allowBaseEditionUU = preset.allow_base_edition_uu
      }
      if (preset.allow_first_edition_uu !== undefined) {
        draftSettings.value.allowFirstEditionUU = preset.allow_first_edition_uu
      }
      if (preset.timer_enabled !== undefined) {
        draftSettings.value.timerEnabled = preset.timer_enabled
      }
      if (preset.timer_duration !== undefined) {
        draftSettings.value.timerDuration = preset.timer_duration
      }
      if (preset.blind_picks !== undefined) {
        draftSettings.value.blindPicks = preset.blind_picks
      }
      if (preset.snake_draft !== undefined) {
        draftSettings.value.snakeDraft = preset.snake_draft
      }
      if (preset.cards_per_roll !== undefined) {
        draftSettings.value.cardsPerRoll = preset.cards_per_roll
      }
      if (preset.bonuses_per_page !== undefined) {
        draftSettings.value.bonusesPerPage = preset.bonuses_per_page
      }
      if (preset.required_first_roll !== undefined && Array.isArray(preset.required_first_roll)) {
        draftSettings.value.requiredFirstRoll = preset.required_first_roll.join(',')
      }
      
      uploadSuccess.value = true
      setTimeout(() => {
        uploadSuccess.value = false
      }, 3000)
    } else {
      uploadError.value = 'Invalid draft config format. The file must contain a "preset" field with draft settings.'
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unexpected error while processing file'
    uploadError.value = `Failed to process file: ${errorMessage}`
    console.error('Failed to process file:', err)
  }
}

const createDraft = async () => {
  isCreating.value = true
  error.value = null

  try {
    const response = await fetch('/draft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        num_players: draftSettings.value.numPlayers.toString(),
        rounds: draftSettings.value.rounds.toString(),
        techtree_currency: draftSettings.value.techTreePoints.toString(),
        allowed_rarities: draftSettings.value.allowedRarities.join(','),
        allow_base_edition_uu: draftSettings.value.allowBaseEditionUU.toString(),
        allow_first_edition_uu: draftSettings.value.allowFirstEditionUU.toString(),
        custom_uu_mode: draftSettings.value.customUUMode.toString(),
        timer_enabled: draftSettings.value.timerEnabled.toString(),
        timer_duration: draftSettings.value.timerDuration.toString(),
        blind_picks: draftSettings.value.blindPicks.toString(),
        snake_draft: draftSettings.value.snakeDraft.toString(),
        cards_per_roll: draftSettings.value.cardsPerRoll.toString(),
        bonuses_per_page: draftSettings.value.bonusesPerPage.toString(),
        required_first_roll: draftSettings.value.requiredFirstRoll,
      }).toString(),
    })

    if (!response.ok) {
      throw new Error('Failed to create draft')
    }

    // Parse the HTML response to extract the draft ID
    const text = await response.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'text/html')
    
    const hostLink = doc.querySelector('#link1')?.getAttribute('value') || ''
    const playerLink = doc.querySelector('#link2')?.getAttribute('value') || ''
    const spectatorLink = doc.querySelector('#link3')?.getAttribute('value') || ''

    // Extract draft ID from one of the links (they all contain it)
    const draftIdMatch = hostLink.match(/\/draft\/(?:host|player)?\/(\d+)/)
    const draftId = draftIdMatch ? draftIdMatch[1] : ''

    if (!draftId) {
      throw new Error('Failed to extract draft ID from server response')
    }

    // Generate links using browser location to support both local and production environments
    // This handles the /v2 subpath automatically
    const baseUrl = window.location.origin + window.location.pathname.replace(/\/draft\/create\/?$/, '')
    
    draftLinks.value = {
      host: `${baseUrl}/draft/host/${draftId}`,
      player: `${baseUrl}/draft/player/${draftId}`,
      spectator: `${baseUrl}/draft/${draftId}`,
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred'
    console.error('Failed to create draft:', err)
  } finally {
    isCreating.value = false
  }
}

const copyLink = async (linkType: 'host' | 'player' | 'spectator') => {
  if (!draftLinks.value) return

  const link = draftLinks.value[linkType]
  
  try {
    await navigator.clipboard.writeText(link)
    copiedLink.value = linkType
    setTimeout(() => {
      copiedLink.value = null
    }, 2000)
  } catch (err) {
    console.error('Failed to copy link:', err)
  }
}

const closeModal = () => {
  draftLinks.value = null
  router.push('/draft')
}

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.create-draft-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.page-title {
  font-size: 3rem;
  color: hsl(52, 100%, 50%);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  margin-bottom: 2rem;
  text-align: center;
}

.draft-form {
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  border: 3px solid hsl(52, 100%, 50%);
  border-radius: 8px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
}

.form-section {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  color: hsl(52, 100%, 50%);
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 204, 0, 0.5);
  border-radius: 4px;
  color: #f0e6d2;
}

.form-input:focus {
  outline: none;
  border-color: hsl(52, 100%, 50%);
  box-shadow: 0 0 8px rgba(255, 204, 0, 0.4);
}

.rarities-section {
  margin-bottom: 2rem;
}

.rarities-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.rarity-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #f0e6d2;
  font-size: 1rem;
  cursor: pointer;
}

.rarity-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.timer-section {
  margin-bottom: 2rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.timer-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  margin-right: 0.5rem;
}

.timer-input-group {
  margin-top: 1rem;
  padding-left: 1.5rem;
}

.timer-sublabel {
  display: block;
  color: #f0e6d2;
  font-weight: normal;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.timer-help-text {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: rgba(240, 230, 210, 0.7);
  font-style: italic;
}

.blind-picks-section {
  margin-bottom: 2rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.snake-draft-section {
  margin-bottom: 2rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.submit-button {
  width: 100%;
  padding: 1rem;
  font-size: 1.3rem;
  font-weight: bold;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  color: hsl(52, 100%, 50%);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 1rem;
}

.submit-button:hover:not(:disabled) {
  background: hsl(52, 100%, 50%);
  color: #1a0f0a;
  box-shadow: 0 0 12px rgba(255, 204, 0, 0.5);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.back-button {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 204, 0, 0.5);
  border-radius: 4px;
  color: #f0e6d2;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button:hover {
  border-color: hsl(52, 100%, 50%);
  background: rgba(0, 0, 0, 0.6);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.95), rgba(101, 67, 33, 0.95));
  border: 3px solid hsl(52, 100%, 50%);
  border-radius: 8px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  color: hsl(52, 100%, 50%);
  text-align: center;
  margin: 0 0 1.5rem 0;
  font-size: 2rem;
}

.link-section {
  margin-bottom: 1.5rem;
}

.link-section label {
  display: block;
  color: hsl(52, 100%, 50%);
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.link-input-group {
  display: flex;
  gap: 0.5rem;
}

.link-input {
  flex: 1;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 204, 0, 0.5);
  border-radius: 4px;
  color: #f0e6d2;
  font-size: 0.9rem;
}

.copy-button {
  padding: 0.75rem 1.5rem;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  color: hsl(52, 100%, 50%);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.copy-button:hover {
  background: hsl(52, 100%, 50%);
  color: #1a0f0a;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.action-button {
  flex: 1;
  padding: 1rem;
  text-align: center;
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid;
}

.action-button.primary {
  background: hsl(52, 100%, 50%);
  color: #1a0f0a;
  border-color: hsl(52, 100%, 50%);
}

.action-button.primary:hover {
  background: hsl(52, 100%, 60%);
  box-shadow: 0 0 12px rgba(255, 204, 0, 0.5);
}

.action-button.secondary {
  background: rgba(0, 0, 0, 0.4);
  color: #f0e6d2;
  border-color: rgba(255, 204, 0, 0.5);
}

.action-button.secondary:hover {
  border-color: hsl(52, 100%, 50%);
  background: rgba(0, 0, 0, 0.6);
}

.error-message {
  position: fixed;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(200, 0, 0, 0.9);
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  border: 2px solid red;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  z-index: 1001;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }

  .draft-form {
    padding: 1.5rem;
  }

  .modal-content {
    padding: 1.5rem;
  }

  .modal-actions {
    flex-direction: column;
  }

  .link-input-group {
    flex-direction: column;
  }

  .copy-button {
    width: 100%;
  }
}

/* Advanced section styling */
.advanced-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 204, 0, 0.3);
  border-radius: 4px;
}

.advanced-section summary {
  cursor: pointer;
  user-select: none;
  font-weight: bold;
  margin-bottom: 0;
}

.advanced-section[open] summary {
  margin-bottom: 1rem;
}

.required-bonuses-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 204, 0, 0.3);
  border-radius: 4px;
}

.required-bonuses-section summary {
  cursor: pointer;
  user-select: none;
  font-weight: bold;
  margin-bottom: 0;
}

.required-bonuses-section[open] summary {
  margin-bottom: 1rem;
}

/* Collapsible summary with down arrow indicator */
.collapsible-summary {
  position: relative;
  padding-right: 2rem;
}

.collapsible-summary::after {
  content: '';
  position: absolute;
  right: 0;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 8px solid currentColor;
  transition: transform 0.2s ease;
  opacity: 0.7;
}

.collapsible-summary:hover::after {
  opacity: 1;
}

details[open] .collapsible-summary::after {
  transform: rotate(180deg);
}

.uu-edition-section {
  margin-bottom: 2rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.uu-edition-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.uu-edition-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #f0e6d2;
  font-size: 1rem;
  cursor: pointer;
}

.uu-edition-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.custom-uu-mode-section {
  margin-bottom: 2rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.form-help {
  font-size: 0.85rem;
  color: rgba(240, 230, 210, 0.7);
  margin-top: 0.25rem;
  font-style: italic;
}

/* Drop Zone Styles */
.drop-zone {
  margin-bottom: 2rem;
  padding: 2rem;
  border: 2px dashed rgba(255, 204, 0, 0.5);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.drop-zone:hover {
  border-color: hsl(52, 100%, 50%);
  background: rgba(0, 0, 0, 0.4);
}

.drop-zone-active {
  border-color: hsl(52, 100%, 50%);
  background: rgba(255, 204, 0, 0.1);
  transform: scale(1.02);
}

.drop-zone-error {
  border-color: rgba(255, 0, 0, 0.7);
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.drop-zone-icon {
  font-size: 3rem;
  opacity: 0.7;
}

.drop-zone-text {
  color: #f0e6d2;
  margin: 0;
  font-size: 1rem;
}

.drop-zone-subtext {
  color: rgba(240, 230, 210, 0.6);
  margin: 0;
  font-size: 0.9rem;
}

.file-input-hidden {
  display: none;
}

.browse-button {
  margin-top: 0.5rem;
  padding: 0.5rem 1.5rem;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 204, 0, 0.5);
  border-radius: 4px;
  color: hsl(52, 100%, 50%);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.browse-button:hover {
  background: hsl(52, 100%, 50%);
  color: #1a0f0a;
}

.upload-message {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.upload-message.success {
  background: rgba(0, 200, 0, 0.2);
  border: 1px solid rgba(0, 255, 0, 0.5);
  color: #90EE90;
}

.upload-message.error {
  background: rgba(200, 0, 0, 0.2);
  border: 1px solid rgba(255, 0, 0, 0.5);
  color: #FFB6C1;
}

</style>
