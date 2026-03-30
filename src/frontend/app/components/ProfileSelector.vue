<template>
  <div v-if="show" class="modal-overlay" @click.self="handleCancel">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Select Steam Profile</h2>
        <button class="close-btn" @click="handleCancel" aria-label="Close">×</button>
      </div>
      
      <div class="modal-body">
        <p class="description">
          Multiple Steam profiles were detected. Please select which one to install the mod to:
        </p>
        
        <div class="profile-list">
          <button
            v-for="profile in profiles"
            :key="profile.id"
            class="profile-item"
            @click="handleSelect(profile)"
          >
            <div class="profile-icon">👤</div>
            <div class="profile-info">
              <div class="profile-name">{{ profile.displayName }}</div>
              <div class="profile-id">ID: {{ profile.id }}</div>
            </div>
          </button>
        </div>
        
        <div class="modal-footer">
          <button class="cancel-btn" @click="handleCancel">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SteamProfile } from '~/composables/useFileSystemInstall'

interface Props {
  show: boolean
  profiles: SteamProfile[]
}

interface Emits {
  (e: 'select', profile: SteamProfile): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function handleSelect(profile: SteamProfile) {
  emit('select', profile)
}

function handleCancel() {
  emit('cancel')
}
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
  max-width: 500px;
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
}

.profile-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.profile-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
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

.profile-item:hover {
  background: rgba(0, 0, 0, 0.5);
  border-color: hsl(52, 100%, 50%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
}

.profile-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
}

.profile-name {
  color: hsl(52, 100%, 50%);
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.profile-id {
  color: hsla(52, 100%, 50%, 0.7);
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
}

.modal-footer {
  display: flex;
  justify-content: center;
  padding-top: 1rem;
  border-top: 2px solid hsla(52, 100%, 50%, 0.3);
}

.cancel-btn {
  padding: 0.75rem 2rem;
  background: rgba(0, 0, 0, 0.4);
  color: hsl(52, 100%, 50%);
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: rgba(139, 69, 19, 0.6);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .modal-content {
    max-width: 95%;
  }
  
  .modal-header h2 {
    font-size: 1.2rem;
  }
  
  .profile-item {
    padding: 0.75rem;
  }
  
  .profile-icon {
    font-size: 2rem;
  }
  
  .profile-name {
    font-size: 1rem;
  }
}
</style>
