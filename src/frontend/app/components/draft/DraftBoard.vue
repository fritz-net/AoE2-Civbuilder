<template>
  <div class="draft-board" @mousemove="handleMouseMove">
    <!-- Header -->
    <div class="board-header">
      <div class="phase-info">
        <h1 class="phase-title">{{ phaseTitle }}</h1>
        <div class="round-info">Round {{ roundNumber }}</div>
      </div>
      
      <!-- Timer (if enabled) -->
      <TimerCountdown
        v-if="timerDuration > 0"
        :duration="timerDuration"
        :auto-start="isMyTurn"
        :show-progress="true"
        @complete="handleTimerComplete"
      />
    </div>

    <!-- Main game area -->
    <div class="game-container">
      <!-- Players sidebar -->
      <div class="players-sidebar">
        <div
          v-for="(player, index) in orderedPlayers"
          :key="player.index"
          class="player-card"
          :class="{ 'player-active': player.index === currentPlayerIndex }"
          @click="$emit('view-player', player.index)"
        >
          <div class="player-flag">
            <canvas
              :ref="(el) => setFlagCanvas(el as HTMLCanvasElement, player.index)"
              :width="85"
              :height="85"
              class="flag-canvas"
            ></canvas>
          </div>
          <div class="player-info">
            <div class="player-civ-name">{{ player.alias || '?' }}</div>
            <div class="player-name">{{ player.name }}</div>
          </div>
        </div>
      </div>

      <!-- Cards board -->
      <div class="cards-board">
        <div class="cards-container">
          <DraftCard
            v-for="(card, index) in displayCards"
            :key="index"
            :card="card"
            :size="cardSize"
            :margin="cardMargin"
            :selectable="isCardSelectable(index)"
            :disabled="isCardDisabled(index)"
            :hidden="card.hidden"
            @select="handleCardSelect"
            @hover="handleCardHover"
            @unhover="handleCardUnhover"
          />
        </div>
        
        <!-- Fill/Reroll toolbar at bottom (only shown when it's your turn and there are empty slots) -->
        <div v-if="isMyTurn && hasEmptySlots" class="board-toolbar">
          <button 
            class="toolbar-btn refill-btn" 
            @click="$emit('refill')"
            @mouseenter="handleToolbarHover('Fill empty card slots with new cards')"
            @mouseleave="handleToolbarUnhover"
          >
            Refill
          </button>
          <button 
            class="toolbar-btn clear-btn" 
            @click="$emit('clear')"
            @mouseenter="handleToolbarHover('Remove all cards and get a fresh set')"
            @mouseleave="handleToolbarUnhover"
          >
            Reroll
          </button>
        </div>
      </div>
      
      <!-- Bonuses sidebar (shows currently selected bonuses) -->
      <DraftSidebar
        v-if="currentPlayerData"
        :player="currentPlayerData"
        :show-bonuses="true"
        class="bonuses-sidebar"
      />
    </div>
    
    <!-- Mouse-following help tooltip -->
    <div 
      v-show="hoveredCard || tooltipText" 
      class="help-tooltip"
      :class="hoveredCard ? `rarity-border-${hoveredCard.rarity || 0}` : ''"
      :style="tooltipStyle"
    >
      <div class="help-content">
        <div v-if="hoveredCard" class="tooltip-inner">
          <span :class="'rarity-text rarity-' + (hoveredCard.rarity || 0)">
            {{ rarityNames[hoveredCard.rarity || 0] }}
          </span>
          <p class="card-description">{{ hoveredCard.description || hoveredCard.name }}</p>
        </div>
        <div v-else-if="tooltipText" class="tooltip-inner">
          <p class="card-description">{{ tooltipText }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import DraftCard from './DraftCard.vue'
import DraftSidebar from './DraftSidebar.vue'
import TimerCountdown from './TimerCountdown.vue'
import { rarityNames } from '~/composables/useBonusData'
import { colours } from '~/composables/useCivData'
import type { DraftPlayer } from '~/composables/useDraft'

interface DisplayCard {
  id: number
  type: number
  rarity?: number
  name?: string
  description?: string
  hidden?: boolean
  index?: number  // Position in the cards array (for highlighted check)
}

const props = withDefaults(defineProps<{
  phaseTitle: string
  roundNumber: number
  players: DraftPlayer[]
  playerOrder: number[]
  currentPlayerIndex: number
  cards: DisplayCard[]
  isMyTurn: boolean
  timerDuration?: number
  myPlayerIndex?: number // The player viewing this board
  highlighted?: number[] // Array of card indices that can be selected (selection limit)
}>(), {
  timerDuration: 0,
  myPlayerIndex: -1,
  highlighted: () => [],
})

const emit = defineEmits<{
  (e: 'select-card', card: DisplayCard): void
  (e: 'view-player', playerIndex: number): void
  (e: 'timer-complete'): void
  (e: 'refill'): void
  (e: 'clear'): void
}>()

const hoveredCard = ref<DisplayCard | null>(null)
const tooltipText = ref<string | null>(null)
const flagCanvasRefs = ref<Map<number, HTMLCanvasElement>>(new Map())
const mousePosition = ref({ x: 0, y: 0 })

// Ordered players based on draft order
const orderedPlayers = computed(() => {
  return props.playerOrder.map((index) => ({
    ...props.players[index],
    index,
  }))
})

// Get the current player data (the one viewing this board)
const currentPlayerData = computed(() => {
  if (props.myPlayerIndex >= 0 && props.players && props.myPlayerIndex < props.players.length) {
    return props.players[props.myPlayerIndex]
  }
  return null
})

// Check if there are empty slots (cards with id -1)
const hasEmptySlots = computed(() => {
  return props.cards.some(card => card.id === -1)
})

// Display cards with computed properties
const displayCards = computed(() => {
  return props.cards.map((card, index) => ({
    ...card,
    index, // Add index for highlighted check
    hidden: card.id === -1 || card.hidden,
  }))
})

// Check if a card is selectable (respects highlighted array like legacy code)
const isCardSelectable = (index: number): boolean => {
  if (!props.isMyTurn) return false
  if (props.cards[index]?.id === -1) return false
  
  // If highlighted array is empty, all visible cards are selectable
  if (!props.highlighted || props.highlighted.length === 0) {
    return true
  }
  
  // If highlighted array has values, only those indices are selectable
  return props.highlighted.includes(index)
}

// Check if a card should be disabled (greyed out)
const isCardDisabled = (index: number): boolean => {
  if (!props.isMyTurn) return true
  if (props.cards[index]?.id === -1) return true
  
  // If highlighted array has values and this card isn't in it, disable it
  if (props.highlighted && props.highlighted.length > 0 && !props.highlighted.includes(index)) {
    return true
  }
  
  return false
}

// Card sizing based on number of cards
const cardSize = computed(() => {
  const count = props.cards.length
  if (count < 9) return 16
  if (count < 13) return 12
  if (count < 15) return 11
  if (count < 19) return 10
  if (count < 25) return 9
  if (count < 33) return 8
  if (count < 45) return 7
  return 6
})

const cardMargin = computed(() => {
  const count = props.cards.length
  if (count < 19) return 1
  if (count < 33) return 0.5
  return 0.3
})

// Tooltip positioning - follows mouse
const tooltipStyle = computed(() => {
  const offset = 15 // pixels from cursor
  return {
    left: `${mousePosition.value.x + offset}px`,
    top: `${mousePosition.value.y + offset}px`,
  }
})

// Draw flag on canvas for a player
const drawFlag = (canvas: HTMLCanvasElement, palette: number[]) => {
  const ctx = canvas.getContext('2d')
  if (!ctx || !palette || palette.length < 8) {
    // Draw a default gray flag if palette is invalid
    if (ctx) {
      ctx.fillStyle = '#808080'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    return
  }
  
  const width = canvas.width
  const height = canvas.height
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height)
  
  // Get colors from palette
  const color1 = colours[palette[0]] || [128, 128, 128]
  const color2 = colours[palette[1]] || [128, 128, 128]
  const color3 = colours[palette[2]] || [128, 128, 128]
  const division = palette[5] || 0
  
  // Draw base color
  ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
  ctx.fillRect(0, 0, width, height)
  
  // Draw division pattern
  switch (division) {
    case 0:
      // Solid - already filled
      break
    case 1:
      // Halves split vertically
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(width / 2, 0, width / 2, height)
      break
    case 2:
      // Halves split horizontally
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(0, height / 2, width, height / 2)
      break
    case 3:
      // Thirds split vertically
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(width / 3, 0, width / 3, height)
      ctx.fillStyle = `rgb(${color3[0]}, ${color3[1]}, ${color3[2]})`
      ctx.fillRect(2 * width / 3, 0, width / 3, height)
      break
    case 4:
      // Thirds split horizontally
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(0, height / 3, width, height / 3)
      ctx.fillStyle = `rgb(${color3[0]}, ${color3[1]}, ${color3[2]})`
      ctx.fillRect(0, 2 * height / 3, width, height / 3)
      break
    case 5:
      // Quarters - opposite corners same color
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(0, height / 2, width / 2, height / 2)
      ctx.fillRect(width / 2, 0, width / 2, height / 2)
      break
    case 7:
    case 8:
      // Diagonal halves
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.beginPath()
      if (division === 7) {
        ctx.moveTo(0, 0)
        ctx.lineTo(width, height)
        ctx.lineTo(0, height)
      } else {
        ctx.moveTo(width, 0)
        ctx.lineTo(0, height)
        ctx.lineTo(width, height)
      }
      ctx.closePath()
      ctx.fill()
      break
    default:
      // For other patterns, just show two colors
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(width / 2, 0, width / 2, height)
  }
}

const setFlagCanvas = (canvas: HTMLCanvasElement | null, playerIndex: number) => {
  if (canvas) {
    flagCanvasRefs.value.set(playerIndex, canvas)
    // Draw flag immediately if we have player data
    const player = props.players[playerIndex]
    if (player?.flag_palette) {
      drawFlag(canvas, player.flag_palette)
    }
  }
}

// Watch for player changes to update flags
// Deep watch is intentional as player flag_palette can change at various points
// (e.g., after Phase 1 when players submit their civ info)
watch(() => props.players, () => {
  nextTick(() => {
    flagCanvasRefs.value.forEach((canvas, playerIndex) => {
      const player = props.players[playerIndex]
      if (player?.flag_palette) {
        drawFlag(canvas, player.flag_palette)
      }
    })
  })
}, { deep: true })

const handleMouseMove = (event: MouseEvent) => {
  mousePosition.value = { x: event.clientX, y: event.clientY }
}

const handleCardSelect = (card: DisplayCard) => {
  // Card must have a valid index to be selected
  if (typeof card.index !== 'number' || card.index < 0) {
    console.error('Card selection attempted without valid index')
    return
  }
  
  if (props.isMyTurn && !card.hidden && isCardSelectable(card.index)) {
    emit('select-card', card)
  }
}

const handleCardHover = (card: DisplayCard) => {
  hoveredCard.value = card
}

const handleCardUnhover = () => {
  hoveredCard.value = null
}

const handleToolbarHover = (text: string) => {
  tooltipText.value = text
}

const handleToolbarUnhover = () => {
  tooltipText.value = null
}

const handleTimerComplete = () => {
  emit('timer-complete')
}

onMounted(() => {
  // Initialize any necessary setup
})
</script>

<style scoped>
.draft-board {
  width: 100%;
  min-height: 100vh;
  background: url('/img/draftbackground.jpg') center/cover;
  display: flex;
  flex-direction: column;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: rgba(0, 0, 0, 0.7);
  border-bottom: 3px solid hsl(52, 100%, 50%);
}

.phase-info {
  flex: 1;
}

.phase-title {
  margin: 0;
  font-size: 2.5rem;
  color: hsl(52, 100%, 50%);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.round-info {
  font-size: 1.2rem;
  color: #f0e6d2;
  margin-top: 0.5rem;
}

.game-container {
  flex: 1;
  display: flex;
  gap: 1rem;
  padding: 1rem;
  overflow: hidden;
}

.players-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 200px;
  flex-shrink: 0;
}

.player-card {
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  border: 2px solid rgba(255, 204, 0, 0.5);
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.player-card:hover {
  border-color: hsl(52, 100%, 50%);
  box-shadow: 0 0 12px rgba(255, 204, 0, 0.4);
  transform: translateX(5px);
}

.player-active {
  border-color: rgb(0, 200, 0);
  border-width: 3px;
  box-shadow: 0 0 16px rgba(0, 200, 0, 0.6);
}

.player-flag {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
}

.flag-canvas {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  border: 1px solid rgba(255, 204, 0, 0.3);
}

.player-info {
  flex: 1;
  min-width: 0;
}

.player-civ-name {
  color: hsl(52, 100%, 50%);
  font-weight: bold;
  font-size: 0.95rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-name {
  color: #f0e6d2;
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cards-board {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
}

.cards-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-content: flex-start;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  min-height: 400px;
}

/* Mouse-following tooltip - matches /build style with black background and colored border */
.help-tooltip {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
  max-width: 350px;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.95);
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

/* Rarity border colors */
.rarity-border-0 { border-color: #b0b0b0; } /* Ordinary - Gray */
.rarity-border-1 { border-color: #4ade80; } /* Distinguished - Green */
.rarity-border-2 { border-color: #60a5fa; } /* Superior - Blue */
.rarity-border-3 { border-color: #c084fc; } /* Epic - Purple */
.rarity-border-4 { border-color: #fbbf24; } /* Legendary - Orange */

.help-content {
  color: hsl(52, 100%, 50%);
}

.tooltip-inner {
  text-align: left;
}

.rarity-text {
  display: block;
  font-size: 0.85rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.rarity-0 { color: #b0b0b0; } /* Ordinary - Gray */
.rarity-1 { color: #4ade80; } /* Distinguished - Green */
.rarity-2 { color: #60a5fa; } /* Superior - Blue */
.rarity-3 { color: #c084fc; } /* Epic - Purple */
.rarity-4 { color: #fbbf24; } /* Legendary - Orange */

.card-description {
  margin: 0;
  line-height: 1.4;
  font-size: 1rem;
  color: hsl(52, 100%, 50%);
}

@media (max-width: 1024px) {
  .game-container {
    flex-direction: column;
  }

  .players-sidebar {
    flex-direction: row;
    width: 100%;
    overflow-x: auto;
  }

  .player-card {
    min-width: 150px;
  }
}

@media (max-width: 768px) {
  .board-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .phase-title {
    font-size: 1.8rem;
  }

  .round-info {
    font-size: 1rem;
  }

  .player-flag {
    width: 50px;
    height: 50px;
  }

  .cards-container {
    padding: 0.5rem;
  }
}

/* Bonuses sidebar */
.bonuses-sidebar {
  width: 280px;
  flex-shrink: 0;
  max-height: calc(100vh - 150px);
  overflow-y: auto;
}

/* Board toolbar for Fill/Reroll buttons */
.board-toolbar {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.toolbar-btn {
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  color: hsl(52, 100%, 50%);
}

.toolbar-btn:hover {
  background: hsl(52, 100%, 50%);
  color: #1a0f0a;
  box-shadow: 0 0 12px rgba(255, 204, 0, 0.5);
}

.refill-btn {
  border-color: #4CAF50;
  color: #4CAF50;
}

.refill-btn:hover {
  background: #4CAF50;
  color: white;
}

.clear-btn {
  border-color: #f44336;
  color: #f44336;
}

.clear-btn:hover {
  background: #f44336;
  color: white;
}

@media (max-width: 1200px) {
  .bonuses-sidebar {
    display: none;
  }
}
</style>
