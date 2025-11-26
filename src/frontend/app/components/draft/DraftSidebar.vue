<template>
  <div class="draft-sidebar">
    <div class="sidebar-header">
      <h3>{{ playerName || 'Your Civilization' }}</h3>
    </div>

    <div class="sidebar-content">
      <!-- Civilization Bonuses -->
      <div v-if="bonuses.civBonuses.length > 0" class="bonus-section">
        <h4 class="section-title">Civilization Bonuses</h4>
        <ul class="bonus-list">
          <li v-for="(bonus, index) in bonuses.civBonuses" :key="index" class="bonus-item">
            <span class="bonus-bullet">•</span>
            <span class="bonus-text">{{ bonus }}</span>
          </li>
        </ul>
      </div>

      <!-- Unique Unit -->
      <div v-if="bonuses.uniqueUnit" class="bonus-section">
        <h4 class="section-title">Unique Unit</h4>
        <div class="bonus-highlight">{{ bonuses.uniqueUnit }}</div>
      </div>

      <!-- Castle Age Tech -->
      <div v-if="bonuses.castleTech" class="bonus-section">
        <h4 class="section-title">Castle Age Tech</h4>
        <div class="bonus-highlight">{{ bonuses.castleTech }}</div>
      </div>

      <!-- Imperial Age Tech -->
      <div v-if="bonuses.imperialTech" class="bonus-section">
        <h4 class="section-title">Imperial Age Tech</h4>
        <div class="bonus-highlight">{{ bonuses.imperialTech }}</div>
      </div>

      <!-- Team Bonus -->
      <div v-if="bonuses.teamBonus" class="bonus-section">
        <h4 class="section-title">Team Bonus</h4>
        <div class="bonus-highlight">{{ bonuses.teamBonus }}</div>
      </div>

      <!-- Empty state -->
      <div v-if="isEmpty" class="empty-state">
        <p>No bonuses selected yet</p>
        <p class="empty-hint">Select cards during the draft to build your civilization</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface DraftSidebarBonuses {
  civBonuses: string[]
  uniqueUnit: string | null
  castleTech: string | null
  imperialTech: string | null
  teamBonus: string | null
}

const props = defineProps<{
  playerName?: string
  bonuses: DraftSidebarBonuses
}>()

const isEmpty = computed(() => {
  return (
    props.bonuses.civBonuses.length === 0 &&
    !props.bonuses.uniqueUnit &&
    !props.bonuses.castleTech &&
    !props.bonuses.imperialTech &&
    !props.bonuses.teamBonus
  )
})
</script>

<style scoped>
.draft-sidebar {
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.95), rgba(101, 67, 33, 0.95));
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 8px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
}

.sidebar-header {
  background: rgba(0, 0, 0, 0.3);
  padding: 1rem;
  border-bottom: 2px solid hsl(52, 100%, 50%);
}

.sidebar-header h3 {
  margin: 0;
  color: hsl(52, 100%, 50%);
  font-size: 1.3rem;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.bonus-section {
  margin-bottom: 1.5rem;
}

.bonus-section:last-child {
  margin-bottom: 0;
}

.section-title {
  color: hsl(52, 100%, 50%);
  font-size: 1rem;
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 204, 0, 0.3);
  padding-bottom: 0.25rem;
}

.bonus-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.bonus-item {
  display: flex;
  gap: 0.5rem;
  color: #f0e6d2;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.bonus-bullet {
  color: hsl(52, 100%, 50%);
  font-weight: bold;
}

.bonus-text {
  flex: 1;
}

.bonus-highlight {
  color: #f0e6d2;
  font-size: 0.95rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  border-left: 3px solid hsl(52, 100%, 50%);
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: rgba(240, 230, 210, 0.6);
}

.empty-state p {
  margin: 0.5rem 0;
}

.empty-hint {
  font-size: 0.85rem;
  font-style: italic;
}

/* Custom scrollbar */
.sidebar-content::-webkit-scrollbar {
  width: 8px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: hsl(52, 100%, 50%);
  border-radius: 4px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: hsl(52, 100%, 60%);
}

@media (max-width: 1200px) {
  .sidebar-header h3 {
    font-size: 1.1rem;
  }

  .section-title {
    font-size: 0.9rem;
  }

  .bonus-item {
    font-size: 0.85rem;
  }

  .bonus-highlight {
    font-size: 0.85rem;
  }
}

@media (max-width: 768px) {
  .draft-sidebar {
    max-height: 300px;
  }

  .sidebar-header {
    padding: 0.75rem;
  }

  .sidebar-content {
    padding: 0.75rem;
  }

  .bonus-section {
    margin-bottom: 1rem;
  }
}
</style>
