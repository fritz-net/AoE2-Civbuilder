<template>
  <div class="draft-player-page">
    <!-- Join Form (before entering lobby) -->
    <div v-if="needsToJoin" class="join-phase">
      <h1 class="join-title">Civilization Drafter</h1>
      <form class="join-box" @submit.prevent="handleJoin">
        <label for="playerName" class="join-label">Player (or Team) Name</label>
        <input
          id="playerName"
          v-model="playerName"
          type="text"
          class="join-input"
          placeholder="Enter your name"
          required
          maxlength="30"
        />
        <button type="submit" class="join-button" :disabled="isJoining">
          {{ isJoining ? 'Joining...' : 'Join Draft' }}
        </button>
      </form>
    </div>

    <!-- Phase 0: Lobby -->
    <DraftLobby
      v-else-if="currentPhase === 0"
      :players="draft?.players || []"
      :player-number="playerNumber"
      :is-host="isHost"
      :current-player="currentPlayer"
      @start="handleStartDraft"
      @toggle-ready="handleToggleReady"
    />

    <!-- Phase 1: Flag, Architecture, Language, Civ Name (NO Tech Tree) -->
    <div v-else-if="currentPhase === 1" class="setup-phase">
      <!-- If player is ready or waiting, show waiting screen -->
      <div v-if="isWaitingPhase1 || currentPlayer?.ready === 1" class="waiting-screen">
        <h1 class="waiting-title">Waiting For Players</h1>
        <div class="waiting-phase-box">
          <div class="loading-spinner"></div>
          <p>Other players are still customizing their civilizations...</p>
        </div>
      </div>

      <!-- Otherwise, show setup -->
      <div v-else>
        <h1 class="phase-title">Customize Your Civilization</h1>
        
        <div class="setup-container single-column">
          <!-- Flag Creator -->
          <div class="setup-section">
            <h2>Flag & Basic Info</h2>
            <FlagCreator
              v-model="civConfig.flag_palette"
              v-model:custom-flag="civConfig.customFlag"
              v-model:custom-flag-data="civConfig.customFlagData"
            />

            <ArchitectureSelector v-model="civConfig.architecture" />
            <LanguageSelector v-model="civConfig.language" />
            
            <div class="civ-name-input">
              <label for="civName">Civilization Name</label>
              <input
                id="civName"
                v-model="civConfig.alias"
                type="text"
                placeholder="Enter civilization name"
                maxlength="30"
              />
            </div>
          </div>
        </div>

        <button class="next-button" @click="handleSaveCivInfo">
          Next
        </button>
      </div>
    </div>

    <!-- Phase 2: Draft Cards -->
    <div v-else-if="currentPhase === 2 && draft" class="draft-phase">
      <DraftBoard
        :phase-title="roundTypeName"
        :round-number="(currentTurn?.roundType || 0) + 1"
        :players="draft.players"
        :player-order="draft.gamestate.order"
        :current-player-index="currentTurn?.playerNum || 0"
        :cards="displayCards"
        :is-my-turn="currentTurn?.isMyTurn || false"
        :my-player-index="playerNumber"
        :timer-duration="timerDuration"
        :timer-max-duration="timerMaxDuration"
        :timer-paused="isTimerPaused"
        :is-host="isHost"
        :highlighted="draft.gamestate.highlighted || []"
        @select-card="handleSelectCard"
        @view-player="handleViewPlayer"
        @timer-complete="handleTimerComplete"
        @timer-pause="handleTimerPause"
        @timer-resume="handleTimerResume"
        @refill="handleRefill"
        @clear="handleClear"
      />
    </div>

    <!-- Phase 3: Tech Tree (after drafting, shows selected bonuses in sidebar) -->
    <div v-else-if="currentPhase === 3" class="techtree-phase">
      <!-- Show waiting screen if done with tech tree -->
      <template v-if="isWaitingPhase3 || currentPlayer?.ready === 1">
        <div class="waiting-phase">
          <h1 class="phase-title">Waiting For Players</h1>
          <div class="waiting-phase-box">
            <div class="loading-spinner"></div>
            <p class="waiting-text">Your tech tree has been saved. Waiting for other players...</p>
          </div>
        </div>
      </template>
      
      <!-- Show tech tree if not done yet -->
      <template v-else>
        <TechTree
          v-model="civConfig.tree"
          :points="techTreePoints"
          :editable="true"
          :relative-path="techtreePath"
          :show-pastures="showPasturesInTechtree"
          :sidebar-content="sidebarContent"
          :sidebar-title="sidebarTitle"
          mode="draft"
          @done="handleTechTreeDone"
        />
      </template>
    </div>

    <!-- Phase 5: Creating Mod -->
    <div v-else-if="currentPhase === 5" class="creating-phase">
      <h1 class="phase-title">Creating Mod...</h1>
      <div class="waiting-phase-box">
        <div class="loading-spinner"></div>
        <p class="creating-text">The host is creating the mod. Please wait...</p>
      </div>
    </div>

    <!-- Phase 6: Download -->
    <div v-else-if="currentPhase === 6" class="download-phase">
      <h1 class="phase-title">Mod Created!</h1>
      <div class="download-content">
        <p class="download-info">The host has created the mod. You can download it below:</p>
        
        <button class="download-button" @click="handleDownload">
          Download Mod
        </button>
        
        <div class="instructions-box">
          <p class="instructions-title"><b>Note:</b></p>
          <p class="instructions-text">
            The host will publish the mod to ageofempires.com.<br><br>
            Once published, they will share the mod link with you.<br><br>
            Subscribe to both the Data Mod and UI Mod to play!
          </p>
        </div>
        
        <button class="home-button" @click="goHome">
          Return Home
        </button>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDraft } from '~/composables/useDraft'
import { useBonusData, roundTypeToBonusType } from '~/composables/useBonusData'
import { PASTURES_BONUS_ID } from '~/composables/useCivConstants'
import type { CivConfig } from '~/composables/useCivData'
import DraftLobby from '~/components/draft/DraftLobby.vue'
import DraftBoard from '~/components/draft/DraftBoard.vue'
import FlagCreator from '~/components/FlagCreator.vue'
import ArchitectureSelector from '~/components/ArchitectureSelector.vue'
import LanguageSelector from '~/components/LanguageSelector.vue'
import TechTree from '~/components/TechTree.vue'
import PlayerViewModal from '~/components/draft/PlayerViewModal.vue'

const config = useRuntimeConfig()
const route = useRoute()
const router = useRouter()
const draftId = computed(() => route.params.id as string)

// Derive techtree path from runtime config
const techtreePath = computed(() => {
  const baseURL = config.app.baseURL || '/v2/'
  const parentPath = baseURL.replace(/\/v2\/?$/, '') || '/'
  return parentPath.replace(/\/$/, '') + '/aoe2techtree'
})

// Join form state
const needsToJoin = ref(true)
const playerName = ref('')
const isJoining = ref(false)

// Local waiting state (for Phase 1 and Phase 3 transitions)
const isWaitingPhase1 = ref(false)
const isWaitingPhase3 = ref(false)

const {
  draft,
  playerNumber,
  isLoading,
  error,
  isHost,
  currentPlayer,
  currentPhase,
  currentTurn,
  roundTypeName,
  timerDuration,
  timerMaxDuration,
  isTimerPaused,
  initSocket,
  loadDraft,
  joinRoom,
  updateReady,
  startDraft,
  updateTree,
  updateCivInfo,
  selectCard,
  refillCards,
  clearCards,
  pauseTimer,
  resumeTimer,
  notifyTimerExpired,
  syncTimer,
  setupSocketListeners,
  cleanup,
} = useDraft()

const { getBonusCards, getBonusImageUrl, rarityNames } = useBonusData()

// Civ configuration for setup phase
const civConfig = ref<CivConfig>({
  alias: '',
  flag_palette: [3, 4, 5, 6, 7, 3, 3, 3],
  tree: [
    [13, 17, 21, 74, 545, 539, 331, 125, 83, 128, 440],
    [12, 45, 49, 50, 68, 70, 72, 79, 82, 84, 87, 101, 103, 104, 109, 199, 209, 276, 562, 584, 598, 621, 792],
    [22, 101, 102, 103, 408],
  ],
  bonuses: [[], [], [], [], []],
  architecture: 1,
  language: 0,
  wonder: 0,
  castle: 0,
  customFlag: false,
  customFlagData: '',
  description: '',
})

const techTreePoints = computed(() => {
  return draft.value?.preset.points || 250
})

// Player view modal state
const showPlayerModal = ref(false)
const selectedPlayerIndex = ref(-1)
const selectedPlayer = computed(() => {
  if (selectedPlayerIndex.value >= 0 && draft.value?.players) {
    return draft.value.players[selectedPlayerIndex.value]
  }
  return null
})

const showPasturesInTechtree = computed(() => {
  // Check if PASTURES_BONUS_ID is selected in civ bonuses (bonuses[0] array)
  if (!currentPlayer.value?.bonuses?.[0]) return false
  return currentPlayer.value.bonuses[0].includes(PASTURES_BONUS_ID)
})

// Generate sidebar HTML content from player's selected bonuses
const sidebarContent = computed(() => {
  if (!currentPlayer.value) return '<p>No player data available</p>'
  
  const player = currentPlayer.value
  
  // Check if player has any bonuses at all
  if (!player.bonuses || !Array.isArray(player.bonuses)) {
    return '<p>Loading bonuses...</p>'
  }
  
  // Get all bonus cards by type
  const allCards = {
    civBonuses: getBonusCards('civ'),
    uniqueUnits: getBonusCards('uu'),
    castleTechs: getBonusCards('castle'),
    imperialTechs: getBonusCards('imp'),
    teamBonuses: getBonusCards('team'),
  }
  
  let html = ''
  let hasAnyBonus = false
  
  // Civilization Bonuses
  if (player.bonuses[0] && Array.isArray(player.bonuses[0]) && player.bonuses[0].length > 0) {
    html += '<h3>Civilization Bonuses</h3><ul>'
    player.bonuses[0].forEach((id: number) => {
      const bonus = allCards.civBonuses[id]
      if (bonus && bonus.name) {
        html += `<li>${bonus.name}</li>`
        hasAnyBonus = true
      }
    })
    html += '</ul>'
  }
  
  // Unique Unit
  if (player.bonuses[1] && Array.isArray(player.bonuses[1]) && player.bonuses[1].length > 0) {
    const unitId = player.bonuses[1][0]
    const unit = allCards.uniqueUnits[unitId]
    if (unit && unit.name) {
      if (hasAnyBonus) html += '<hr>'
      html += `<h3>Unique Unit</h3><p>${unit.name}</p>`
      hasAnyBonus = true
    }
  }
  
  // Castle Age Tech
  if (player.bonuses[2] && Array.isArray(player.bonuses[2]) && player.bonuses[2].length > 0) {
    const techId = player.bonuses[2][0]
    const tech = allCards.castleTechs[techId]
    if (tech && tech.name) {
      if (hasAnyBonus) html += '<hr>'
      html += `<h3>Castle Age Tech</h3><p>${tech.name}</p>`
      hasAnyBonus = true
    }
  }
  
  // Imperial Age Tech
  if (player.bonuses[3] && Array.isArray(player.bonuses[3]) && player.bonuses[3].length > 0) {
    const techId = player.bonuses[3][0]
    const tech = allCards.imperialTechs[techId]
    if (tech && tech.name) {
      if (hasAnyBonus) html += '<hr>'
      html += `<h3>Imperial Age Tech</h3><p>${tech.name}</p>`
      hasAnyBonus = true
    }
  }
  
  // Team Bonus
  if (player.bonuses[4] && Array.isArray(player.bonuses[4]) && player.bonuses[4].length > 0) {
    const bonusId = player.bonuses[4][0]
    const bonus = allCards.teamBonuses[bonusId]
    if (bonus && bonus.name) {
      if (hasAnyBonus) html += '<hr>'
      html += `<h3>Team Bonus</h3><p>${bonus.name}</p>`
      hasAnyBonus = true
    }
  }
  
  // If no bonuses were found, this shouldn't happen in tech tree phase
  if (!hasAnyBonus) {
    return '<p style="color: #f00;">Error: No bonuses found. This is a bug.</p>'
  }
  
  return html
})

const sidebarTitle = computed(() => {
  return currentPlayer.value?.alias || currentPlayer.value?.name || 'Your Civilization'
})

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

const handleJoin = async () => {
  if (!playerName.value.trim()) return
  
  isJoining.value = true
  
  try {
    // POST to /join endpoint to register as player (joinType=1)
    const response = await fetch('/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        draftID: draftId.value,
        civ_name: playerName.value.trim(),
        joinType: '1', // 1 = player (non-host)
      }).toString(),
      redirect: 'manual', // Don't follow redirect, we'll handle it
    })
    
    // After successful join, reload the page to get cookies
    if (response.ok || response.type === 'opaqueredirect') {
      // Reload to get new cookies and show lobby
      window.location.reload()
    } else {
      const text = await response.text()
      throw new Error(text || 'Failed to join draft')
    }
  } catch (err) {
    console.error('Failed to join draft:', err)
    error.value = err instanceof Error ? err.message : 'Failed to join draft'
    isJoining.value = false
  }
}

const handleStartDraft = () => {
  // Only host can start
  if (isHost.value) {
    startDraft()
  }
}

const handleToggleReady = () => {
  if (playerNumber.value >= 0) {
    updateReady(playerNumber.value)
  }
}

// Phase 1: Save civ info (flag, architecture, language, civ name) - NO tech tree
const handleSaveCivInfo = () => {
  if (playerNumber.value >= 0) {
    // Immediately show waiting screen (optimistic update like legacy code)
    isWaitingPhase1.value = true
    
    updateCivInfo(
      playerNumber.value,
      civConfig.value.alias,
      civConfig.value.flag_palette,
      civConfig.value.architecture,
      civConfig.value.language
    )
  }
}

// Phase 3: Save tech tree (after card drafting)
const handleSaveTechTree = () => {
  if (playerNumber.value >= 0) {
    // Immediately show waiting screen (optimistic update like legacy code)
    isWaitingPhase3.value = true
    
    updateTree(playerNumber.value, civConfig.value.tree as number[][])
  }
}

// Handle Done button from TechTree component
const handleTechTreeDone = (tree: number[][], _points: number) => {
  // points parameter is passed by TechTree but we only need to save the tree
  civConfig.value.tree = tree
  if (playerNumber.value >= 0) {
    // Immediately show waiting screen (optimistic update like legacy code)
    isWaitingPhase3.value = true
    
    updateTree(playerNumber.value, tree)
  }
}

const handleSelectCard = (card: any) => {
  if (draft.value && currentTurn.value?.isMyTurn) {
    // Send the actual card ID (pick), not the position in array
    // The server expects: socket.emit('end turn', roomID, pick, client_turn)
    // where pick is the card ID (e.g., 245 for bonus card 245)
    selectCard(card.id, draft.value.gamestate.turn)
  }
}

const handleViewPlayer = (playerIndex: number) => {
  // Check if blind picks is enabled
  const blindPicks = draft.value?.preset?.blind_picks || false
  
  // Users can always view their own bonuses
  if (playerIndex === playerNumber.value) {
    selectedPlayerIndex.value = playerIndex
    showPlayerModal.value = true
    return
  }
  
  // If blind picks is enabled, non-spectators (playerNumber >= 0) cannot view other players
  // Note: spectators have playerNumber < 0
  if (blindPicks && playerNumber.value >= 0) {
    console.log('Cannot view other players when blind picks is enabled')
    return
  }
  
  // Show player modal
  if (draft.value?.players && playerIndex >= 0 && playerIndex < draft.value.players.length) {
    selectedPlayerIndex.value = playerIndex
    showPlayerModal.value = true
  }
}

const closePlayerModal = () => {
  showPlayerModal.value = false
  selectedPlayerIndex.value = -1
}

const handleRefill = () => {
  refillCards()
}

const handleClear = () => {
  clearCards()
}

const handleTimerComplete = () => {
  if (draft.value && currentTurn.value?.isMyTurn) {
    // Notify server that timer expired
    notifyTimerExpired(draft.value.gamestate.turn)
  }
}

const handleTimerPause = () => {
  pauseTimer()
}

const handleTimerResume = () => {
  resumeTimer()
}

const handleDownload = () => {
  if (!draft.value) return
  
  // Create a form and submit it to trigger download (like legacy code)
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = '/download'
  form.style.display = 'none'
  
  const input = document.createElement('input')
  input.type = 'hidden'
  input.name = 'draftID'
  input.value = draft.value.id
  
  form.appendChild(input)
  document.body.appendChild(form)
  form.submit()
  document.body.removeChild(form)
}

const goHome = () => {
  // Navigate to home page - use navigateTo for proper Nuxt routing
  navigateTo('/')
}

// Helper to get cookie value
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=')
    if (key === name) {
      return value
    }
  }
  return null
}

onMounted(async () => {
  // Check if already joined (has playerNumber cookie for this draft)
  const playerNumberCookie = getCookie('playerNumber')
  const draftIdCookie = getCookie('draftID')
  
  if (playerNumberCookie !== null && draftIdCookie === draftId.value) {
    // Already joined, skip join form
    needsToJoin.value = false
    
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
  }
  // Otherwise, show join form
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.draft-player-page {
  min-height: 100vh;
  width: 100vw;
}

/* Override default layout for draft pages */
:global(.app-layout) {
  width: 100vw;
  overflow-x: hidden;
}

/* Override default layout padding for draft pages */
:global(.content) {
  padding: 0 !important;
  width: 100vw;
}

/* Join Form Styles */
.join-phase {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 2rem;
}

.join-title {
  font-size: 4rem;
  color: hsl(52, 100%, 50%);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  font-family: 'TrajanPro', serif;
  margin-bottom: 2rem;
}

.join-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  border: 3px solid hsl(52, 100%, 50%);
  border-radius: 8px;
  padding: 2rem 3rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
}

.join-label {
  font-size: 1.3rem;
  color: hsl(52, 100%, 50%);
  font-weight: bold;
}

.join-input {
  width: 300px;
  padding: 0.75rem 1rem;
  font-size: 1.1rem;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 204, 0, 0.5);
  border-radius: 4px;
  color: #f0e6d2;
  text-align: center;
}

.join-input:focus {
  outline: none;
  border-color: hsl(52, 100%, 50%);
  box-shadow: 0 0 8px rgba(255, 204, 0, 0.4);
}

.join-button {
  padding: 0.75rem 2rem;
  font-size: 1.2rem;
  font-weight: bold;
  background: linear-gradient(to bottom, hsl(52, 100%, 50%), hsl(45, 100%, 40%));
  border: 2px solid hsl(52, 100%, 60%);
  border-radius: 4px;
  color: #1a0f0a;
  cursor: pointer;
  transition: all 0.2s ease;
}

.join-button:hover:not(:disabled) {
  background: linear-gradient(to bottom, hsl(52, 100%, 60%), hsl(45, 100%, 50%));
  box-shadow: 0 0 12px rgba(255, 204, 0, 0.5);
}

.join-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.setup-phase {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.phase-title {
  font-size: 3rem;
  color: hsl(52, 100%, 50%);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  text-align: center;
  margin-bottom: 2rem;
}

.waiting-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
}

.waiting-title {
  font-size: 3rem;
  color: hsl(52, 100%, 50%);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  margin-bottom: 2rem;
}

.waiting-content {
  text-align: center;
  margin-bottom: 3rem;
}

.waiting-content p {
  color: #f0e6d2;
  font-size: 1.3rem;
  margin-top: 1rem;
}

.tech-tree-preview {
  width: 100%;
  max-width: 1000px;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  border: 3px solid hsl(52, 100%, 50%);
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
}

.tech-tree-preview h2 {
  color: hsl(52, 100%, 50%);
  text-align: center;
  margin: 0 0 1.5rem 0;
}

.setup-container {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.setup-section {
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  border: 3px solid hsl(52, 100%, 50%);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
}

.setup-section h2 {
  color: hsl(52, 100%, 50%);
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  text-align: center;
}

.tech-tree-section {
  overflow: auto;
  max-height: 70vh;
}

.civ-name-input {
  margin: 1.5rem 0;
}

.civ-name-input label {
  display: block;
  color: hsl(52, 100%, 50%);
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.civ-name-input input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 204, 0, 0.5);
  border-radius: 4px;
  color: #f0e6d2;
}

.civ-name-input input:focus {
  outline: none;
  border-color: hsl(52, 100%, 50%);
  box-shadow: 0 0 8px rgba(255, 204, 0, 0.4);
}

.next-button {
  display: block;
  margin: 0 auto;
  padding: 1rem 3rem;
  font-size: 1.3rem;
  font-weight: bold;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  border: 3px solid hsl(52, 100%, 50%);
  border-radius: 8px;
  color: hsl(52, 100%, 50%);
  cursor: pointer;
  transition: all 0.2s ease;
}

.next-button:hover {
  background: hsl(52, 100%, 50%);
  color: #1a0f0a;
  box-shadow: 0 0 16px rgba(255, 204, 0, 0.6);
}

.draft-phase {
  min-height: 100vh;
}

.draft-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1rem;
  height: 100vh;
}

.draft-main {
  overflow: hidden;
}

.draft-sidebar-container {
  padding: 1rem;
  overflow: hidden;
}

.complete-phase {
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
  max-width: 800px;
}

.complete-content p {
  color: #f0e6d2;
  font-size: 1.3rem;
  margin: 1rem 0;
}

.final-summary {
  margin: 2rem 0;
  text-align: left;
}

.final-summary h2 {
  color: hsl(52, 100%, 50%);
  margin-bottom: 1rem;
  text-align: center;
}

.download-button,
.home-button {
  margin: 1rem 0.5rem;
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

@media (max-width: 1200px) {
  .draft-layout {
    grid-template-columns: 1fr;
    height: auto;
  }

  .draft-sidebar-container {
    max-height: 400px;
  }
}

@media (max-width: 1024px) {
  .setup-container {
    grid-template-columns: 1fr;
  }

  .tech-tree-section {
    max-height: 50vh;
  }
}

@media (max-width: 768px) {
  .phase-title {
    font-size: 2rem;
  }

  .waiting-title {
    font-size: 2rem;
  }

  .complete-title {
    font-size: 2.5rem;
  }

  .setup-phase {
    padding: 1rem;
  }

  .setup-section {
    padding: 1rem;
  }

  .complete-content {
    padding: 2rem 1rem;
  }
}

/* Single column setup (Phase 1 - no tech tree) */
.setup-container.single-column {
  grid-template-columns: 1fr;
  max-width: 600px;
  margin: 0 auto 2rem;
}

/* Tech tree phase (Phase 3) */
.techtree-phase {
  height: 100vh;
  width: 100%;
  padding: 0;
  overflow: hidden;
}

/* Waiting phase */
.waiting-phase {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
}

.waiting-phase-box {
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  border: 3px solid hsl(52, 100%, 50%);
  border-radius: 8px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  max-width: 600px;
}

.waiting-text {
  color: #f0e6d2;
  font-size: 1.2rem;
  margin-top: 2rem;
  text-align: center;
  max-width: 500px;
}

/* Creating phase (Phase 5) */
.creating-phase {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 2rem;
}

.creating-text {
  color: #f0e6d2;
  font-size: 1.2rem;
  margin-top: 2rem;
  text-align: center;
}

/* Download phase (Phase 6) */
.download-phase {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
}

.download-info {
  color: #f0e6d2;
  font-size: 1.2rem;
  margin-bottom: 1rem;
  text-align: center;
}

.download-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  max-width: 800px;
  width: 100%;
}

.instructions-box {
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  border: 3px solid hsl(52, 100%, 50%);
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  width: 100%;
}

.instructions-title {
  color: hsl(52, 100%, 50%);
  font-size: 1.3rem;
  margin: 0 0 1rem 0;
}

.instructions-text {
  color: #f0e6d2;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
}

@media (max-width: 1024px) {
  .techtree-container {
    flex-direction: column;
  }
}
</style>
