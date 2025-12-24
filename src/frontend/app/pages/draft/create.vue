<template>
  <div class="create-draft-page">
    <h1 class="page-title">Create Draft</h1>

    <div class="draft-form">
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
      <!-- Advanced/Testing Options (collapsed by default) -->
      <details class="form-section advanced-section">
        <summary class="form-label">Advanced Options (for testing)</summary>
        
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
          <label for="requiredFirstRoll" class="form-label">Required Bonuses in First Roll:</label>
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
  timerEnabled: false,
  timerDuration: 60,
  cardsPerRoll: 3, // Optional: number of cards to show per roll
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
        timer_enabled: draftSettings.value.timerEnabled.toString(),
        timer_duration: draftSettings.value.timerDuration.toString(),
        cards_per_roll: draftSettings.value.cardsPerRoll.toString(),
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

.form-help {
  font-size: 0.85rem;
  color: rgba(240, 230, 210, 0.7);
  margin-top: 0.25rem;
  font-style: italic;
}
</style>
