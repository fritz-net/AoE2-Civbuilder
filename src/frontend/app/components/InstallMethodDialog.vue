<template>
  <div v-if="show" class="modal-overlay" @click.self="handleCancel">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Mod Created Successfully! ✅</h2>
        <button class="close-btn" @click="handleCancel" aria-label="Close">×</button>
      </div>
      
      <div class="modal-body">
        <p class="description">
          Your civilization mod has been created. Choose how you want to get it:
        </p>
        
        <div class="options-list">
          <!-- Auto-Install Option -->
          <button
            v-if="supportsAutoInstall"
            class="option-item primary-option"
            @click="handleAutoInstall"
            :disabled="isProcessing"
          >
            <div class="option-icon">🚀</div>
            <div class="option-info">
              <div class="option-title">Auto-Install to Steam</div>
              <div class="option-description">
                Automatically extract and install the mod to your Age of Empires II mods folder
              </div>
            </div>
          </button>
          
          <!-- Download Option -->
          <button
            class="option-item"
            @click="handleDownload"
            :disabled="isProcessing"
          >
            <div class="option-icon">⬇️</div>
            <div class="option-info">
              <div class="option-title">Download Mod</div>
              <div class="option-description">
                Download the mod as a ZIP file and install it manually
              </div>
            </div>
          </button>
        </div>
        
        <div v-if="!supportsAutoInstall" class="browser-warning">
          <strong>Note:</strong> Auto-install is not supported in your browser. 
          Please use Chrome, Edge, or another Chromium-based browser for this feature.
        </div>
        
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isFileSystemAccessSupported } from '~/composables/useFileSystemInstall'

interface Props {
  show: boolean
}

interface Emits {
  (e: 'auto-install'): void
  (e: 'download'): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isProcessing = ref(false)
const errorMessage = ref<string | null>(null)
const supportsAutoInstall = ref(isFileSystemAccessSupported())

function handleAutoInstall() {
  if (isProcessing.value) return
  isProcessing.value = true
  errorMessage.value = null
  emit('auto-install')
}

function handleDownload() {
  if (isProcessing.value) return
  isProcessing.value = true
  errorMessage.value = null
  emit('download')
}

function handleCancel() {
  if (isProcessing.value) return
  emit('cancel')
}

// Expose method to reset processing state
defineExpose({
  resetProcessing: () => {
    isProcessing.value = false
  },
  setError: (message: string) => {
    errorMessage.value = message
    isProcessing.value = false
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: rgba(139, 69, 19, 0.95);
  border: 3px solid hsl(52, 100%, 50%);
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid hsla(52, 100%, 50%, 0.3);
}

.modal-header h2 {
  color: hsl(52, 100%, 50%);
  font-size: 1.5rem;
  margin: 0;
  font-family: 'Cinzel', serif;
}

.close-btn {
  background: none;
  border: none;
  color: hsl(52, 100%, 50%);
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: hsl(52, 100%, 70%);
}

.modal-body {
  padding: 1.5rem;
}

.description {
  color: hsla(52, 100%, 50%, 0.9);
  margin-bottom: 1.5rem;
  line-height: 1.6;
  text-align: center;
  font-size: 1.1rem;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid hsla(52, 100%, 50%, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
}

.option-item:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.5);
  border-color: hsl(52, 100%, 50%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.option-item:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.primary-option {
  background: rgba(30, 80, 120, 0.4);
  border-color: hsl(52, 100%, 50%);
}

.primary-option:hover:not(:disabled) {
  background: rgba(30, 80, 120, 0.6);
  box-shadow: 0 4px 16px rgba(30, 80, 120, 0.6);
}

.option-icon {
  font-size: 3rem;
  flex-shrink: 0;
}

.option-info {
  flex: 1;
}

.option-title {
  color: hsl(52, 100%, 50%);
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  font-family: 'Cinzel', serif;
}

.option-description {
  color: hsla(52, 100%, 50%, 0.8);
  font-size: 0.95rem;
  line-height: 1.4;
}

.browser-warning {
  padding: 1rem;
  background: rgba(139, 69, 19, 0.3);
  border-left: 4px solid hsl(39, 100%, 50%);
  border-radius: 4px;
  color: hsla(52, 100%, 50%, 0.9);
  font-size: 0.9rem;
  line-height: 1.5;
}

.error-message {
  padding: 1rem;
  background: rgba(139, 0, 0, 0.3);
  border-left: 4px solid hsl(0, 100%, 50%);
  border-radius: 4px;
  color: hsl(0, 100%, 70%);
  font-size: 0.9rem;
  line-height: 1.5;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .modal-content {
    max-width: 95%;
  }
  
  .modal-header h2 {
    font-size: 1.2rem;
  }
  
  .option-item {
    padding: 1rem;
  }
  
  .option-icon {
    font-size: 2.5rem;
  }
  
  .option-title {
    font-size: 1.1rem;
  }
  
  .option-description {
    font-size: 0.9rem;
  }
}
</style>
