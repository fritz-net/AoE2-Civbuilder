<template>
  <div class="bonus-selector-grid">
    <!-- Header with title and navigation -->
    <div class="selector-header">
      <button 
        v-if="showNavigation" 
        class="nav-btn nav-prev"
        @click="$emit('prev')"
      >
        &lt;
      </button>
      <h2 class="section-title">{{ title }}</h2>
      <button 
        v-if="showNavigation" 
        class="nav-btn nav-next"
        @click="$emit('next')"
      >
        &gt;
      </button>
    </div>
    
    <p v-if="subtitle" class="section-subtitle">{{ subtitle }}</p>
    
    <!-- Controls: Size slider, filters, and sorting -->
    <div class="controls-row">
      <div class="size-control">
        <label class="control-label">Card Size:</label>
        <input 
          type="range" 
          v-model.number="cardSize" 
          min="3" 
          max="12" 
          step="0.5"
          class="size-slider"
        />
      </div>
      
      <div class="filter-control">
        <label class="control-label">Filter:</label>
        <input 
          type="text" 
          v-model="filterText"
          :placeholder="filterPlaceholder"
          class="filter-input"
        />
      </div>
      
      <div class="sort-control">
        <label class="control-label">Sort:</label>
        <select v-model="sortBy" class="sort-select">
          <option value="id">Default</option>
          <option value="name">Name</option>
          <option value="rarity">Rarity</option>
          <option value="edition">Edition</option>
        </select>
        <button 
          class="sort-direction-btn"
          @click="sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'"
          :title="sortDirection === 'asc' ? 'Ascending' : 'Descending'"
        >
          {{ sortDirection === 'asc' ? '↑' : '↓' }}
        </button>
      </div>
    </div>
    
    <!-- Rarity and Edition filters -->
    <div class="filter-row">
      <div class="rarity-filters">
        <label 
          v-for="(rarity, index) in rarityNames" 
          :key="index"
          class="filter-toggle"
          :class="{ 'active': selectedRarities[index] }"
        >
          <input 
            type="checkbox" 
            v-model="selectedRarities[index]"
            class="toggle-input"
          />
          <span class="toggle-pill" :class="`rarity-pill-${rarityCssClasses[index]}`">
            {{ rarity }}
          </span>
        </label>
      </div>
      
      <div class="edition-filters">
        <label 
          v-for="(edition, index) in editionNames" 
          :key="index"
          class="filter-toggle"
          :class="{ 'active': selectedEditions[index] }"
        >
          <input 
            type="checkbox" 
            v-model="selectedEditions[index]"
            class="toggle-input"
          />
          <span class="toggle-pill edition-pill">{{ edition }}</span>
        </label>
        <label class="filter-toggle show-edition-toggle" :class="{ 'active': showEditionBadge }">
          <input type="checkbox" v-model="showEditionBadge" class="toggle-input" />
          <span class="toggle-pill edition-pill">Show Edition</span>
        </label>
      </div>
    </div>
    
    <!-- Selection counter -->
    <div v-if="maxSelections" class="selection-counter">
      {{ selectedCount }}/{{ maxSelections }} selected
    </div>
    
    <!-- Card Grid -->
    <div class="cards-container">
      <!-- Selected cards section -->
      <div v-if="selectedCards.length > 0" class="selected-section">
        <div class="cards-grid selected-cards-grid">
          <div 
            v-for="card in selectedCards"
            :key="`selected-${card.id}`"
            class="selected-card-wrapper"
          >
            <BonusItem
              :id="card.id"
              :name="card.name"
              :description="card.description"
              :rarity="card.rarity"
              :edition="card.edition"
              :image-url="getCardImageUrl(card)"
              :frame-url="getCardFrameUrl(card)"
              :edition-url="getCardEditionUrl(card)"
              :selected="true"
              :size="cardSize"
              :show-edition="showEditionBadge"
              :multiplier="getCardMultiplier(card.id)"
              @toggle="toggleCard(card.id)"
              @hover="(hovering: boolean) => handleCardHover(card, hovering)"
            />
            <!-- Multiplier controls (only when allowMultiplier is enabled) -->
            <div v-if="allowMultiplier" class="multiplier-controls">
              <button 
                class="multiplier-btn"
                @click.stop="decrementMultiplier(card.id)"
                :disabled="getCardMultiplier(card.id) <= 1"
              >
                −
              </button>
              <span class="multiplier-value">{{ getCardMultiplier(card.id) }}</span>
              <button 
                class="multiplier-btn"
                @click.stop="incrementMultiplier(card.id)"
                :disabled="getCardMultiplier(card.id) >= maxMultiplier"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Unselected cards section -->
      <div class="unselected-section">
        <div class="cards-grid">
          <BonusItem
            v-for="card in sortedFilteredUnselectedCards"
            :key="`unselected-${card.id}`"
            :id="card.id"
            :name="card.name"
            :description="card.description"
            :rarity="card.rarity"
            :edition="card.edition"
            :image-url="getCardImageUrl(card)"
            :frame-url="getCardFrameUrl(card)"
            :edition-url="getCardEditionUrl(card)"
            :selected="false"
            :disabled="isMaxReached && mode === 'multi'"
            :size="cardSize"
            :show-edition="showEditionBadge"
            @toggle="toggleCard(card.id)"
            @hover="(hovering: boolean) => handleCardHover(card, hovering)"
          />
        </div>
      </div>
    </div>
    
    <!-- Hover tooltip - follows mouse cursor -->
    <div 
      v-if="hoveredCard" 
      class="hover-tooltip"
      :class="`rarity-bg-${rarityCssClasses[hoveredCard.rarity]}`"
      :style="tooltipStyle"
    >
      <div class="tooltip-rarity" :class="`rarity-text-${rarityCssClasses[hoveredCard.rarity]}`">
        {{ rarityNames[hoveredCard.rarity] }}
      </div>
      <div class="tooltip-name">{{ hoveredCard.name }}</div>
      
      <!-- Unit stats for unique units -->
      <div v-if="hoveredUnitStats" class="tooltip-unit-stats">
        <div class="unit-stats-row">
          <span class="stat-label">Cost:</span>
          <span class="stat-value">{{ formatCost(hoveredUnitStats.cost) }}</span>
        </div>
        <div class="unit-stats-row">
          <span class="stat-label">HP:</span>
          <span class="stat-value">{{ hoveredUnitStats.hp.join(' / ') }}</span>
        </div>
        <div class="unit-stats-row">
          <span class="stat-label">Attack:</span>
          <span class="stat-value">{{ getBaseAttack(hoveredUnitStats.attacks.basic) }} / {{ getBaseAttack(hoveredUnitStats.attacks.elite) }}</span>
        </div>
        <div class="unit-stats-row" v-if="hoveredUnitStats.range[0] > 0">
          <span class="stat-label">Range:</span>
          <span class="stat-value">{{ hoveredUnitStats.range.join(' / ') }}</span>
        </div>
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
        <div v-if="hoveredUnitStats.special" class="unit-special">
          {{ hoveredUnitStats.special }}
        </div>
      </div>
      
      <!-- Description for non-unit bonuses -->
      <div v-else class="tooltip-description">
        {{ hoveredCard.description }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { 
  type BonusCard,
  type BonusType,
  rarityNames, 
  rarityCssClasses, 
  editionNames,
  getBonusImageUrl,
  getFrameUrl,
  getEditionUrl
} from '~/composables/useBonusData'
import { 
  unitStats, 
  formatCost, 
  formatAttackBonuses, 
  getBaseAttack,
  type UnitStats 
} from '~/composables/useUnitStats'

const props = withDefaults(defineProps<{
  title: string
  subtitle?: string
  bonusType: BonusType
  bonuses: BonusCard[]
  modelValue: (number | [number, number])[]
  mode?: 'single' | 'multi'
  maxSelections?: number
  maxMultiplier?: number
  allowMultiplier?: boolean
  disabled?: boolean
  showNavigation?: boolean
  filterPlaceholder?: string
}>(), {
  mode: 'multi',
  maxMultiplier: 255,
  allowMultiplier: false,
  disabled: false,
  showNavigation: false,
  filterPlaceholder: 'e.g. "Infantry", "Archer", etc.'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: (number | [number, number])[]): void
  (e: 'prev'): void
  (e: 'next'): void
}>()

// Local state
const cardSize = ref(6)
const filterText = ref('')
const sortBy = ref<'id' | 'name' | 'rarity' | 'edition'>('id')
const sortDirection = ref<'asc' | 'desc'>('asc')
const selectedRarities = ref([true, true, true, true, true])
const selectedEditions = ref([true, true])
const showEditionBadge = ref(true)
const hoveredCard = ref<BonusCard | null>(null)

// Mouse position for tooltip
const mouseX = ref(0)
const mouseY = ref(0)

function updateMousePosition(event: MouseEvent) {
  mouseX.value = event.clientX
  mouseY.value = event.clientY
}

// Tooltip configuration constants
const TOOLTIP_OFFSET_X = 15
const TOOLTIP_OFFSET_Y = 15
const TOOLTIP_WIDTH = 350 // matches max-width in CSS
const TOOLTIP_HEIGHT = 100 // approximate height for overflow detection

// Tooltip style - positions tooltip near cursor with offset
const tooltipStyle = computed(() => {
  // Guard for SSR - return default position if window is undefined
  if (typeof window === 'undefined') {
    return { left: '0px', top: '0px' }
  }
  
  // Check if tooltip would overflow right edge
  const rightOverflow = mouseX.value + TOOLTIP_OFFSET_X + TOOLTIP_WIDTH > window.innerWidth
  // Check if tooltip would overflow bottom
  const bottomOverflow = mouseY.value + TOOLTIP_OFFSET_Y + TOOLTIP_HEIGHT > window.innerHeight
  
  const left = rightOverflow ? mouseX.value - TOOLTIP_WIDTH - TOOLTIP_OFFSET_X : mouseX.value + TOOLTIP_OFFSET_X
  const top = bottomOverflow ? mouseY.value - TOOLTIP_HEIGHT - TOOLTIP_OFFSET_Y : mouseY.value + TOOLTIP_OFFSET_Y
  
  return {
    left: `${left}px`,
    top: `${top}px`
  }
})

// Get unit stats for the hovered card (only for unique units)
const hoveredUnitStats = computed((): UnitStats | null => {
  if (!hoveredCard.value || props.bonusType !== 'uu') return null
  return unitStats[hoveredCard.value.id] || null
})

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', updateMousePosition)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('mousemove', updateMousePosition)
  }
})

// Constants
const DEFAULT_MULTIPLIER = 1

// Computed properties
const selectedCount = computed(() => props.modelValue.length)

const isMaxReached = computed(() => {
  if (!props.maxSelections) return false
  return selectedCount.value >= props.maxSelections
})

// Get selected card IDs as a Set for O(1) lookup (handling both simple number and [id, multiplier] format)
const selectedIdSet = computed(() => {
  const ids = props.modelValue.map(item => {
    if (Array.isArray(item)) {
      return item[0]
    }
    return item
  })
  return new Set(ids)
})

// Selected cards
const selectedCards = computed(() => {
  return props.bonuses.filter(card => selectedIdSet.value.has(card.id))
})

// Filter unselected cards
const filteredUnselectedCards = computed(() => {
  return props.bonuses.filter(card => {
    // Skip if selected (using Set for O(1) lookup)
    if (selectedIdSet.value.has(card.id)) return false
    
    // Check rarity filter
    if (!selectedRarities.value[card.rarity]) return false
    
    // Check edition filter
    const editionIndex = card.edition <= 0 ? 0 : Math.min(card.edition, editionNames.length - 1)
    if (!selectedEditions.value[editionIndex]) return false
    
    // Check text filter
    if (filterText.value) {
      const searchTerm = filterText.value.toLowerCase()
      if (!card.name.toLowerCase().includes(searchTerm) && 
          !card.description.toLowerCase().includes(searchTerm)) {
        return false
      }
    }
    
    return true
  })
})

// Sorted filtered unselected cards
const sortedFilteredUnselectedCards = computed(() => {
  const cards = [...filteredUnselectedCards.value]
  const direction = sortDirection.value === 'asc' ? 1 : -1
  
  return cards.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return direction * a.name.localeCompare(b.name)
      case 'rarity':
        return direction * (a.rarity - b.rarity)
      case 'edition':
        return direction * (a.edition - b.edition)
      case 'id':
      default:
        return direction * (a.id - b.id)
    }
  })
})

// Helper functions
function getCardImageUrl(card: BonusCard): string {
  return getBonusImageUrl(props.bonusType, card.id, card.imageVersion)
}

function getCardFrameUrl(card: BonusCard): string {
  return getFrameUrl(card.rarity)
}

function getCardEditionUrl(card: BonusCard): string {
  return getEditionUrl(card.edition)
}

function getCardMultiplier(cardId: number): number {
  const item = props.modelValue.find(val => {
    if (Array.isArray(val)) {
      return val[0] === cardId
    }
    return val === cardId
  })
  if (Array.isArray(item)) {
    return item[1]
  }
  return DEFAULT_MULTIPLIER
}

function isSelected(cardId: number): boolean {
  return selectedIdSet.value.has(cardId)
}

function toggleCard(cardId: number) {
  if (props.disabled) return
  
  const currentSelection = [...props.modelValue]
  const index = currentSelection.findIndex(item => {
    if (Array.isArray(item)) {
      return item[0] === cardId
    }
    return item === cardId
  })
  
  if (props.mode === 'single') {
    // Single selection mode - replace selection
    if (index === -1) {
      emit('update:modelValue', [[cardId, DEFAULT_MULTIPLIER]])
    } else {
      // Toggle off
      emit('update:modelValue', [])
    }
  } else {
    // Multi selection mode
    if (index === -1) {
      // Add card
      if (props.maxSelections && currentSelection.length >= props.maxSelections) {
        return // Max reached
      }
      currentSelection.push([cardId, DEFAULT_MULTIPLIER])
    } else {
      // Remove card
      currentSelection.splice(index, 1)
    }
    emit('update:modelValue', currentSelection)
  }
}

// Multiplier functions for bonus stacking (enabled via allowMultiplier prop)
function incrementMultiplier(cardId: number) {
  if (!props.allowMultiplier) return
  
  const currentSelection = [...props.modelValue]
  const index = currentSelection.findIndex(item => {
    if (Array.isArray(item)) {
      return item[0] === cardId
    }
    return item === cardId
  })
  
  if (index !== -1) {
    const currentValue = Array.isArray(currentSelection[index]) 
      ? currentSelection[index][1] 
      : DEFAULT_MULTIPLIER
    if (currentValue < props.maxMultiplier) {
      currentSelection[index] = [cardId, currentValue + 1]
      emit('update:modelValue', currentSelection)
    }
  }
}

function decrementMultiplier(cardId: number) {
  if (!props.allowMultiplier) return
  
  const currentSelection = [...props.modelValue]
  const index = currentSelection.findIndex(item => {
    if (Array.isArray(item)) {
      return item[0] === cardId
    }
    return item === cardId
  })
  
  if (index !== -1) {
    const currentValue = Array.isArray(currentSelection[index]) 
      ? currentSelection[index][1] 
      : DEFAULT_MULTIPLIER
    if (currentValue > 1) {
      currentSelection[index] = [cardId, currentValue - 1]
      emit('update:modelValue', currentSelection)
    }
  }
}

function handleCardHover(card: BonusCard, isHovering: boolean) {
  if (isHovering) {
    hoveredCard.value = card
  } else {
    hoveredCard.value = null
  }
}
</script>

<style scoped>
.bonus-selector-grid {
  background: rgba(139, 69, 19, 0.75);
  border: 2px solid hsl(52, 100%, 50%);
  padding: 1rem;
  border-radius: 8px;
  position: relative;
}

.selector-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.nav-btn {
  width: 40px;
  height: 40px;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  border: 2px solid hsl(52, 100%, 50%);
  color: hsl(52, 100%, 50%);
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  background: linear-gradient(to bottom, rgba(160, 82, 45, 0.95), rgba(139, 69, 19, 0.95));
  transform: scale(1.1);
}

.section-title {
  color: hsl(52, 100%, 50%);
  font-size: 1.5rem;
  text-align: center;
  margin: 0;
}

.section-subtitle {
  color: hsla(52, 100%, 50%, 0.8);
  font-size: 0.9rem;
  text-align: center;
  margin-bottom: 0.75rem;
}

.controls-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.75rem;
  align-items: center;
}

.size-control,
.filter-control,
.sort-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-label {
  color: hsl(52, 100%, 50%);
  font-size: 0.9rem;
  white-space: nowrap;
}

.size-slider {
  width: 100px;
  accent-color: hsl(52, 100%, 50%);
}

.filter-input {
  padding: 0.4rem 0.6rem;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  color: hsl(52, 100%, 50%);
  font-size: 0.85rem;
  width: 180px;
}

.filter-input::placeholder {
  color: hsla(52, 100%, 50%, 0.5);
}

.sort-select {
  padding: 0.4rem 0.6rem;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  color: hsl(52, 100%, 50%);
  font-size: 0.85rem;
  cursor: pointer;
}

.sort-select option {
  background: #1a1a1a;
  color: hsl(52, 100%, 50%);
}

.sort-direction-btn {
  padding: 0.35rem 0.6rem;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  color: hsl(52, 100%, 50%);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sort-direction-btn:hover {
  background: rgba(139, 69, 19, 0.6);
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.rarity-filters,
.edition-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Styled pill toggle filters */
.filter-toggle {
  display: inline-flex;
  cursor: pointer;
}

.toggle-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-pill {
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  background: rgba(0, 0, 0, 0.4);
  color: hsla(52, 100%, 50%, 0.6);
}

.filter-toggle.active .toggle-pill {
  background: rgba(0, 0, 0, 0.6);
  color: hsl(52, 100%, 50%);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
}

/* Rarity pill colors */
.rarity-pill-common {
  border-color: #b0b0b0;
}
.filter-toggle.active .rarity-pill-common {
  background: rgba(176, 176, 176, 0.2);
  color: #d0d0d0;
}

.rarity-pill-uncommon {
  border-color: #4ade80;
}
.filter-toggle.active .rarity-pill-uncommon {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.rarity-pill-rare {
  border-color: #60a5fa;
}
.filter-toggle.active .rarity-pill-rare {
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
}

.rarity-pill-epic {
  border-color: #c084fc;
}
.filter-toggle.active .rarity-pill-epic {
  background: rgba(192, 132, 252, 0.2);
  color: #c084fc;
}

.rarity-pill-legendary {
  border-color: #fbbf24;
}
.filter-toggle.active .rarity-pill-legendary {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

/* Edition pill */
.edition-pill {
  border-color: hsl(52, 100%, 50%);
}
.filter-toggle.active .edition-pill {
  background: rgba(255, 215, 0, 0.15);
}

.show-edition-toggle {
  margin-left: 0.5rem;
  padding-left: 0.5rem;
  border-left: 1px solid hsla(52, 100%, 50%, 0.3);
}

.selection-counter {
  text-align: center;
  color: hsl(52, 100%, 50%);
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
  font-weight: bold;
}

.cards-container {
  min-height: 400px;
  max-height: 500px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.cards-container::-webkit-scrollbar {
  width: 8px;
}

.cards-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.cards-container::-webkit-scrollbar-thumb {
  background: hsl(52, 100%, 50%);
  border-radius: 4px;
}

.selected-section {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid hsla(52, 100%, 50%, 0.3);
}

.cards-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-start;
}

.selected-cards-grid {
  gap: 1rem;
}

.selected-card-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

/* Multiplier controls */
.multiplier-controls {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(0, 0, 0, 0.6);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  border: 1px solid hsl(52, 100%, 50%);
}

.multiplier-btn {
  width: 1.5rem;
  height: 1.5rem;
  background: rgba(139, 69, 19, 0.8);
  border: 1px solid hsl(52, 100%, 50%);
  color: hsl(52, 100%, 50%);
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.multiplier-btn:hover:not(:disabled) {
  background: rgba(160, 82, 45, 0.9);
}

.multiplier-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.multiplier-value {
  color: hsl(52, 100%, 50%);
  font-size: 0.85rem;
  font-weight: bold;
  min-width: 1.2rem;
  text-align: center;
}

/* Hover tooltip - follows mouse cursor */
.hover-tooltip {
  position: fixed;
  max-width: 350px;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.95);
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 8px;
  z-index: 9999;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

.tooltip-rarity {
  font-size: 0.85rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.tooltip-name {
  color: hsl(52, 100%, 50%);
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.tooltip-description {
  color: hsl(52, 100%, 50%);
  font-size: 1rem;
  line-height: 1.4;
}

/* Unit stats tooltip styles */
.tooltip-unit-stats {
  font-size: 0.9rem;
}

.unit-stats-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.stat-label {
  color: hsla(52, 100%, 50%, 0.8);
  font-weight: 500;
}

.stat-value {
  color: hsl(52, 100%, 50%);
  font-weight: bold;
}

.attack-bonuses {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid hsla(52, 100%, 50%, 0.3);
}

.attack-bonus {
  color: hsl(120, 70%, 50%);
  font-size: 0.85rem;
  margin-left: 0.5rem;
}

.unit-special {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid hsla(52, 100%, 50%, 0.3);
  color: hsl(280, 70%, 70%);
  font-style: italic;
  font-size: 0.85rem;
}

/* Rarity colors */
.rarity-common { color: #b0b0b0; }
.rarity-uncommon { color: #4ade80; }
.rarity-rare { color: #60a5fa; }
.rarity-epic { color: #c084fc; }
.rarity-legendary { color: #fbbf24; }

.rarity-text-common { color: #b0b0b0; }
.rarity-text-uncommon { color: #4ade80; }
.rarity-text-rare { color: #60a5fa; }
.rarity-text-epic { color: #c084fc; }
.rarity-text-legendary { color: #fbbf24; }

.rarity-bg-common { border-color: #b0b0b0; }
.rarity-bg-uncommon { border-color: #4ade80; }
.rarity-bg-rare { border-color: #60a5fa; }
.rarity-bg-epic { border-color: #c084fc; }
.rarity-bg-legendary { border-color: #fbbf24; }

/* Responsive adjustments */
@media (max-width: 768px) {
  .controls-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-input {
    width: 100%;
  }
  
  .filter-row {
    flex-direction: column;
  }
  
  .hover-tooltip {
    left: 10px;
    right: 10px;
    transform: none;
    max-width: none;
  }
}
</style>
