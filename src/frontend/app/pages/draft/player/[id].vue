<template>
  <div class="draft-player-page">
    <!-- Phase 0: Lobby -->
    <DraftLobby
      v-if="currentPhase === 0"
      :players="draft?.players || []"
      :player-number="playerNumber"
      :is-host="isHost"
      :current-player="currentPlayer"
      @start="handleStartDraft"
      @toggle-ready="handleToggleReady"
    />

    <!-- Phase 1: Waiting or Setup -->
    <div v-else-if="currentPhase === 1" class="setup-phase">
      <!-- If player is ready, show waiting screen -->
      <div v-if="currentPlayer?.ready === 1" class="waiting-screen">
        <h1 class="waiting-title">Waiting For Players</h1>
        <div class="waiting-content">
          <div class="loading-spinner"></div>
          <p>Other players are still customizing their civilizations...</p>
        </div>
        
        <!-- Show tech tree preview -->
        <div v-if="civConfig.tree" class="tech-tree-preview">
          <h2>Your Tech Tree</h2>
          <TechTree
            v-model="civConfig.tree"
            :points-available="techTreePoints"
            :editable="false"
          />
        </div>
      </div>

      <!-- Otherwise, show setup -->
      <div v-else>
        <h1 class="phase-title">Customize Your Civilization</h1>
        
        <div class="setup-container">
          <!-- Flag Creator -->
          <div class="setup-section">
            <h2>Flag & Basic Info</h2>
            <FlagCreator
              v-model="civConfig.flag_palette"
              v-model:custom-flag="civConfig.customFlag"
              v-model:custom-flag-data="civConfig.customFlagData"
            />
            
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

            <ArchitectureSelector v-model="civConfig.architecture" />
            <LanguageSelector v-model="civConfig.language" />
          </div>

          <!-- Tech Tree -->
          <div class="setup-section tech-tree-section">
            <h2>Tech Tree ({{ techTreePoints }} points available)</h2>
            <TechTree
              v-model="civConfig.tree"
              :points-available="techTreePoints"
              :editable="true"
            />
          </div>
        </div>

        <button class="next-button" @click="handleSaveSetup">
          Ready for Draft
        </button>
      </div>
    </div>

    <!-- Phase 2: Draft Cards -->
    <div v-else-if="currentPhase === 2 && draft" class="draft-phase">
      <div class="draft-layout">
        <!-- Main draft board -->
        <div class="draft-main">
          <DraftBoard
            :phase-title="roundTypeName"
            :round-number="(currentTurn?.roundType || 0) + 1"
            :players="draft.players"
            :player-order="draft.gamestate.order"
            :current-player-index="currentTurn?.playerNum || 0"
            :cards="displayCards"
            :is-my-turn="currentTurn?.isMyTurn || false"
            :timer-duration="0"
            @select-card="handleSelectCard"
            @view-player="handleViewPlayer"
          />
        </div>

        <!-- Sidebar showing selected bonuses -->
        <div class="draft-sidebar-container">
          <DraftSidebar
            :player-name="currentPlayer?.alias"
            :bonuses="selectedBonuses"
          />
        </div>
      </div>
    </div>

    <!-- Phase 3: Complete -->
    <div v-else-if="currentPhase === 3" class="complete-phase">
      <h1 class="complete-title">Draft Complete!</h1>
      <div class="complete-content">
        <p>All players have finished selecting their civilizations.</p>
        <p>Download your mod to play the game!</p>
        
        <!-- Show final civilization summary -->
        <div class="final-summary">
          <h2>Your Civilization: {{ currentPlayer?.alias }}</h2>
          <DraftSidebar
            :player-name="currentPlayer?.alias"
            :bonuses="selectedBonuses"
          />
        </div>

        <button class="download-button" @click="handleDownload">
          Download Mod
        </button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDraft } from '~/composables/useDraft'
import type { CivConfig } from '~/composables/useCivData'
import DraftLobby from '~/components/draft/DraftLobby.vue'
import DraftBoard from '~/components/draft/DraftBoard.vue'
import DraftSidebar from '~/components/draft/DraftSidebar.vue'
import FlagCreator from '~/components/FlagCreator.vue'
import ArchitectureSelector from '~/components/ArchitectureSelector.vue'
import LanguageSelector from '~/components/LanguageSelector.vue'
import TechTree from '~/components/TechTree.vue'

const route = useRoute()
const router = useRouter()
const draftId = computed(() => route.params.id as string)

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
  initSocket,
  loadDraft,
  joinRoom,
  updateReady,
  startDraft,
  updateTree,
  updateCivInfo,
  selectCard,
  setupSocketListeners,
  cleanup,
} = useDraft()

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

const displayCards = computed(() => {
  if (!draft.value) return []
  
  return draft.value.gamestate.cards.map((cardId, index) => ({
    id: cardId,
    type: currentTurn.value?.roundType || 0,
    hidden: cardId === -1,
    name: `Card ${cardId}`,
    description: 'Card description',
  }))
})

// Compute selected bonuses for sidebar
const selectedBonuses = computed(() => {
  if (!currentPlayer.value) {
    return {
      civBonuses: [],
      uniqueUnit: null,
      castleTech: null,
      imperialTech: null,
      teamBonus: null,
    }
  }

  const bonuses = currentPlayer.value.bonuses || [[], [], [], [], []]
  
  return {
    civBonuses: bonuses[0]?.map((b: any) => `Bonus ${b}`) || [],
    uniqueUnit: bonuses[1]?.[0] ? `Unit ${bonuses[1][0]}` : null,
    castleTech: bonuses[2]?.[0] ? `Tech ${bonuses[2][0]}` : null,
    imperialTech: bonuses[3]?.[0] ? `Tech ${bonuses[3][0]}` : null,
    teamBonus: bonuses[4]?.[0] ? `Bonus ${bonuses[4][0]}` : null,
  }
})

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

const handleSaveSetup = () => {
  if (playerNumber.value >= 0) {
    // Update civ info with the correct parameters matching server expectations
    updateCivInfo(
      playerNumber.value,
      civConfig.value.alias,
      civConfig.value.flag_palette,
      civConfig.value.architecture,
      civConfig.value.language
    )
    // Also update tech tree separately
    updateTree(playerNumber.value, civConfig.value.tree as number[][])
  }
}

const handleSelectCard = (card: any) => {
  if (draft.value && currentTurn.value?.isMyTurn) {
    const cardIndex = draft.value.gamestate.cards.indexOf(card.id)
    if (cardIndex >= 0) {
      selectCard(cardIndex, draft.value.gamestate.turn)
    }
  }
}

const handleViewPlayer = (playerIndex: number) => {
  // TODO: Show player's tech tree with their selected bonuses
  console.log('View player:', playerIndex)
}

const handleDownload = () => {
  // TODO: Trigger mod download
  console.log('Download mod')
}

const goHome = () => {
  router.push('/v2')
}

onMounted(async () => {
  // Initialize socket first (async - loads script)
  await initSocket()
  
  // Setup listeners before loading so we can receive the gamestate
  setupSocketListeners()
  
  // Load draft - this will use socket.io to get gamestate
  await loadDraft(draftId.value)
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.draft-player-page {
  min-height: 100vh;
  background: url('/img/aoe2background.jpg') center/cover;
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
</style>
