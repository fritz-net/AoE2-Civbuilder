<template>
  <div v-if="showTimer" class="timer-container" :class="{ 'timer-warning': isWarning, 'timer-critical': isCritical, 'timer-paused': isPaused }">
    <div class="timer-label">{{ label }}</div>
    <div class="timer-display-row">
      <div class="timer-display">{{ formattedTime }}</div>
      <div v-if="isPaused" class="pause-indicator" :class="{ 'pulse-animation': isPaused }">
        <svg viewBox="0 0 24 24" class="pause-icon">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      </div>
    </div>
    <div v-if="showProgress" class="timer-progress">
      <div class="timer-progress-bar" :style="{ width: progressPercent + '%' }"></div>
    </div>
    
    <!-- Integrated timer controls (only visible for host) -->
    <button 
      v-if="isHost && showControls" 
      class="timer-control-button"
      :class="{ 'is-paused': isPaused }"
      @click="handleControlClick"
    >
      <svg v-if="!isPaused" viewBox="0 0 24 24" class="control-icon pause-icon">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
      <svg v-else viewBox="0 0 24 24" class="control-icon play-icon">
        <path d="M8 5v14l11-7z" />
      </svg>
      <span class="control-label">{{ isPaused ? 'Resume' : 'Pause' }}</span>
    </button>
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
  isHost?: boolean // Whether the current user is the host
  isPaused?: boolean // Whether the timer is currently paused
  showControls?: boolean // Whether to show pause/resume controls
}>(), {
  duration: 60,
  maxDuration: 0, // 0 means use duration
  autoStart: true,
  showProgress: true,
  label: 'Time Remaining',
  warningThreshold: 30,
  criticalThreshold: 10,
  isHost: false,
  isPaused: false,
  showControls: true,
})

const emit = defineEmits<{
  (e: 'complete'): void
  (e: 'tick', remainingSeconds: number): void
  (e: 'pause'): void
  (e: 'resume'): void
}>()

const timeRemaining = ref(props.duration)
const isRunning = ref(false)
const intervalId = ref<number | null>(null)

const handleControlClick = () => {
  if (props.isPaused) {
    emit('resume')
  } else {
    emit('pause')
  }
}

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

// Watch isPaused prop to ensure timer state stays in sync
// This handles when parent component updates the paused state
watch(() => props.isPaused, (paused, wasPaused) => {
  if (paused && isRunning.value) {
    // Pause the timer
    stop()
  } else if (!paused && wasPaused === true) {
    // Resume only if transitioning from paused to unpaused
    start()
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
  position: relative;
}

.timer-warning {
  border-color: hsl(39, 100%, 50%);
}

.timer-critical {
  border-color: hsl(0, 100%, 50%);
  animation: pulse 1s ease-in-out infinite;
}

.timer-paused {
  border-color: hsl(200, 100%, 50%);
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

.timer-display-row {
  display: flex;
  align-items: center;
  gap: 1rem;
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

.pause-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
}

.pause-indicator .pause-icon {
  width: 100%;
  height: 100%;
  fill: hsl(200, 100%, 50%);
}

.pulse-animation {
  animation: pausePulse 1.5s ease-in-out infinite;
}

@keyframes pausePulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
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

.timer-control-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.7), rgba(101, 67, 33, 0.7));
  border: 2px solid hsl(39, 100%, 50%);
  border-radius: 4px;
  color: hsl(39, 100%, 50%);
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.timer-control-button:hover {
  background: hsl(39, 100%, 50%);
  color: #1a0f0a;
  box-shadow: 0 0 12px rgba(255, 165, 0, 0.5);
  transform: translateY(-1px);
}

.timer-control-button.is-paused {
  border-color: hsl(120, 100%, 50%);
  color: hsl(120, 100%, 50%);
}

.timer-control-button.is-paused:hover {
  background: hsl(120, 100%, 50%);
  color: #1a0f0a;
  box-shadow: 0 0 12px rgba(0, 255, 0, 0.5);
}

.control-icon {
  width: 1rem;
  height: 1rem;
  fill: currentColor;
}

.control-label {
  font-size: 0.85rem;
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
  
  .timer-control-button {
    padding: 0.4rem 0.75rem;
    font-size: 0.8rem;
  }
  
  .pause-indicator {
    width: 1.5rem;
    height: 1.5rem;
  }
}
</style>
