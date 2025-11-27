<template>
  <div 
    v-show="visible" 
    class="game-tooltip"
    :style="tooltipStyle"
  >
    <div class="tooltip-content">
      <slot>
        <!-- Default content if no slot provided -->
        <span v-if="rarityLevel !== undefined" :class="'rarity-text rarity-' + rarityLevel">
          {{ rarityNames[rarityLevel] }}
        </span>
        <p v-if="text" class="tooltip-text">{{ text }}</p>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { rarityNames } from '~/composables/useBonusData'

interface Props {
  visible?: boolean
  mouseX?: number
  mouseY?: number
  text?: string
  rarityLevel?: number
  offset?: number
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  mouseX: 0,
  mouseY: 0,
  text: '',
  rarityLevel: undefined,
  offset: 15,
})

const tooltipStyle = computed(() => {
  return {
    left: `${props.mouseX + props.offset}px`,
    top: `${props.mouseY + props.offset}px`,
  }
})
</script>

<style scoped>
.game-tooltip {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
  max-width: 400px;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.98), rgba(101, 67, 33, 0.98));
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.8);
}

.tooltip-content {
  color: #f0e6d2;
  text-align: center;
}

.rarity-text {
  display: block;
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}

.rarity-0 { color: #808080; } /* Ordinary - Gray */
.rarity-1 { color: #00ff00; } /* Distinguished - Green */
.rarity-2 { color: #0070ff; } /* Superior - Blue */
.rarity-3 { color: #a335ee; } /* Epic - Purple */
.rarity-4 { color: #ff8000; } /* Legendary - Orange */

.tooltip-text {
  margin: 0;
  line-height: 1.5;
  font-size: 0.95rem;
}
</style>
