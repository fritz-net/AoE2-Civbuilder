<template>
  <div v-if="show" class="confirm-overlay">
    <div class="confirm-content" @click.stop>
      <div class="confirm-header">
        <h2>{{ title }}</h2>
      </div>

      <div class="confirm-body">
        <p v-if="message" class="confirm-message">{{ message }}</p>
        <p v-if="warning" class="confirm-warning">⚠️ {{ warning }}</p>
      </div>

      <div class="confirm-footer">
        <button class="confirm-btn cancel-btn" @click="handleCancel">
          {{ cancelText }}
        </button>
        <button class="confirm-btn confirm-btn-primary" @click="handleConfirm">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  title?: string
  message?: string
  warning?: string
  confirmText?: string
  cancelText?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm',
  message: '',
  warning: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  padding: 1rem;
}

.confirm-content {
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.98), rgba(101, 67, 33, 0.98));
  border: 3px solid hsl(52, 100%, 50%);
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
  overflow: hidden;
}

.confirm-header {
  padding: 1.5rem 2rem;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 2px solid hsl(52, 100%, 50%);
}

.confirm-header h2 {
  margin: 0;
  color: hsl(52, 100%, 50%);
  font-size: 2rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  text-align: center;
}

.confirm-body {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.confirm-message {
  color: #f0e6d2;
  font-size: 1.2rem;
  margin: 0;
  text-align: center;
  line-height: 1.6;
}

.confirm-warning {
  color: hsl(52, 100%, 50%);
  font-size: 1.3rem;
  font-weight: bold;
  margin: 0;
  padding: 1rem;
  background: rgba(255, 204, 0, 0.1);
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 8px;
  text-align: center;
  line-height: 1.6;
}

.confirm-footer {
  padding: 1.5rem 2rem;
  background: rgba(0, 0, 0, 0.3);
  border-top: 2px solid hsl(52, 100%, 50%);
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.confirm-btn {
  padding: 0.75rem 2rem;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid;
  font-family: inherit;
  min-width: 120px;
}

.cancel-btn {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 204, 0, 0.5);
  color: #f0e6d2;
}

.cancel-btn:hover {
  background: rgba(0, 0, 0, 0.6);
  border-color: hsl(52, 100%, 50%);
  box-shadow: 0 0 12px rgba(255, 204, 0, 0.3);
}

.confirm-btn-primary {
  background: linear-gradient(to bottom, hsl(52, 100%, 50%), hsl(45, 100%, 40%));
  border-color: hsl(52, 100%, 60%);
  color: #1a0f0a;
}

.confirm-btn-primary:hover {
  background: linear-gradient(to bottom, hsl(52, 100%, 60%), hsl(45, 100%, 50%));
  box-shadow: 0 0 12px rgba(255, 204, 0, 0.5);
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .confirm-header h2 {
    font-size: 1.5rem;
  }

  .confirm-message {
    font-size: 1rem;
  }

  .confirm-warning {
    font-size: 1.1rem;
  }

  .confirm-footer {
    flex-direction: column;
  }

  .confirm-btn {
    width: 100%;
  }
}
</style>
