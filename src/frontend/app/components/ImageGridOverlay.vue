<template>
  <Teleport to="body">
    <Transition name="overlay-fade">
      <div v-if="show" class="image-grid-overlay" @click="handleOverlayClick">
        <div class="overlay-content" @click.stop>
          <div class="overlay-header">
            <h2 class="overlay-title">{{ title }}</h2>
            <button class="close-btn" @click="close" aria-label="Close">✕</button>
          </div>
          
          <div class="image-grid">
            <div
              v-for="(item, index) in items"
              :key="index"
              class="grid-item"
              :class="{ selected: isSelected(index) }"
              @click="selectItem(index)"
            >
              <img
                :src="getImageSrc(index)"
                :alt="item"
                class="grid-image"
                @error="handleImageError"
              />
              <div class="grid-label">{{ item }}</div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  show: boolean
  title: string
  items: string[]
  selectedIndex: number
  imagePathTemplate: string // Template with {index} placeholder, e.g., '/v2/img/wonders/wonder_{index}.png'
  indexOffset?: number // 0 for wonders (0-indexed), 1 for architectures (1-indexed)
}

const props = withDefaults(defineProps<Props>(), {
  indexOffset: 0
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', index: number): void
}>()

function isSelected(index: number): boolean {
  return index === props.selectedIndex
}

function getImageSrc(index: number): string {
  const imageIndex = index + props.indexOffset
  return props.imagePathTemplate.replace('{index}', imageIndex.toString())
}

function selectItem(index: number) {
  emit('select', index)
  emit('close')
}

function close() {
  emit('close')
}

function handleOverlayClick() {
  close()
}

function handleImageError(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.opacity = '0.3'
}
</script>

<style scoped>
.image-grid-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 2rem;
  overflow: auto;
}

.overlay-content {
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.95), rgba(101, 67, 33, 0.95));
  border: 3px solid hsl(52, 100%, 50%);
  border-radius: 12px;
  padding: 2rem;
  max-width: 95vw;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
}

.overlay-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(255, 204, 0, 0.3);
}

.overlay-title {
  color: hsl(52, 100%, 50%);
  font-size: 1.8rem;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.close-btn {
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  color: hsl(52, 100%, 50%);
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.close-btn:hover {
  background: rgba(255, 0, 0, 0.3);
  border-color: #ff6b6b;
  color: #ff6b6b;
  transform: scale(1.1);
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  padding: 0.5rem;
}

.grid-item {
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 204, 0, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.grid-item:hover {
  border-color: hsl(52, 100%, 50%);
  background: rgba(255, 204, 0, 0.1);
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(255, 204, 0, 0.3);
}

.grid-item.selected {
  border-color: hsl(52, 100%, 50%);
  background: rgba(255, 204, 0, 0.2);
  box-shadow: 0 0 16px rgba(255, 204, 0, 0.5);
}

.grid-item.selected::before {
  content: '✓';
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: hsl(52, 100%, 50%);
  color: #1a0f0a;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
}

.grid-item {
  position: relative;
}

.grid-image {
  max-width: 100%;
  max-height: 120px;
  object-fit: contain;
  border-radius: 4px;
  transition: opacity 0.3s ease;
}

.grid-label {
  color: hsl(52, 100%, 50%);
  font-size: 0.85rem;
  text-align: center;
  line-height: 1.3;
  min-height: 2.6em;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Transition effects */
.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.75rem;
  }
  
  .overlay-content {
    padding: 1rem;
  }
  
  .overlay-title {
    font-size: 1.4rem;
  }
  
  .grid-image {
    max-height: 100px;
  }
}

@media (max-width: 480px) {
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.5rem;
  }
  
  .grid-label {
    font-size: 0.75rem;
  }
}
</style>
