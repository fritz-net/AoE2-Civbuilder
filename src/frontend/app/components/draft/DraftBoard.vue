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
        ref="timerRef"
        :duration="timerDuration"
        :max-duration="timerMaxDuration"
        :auto-start="!timerPaused"
        :show-progress="true"
        :is-host="isHost"
        :is-paused="timerPaused"
        :show-controls="true"
        @complete="handleTimerComplete"
        @pause="handleTimerPause"
        @resume="handleTimerResume"
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
            @mouseenter="handleToolbarHover(`Fill ${emptySlotCount} empty card slot${emptySlotCount !== 1 ? 's' : ''} with new cards`)"
            @mouseleave="handleToolbarUnhover"
          >
            Refill
          </button>
          <button 
            class="toolbar-btn clear-btn" 
            @click="$emit('clear')"
            @mouseenter="handleToolbarHover(`Clear all ${visibleCardCount} visible cards and get a fresh set`)"
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
      :class="[
        hoveredCard ? `rarity-border-${hoveredCard.rarity || 0}` : '',
        hoveredUnitStats ? 'unit-stats-tooltip' : ''
      ]"
      :style="tooltipStyle"
    >
      <div class="help-content">
        <div v-if="hoveredCard" class="tooltip-inner">
          <span :class="'rarity-text rarity-' + (hoveredCard.rarity || 0)">
            {{ rarityNames[hoveredCard.rarity || 0] }}
          </span>
          
          <!-- Show unit name for unique units -->
          <div v-if="hoveredUnitStats" class="tooltip-name">{{ hoveredCard.name }}</div>
          
          <!-- Unit stats display for unique units -->
          <div v-if="hoveredUnitStats" class="tooltip-unit-stats">
            <!-- Unit graphic -->
            <img 
              :src="getUnitGraphicUrl(hoveredCard.id)" 
              class="unit-graphic"
              :alt="hoveredCard.name"
            />
            
            <!-- Cost with icons -->
            <div class="unit-stats-row">
              <span class="stat-label">Cost:</span>
              <span class="stat-value">
                <template v-if="hoveredUnitStats.cost[0] > 0">
                  <img :src="getStatIconUrl('food')" class="stat-icon" title="Food" />{{ hoveredUnitStats.cost[0] }}
                </template>
                <template v-if="hoveredUnitStats.cost[1] > 0">
                  <img :src="getStatIconUrl('wood')" class="stat-icon" title="Wood" />{{ hoveredUnitStats.cost[1] }}
                </template>
                <template v-if="hoveredUnitStats.cost[2] > 0">
                  <img :src="getStatIconUrl('stone')" class="stat-icon" title="Stone" />{{ hoveredUnitStats.cost[2] }}
                </template>
                <template v-if="hoveredUnitStats.cost[3] > 0">
                  <img :src="getStatIconUrl('gold')" class="stat-icon" title="Gold" />{{ hoveredUnitStats.cost[3] }}
                </template>
              </span>
            </div>
            
            <!-- HP -->
            <div class="unit-stats-row">
              <span class="stat-label">HP:</span>
              <span class="stat-value">
                <img :src="getStatIconUrl('hp')" class="stat-icon" title="Hit Points" />
                {{ formatStatPair(hoveredUnitStats.hp) }}
              </span>
            </div>
            
            <!-- Attack -->
            <div class="unit-stats-row">
              <span class="stat-label">Attack:</span>
              <span class="stat-value">
                <img :src="getAttackIcon(hoveredUnitStats)" class="stat-icon" title="Attack" />
                {{ getBaseAttack(hoveredUnitStats.attacks.basic) }} / {{ getBaseAttack(hoveredUnitStats.attacks.elite) }}
              </span>
            </div>
            
            <!-- Attack Speed (reload time) -->
            <div class="unit-stats-row">
              <span class="stat-label">Attack Speed:</span>
              <span class="stat-value">
                <img :src="getStatIconUrl('reloadTime')" class="stat-icon" title="Attack Speed" />
                {{ formatStatPair(hoveredUnitStats.reload) }}s
              </span>
            </div>
            
            <!-- Range (only show if > 0) -->
            <div class="unit-stats-row" v-if="hoveredUnitStats.range[0] > 0">
              <span class="stat-label">Range:</span>
              <span class="stat-value">
                <img :src="getStatIconUrl('range')" class="stat-icon" title="Range" />
                {{ formatStatPair(hoveredUnitStats.range) }}
              </span>
            </div>
            
            <!-- Movement Speed -->
            <div class="unit-stats-row">
              <span class="stat-label">Speed:</span>
              <span class="stat-value">
                <img :src="getStatIconUrl('movementSpeed')" class="stat-icon" title="Movement Speed" />
                {{ formatStatPair(hoveredUnitStats.speed) }}
              </span>
            </div>
            
            <!-- Armor -->
            <div class="unit-stats-row">
              <span class="stat-label">Armor:</span>
              <span class="stat-value">
                <img :src="getStatIconUrl('armor')" class="stat-icon" title="Melee Armor" />
                <img :src="getStatIconUrl('range-armor')" class="stat-icon" title="Pierce Armor" />
                {{ formatArmorStat(hoveredUnitStats.armors.basic[0], hoveredUnitStats.armors.elite[0]) }} / 
                {{ formatArmorStat(hoveredUnitStats.armors.basic[1], hoveredUnitStats.armors.elite[1]) }}
              </span>
            </div>
            
            <!-- Attack bonuses -->
            <div v-if="formatAttackBonuses(hoveredUnitStats.attacks.elite).length > 0" class="attack-bonuses">
              <div class="stat-label">Attack Bonuses:</div>
              <div 
                v-for="(bonus, index) in formatAttackBonuses(hoveredUnitStats.attacks.elite)" 
                :key="index"
                class="attack-bonus"
              >
                {{ bonus }}
              </div>
            </div>
            
            <!-- Special ability -->
            <div v-if="hoveredUnitStats.special" class="unit-special">
              <strong>Special:</strong> {{ hoveredUnitStats.special }}
            </div>
          </div>
          
          <!-- Regular description for non-unit cards -->
          <p v-else class="card-description">{{ hoveredCard.description || hoveredCard.name }}</p>
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
import { renderFlagOnCanvas } from '~/composables/useFlagRenderer'
import { unitStats, formatAttackBonuses, getBaseAttack, type UnitStats } from '~/composables/useUnitStats'
import type { DraftPlayer } from '~/composables/useDraft'

const config = useRuntimeConfig()

// Derive base path for techtree assets
const techtreeBasePath = computed(() => {
  const baseURL = config.app.baseURL || '/v2/'
  const parentPath = baseURL.replace(/\/v2\/?$/, '') || '/'
  return parentPath.replace(/\/$/, '') + '/aoe2techtree'
})

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
  timerMaxDuration?: number
  timerPaused?: boolean
  myPlayerIndex?: number // The player viewing this board
  highlighted?: number[] // Array of card indices that can be selected (selection limit)
  isHost?: boolean // Whether the current user is the host
}>(), {
  timerDuration: 0,
  timerMaxDuration: 0,
  timerPaused: false,
  myPlayerIndex: -1,
  highlighted: () => [],
  isHost: false,
})

const emit = defineEmits<{
  (e: 'select-card', card: DisplayCard): void
  (e: 'view-player', playerIndex: number): void
  (e: 'timer-complete'): void
  (e: 'refill'): void
  (e: 'clear'): void
  (e: 'timer-pause'): void
  (e: 'timer-resume'): void
}>()

const hoveredCard = ref<DisplayCard | null>(null)
const tooltipText = ref<string | null>(null)
const flagCanvasRefs = ref<Map<number, HTMLCanvasElement>>(new Map())
const mousePosition = ref({ x: 0, y: 0 })
// Cache rendered flag palettes to prevent flickering on re-renders
const renderedFlagPalettes = ref<Map<number, string>>(new Map())

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

// Count of empty slots for tooltip
const emptySlotCount = computed(() => {
  return props.cards.filter(card => card.id === -1).length
})

// Count of visible cards for tooltip
const visibleCardCount = computed(() => {
  return props.cards.filter(card => card.id !== -1).length
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
  // Cards are never selectable when timer is paused (for anyone)
  if (props.timerPaused) return false
  
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
  // Cards are disabled (greyed) when timer is paused (for everyone)
  if (props.timerPaused) return true
  
  // Hidden cards are always disabled
  if (props.cards[index]?.id === -1) return true
  
  // Spectators (myPlayerIndex < 0): cards are NOT greyed when timer is running
  // Non-active players (myPlayerIndex >= 0 && !isMyTurn): cards ARE greyed
  if (props.myPlayerIndex >= 0 && !props.isMyTurn) return true
  
  // For active player: disable cards not in highlighted array (when array has values)
  if (props.isMyTurn && props.highlighted && props.highlighted.length > 0 && !props.highlighted.includes(index)) {
    return true
  }
  
  // All other cards remain enabled (not disabled/greyed out)
  // This includes spectator cards (myPlayerIndex < 0) when timer is running
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

// Get unit stats for unique unit cards (type 1)
const hoveredUnitStats = computed((): UnitStats | null => {
  if (!hoveredCard.value) return null
  // Type 1 = unique units
  if (hoveredCard.value.type !== 1) return null
  
  const stats = unitStats[hoveredCard.value.id]
  return stats || null
})

// Helper functions for unit stats display
function formatStatPair(values: number[]): string {
  if (values.length === 1) return values[0].toString()
  if (values.length === 2 && values[0] === values[1]) return values[0].toString()
  return `${values[0]} / ${values[1]}`
}

function formatArmorStat(basic: number, elite: number): string {
  if (basic === elite) return basic.toString()
  return `${basic}/${elite}`
}

function getUnitGraphicUrl(unitId: number): string {
  return `/v2/img/unitgraphics/uu_${unitId}.jpg`
}

function getStatIconUrl(stat: string): string {
  const iconMap: Record<string, string> = {
    'food': 'food.png',
    'wood': 'wood.png',
    'stone': 'stone.png',
    'gold': 'gold.png',
    'hp': 'hp.png',
    'meleeAttack': 'damage.png',
    'pierceAttack': 'pierceAttack.png',
    'range': 'range.png',
    'reloadTime': 'reloadTime.png',
    'movementSpeed': 'movementSpeed.png',
    'armor': 'armor.png',
    'range-armor': 'range-armor.png',
  }
  return `/v2/img/staticons/${iconMap[stat] || 'hp.png'}`
}

function getAttackIcon(stats: UnitStats): string {
  // Check if the unit has pierce damage (ranged) by looking for class 3 in attacks
  const hasPierceDamage = stats.attacks.basic.some(([classId]) => classId === 3)
  return getStatIconUrl(hasPierceDamage ? 'pierceAttack' : 'meleeAttack')
}

// Draw flag on canvas for a player using the shared flag renderer
const drawFlag = (canvas: HTMLCanvasElement, palette: number[], playerIndex: number) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // Create a cache key from the palette to prevent unnecessary re-renders
  const paletteKey = palette.join(',')
  const cachedKey = renderedFlagPalettes.value.get(playerIndex)
  
  // Skip rendering if palette hasn't changed
  if (cachedKey === paletteKey) return
  
  // Use the full flag renderer with symbols and overlays
  // Symbol images are served from /img/symbols/ by the main server
  renderFlagOnCanvas(ctx, palette, canvas.width, canvas.height, '/img/symbols')
  
  // Cache the rendered palette
  renderedFlagPalettes.value.set(playerIndex, paletteKey)
}

const setFlagCanvas = (canvas: HTMLCanvasElement | null, playerIndex: number) => {
  if (canvas) {
    flagCanvasRefs.value.set(playerIndex, canvas)
    // Draw flag immediately if we have player data
    const player = props.players[playerIndex]
    if (player?.flag_palette) {
      drawFlag(canvas, player.flag_palette, playerIndex)
    }
  }
}

// Watch for player changes to update flags
// Only redraw if palette actually changed (checked in drawFlag)
watch(() => props.players, () => {
  nextTick(() => {
    flagCanvasRefs.value.forEach((canvas, playerIndex) => {
      const player = props.players[playerIndex]
      if (player?.flag_palette) {
        drawFlag(canvas, player.flag_palette, playerIndex)
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

const handleTimerPause = () => {
  emit('timer-pause')
}

const handleTimerResume = () => {
  emit('timer-resume')
}

onMounted(() => {
  // Initialize any necessary setup
})
</script>

<style scoped>
.draft-board {
  width: 100%;
  height: 100vh;
  background: url('/img/draftbackground.jpg') center/cover;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  min-height: 0;
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
  overflow: hidden;
  min-height: 0;
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
  min-height: 200px;
  flex: 1;
  overflow-y: auto;
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

/* Unit stats tooltip styles */
.unit-stats-tooltip {
  max-width: 450px;
}

.tooltip-name {
  font-size: 1.1rem;
  font-weight: bold;
  color: hsl(52, 100%, 50%);
  margin-bottom: 0.5rem;
}

.tooltip-unit-stats {
  margin-top: 0.5rem;
}

.unit-graphic {
  width: 100px;
  height: 100px;
  margin: 0 auto 0.75rem;
  display: block;
  image-rendering: pixelated;
  border: 2px solid rgba(255, 204, 0, 0.4);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
}

.unit-stats-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.2rem 0;
  border-bottom: 1px solid rgba(255, 204, 0, 0.2);
}

.unit-stats-row:last-child {
  border-bottom: none;
}

.stat-label {
  color: rgba(255, 204, 0, 0.8);
  font-size: 0.85rem;
  min-width: 100px;
}

.stat-value {
  color: #f0e6d2;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stat-icon {
  width: 16px;
  height: 16px;
  vertical-align: middle;
}

.attack-bonuses {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 204, 0, 0.3);
}

.attack-bonus {
  color: #f0e6d2;
  font-size: 0.8rem;
  padding: 0.1rem 0;
}

.unit-special {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 204, 0, 0.3);
  color: #4ade80;
  font-size: 0.85rem;
  font-style: italic;
}
</style>
