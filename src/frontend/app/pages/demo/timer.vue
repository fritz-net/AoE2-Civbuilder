<template>
  <div class="timer-demo">
    <!-- Settings Panel -->
    <div class="settings-panel">
      <h2>⏱️ Timer Countdown Demo Settings</h2>
      
      <div class="setting-group">
        <label class="setting-label" for="duration-input">Duration (seconds):</label>
        <input 
          id="duration-input"
          type="number" 
          v-model.number="duration" 
          min="1"
          max="600"
          class="number-input"
        />
      </div>
      
      <div class="setting-group">
        <label class="setting-label" for="max-duration-input">Max Duration (for progress bar):</label>
        <input 
          id="max-duration-input"
          type="number" 
          v-model.number="maxDuration" 
          min="0"
          max="600"
          class="number-input"
        />
        <span class="info-text">0 = use duration</span>
      </div>
      
      <div class="setting-group">
        <label class="setting-label" for="warning-input">Warning Threshold (seconds):</label>
        <input 
          id="warning-input"
          type="number" 
          v-model.number="warningThreshold" 
          min="1"
          max="120"
          class="number-input"
        />
      </div>
      
      <div class="setting-group">
        <label class="setting-label" for="critical-input">Critical Threshold (seconds):</label>
        <input 
          id="critical-input"
          type="number" 
          v-model.number="criticalThreshold" 
          min="1"
          max="60"
          class="number-input"
        />
      </div>
      
      <div class="setting-group">
        <label class="setting-label" for="label-input">Label:</label>
        <input 
          id="label-input"
          type="text" 
          v-model="label" 
          class="text-input"
          placeholder="Time Remaining"
        />
      </div>
      
      <div class="setting-group">
        <label class="setting-label">
          <input type="checkbox" v-model="autoStart" />
          Auto Start
        </label>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">
          <input type="checkbox" v-model="showProgress" />
          Show Progress Bar
        </label>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">
          <input type="checkbox" v-model="isHost" />
          Host Controls (clickable to pause/resume)
        </label>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">
          <input type="checkbox" v-model="isPaused" />
          Paused
        </label>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">
          <input type="checkbox" v-model="showControls" />
          Show Controls
        </label>
      </div>
      
      <div class="button-group">
        <button @click="resetTimer" class="control-button">🔄 Reset Timer</button>
        <button @click="addTime(10)" class="control-button">⏱️ +10s</button>
        <button @click="addTime(-10)" class="control-button" :disabled="duration <= 10">⏱️ -10s</button>
      </div>
      
      <div class="info-box">
        <h3>Timer Events:</h3>
        <div class="events-log">
          <div v-for="(event, index) in events" :key="index" class="event-item">
            {{ event }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Timer Display -->
    <div class="timer-container">
      <h2>Timer Preview</h2>
      
      <div class="timer-wrapper">
        <TimerCountdown
          ref="timerRef"
          :key="timerKey"
          :duration="duration"
          :max-duration="maxDuration"
          :auto-start="autoStart"
          :show-progress="showProgress"
          :label="label"
          :warning-threshold="warningThreshold"
          :critical-threshold="criticalThreshold"
          :is-host="isHost"
          :is-paused="isPaused"
          :show-controls="showControls"
          @complete="handleComplete"
          @tick="handleTick"
          @pause="handlePause"
          @resume="handleResume"
        />
      </div>
      
      <div class="instructions">
        <h3>Instructions:</h3>
        <ul>
          <li>Adjust settings in the left panel to configure the timer</li>
          <li>Enable "Host Controls" and hover over the timer to see pause/play icons</li>
          <li>Click the timer when hovering (host mode) to pause/resume</li>
          <li>Watch the border color change based on warning and critical thresholds</li>
          <li>When paused, a pause icon appears next to the time</li>
          <li>Progress bar shows time remaining visually</li>
        </ul>
      </div>
      
      <div class="state-display">
        <h3>Current State:</h3>
        <ul>
          <li><strong>Duration:</strong> {{ duration }}s</li>
          <li><strong>Auto Start:</strong> {{ autoStart }}</li>
          <li><strong>Is Paused:</strong> {{ isPaused }}</li>
          <li><strong>Is Host:</strong> {{ isHost }}</li>
          <li><strong>Show Progress:</strong> {{ showProgress }}</li>
          <li><strong>Warning at:</strong> {{ warningThreshold }}s</li>
          <li><strong>Critical at:</strong> {{ criticalThreshold }}s</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TimerCountdown from '~/components/draft/TimerCountdown.vue'

const timerRef = ref<InstanceType<typeof TimerCountdown> | null>(null)
const timerKey = ref(0)

// Settings
const duration = ref(60)
const maxDuration = ref(0)
const autoStart = ref(true)
const showProgress = ref(true)
const label = ref('Time Remaining')
const warningThreshold = ref(30)
const criticalThreshold = ref(10)
const isHost = ref(true)
const isPaused = ref(false)
const showControls = ref(true)

// Events log
const events = ref<string[]>([])

// Methods
function handleComplete() {
  addEvent('⏰ Timer completed!')
}

function handleTick(remainingSeconds: number) {
  // Only log every 10 seconds to avoid spam
  if (remainingSeconds % 10 === 0) {
    addEvent(`⏱️ Tick: ${remainingSeconds}s remaining`)
  }
}

function handlePause() {
  addEvent('⏸️ Timer paused')
  isPaused.value = true
}

function handleResume() {
  addEvent('▶️ Timer resumed')
  isPaused.value = false
}

function addEvent(message: string) {
  const timestamp = new Date().toLocaleTimeString()
  events.value.unshift(`[${timestamp}] ${message}`)
  // Keep only last 10 events
  if (events.value.length > 10) {
    events.value.pop()
  }
}

function resetTimer() {
  timerKey.value++
  events.value = []
  addEvent('🔄 Timer reset')
}

function addTime(seconds: number) {
  duration.value = Math.max(1, duration.value + seconds)
  addEvent(`⏱️ Time adjusted: ${seconds > 0 ? '+' : ''}${seconds}s`)
}
</script>

<style scoped>
.timer-demo {
  display: flex;
  gap: 1rem;
  min-height: 100vh;
  background: #2a2a2a;
  padding: 1rem;
}

.settings-panel {
  width: 350px;
  background: linear-gradient(135deg, #3a3a3a 0%, #2a2a2a 100%);
  border-right: 3px solid #d4af37;
  padding: 1.5rem;
  overflow-y: auto;
  flex-shrink: 0;
  border-radius: 8px;
}

.settings-panel h2 {
  color: #d4af37;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.setting-group {
  margin-bottom: 1.5rem;
}

.setting-label {
  display: block;
  color: #e0e0e0;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.number-input,
.text-input {
  width: 100%;
  padding: 0.5rem;
  border: 2px solid #4a4a4a;
  border-radius: 6px;
  background: #1a1a1a;
  color: #e0e0e0;
  font-size: 1rem;
}

.number-input:focus,
.text-input:focus {
  outline: none;
  border-color: #d4af37;
}

.info-text {
  display: block;
  font-size: 0.85rem;
  color: #999;
  margin-top: 0.5rem;
  font-style: italic;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.control-button {
  padding: 0.75rem;
  background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
  border: none;
  border-radius: 8px;
  color: #1a1a1a;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(212, 175, 55, 0.4);
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-button:active:not(:disabled) {
  transform: translateY(0);
}

.info-box {
  background: #1a1a1a;
  border: 2px solid #d4af37;
  border-radius: 8px;
  padding: 1rem;
  max-height: 300px;
  overflow-y: auto;
}

.info-box h3 {
  color: #d4af37;
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
}

.events-log {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.event-item {
  color: #e0e0e0;
  padding: 0.5rem;
  background: #2a2a2a;
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: monospace;
}

.timer-container {
  flex: 1;
  background: linear-gradient(135deg, #3a3a3a 0%, #2a2a2a 100%);
  border-radius: 8px;
  padding: 2rem;
  overflow-y: auto;
}

.timer-container h2 {
  color: #d4af37;
  font-size: 2rem;
  margin-bottom: 2rem;
  text-align: center;
}

.timer-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  margin-bottom: 2rem;
}

.instructions {
  background: #1a1a1a;
  border: 2px solid #4a4a4a;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.instructions h3 {
  color: #d4af37;
  font-size: 1.3rem;
  margin-bottom: 1rem;
}

.instructions ul {
  color: #e0e0e0;
  padding-left: 1.5rem;
  line-height: 1.8;
}

.instructions li {
  margin-bottom: 0.5rem;
}

.state-display {
  background: #1a1a1a;
  border: 2px solid #d4af37;
  border-radius: 8px;
  padding: 1.5rem;
}

.state-display h3 {
  color: #d4af37;
  font-size: 1.3rem;
  margin-bottom: 1rem;
}

.state-display ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.state-display li {
  color: #e0e0e0;
  padding: 0.5rem 0;
  border-bottom: 1px solid #3a3a3a;
  font-size: 0.95rem;
}

.state-display li:last-child {
  border-bottom: none;
}

.state-display strong {
  color: #d4af37;
}

/* Responsive design */
@media (max-width: 1024px) {
  .timer-demo {
    flex-direction: column;
  }
  
  .settings-panel {
    width: 100%;
    border-right: none;
    border-bottom: 3px solid #d4af37;
  }
}
</style>
