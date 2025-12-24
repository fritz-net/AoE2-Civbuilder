<template>
  <div v-if="showTimer" class="timer-container" :class="{ 'timer-warning': isWarning, 'timer-critical': isCritical }">
    <div class="timer-label">{{ label }}</div>
    <div class="timer-display">{{ formattedTime }}</div>
    <div v-if="showProgress" class="timer-progress">
      <div class="timer-progress-bar" :style="{ width: progressPercent + '%' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  duration?: number // Current remaining time in seconds
  maxDuration?: number // Maximum duration for progress bar calculation (optional, defaults to duration)
  autoStart?: boolean
  showProgress?: boolean
  label?: string
  warningThreshold?: number // Show warning color below this (seconds)
  criticalThreshold?: number // Show critical color below this (seconds)
}>(), {
  duration: 60,
  maxDuration: 0, // 0 means use duration
  autoStart: true,
  showProgress: true,
  label: 'Time Remaining',
  warningThreshold: 30,
  criticalThreshold: 10,
})

const emit = defineEmits<{
  (e: 'complete'): void
  (e: 'tick', remainingSeconds: number): void
}>()

const timeRemaining = ref(props.duration)
const isRunning = ref(false)
const intervalId = ref<number | null>(null)

const formattedTime = computed(() => {
  const minutes = Math.floor(timeRemaining.value / 60)
  const seconds = timeRemaining.value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const progressPercent = computed(() => {
  const max = props.maxDuration > 0 ? props.maxDuration : props.duration
  return (timeRemaining.value / max) * 100
})

const isWarning = computed(() => {
  return timeRemaining.value <= props.warningThreshold && timeRemaining.value > props.criticalThreshold
})

const isCritical = computed(() => {
  return timeRemaining.value <= props.criticalThreshold
})

const showTimer = computed(() => {
  return props.duration > 0 && timeRemaining.value >= 0
})

const start = () => {
  if (isRunning.value) return
  
  isRunning.value = true
  intervalId.value = window.setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--
      emit('tick', timeRemaining.value)
      
      if (timeRemaining.value === 0) {
        stop()
        emit('complete')
      }
    }
  }, 1000)
}

const stop = () => {
  if (intervalId.value !== null) {
    clearInterval(intervalId.value)
    intervalId.value = null
  }
  isRunning.value = false
}

const reset = (newDuration?: number) => {
  stop()
  timeRemaining.value = newDuration ?? props.duration
}

const pause = () => {
  stop()
}

const resume = () => {
  start()
}

// Watch for duration changes
watch(() => props.duration, (newDuration, oldDuration) => {
  // Always update timeRemaining when duration changes from server
  // This handles page reload and turn changes
  if (newDuration !== oldDuration && newDuration !== timeRemaining.value) {
    timeRemaining.value = newDuration
    // If it was running and should auto-start, restart it
    if (props.autoStart) {
      stop()
      start()
    }
  }
})

// Watch for autoStart changes (handles pause/resume)
watch(() => props.autoStart, (shouldStart) => {
  if (shouldStart && !isRunning.value) {
    start()
  } else if (!shouldStart && isRunning.value) {
    stop()
  }
})

onMounted(() => {
  if (props.autoStart) {
    start()
  }
})

onUnmounted(() => {
  stop()
})

// Expose methods for parent component
defineExpose({
  start,
  stop,
  reset,
  pause,
  resume,
  timeRemaining,
  isRunning,
})
</script>

<style scoped>
.timer-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  transition: all 0.3s ease;
}

.timer-warning {
  border-color: hsl(39, 100%, 50%);
}

.timer-critical {
  border-color: hsl(0, 100%, 50%);
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  }
  50% {
    box-shadow: 0 4px 20px rgba(255, 0, 0, 0.8);
  }
}

.timer-label {
  font-size: 0.9rem;
  color: hsl(52, 100%, 50%);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.timer-display {
  font-size: 2.5rem;
  font-weight: bold;
  color: #f0e6d2;
  font-family: monospace;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.timer-critical .timer-display {
  color: hsl(0, 100%, 60%);
}

.timer-warning .timer-display {
  color: hsl(39, 100%, 60%);
}

.timer-progress {
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 3px;
  margin-top: 0.75rem;
  overflow: hidden;
}

.timer-progress-bar {
  height: 100%;
  background: hsl(52, 100%, 50%);
  transition: width 1s linear, background-color 0.3s ease;
  border-radius: 3px;
}

.timer-warning .timer-progress-bar {
  background: hsl(39, 100%, 50%);
}

.timer-critical .timer-progress-bar {
  background: hsl(0, 100%, 50%);
}

@media (max-width: 768px) {
  .timer-container {
    padding: 0.75rem;
  }

  .timer-display {
    font-size: 2rem;
  }

  .timer-label {
    font-size: 0.8rem;
  }
}
</style>
