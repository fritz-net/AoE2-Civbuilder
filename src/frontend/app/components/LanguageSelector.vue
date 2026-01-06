<template>
  <div class="language-selector">
    <div class="title-row">
      <h2 class="section-title">Language</h2>
      <button 
        class="mute-btn" 
        @click="toggleMute"
        :title="isMuted ? 'Unmute' : 'Mute'"
        :aria-label="isMuted ? 'Unmute' : 'Mute'"
      >
        <span v-if="isMuted">🔇</span>
        <span v-else>🔊</span>
      </button>
    </div>
    
    <div class="selector-content">
      <button class="nav-btn" @click="previous">&lt;</button>
      
      <div class="language-display">
        <select 
          v-model="selectedLanguage" 
          @change="handleDropdownChange"
          class="language-dropdown"
          :disabled="disabled"
        >
          <option 
            v-for="(language, index) in languages" 
            :key="index" 
            :value="index"
          >
            {{ language }}
          </option>
        </select>
      </div>
      
      <button class="nav-btn" @click="next">&gt;</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { languages } from '~/composables/useCivData'

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

const selectedLanguage = ref(props.modelValue)
const isMuted = ref(false)
const audioElement = ref<HTMLAudioElement | null>(null)
const voiceFilesMap = ref<Record<string, string[]> | null>(null)

// Load voice files map and mute preference
onMounted(async () => {
  // Load mute preference from localStorage
  const savedMuteState = localStorage.getItem('languageSelectorMuted')
  if (savedMuteState !== null) {
    isMuted.value = savedMuteState === 'true'
  }
  
  // Load voice files map
  try {
    const response = await fetch(`${baseURL}vanillaFiles/voiceFiles/voiceFilesMap.json`)
    if (response.ok) {
      voiceFilesMap.value = await response.json()
    } else {
      console.warn('Could not load voice files map')
    }
  } catch (error) {
    console.error('Error loading voice files map:', error)
  }
})

// Watch for external changes to modelValue and play sound
watch(() => props.modelValue, (newVal) => {
  selectedLanguage.value = newVal
  playRandomVoice(newVal)
})

function toggleMute() {
  isMuted.value = !isMuted.value
  localStorage.setItem('languageSelectorMuted', String(isMuted.value))
  
  // Stop any currently playing audio
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value.currentTime = 0
  }
}

async function playRandomVoice(languageIndex: number) {
  if (isMuted.value || props.disabled || !voiceFilesMap.value) return
  
  try {
    const languageKey = String(languageIndex)
    const files = voiceFilesMap.value[languageKey]
    
    if (!files || files.length === 0) {
      console.warn(`No voice files found for language ${languageIndex}`)
      return
    }
    
    // Select a random voice file
    const randomFile = files[Math.floor(Math.random() * files.length)]
    const audioPath = `${baseURL}vanillaFiles/voiceFiles/${languageIndex}/${randomFile}`
    
    // Play the audio
    if (audioElement.value) {
      audioElement.value.pause()
    }
    
    audioElement.value = new Audio(audioPath)
    audioElement.value.volume = 0.5 // Set volume to 50%
    
    try {
      await audioElement.value.play()
    } catch (error) {
      console.warn('Audio playback failed:', error)
    }
  } catch (error) {
    console.error('Error playing voice:', error)
  }
}

function handleDropdownChange() {
  emit('update:modelValue', selectedLanguage.value)
  playRandomVoice(selectedLanguage.value)
}

function next() {
  if (props.disabled) return
  const newValue = (props.modelValue + 1) % languages.length
  emit('update:modelValue', newValue)
}

function previous() {
  if (props.disabled) return
  const newValue = (props.modelValue - 1 + languages.length) % languages.length
  emit('update:modelValue', newValue)
}
</script>

<style scoped>
.language-selector {
  background: rgba(139, 69, 19, 0.75);
  border: 2px solid hsl(52, 100%, 50%);
  padding: 1rem;
  border-radius: 8px;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.section-title {
  color: hsl(52, 100%, 50%);
  font-size: 1.2rem;
  margin: 0;
  text-align: center;
}

.mute-btn {
  width: 32px;
  height: 32px;
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
  padding: 0;
}

.mute-btn:hover {
  background: linear-gradient(to bottom, rgba(160, 82, 45, 0.95), rgba(139, 69, 19, 0.95));
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(255, 204, 0, 0.3);
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
}

.nav-btn:hover {
  background: linear-gradient(to bottom, rgba(160, 82, 45, 0.95), rgba(139, 69, 19, 0.95));
  transform: translateY(-2px);
}

.language-display {
  min-width: 180px;
  text-align: center;
}

.language-dropdown {
  width: 100%;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  color: hsl(52, 100%, 50%);
  font-size: 1rem;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
}

.language-dropdown:hover:not(:disabled) {
  border-color: hsl(52, 100%, 60%);
  box-shadow: 0 0 8px rgba(255, 204, 0, 0.4);
}

.language-dropdown:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.language-dropdown option {
  background: rgba(139, 69, 19, 0.95);
  color: hsl(52, 100%, 50%);
}
</style>
