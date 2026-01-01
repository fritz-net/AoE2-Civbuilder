<template>
  <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ playerTitle }}</h2>
        <button class="close-btn" @click="closeModal" title="Close">×</button>
      </div>

      <div class="modal-body">
        <!-- Tech tree with native sidebar showing bonuses -->
        <TechTree
          v-if="player && showTechTree"
          :civ="playerCivData"
          :editable="false"
          :techtree-points="techtreePoints"
          :points-label="'Tech Tree Points Used'"
          :sidebar-content="sidebarContent"
          :sidebar-title="sidebarTitle"
          done-button-text="Close"
          @done="closeModal"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { DraftPlayer } from '~/composables/useDraft'
import { getBonusCards } from '~/composables/useBonusData'
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

const showTechTree = ref(false)

const playerTitle = computed(() => {
  if (!props.player) return 'Player Info'
  return props.player.alias || props.player.name || `Player ${props.playerIndex + 1}`
})

const sidebarTitle = computed(() => {
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

// Generate sidebar content with bonuses for TechTree's native sidebar
const sidebarContent = computed(() => {
  if (!props.player) return '<p>No player data available</p>'
  
  const player = props.player
  
  // Check if player has any bonuses at all
  if (!player.bonuses || !Array.isArray(player.bonuses)) {
    return '<p>Loading bonuses...</p>'
  }
  
  // Get all bonus cards by type
  const allCards = {
    civBonuses: getBonusCards('civ'),
    uniqueUnits: getBonusCards('uu'),
    castleTechs: getBonusCards('castle'),
    imperialTechs: getBonusCards('imp'),
    teamBonuses: getBonusCards('team'),
  }
  
  let html = ''
  let hasAnyBonus = false
  
  // Player info header
  if (player.name) {
    html += `<p><strong>Player:</strong> ${player.name}</p>`
  }
  if (player.description) {
    html += `<p>${player.description}</p>`
  }
  if (html) {
    html += '<hr>'
  }
  
  // Civilization Bonuses
  if (player.bonuses[0] && Array.isArray(player.bonuses[0]) && player.bonuses[0].length > 0) {
    html += '<h3>Civilization Bonuses</h3><ul>'
    player.bonuses[0].forEach((id: number) => {
      const bonus = allCards.civBonuses[id]
      if (bonus && bonus.name) {
        html += `<li>${bonus.name}</li>`
        hasAnyBonus = true
      }
    })
    html += '</ul>'
  }
  
  // Unique Unit - handle both legacy (number) and custom (object) formats
  if (player.bonuses[1] && Array.isArray(player.bonuses[1]) && player.bonuses[1].length > 0) {
    const unitData = player.bonuses[1][0]
    
    // Check if it's a custom UU object
    if (typeof unitData === 'object' && unitData.type === 'custom') {
      if (hasAnyBonus) html += '<hr>'
      html += `<h3>Custom Unique Unit</h3>`
      html += `<p><strong>${unitData.name}</strong></p>`
      html += `<p class="custom-uu-type">${unitData.unitType.charAt(0).toUpperCase() + unitData.unitType.slice(1)}</p>`
      html += '<div class="custom-uu-stats">'
      html += `<p><strong>HP:</strong> ${unitData.health} | <strong>Attack:</strong> ${unitData.attack}</p>`
      html += `<p><strong>Armor:</strong> ${unitData.meleeArmor}/${unitData.pierceArmor} | <strong>Speed:</strong> ${unitData.speed}</p>`
      if (unitData.range > 0) {
        html += `<p><strong>Range:</strong> ${unitData.range}</p>`
      }
      html += `<p><strong>Cost:</strong> ${unitData.cost.food}F `
      if (unitData.cost.wood > 0) html += `${unitData.cost.wood}W `
      if (unitData.cost.gold > 0) html += `${unitData.cost.gold}G `
      if (unitData.cost.stone > 0) html += `${unitData.cost.stone}S`
      html += `</p>`
      if (unitData.attackBonuses && unitData.attackBonuses.length > 0) {
        html += '<p><strong>Bonuses:</strong></p><ul>'
        unitData.attackBonuses.forEach((bonus: any) => {
          html += `<li>+${bonus.amount} vs armor class ${bonus.class}</li>`
        })
        html += '</ul>'
      }
      html += '</div>'
      hasAnyBonus = true
    } else if (typeof unitData === 'number') {
      // Legacy format: numeric unit ID
      const unit = allCards.uniqueUnits[unitData]
      if (unit && unit.name) {
        if (hasAnyBonus) html += '<hr>'
        html += `<h3>Unique Unit</h3><p>${unit.name}</p>`
        hasAnyBonus = true
      }
    }
  }
  
  // Castle Age Tech
  if (player.bonuses[2] && Array.isArray(player.bonuses[2]) && player.bonuses[2].length > 0) {
    const techId = player.bonuses[2][0]
    const tech = allCards.castleTechs[techId]
    if (tech && tech.name) {
      if (hasAnyBonus) html += '<hr>'
      html += `<h3>Castle Age Tech</h3><p>${tech.name}</p>`
      hasAnyBonus = true
    }
  }
  
  // Imperial Age Tech
  if (player.bonuses[3] && Array.isArray(player.bonuses[3]) && player.bonuses[3].length > 0) {
    const techId = player.bonuses[3][0]
    const tech = allCards.imperialTechs[techId]
    if (tech && tech.name) {
      if (hasAnyBonus) html += '<hr>'
      html += `<h3>Imperial Age Tech</h3><p>${tech.name}</p>`
      hasAnyBonus = true
    }
  }
  
  // Team Bonus
  if (player.bonuses[4] && Array.isArray(player.bonuses[4]) && player.bonuses[4].length > 0) {
    const bonusId = player.bonuses[4][0]
    const bonus = allCards.teamBonuses[bonusId]
    if (bonus && bonus.name) {
      if (hasAnyBonus) html += '<hr>'
      html += `<h3>Team Bonus</h3><p>${bonus.name}</p>`
      hasAnyBonus = true
    }
  }
  
  // If no bonuses were found at all, show message
  if (!hasAnyBonus) {
    return '<p>No bonuses selected yet</p>'
  }
  
  return html
})

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
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
}

/* Custom scrollbar - keep for consistency but TechTree handles its own scrolling */
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
}

/* Custom UU Stats Styling (for sidebar content) */
:deep(.custom-uu-type) {
  color: rgba(240, 230, 210, 0.7);
  font-style: italic;
  font-size: 0.9em;
  margin-top: 0.25rem;
}

:deep(.custom-uu-stats) {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  border-left: 3px solid hsl(52, 100%, 50%);
}

:deep(.custom-uu-stats p) {
  margin: 0.25rem 0;
  font-size: 0.9em;
  line-height: 1.5;
}

:deep(.custom-uu-stats ul) {
  margin: 0.5rem 0 0 0;
  padding-left: 1.5rem;
}

:deep(.custom-uu-stats li) {
  margin: 0.25rem 0;
  font-size: 0.85em;
  color: rgba(240, 230, 210, 0.9);
}
</style>
