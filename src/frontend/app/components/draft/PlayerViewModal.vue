<template>
  <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ playerTitle }}</h2>
        <button class="close-btn" @click="closeModal" title="Close">×</button>
      </div>

      <div class="modal-body">
        <!-- Player flag -->
        <div class="player-flag-section">
          <canvas
            ref="flagCanvasRef"
            :width="150"
            :height="150"
            class="flag-canvas"
          ></canvas>
        </div>

        <!-- Bonuses sidebar -->
        <div class="bonuses-section">
          <DraftSidebar :player="player" :show-bonuses="true" />
        </div>

        <!-- Tech tree (read-only) -->
        <div class="techtree-section">
          <TechTree
            v-if="player && showTechTree"
            :civ="playerCivData"
            :editable="false"
            :techtree-points="techtreePoints"
            :points-label="'Tech Tree Points Used'"
            :sidebar-content="sidebarContent"
            :sidebar-title="'Civilization Info'"
            done-button-text="Close"
            @done="closeModal"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { DraftPlayer } from '~/composables/useDraft'
import { renderFlagOnCanvas } from '~/composables/useFlagRenderer'
import DraftSidebar from './DraftSidebar.vue'
import TechTree from '~/components/TechTree.vue'

const props = defineProps<{
  show: boolean
  player: DraftPlayer | null
  playerIndex: number
  techtreePoints?: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const flagCanvasRef = ref<HTMLCanvasElement | null>(null)
const showTechTree = ref(false)

const playerTitle = computed(() => {
  if (!props.player) return 'Player Info'
  return props.player.alias || props.player.name || `Player ${props.playerIndex + 1}`
})

const techtreePoints = computed(() => {
  return props.techtreePoints || 0
})

// Convert player data to civ format for TechTree component
const playerCivData = computed(() => {
  if (!props.player) return null
  
  return {
    name: props.player.alias || props.player.name || `Player ${props.playerIndex + 1}`,
    description: props.player.description || '',
    wonder: props.player.wonder || 0,
    castle: props.player.castle || 0,
    flag_palette: props.player.flag_palette || [3, 4, 5, 6, 7, 3, 3, 3],
    tree: props.player.tree || [[], [], []],
    architecture: props.player.architecture || 1,
    language: props.player.language || 0,
    bonuses: props.player.bonuses || [[], [], [], [], []],
  }
})

// Create sidebar content with player info
const sidebarContent = computed(() => {
  if (!props.player) return ''
  
  const parts = []
  
  if (props.player.alias) {
    parts.push(`<h3>${props.player.alias}</h3>`)
  }
  
  if (props.player.name) {
    parts.push(`<p><strong>Player:</strong> ${props.player.name}</p>`)
  }
  
  if (props.player.description) {
    parts.push(`<p>${props.player.description}</p>`)
  }
  
  return parts.join('')
})

// Draw flag when player changes
watch(() => props.player, (player) => {
  if (player && flagCanvasRef.value) {
    nextTick(() => {
      const canvas = flagCanvasRef.value
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      renderFlagOnCanvas(ctx, player.flag_palette || [3, 4, 5, 6, 7, 3, 3, 3], canvas.width, canvas.height, '/img/symbols')
    })
  }
}, { immediate: true })

// Show tech tree after a brief delay to allow rendering
watch(() => props.show, (show) => {
  if (show) {
    showTechTree.value = false
    nextTick(() => {
      showTechTree.value = true
    })
  } else {
    showTechTree.value = false
  }
}, { immediate: true })

const handleOverlayClick = () => {
  closeModal()
}

const closeModal = () => {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-content {
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.98), rgba(101, 67, 33, 0.98));
  border: 3px solid hsl(52, 100%, 50%);
  border-radius: 12px;
  max-width: 95vw;
  max-height: 95vh;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 2px solid hsl(52, 100%, 50%);
}

.modal-header h2 {
  margin: 0;
  color: hsl(52, 100%, 50%);
  font-size: 2rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.close-btn {
  background: none;
  border: 2px solid hsl(52, 100%, 50%);
  color: hsl(52, 100%, 50%);
  font-size: 2rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: hsl(52, 100%, 50%);
  color: #1a0f0a;
  transform: scale(1.1);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.player-flag-section {
  display: flex;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.flag-canvas {
  border-radius: 8px;
  border: 3px solid hsl(52, 100%, 50%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
}

.bonuses-section {
  display: flex;
  justify-content: center;
}

.techtree-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* Custom scrollbar */
.modal-body::-webkit-scrollbar {
  width: 12px;
}

.modal-body::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: hsl(52, 100%, 50%);
  border-radius: 6px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: hsl(52, 100%, 60%);
}

@media (max-width: 768px) {
  .modal-header {
    padding: 1rem;
  }

  .modal-header h2 {
    font-size: 1.5rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .flag-canvas {
    width: 100px;
    height: 100px;
  }
}
</style>
