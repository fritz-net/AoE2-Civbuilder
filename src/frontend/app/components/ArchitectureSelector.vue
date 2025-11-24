<template>
  <div class="architecture-selector">
    <h2 class="section-title">Architecture</h2>
    
    <div class="selector-content">
      <button class="nav-btn" @click="previous">&lt;</button>
      
      <div class="architecture-display">
        <img 
          :src="`/img/architectures/tc_${modelValue}.png`" 
          :alt="currentArchitectureName"
          class="architecture-image"
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

const props = defineProps<{
  modelValue: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

// Architecture values are 1-indexed (1-11)
const currentArchitectureName = computed(() => architectures[props.modelValue - 1] || architectures[0])

function next() {
  // Architecture is 1-indexed, cycles through 1-11
  const newValue = ((props.modelValue % 11) + 1)
  emit('update:modelValue', newValue)
}

function previous() {
  // Architecture is 1-indexed, cycles through 1-11
  const newValue = ((props.modelValue - 2 + 11) % 11) + 1
  emit('update:modelValue', newValue)
}
</script>

<style scoped>
.architecture-selector {
  background: rgba(139, 69, 19, 0.3);
  border: 2px solid #d4af37;
  padding: 1rem;
  border-radius: 8px;
}

.section-title {
  color: #d4af37;
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
  color: #d4af37;
  border: 2px solid #d4af37;
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
  border: 2px solid #d4af37;
  border-radius: 4px;
}

.architecture-name {
  color: #d4af37;
  font-size: 0.9rem;
  text-align: center;
}
</style>
