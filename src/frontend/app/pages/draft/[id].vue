<template>
  <div class="draft-spectator-page">
    <!-- Phase 0: Lobby -->
    <div v-if="currentPhase === 0" class="spectator-lobby">
      <h1 class="lobby-title">Draft Lobby - Spectator Mode</h1>
      <div class="lobby-content">
        <p class="spectator-note">You are viewing this draft as a spectator</p>
        
        <div class="player-list">
          <h2>Players</h2>
          <div
            v-for="(player, index) in draft?.players || []"
            :key="index"
            class="player-item"
          >
            <span class="player-index">{{ index === 0 ? 'Host' : `Player ${index + 1}` }}</span>
            <span class="player-name">{{ player.name || '(Waiting...)' }}</span>
            <span v-if="index !== 0" class="player-status">
              {{ player.ready === 1 ? '✓ Ready' : '✗ Not Ready' }}
            </span>
          </div>
        </div>

        <p class="waiting-message">Waiting for host to start the draft...</p>
      </div>
    </div>

    <!-- Phase 1: Setup Phase -->
    <div v-else-if="currentPhase === 1" class="setup-spectator">
      <h1 class="phase-title">Players Customizing Civilizations</h1>
      <div class="spectator-content">
        <div class="loading-spinner"></div>
        <p>Players are setting up their flags, tech trees, and civilization details...</p>
        <p class="hint">The draft will begin once all players are ready.</p>
      </div>
    </div>

    <!-- Phase 2: Draft Cards -->
    <div v-else-if="currentPhase === 2 && draft" class="draft-spectator">
      <DraftBoard
        :phase-title="roundTypeName"
        :round-number="(currentTurn?.roundType || 0) + 1"
        :players="draft.players"
        :player-order="draft.gamestate.order"
        :current-player-index="currentTurn?.playerNum || 0"
        :cards="displayCards"
        :is-my-turn="false"
        :timer-duration="timerDuration"
        :timer-max-duration="timerMaxDuration"
        :timer-paused="isTimerPaused"
        @view-player="handleViewPlayer"
      >
        <template #card-details="{ card }">
          <div v-if="card" class="card-details">
            <h3>{{ card.name }}</h3>
            <p>{{ card.description }}</p>
            <div class="spectator-badge">Spectator Mode - View Only</div>
          </div>
        </template>
      </DraftBoard>

      <!-- Spectator banner -->
      <div class="spectator-banner">
        <span>👁️ Spectator Mode</span>
      </div>
    </div>

    <!-- Phase 3: Tech Tree Customization -->
    <div v-else-if="currentPhase === 3" class="setup-spectator">
      <h1 class="phase-title">Tech Tree Customization</h1>
      <div class="spectator-content">
        <div class="loading-spinner"></div>
        <p>Players are customizing their tech trees...</p>
        <p class="hint">The mod will be created once all players finish.</p>
      </div>
    </div>

    <!-- Phase 5: Creating Mod -->
    <div v-else-if="currentPhase === 5" class="setup-spectator">
      <h1 class="phase-title">Creating Mod...</h1>
      <div class="spectator-content">
        <div class="loading-spinner"></div>
        <p>The mod is being created. Please wait...</p>
      </div>
    </div>

    <!-- Phase 6: Complete -->
    <div v-else-if="currentPhase === 6" class="complete-spectator">
      <h1 class="complete-title">Draft Complete!</h1>
      <div class="complete-content">
        <p>All players have finished and the mod has been created!</p>
        
        <!-- Show all players' final civilizations -->
        <div class="final-civilizations">
          <h2>Final Civilizations</h2>
          <div class="civ-grid">
            <div
              v-for="(player, index) in draft?.players || []"
              :key="index"
              class="civ-summary"
              @click="handleViewPlayer(index)"
            >
              <h3>{{ player.alias || `Player ${index + 1}` }}</h3>
              <p class="player-name-small">{{ player.name }}</p>
              <div class="civ-preview">
                <canvas
                  :ref="(el) => setFlagCanvas(el as HTMLCanvasElement, index)"
                  :width="100"
                  :height="100"
                  class="flag-canvas"
                ></canvas>
                <!-- Show UU if available -->
                <div v-if="getPlayerUU(player)" class="uu-preview">
                  <span class="uu-label">Unique Unit:</span>
                  <span class="uu-name">{{ getPlayerUU(player) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button class="download-button" @click="handleDownload">
            Download Mod
          </button>
          <button class="home-button" @click="goHome">
            Return Home
          </button>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Loading draft...</p>
    </div>

    <!-- Error state -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- Player View Modal -->
    <PlayerViewModal
      :show="showPlayerModal"
      :player="selectedPlayer"
      :player-index="selectedPlayerIndex"
      :techtree-points="draft?.preset?.points || 0"
      @close="closePlayerModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDraft } from '~/composables/useDraft'
import { useBonusData, roundTypeToBonusType } from '~/composables/useBonusData'
import { renderFlagOnCanvas } from '~/composables/useFlagRenderer'
import DraftBoard from '~/components/draft/DraftBoard.vue'
import PlayerViewModal from '~/components/draft/PlayerViewModal.vue'

const route = useRoute()
const router = useRouter()
const draftId = computed(() => route.params.id as string)

const {
  draft,
  isLoading,
  error,
  currentPhase,
  currentTurn,
  roundTypeName,
  timerDuration,
  timerMaxDuration,
  isTimerPaused,
  initSocket,
  loadDraft,
  joinRoom,
  syncTimer,
  setupSocketListeners,
  cleanup,
} = useDraft()

const { getBonusCards, getBonusImageUrl, rarityNames } = useBonusData()

// Player view modal state
const showPlayerModal = ref(false)
const selectedPlayerIndex = ref(-1)
const selectedPlayer = computed(() => {
  if (selectedPlayerIndex.value >= 0 && draft.value?.players) {
    return draft.value.players[selectedPlayerIndex.value]
  }
  return null
})

const flagCanvasRefs = ref<Map<number, HTMLCanvasElement>>(new Map())

const displayCards = computed(() => {
  if (!draft.value) return []
  
  const roundType = currentTurn.value?.roundType || 0
  const bonusType = roundTypeToBonusType(roundType)
  const allCards = getBonusCards(bonusType)
  
  return draft.value.gamestate.cards.map((cardId, index) => {
    if (cardId === -1) {
      return {
        id: cardId,
        type: roundType,
        hidden: true,
        name: '',
        description: '',
        rarity: 0,
        imageVersion: 0,
      }
    }
    
    const cardData = allCards[cardId]
    return {
      id: cardId,
      type: roundType,
      hidden: false,
      name: cardData?.name || `Card ${cardId}`,
      description: cardData?.description || '',
      rarity: cardData?.rarity || 0,
      imageVersion: cardData?.imageVersion || 0,
    }
  })
})

// Get player's unique unit name
const getPlayerUU = (player: any) => {
  if (!player?.bonuses || !player.bonuses[1] || player.bonuses[1].length === 0) {
    return null
  }
  const uuId = player.bonuses[1][0]
  const uuCards = getBonusCards('uu')
  return uuCards[uuId]?.name || null
}

// Draw flag on canvas using player's flag_palette with full rendering
const drawFlag = (canvas: HTMLCanvasElement, palette: number[]) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // Use the full flag renderer with symbols and overlays
  renderFlagOnCanvas(ctx, palette, canvas.width, canvas.height, '/img/symbols')
}

const setFlagCanvas = (canvas: HTMLCanvasElement | null, playerIndex: number) => {
  if (canvas) {
    flagCanvasRefs.value.set(playerIndex, canvas)
    // Draw flag using player's flag_palette
    const player = draft.value?.players?.[playerIndex]
    if (player?.flag_palette) {
      nextTick(() => {
        drawFlag(canvas, player.flag_palette)
      })
    }
  }
}

// Watch for draft changes to redraw flags
watch(() => draft.value?.players, (players) => {
  if (players) {
    nextTick(() => {
      flagCanvasRefs.value.forEach((canvas, index) => {
        const player = players[index]
        if (player?.flag_palette) {
          drawFlag(canvas, player.flag_palette)
        }
      })
    })
  }
}, { deep: true })

const handleViewPlayer = (playerIndex: number) => {
  // Spectators can always view all players
  if (draft.value?.players && playerIndex >= 0 && playerIndex < draft.value.players.length) {
    selectedPlayerIndex.value = playerIndex
    showPlayerModal.value = true
  }
}

const closePlayerModal = () => {
  showPlayerModal.value = false
  selectedPlayerIndex.value = -1
}

const handleDownload = () => {
  if (!draft.value) return
  
  // Validate that draft ID is a safe numeric string (server-generated ID)
  const draftId = draft.value.id
  if (!/^\d+$/.test(draftId)) {
    console.error('Invalid draft ID format')
    return
  }
  
  // Create a form and submit it to trigger download (like legacy code)
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = '/download'
  form.style.display = 'none'
  
  const input = document.createElement('input')
  input.type = 'hidden'
  input.name = 'draftID'
  input.value = draftId
  
  form.appendChild(input)
  document.body.appendChild(form)
  form.submit()
  document.body.removeChild(form)
}

const goHome = () => {
  // Navigate to home page - use navigateTo for proper Nuxt routing
  navigateTo('/')
}

onMounted(async () => {
  // Initialize socket first (async - loads script)
  await initSocket()
  
  // Setup listeners before loading so we can receive the gamestate
  setupSocketListeners()
  
  // Load draft - this will use socket.io to get gamestate
  await loadDraft(draftId.value)
  
  // Start periodic timer sync for phase 2 (every second)
  const timerSyncInterval = setInterval(() => {
    if (draft.value && draft.value.gamestate.phase === 2 && draft.value.preset.timer_enabled) {
      syncTimer()
    }
  }, 1000)
  
  // Clean up interval on unmount
  onUnmounted(() => {
    clearInterval(timerSyncInterval)
  })
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.draft-spectator-page {
  min-height: 100vh;
}

.spectator-lobby {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 2rem;
}

.lobby-title {
  font-size: 3rem;
  color: hsl(52, 100%, 50%);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  margin-bottom: 2rem;
  text-align: center;
}

.lobby-content {
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  border: 3px solid hsl(52, 100%, 50%);
  border-radius: 8px;
  padding: 2rem;
  min-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
}

.spectator-note {
  color: hsl(39, 100%, 60%);
  text-align: center;
  font-style: italic;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

.player-list h2 {
  color: hsl(52, 100%, 50%);
  margin: 0 0 1rem 0;
  text-align: center;
}

.player-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.player-index {
  color: hsl(52, 100%, 50%);
  font-weight: bold;
}

.player-name {
  color: #f0e6d2;
}

.player-status {
  color: #f0e6d2;
  font-size: 0.9rem;
}

.waiting-message {
  color: #f0e6d2;
  text-align: center;
  margin-top: 1.5rem;
  font-size: 1.1rem;
}

.setup-spectator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 2rem;
}

.phase-title {
  font-size: 3rem;
  color: hsl(52, 100%, 50%);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  margin-bottom: 2rem;
  text-align: center;
}

.spectator-content {
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  border: 3px solid hsl(52, 100%, 50%);
  border-radius: 8px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
}

.spectator-content p {
  color: #f0e6d2;
  font-size: 1.2rem;
  margin: 1rem 0;
}

.hint {
  color: hsl(39, 100%, 60%);
  font-style: italic;
}

.draft-spectator {
  position: relative;
  min-height: 100vh;
}

.spectator-banner {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid hsl(39, 100%, 50%);
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  color: hsl(39, 100%, 60%);
  font-weight: bold;
  font-size: 1.1rem;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
}

.complete-spectator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 2rem;
}

.complete-title {
  font-size: 4rem;
  color: hsl(52, 100%, 50%);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  margin-bottom: 2rem;
}

.complete-content {
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  border: 3px solid hsl(52, 100%, 50%);
  border-radius: 8px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  max-width: 1000px;
}

.complete-content > p {
  color: #f0e6d2;
  font-size: 1.3rem;
  margin: 1rem 0;
}

.final-civilizations {
  margin: 2rem 0;
}

.final-civilizations h2 {
  color: hsl(52, 100%, 50%);
  margin-bottom: 1.5rem;
}

.civ-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.civ-summary {
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 204, 0, 0.5);
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.civ-summary:hover {
  border-color: hsl(52, 100%, 50%);
  box-shadow: 0 0 12px rgba(255, 204, 0, 0.4);
  transform: translateY(-4px);
}

.civ-summary h3 {
  color: hsl(52, 100%, 50%);
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
}

.player-name {
  color: #f0e6d2;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.civ-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.flag-canvas {
  border-radius: 4px;
  border: 2px solid rgba(255, 204, 0, 0.3);
}

.uu-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 0.5rem;
}

.uu-label {
  color: hsl(52, 100%, 50%);
  font-size: 0.8rem;
  font-weight: bold;
}

.uu-name {
  color: #f0e6d2;
  font-size: 0.9rem;
}

.player-name-small {
  color: #f0e6d2;
  font-size: 0.9rem;
  margin: 0.25rem 0;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.download-button,
.home-button {
  padding: 1rem 2rem;
  font-size: 1.2rem;
  font-weight: bold;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  color: hsl(52, 100%, 50%);
  cursor: pointer;
  transition: all 0.2s ease;
}

.download-button:hover,
.home-button:hover {
  background: hsl(52, 100%, 50%);
  color: #1a0f0a;
  box-shadow: 0 0 12px rgba(255, 204, 0, 0.5);
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 204, 0, 0.3);
  border-top-color: hsl(52, 100%, 50%);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-overlay p {
  color: hsl(52, 100%, 50%);
  font-size: 1.5rem;
  margin-top: 1rem;
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
  .lobby-title,
  .phase-title {
    font-size: 2rem;
  }

  .complete-title {
    font-size: 2.5rem;
  }

  .lobby-content {
    min-width: 300px;
    padding: 1.5rem;
  }

  .spectator-content {
    padding: 2rem 1rem;
  }

  .complete-content {
    padding: 2rem 1rem;
  }

  .civ-grid {
    grid-template-columns: 1fr;
  }

  .spectator-banner {
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
}
</style>
