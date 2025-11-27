<template>
  <div class="draft-lobby">
    <h1 class="lobby-title">Civilization Drafter</h1>
    
    <div class="lobby-box">
      <div class="player-grid">
        <div
          v-for="(player, index) in players"
          :key="index"
          class="player-row"
        >
          <div class="player-label">
            {{ index === 0 ? 'Host:' : `Player ${index + 1}:` }}
          </div>
          <div class="player-name">
            {{ player.name || '(Waiting...)' }}
          </div>
          <div class="player-ready">
            <span v-if="index !== 0">
              {{ player.ready === 1 ? '✓' : 'x' }}
            </span>
          </div>
        </div>
      </div>

      <button
        v-if="isHost"
        class="ready-button"
        :disabled="!allPlayersReady"
        @click="$emit('start')"
      >
        {{ allPlayersReady ? 'Start Draft' : 'Lobby Not Ready' }}
      </button>

      <button
        v-else-if="playerNumber >= 0"
        class="ready-button"
        @click="$emit('toggle-ready')"
      >
        {{ currentPlayer?.ready === 1 ? 'Unready' : 'Ready' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DraftPlayer } from '~/composables/useDraft'

const props = defineProps<{
  players: DraftPlayer[]
  playerNumber: number
  isHost: boolean
  currentPlayer: DraftPlayer | null
}>()

const emit = defineEmits<{
  (e: 'start'): void
  (e: 'toggle-ready'): void
}>()

const allPlayersReady = computed(() => {
  for (let i = 1; i < props.players.length; i++) {
    if (props.players[i].ready === 0) {
      return false
    }
  }
  return true
})
</script>

<style scoped>
.draft-lobby {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 2rem;
}

.lobby-title {
  font-size: 3rem;
  color: hsl(52, 100%, 50%);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  margin-bottom: 2rem;
  text-align: center;
}

.lobby-box {
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  border: 3px solid hsl(52, 100%, 50%);
  border-radius: 8px;
  padding: 2rem;
  min-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
}

.player-grid {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  margin-bottom: 2rem;
}

.player-row {
  display: contents;
}

.player-label {
  font-weight: bold;
  color: hsl(52, 100%, 50%);
  text-align: right;
}

.player-name {
  color: #f0e6d2;
  padding-left: 1rem;
}

.player-ready {
  color: hsl(52, 100%, 50%);
  font-weight: bold;
  font-size: 1.2rem;
  text-align: center;
  min-width: 30px;
}

.ready-button {
  width: 100%;
  padding: 0.75rem 1.5rem;
  font-size: 1.2rem;
  font-weight: bold;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  color: hsl(52, 100%, 50%);
  cursor: pointer;
  transition: all 0.2s ease;
}

.ready-button:hover:not(:disabled) {
  background: hsl(52, 100%, 50%);
  color: #1a0f0a;
  box-shadow: 0 0 12px hsla(52, 100%, 50%, 0.5);
}

.ready-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .lobby-box {
    min-width: 300px;
    padding: 1.5rem;
  }

  .lobby-title {
    font-size: 2rem;
  }

  .player-grid {
    gap: 0.75rem;
    font-size: 0.9rem;
  }
}
</style>
