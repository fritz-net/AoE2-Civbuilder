<template>
  <div class="wonder-selector">
    <h2 class="section-title">Wonder</h2>
    
    <div class="selector-content">
      <button class="nav-btn" @click="previous">&lt;</button>
      
      <div class="wonder-display">
        <img 
          :src="wonderImageSrc" 
          :alt="currentWonderName"
          class="wonder-image clickable"
          @error="handleImageError"
          @click="showOverlay = true"
          title="Click to view all wonders"
        />
        <select 
          v-model="selectedWonder" 
          @change="handleDropdownChange"
          class="wonder-dropdown"
          :disabled="disabled"
        >
          <option 
            v-for="(wonder, index) in wonders" 
            :key="index" 
            :value="index"
          >
            {{ wonder }}
          </option>
        </select>
      </div>
      
      <button class="nav-btn" @click="next">&gt;</button>
    </div>
    
    <ImageGridOverlay
      :show="showOverlay"
      title="Select Wonder"
      :items="wonders"
      :selected-index="props.modelValue"
      :image-path-template="`${baseURL}img/wonders/wonder_{index}.png`"
      :index-offset="0"
      @close="showOverlay = false"
      @select="handleOverlaySelect"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { wonders } from '~/composables/useCivData'
import ImageGridOverlay from './ImageGridOverlay.vue'

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

const selectedWonder = ref(props.modelValue)
const showOverlay = ref(false)

// Watch for external changes to modelValue
watch(() => props.modelValue, (newVal) => {
  selectedWonder.value = newVal
})

const currentWonderName = computed(() => wonders[props.modelValue])

const wonderImageSrc = computed(() => `${baseURL}img/wonders/wonder_${props.modelValue}.png`)

function handleImageError(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

function handleDropdownChange() {
  emit('update:modelValue', selectedWonder.value)
}

function handleOverlaySelect(index: number) {
  // Wonders are 0-indexed, so use the index directly
  emit('update:modelValue', index)
}

function next() {
  if (props.disabled) return
  const newValue = (props.modelValue + 1) % wonders.length
  emit('update:modelValue', newValue)
}

function previous() {
  if (props.disabled) return
  const newValue = (props.modelValue - 1 + wonders.length) % wonders.length
  emit('update:modelValue', newValue)
}

</script>

<style scoped>
.wonder-selector {
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

.wonder-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 200px;
}

.wonder-image {
  width: 200px;
  height: 150px;
  object-fit: contain;
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  transition: all 0.2s ease;
}

.wonder-image.clickable {
  cursor: pointer;
}

.wonder-image.clickable:hover {
  border-color: hsl(52, 100%, 60%);
  box-shadow: 0 0 12px rgba(255, 204, 0, 0.5);
  transform: scale(1.05);
}

.wonder-dropdown {
  width: 100%;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  color: hsl(52, 100%, 50%);
  font-size: 0.85rem;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
}

.wonder-dropdown:hover:not(:disabled) {
  border-color: hsl(52, 100%, 60%);
  box-shadow: 0 0 8px rgba(255, 204, 0, 0.4);
}

.wonder-dropdown:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.wonder-dropdown option {
  background: rgba(139, 69, 19, 0.95);
  color: hsl(52, 100%, 50%);
}
</style>
