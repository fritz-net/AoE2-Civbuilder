<template>
  <div 
    v-if="showTimer" 
    class="timer-container" 
    :class="{ 
      'timer-warning': isWarning, 
      'timer-critical': isCritical, 
      'timer-paused': isPaused,
      'timer-clickable': isHost && showControls
    }"
    @click="handleTimerClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="timer-label">{{ label }}</div>
    <div class="timer-display-row">
      <!-- Show pause/play icon on hover (host only), otherwise show time -->
      <div v-if="isHost && showControls && isHovered" class="timer-icon-display">
        <svg v-if="!isPaused" viewBox="0 0 24 24" class="hover-control-icon">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
        <svg v-else viewBox="0 0 24 24" class="hover-control-icon">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
      <div v-else class="timer-display">
        {{ formattedTime }}
        <span v-if="isPaused" class="pause-indicator-inline pulse-animation">⏸</span>
      </div>
    </div>
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
const isHovered = ref(false)

const handleTimerClick = () => {
  // Only handle clicks if host and controls are enabled
  if (!props.isHost || !props.showControls) return
  
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
    if (props.autoStart && !props.isPaused) {
      stop()
      start()
    }
  }
})

// Combined watcher for autoStart and isPaused to prevent conflicts
// Handles both initial state and pause/resume transitions
watch([() => props.autoStart, () => props.isPaused], ([shouldAutoStart, paused]) => {
  const shouldRun = shouldAutoStart && !paused
  
  if (shouldRun && !isRunning.value) {
    start()
  } else if (!shouldRun && isRunning.value) {
    stop()
  }
})

onMounted(() => {
  // Start timer only if autoStart is true AND not paused
  if (props.autoStart && !props.isPaused) {
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

.timer-clickable {
  cursor: pointer;
  user-select: none;
}

.timer-clickable:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.8);
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
  justify-content: center;
  height: 3rem;
  min-height: 3rem;
}

.timer-display {
  font-size: 2.5rem;
  font-weight: bold;
  color: #f0e6d2;
  font-family: monospace;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 3rem;
}

.timer-critical .timer-display {
  color: hsl(0, 100%, 60%);
}

.timer-warning .timer-display {
  color: hsl(39, 100%, 60%);
}

.timer-icon-display {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
}

.hover-control-icon {
  width: 3rem;
  height: 3rem;
  fill: #f0e6d2;
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.8));
  animation: iconPulse 0.3s ease-in-out;
}

@keyframes iconPulse {
  0% {
    transform: scale(0.9);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.pause-indicator-inline {
  font-size: 2rem;
  margin-left: 0.5rem;
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
  
  .hover-control-icon {
    width: 2.5rem;
    height: 2.5rem;
  }
}
</style>
