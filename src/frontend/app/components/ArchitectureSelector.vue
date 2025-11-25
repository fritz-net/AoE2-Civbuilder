<template>
  <div class="architecture-selector">
    <h2 class="section-title">Architecture</h2>
    
    <div class="selector-content">
      <button class="nav-btn" @click="previous">&lt;</button>
      
      <div class="architecture-display">
        <img 
          :src="architectureImageSrc" 
          :alt="currentArchitectureName"
          class="architecture-image"
          @error="handleImageError"
        />
        <span class="architecture-name">{{ currentArchitectureName }}</span>
      </div>
      
      <button class="nav-btn" @click="next">&gt;</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { architectures } from '~/composables/useCivData'

const props = withDefaults(defineProps<{
  modelValue: number
  disabled?: boolean
}>(), {
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const config = useRuntimeConfig()
const baseURL = config.app.baseURL || '/v2/'

// Architecture values are 1-indexed (1-11)
const currentArchitectureName = computed(() => architectures[props.modelValue - 1] || architectures[0])

const architectureImageSrc = computed(() => `${baseURL}img/architectures/tc_${props.modelValue}.png`)

function handleImageError(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

function next() {
  if (props.disabled) return
  // Architecture is 1-indexed, cycles through 1-11
  const newValue = ((props.modelValue % 11) + 1)
  emit('update:modelValue', newValue)
}

function previous() {
  if (props.disabled) return
  // Architecture is 1-indexed, cycles through 1-11
  const newValue = ((props.modelValue - 2 + 11) % 11) + 1
  emit('update:modelValue', newValue)
}
</script>

<style scoped>
.architecture-selector {
  background: rgba(139, 69, 19, 0.75);
  border: 2px solid hsl(52, 100%, 50%);
  padding: 1rem;
  border-radius: 8px;
}

.section-title {
  color: hsl(52, 100%, 50%);
  font-size: 1.2rem;
  margin-bottom: 0.75rem;
  text-align: center;
}

.selector-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.nav-btn {
  width: 40px;
  height: 40px;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  color: hsl(52, 100%, 50%);
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.nav-btn:hover {
  background: linear-gradient(to bottom, rgba(160, 82, 45, 0.95), rgba(139, 69, 19, 0.95));
  transform: translateY(-2px);
}

.architecture-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 180px;
}

.architecture-image {
  max-width: 171px;
  max-height: 127px;
  object-fit: contain;
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 4px;
}

.architecture-name {
  color: hsl(52, 100%, 50%);
  font-size: 0.9rem;
  text-align: center;
}
</style>
