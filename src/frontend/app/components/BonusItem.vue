<template>
  <div 
    class="bonus-card"
    :class="{ 
      'bonus-selected': selected,
      'bonus-disabled': disabled
    }"
    :style="cardStyle"
    @click="handleClick"
    @mouseenter="handleHover(true)"
    @mouseleave="handleHover(false)"
  >
    <!-- Card Image -->
    <img 
      v-if="imageUrl"
      :src="imageUrl" 
      :alt="name"
      class="card-image"
      :class="rarityClass"
    />
    
    <!-- Card Frame (rarity border) -->
    <img 
      v-if="frameUrl"
      :src="frameUrl" 
      class="card-frame"
      :class="rarityClass"
    />
    
    <!-- Edition Badge -->
    <img 
      v-if="editionUrl && showEdition"
      :src="editionUrl" 
      class="card-edition"
    />

    <!-- Selection indicator overlay -->
    <div v-if="selected" class="selection-overlay">
      <span class="selection-check">✓</span>
    </div>

    <!-- Multiplier badge for stacking bonuses -->
    <div v-if="multiplier > 1" class="multiplier-badge">
      x{{ multiplier }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  id: number
  name: string
  description?: string
  rarity?: number
  edition?: number
  imageUrl?: string
  frameUrl?: string
  editionUrl?: string
  selected?: boolean
  disabled?: boolean
  multiplier?: number
  size?: number
  showEdition?: boolean
}>(), {
  rarity: 0,
  edition: 0,
  selected: false,
  disabled: false,
  multiplier: 1,
  size: 6,
  showEdition: true
})

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'hover', isHovering: boolean): void
}>()

const rarityCssClasses = ['common', 'uncommon', 'rare', 'epic', 'legendary']

const rarityClass = computed(() => rarityCssClasses[props.rarity] || 'common')

// Card style creates intentionally square cards for consistent grid layout
// Both width and height are set to the same value (in rem units)
const cardStyle = computed(() => ({
  width: `${props.size}rem`,
  height: `${props.size}rem`,
}))

function handleClick() {
  if (!props.disabled) {
    emit('toggle')
  }
}

function handleHover(isHovering: boolean) {
  emit('hover', isHovering)
}
</script>

<style scoped>
.bonus-card {
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 4px;
  overflow: hidden;
}

.bonus-card:hover:not(.bonus-disabled) {
  transform: scale(1.05);
  z-index: 10;
}

.bonus-card:hover:not(.bonus-disabled) .card-image,
.bonus-card:hover:not(.bonus-disabled) .card-frame {
  filter: brightness(130%);
}

.bonus-selected {
  box-shadow: 0 0 12px rgba(0, 255, 0, 0.7);
}

.bonus-disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(50%);
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 0.2s ease;
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

.card-edition {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50%;
  height: auto;
  pointer-events: none;
}

.selection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 255, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.selection-check {
  font-size: 2rem;
  color: #00ff00;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
}

.multiplier-badge {
  position: absolute;
  top: 5%;
  right: 5%;
  background: rgba(0, 0, 0, 0.8);
  color: hsl(52, 100%, 50%);
  padding: 0.15rem 0.3rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  border: 1px solid hsl(52, 100%, 50%);
}

/* Rarity glow effects */
.card-image.common,
.card-frame.common {
  /* No special effect for common */
}

.card-image.uncommon,
.card-frame.uncommon {
  /* Green tint for uncommon */
}

.card-image.rare,
.card-frame.rare {
  /* Blue tint for rare */
}

.card-image.epic,
.card-frame.epic {
  /* Purple tint for epic */
}

.card-image.legendary,
.card-frame.legendary {
  /* Gold tint for legendary */
}
</style>
