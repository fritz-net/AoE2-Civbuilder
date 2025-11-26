<template>
  <div
    class="draft-card"
    :class="{
      'card-selectable': selectable,
      'card-selected': selected,
      'card-hidden': hidden
    }"
    :style="cardStyle"
    @click="handleClick"
    @mouseenter="$emit('hover', card)"
    @mouseleave="$emit('unhover')"
  >
    <div class="card-border" :class="`rarity-${rarity}`">
      <div class="card-image">
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="cardTitle"
          @error="onImageError"
        />
        <div v-else class="card-placeholder">
          {{ cardTitle }}
        </div>
      </div>
      <div v-if="showTitle" class="card-title">
        {{ cardTitle }}
      </div>
      <div v-if="rarity && showRarity" class="card-rarity">
        {{ rarityText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface DraftCard {
  id: number
  type: number // 0: civ bonus, 1: unique unit, 2: castle tech, 3: imperial tech, 4: team bonus
  rarity?: number // 0: common, 1: uncommon, 2: rare, 3: epic, 4: legendary
  name?: string
}

const props = withDefaults(defineProps<{
  card: DraftCard
  size?: number // in vw units
  margin?: number // in vw units
  selectable?: boolean
  selected?: boolean
  hidden?: boolean
  showTitle?: boolean
  showRarity?: boolean
}>(), {
  size: 8,
  margin: 0.5,
  selectable: true,
  selected: false,
  hidden: false,
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
  const baseUrl = '/img/cards'
  const typePrefix = ['bonus', 'uu', 'tech', 'tech', 'team'][props.card.type] || 'bonus'
  return `${baseUrl}/${typePrefix}_${props.card.id}.png`
})

const handleClick = () => {
  if (props.selectable && !props.hidden) {
    emit('select', props.card)
  }
}

const onImageError = (event: Event) => {
  // Hide broken image
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
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

.card-selectable:not(.card-hidden):hover {
  transform: scale(1.05);
  z-index: 10;
}

.card-selectable:not(.card-hidden):hover .card-border {
  filter: brightness(150%);
  box-shadow: 0 0 20px rgba(255, 204, 0, 0.6);
}

.card-selected .card-border {
  border-color: #00ff00;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.8);
}

.card-border {
  width: 100%;
  height: 100%;
  border: 3px solid;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.6);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
}

/* Rarity colors */
.rarity-0 {
  border-color: #808080; /* Common - Gray */
}

.rarity-1 {
  border-color: #00ff00; /* Uncommon - Green */
}

.rarity-2 {
  border-color: #0070ff; /* Rare - Blue */
}

.rarity-3 {
  border-color: #a335ee; /* Epic - Purple */
}

.rarity-4 {
  border-color: #ff8000; /* Legendary - Orange */
}

.card-image {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
}

.card-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.card-placeholder {
  color: #f0e6d2;
  font-size: 0.8rem;
  text-align: center;
  padding: 0.5rem;
  word-wrap: break-word;
}

.card-title {
  background: rgba(0, 0, 0, 0.7);
  color: #f0e6d2;
  font-size: 0.7rem;
  padding: 0.25rem;
  text-align: center;
  border-top: 1px solid rgba(255, 204, 0, 0.3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-rarity {
  background: rgba(0, 0, 0, 0.8);
  color: hsl(52, 100%, 50%);
  font-size: 0.6rem;
  padding: 0.15rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: bold;
}

@media (max-width: 768px) {
  .card-title {
    font-size: 0.6rem;
  }

  .card-rarity {
    font-size: 0.5rem;
  }
}
</style>
