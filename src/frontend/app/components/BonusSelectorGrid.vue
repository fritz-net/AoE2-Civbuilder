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
    
    <!-- Controls: Size slider and filters -->
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
    </div>
    
    <!-- Rarity and Edition filters -->
    <div class="filter-row">
      <div class="rarity-filters">
        <label 
          v-for="(rarity, index) in rarityNames" 
          :key="index"
          class="filter-checkbox"
        >
          <input 
            type="checkbox" 
            v-model="selectedRarities[index]"
          />
          <span :class="`rarity-${rarityCssClasses[index]}`">{{ rarity }}</span>
        </label>
      </div>
      
      <div class="edition-filters">
        <label 
          v-for="(edition, index) in editionNames" 
          :key="index"
          class="filter-checkbox"
        >
          <input 
            type="checkbox" 
            v-model="selectedEditions[index]"
          />
          <span>{{ edition }}</span>
        </label>
        <label class="filter-checkbox show-edition-toggle">
          <input type="checkbox" v-model="showEditionBadge" />
          <span>Show Edition</span>
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
        <div class="cards-grid">
          <BonusItem
            v-for="card in selectedCards"
            :key="`selected-${card.id}`"
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
        </div>
      </div>
      
      <!-- Unselected cards section -->
      <div class="unselected-section">
        <div class="cards-grid">
          <BonusItem
            v-for="card in filteredUnselectedCards"
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
    
    <!-- Hover tooltip -->
    <div 
      v-if="hoveredCard" 
      class="hover-tooltip"
      :class="`rarity-bg-${rarityCssClasses[hoveredCard.rarity]}`"
    >
      <div class="tooltip-rarity" :class="`rarity-text-${rarityCssClasses[hoveredCard.rarity]}`">
        {{ rarityNames[hoveredCard.rarity] }}
      </div>
      <div class="tooltip-description">
        {{ hoveredCard.description }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

const props = withDefaults(defineProps<{
  title: string
  subtitle?: string
  bonusType: BonusType
  bonuses: BonusCard[]
  modelValue: (number | [number, number])[]
  mode?: 'single' | 'multi'
  maxSelections?: number
  disabled?: boolean
  showNavigation?: boolean
  filterPlaceholder?: string
}>(), {
  mode: 'multi',
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
const selectedRarities = ref([true, true, true, true, true])
const selectedEditions = ref([true, true])
const showEditionBadge = ref(true)
const hoveredCard = ref<BonusCard | null>(null)

// Computed properties
const selectedCount = computed(() => props.modelValue.length)

const isMaxReached = computed(() => {
  if (!props.maxSelections) return false
  return selectedCount.value >= props.maxSelections
})

// Get selected card IDs (handling both simple number and [id, multiplier] format)
const selectedIds = computed(() => {
  return props.modelValue.map(item => {
    if (Array.isArray(item)) {
      return item[0]
    }
    return item
  })
})

// Selected cards
const selectedCards = computed(() => {
  return props.bonuses.filter(card => selectedIds.value.includes(card.id))
})

// Filter unselected cards
const filteredUnselectedCards = computed(() => {
  return props.bonuses.filter(card => {
    // Skip if selected
    if (selectedIds.value.includes(card.id)) return false
    
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
  return 1
}

function isSelected(cardId: number): boolean {
  return selectedIds.value.includes(cardId)
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
      emit('update:modelValue', [[cardId, 1]])
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
      currentSelection.push([cardId, 1])
    } else {
      // Remove card
      currentSelection.splice(index, 1)
    }
    emit('update:modelValue', currentSelection)
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
.filter-control {
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

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: hsla(52, 100%, 50%, 0.9);
  font-size: 0.8rem;
  cursor: pointer;
}

.filter-checkbox input {
  accent-color: hsl(52, 100%, 50%);
  cursor: pointer;
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

/* Hover tooltip */
.hover-tooltip {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 500px;
  padding: 1rem 1.5rem;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 8px;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.tooltip-rarity {
  font-size: 0.9rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.tooltip-description {
  color: hsl(52, 100%, 50%);
  font-size: 1rem;
  line-height: 1.4;
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
