<template>
  <div class="language-selector">
    <h2 class="section-title">Language</h2>
    
    <div class="selector-content">
      <button class="nav-btn" @click="previous">&lt;</button>
      
      <div class="language-display">
        <span class="language-name">{{ currentLanguageName }}</span>
      </div>
      
      <button class="nav-btn" @click="next">&gt;</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { languages } from '~/composables/useCivData'

const props = defineProps<{
  modelValue: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const currentLanguageName = computed(() => languages[props.modelValue])

function next() {
  const newValue = (props.modelValue + 1) % languages.length
  emit('update:modelValue', newValue)
}

function previous() {
  const newValue = (props.modelValue - 1 + languages.length) % languages.length
  emit('update:modelValue', newValue)
}
</script>

<style scoped>
.language-selector {
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
}

.nav-btn:hover {
  background: linear-gradient(to bottom, rgba(160, 82, 45, 0.95), rgba(139, 69, 19, 0.95));
  transform: translateY(-2px);
}

.language-display {
  min-width: 180px;
  text-align: center;
}

.language-name {
  color: #d4af37;
  font-size: 1rem;
}
</style>
