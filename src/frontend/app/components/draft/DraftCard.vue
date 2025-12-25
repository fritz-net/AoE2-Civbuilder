<template>
  <div
    class="draft-card"
    :class="{
      'card-selectable': selectable,
      'card-selected': selected,
      'card-hidden': hidden,
      'card-disabled': disabled && !hidden
    }"
    :style="cardStyle"
    @click="handleClick"
    @mouseenter="$emit('hover', card)"
    @mouseleave="$emit('unhover')"
  >
    <div class="card-inner">
      <!-- Card Image -->
      <img
        v-if="imageUrl && !imageError"
        :src="imageUrl"
        :alt="cardTitle"
        class="card-image"
        @error="onImageError"
      />
      <div v-else class="card-placeholder">
        {{ cardTitle }}
      </div>
      
      <!-- Fancy Frame (rarity border) -->
      <img 
        :src="frameUrl" 
        class="card-frame"
      />
      
      <!-- Card title overlay (for better visibility) -->
      <div v-if="showTitle" class="card-title-overlay">
        {{ cardTitle }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getFrameUrl } from '~/composables/useBonusData'

interface DraftCard {
  id: number
  type: number // 0: civ bonus, 1: unique unit, 2: castle tech, 3: imperial tech, 4: team bonus
  rarity?: number // 0: common, 1: uncommon, 2: rare, 3: epic, 4: legendary
  name?: string
  imageVersion?: number // Version of the card image (for cache busting)
}

const props = withDefaults(defineProps<{
  card: DraftCard
  size?: number // in vw units
  margin?: number // in vw units
  selectable?: boolean
  selected?: boolean
  hidden?: boolean
  disabled?: boolean // Grey out the card when not player's turn
  showTitle?: boolean
  showRarity?: boolean
}>(), {
  size: 8,
  margin: 0.5,
  selectable: true,
  selected: false,
  hidden: false,
  disabled: false,
  showTitle: true,
  showRarity: true,
})

const emit = defineEmits<{
  (e: 'select', card: DraftCard): void
  (e: 'hover', card: DraftCard): void
  (e: 'unhover'): void
}>()

const cardStyle = computed(() => ({
  width: `${props.size}vw`,
  height: `${props.size}vw`,
  margin: `${props.margin}vw`,
}))

const rarityTexts = ['Ordinary', 'Distinguished', 'Superior', 'Epic', 'Legendary']

const rarity = computed(() => props.card.rarity ?? 0)

const rarityText = computed(() => rarityTexts[rarity.value] || 'Unknown')

const cardTitle = computed(() => {
  return props.card.name || `Card ${props.card.id}`
})

const imageUrl = computed(() => {
  // Generate image URL based on card type and id
  // Images are in /img/compressedcards/ with format: {prefix}_{cardIndex}_v{version}.jpg
  // Note: Images are served from the main /public folder, not from Nuxt's /v2 path
  const prefixes = ['bonus', 'uu', 'castle', 'imp', 'team']
  const prefix = prefixes[props.card.type] ?? 'bonus'
  // Default to version 0 for images
  const version = props.card.imageVersion ?? 0
  return `/img/compressedcards/${prefix}_${props.card.id}_v${version}.jpg`
})

// Frame URL based on rarity - use shared utility from useBonusData
const frameUrl = computed(() => getFrameUrl(rarity.value))

const handleClick = () => {
  if (props.selectable && !props.hidden) {
    emit('select', props.card)
  }
}

const imageError = ref(false)

// Reset imageError when card changes (e.g., after reroll)
watch(() => props.card.id, () => {
  imageError.value = false
})

const onImageError = () => {
  // On error, show placeholder instead of hiding image
  imageError.value = true
}
</script>

<style scoped>
.draft-card {
  display: inline-block;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.card-hidden {
  visibility: hidden;
  pointer-events: none;
}

/* Disabled state - greyed out (only when timer is paused) */
.card-disabled {
  filter: brightness(35%);
  cursor: not-allowed;
}

.card-disabled:hover {
  transform: none;
}

/* Non-selectable but enabled cards (spectator mode when timer is running) */
.draft-card:not(.card-selectable):not(.card-disabled):not(.card-hidden) {
  cursor: not-allowed;
}

.card-selectable:not(.card-hidden):not(.card-disabled):hover {
  transform: scale(1.05);
  z-index: 10;
}

.card-selectable:not(.card-hidden):not(.card-disabled):hover .card-inner {
  filter: brightness(130%);
}

.card-selected .card-inner {
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.8);
}

.card-selected .card-frame {
  filter: drop-shadow(0 0 8px rgba(0, 255, 0, 0.8));
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-frame {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  transition: filter 0.2s ease;
}

.card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  color: #f0e6d2;
  font-size: 0.75rem;
  text-align: center;
  padding: 0.5rem;
  word-wrap: break-word;
}

.card-title-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.6) 60%, transparent 100%);
  color: #f0e6d2;
  font-size: 0.65rem;
  padding: 0.5rem 0.25rem 0.25rem;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
}

@media (max-width: 768px) {
  .card-title-overlay {
    font-size: 0.55rem;
  }
}
</style>
