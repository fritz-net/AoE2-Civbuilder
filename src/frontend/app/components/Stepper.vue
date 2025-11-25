<template>
  <div class="stepper">
    <div class="stepper-track">
      <div 
        v-for="(step, index) in steps" 
        :key="index"
        class="step-wrapper"
      >
        <div 
          class="step-item"
          :class="{
            'step-active': currentStep === index,
            'step-completed': currentStep > index,
            'step-clickable': allowNavigation && index <= maxReachedStep
          }"
          @click="goToStep(index)"
        >
          <div class="step-circle">
            <span v-if="currentStep > index" class="step-check">✓</span>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <span class="step-label">{{ step }}</span>
        </div>
        <div 
          v-if="index < steps.length - 1" 
          class="step-connector"
          :class="{ 'connector-completed': currentStep > index }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  steps: string[]
  currentStep: number
  allowNavigation?: boolean
}>(), {
  allowNavigation: true
})

const emit = defineEmits<{
  (e: 'update:currentStep', value: number): void
}>()

// Track the maximum step the user has reached
const maxReachedStep = ref(props.currentStep)

// Update maxReachedStep when currentStep changes
watch(() => props.currentStep, (newStep) => {
  if (newStep > maxReachedStep.value) {
    maxReachedStep.value = newStep
  }
})

function goToStep(index: number) {
  if (props.allowNavigation && index <= maxReachedStep.value) {
    emit('update:currentStep', index)
  }
}
</script>

<style scoped>
.stepper {
  padding: 1rem 0;
  margin-bottom: 1.5rem;
}

.stepper-track {
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-wrapper {
  display: flex;
  align-items: center;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  transition: all 0.2s ease;
}

.step-clickable {
  cursor: pointer;
}

.step-clickable:hover .step-circle {
  transform: scale(1.1);
}

.step-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1rem;
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid hsl(52, 100%, 50%);
  color: hsl(52, 100%, 50%);
  transition: all 0.3s ease;
}

.step-active .step-circle {
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  box-shadow: 0 0 12px hsla(52, 100%, 50%, 0.5);
}

.step-completed .step-circle {
  background: hsl(52, 100%, 50%);
  color: #1a0f0a;
}

.step-check {
  font-size: 1.2rem;
}

.step-label {
  font-size: 0.85rem;
  color: hsl(52, 100%, 50%);
  text-align: center;
  max-width: 100px;
  opacity: 0.7;
}

.step-active .step-label {
  opacity: 1;
  font-weight: bold;
}

.step-completed .step-label {
  opacity: 1;
}

.step-connector {
  width: 60px;
  height: 3px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid hsl(52, 100%, 50%);
  margin: 0 0.5rem;
  margin-bottom: 1.5rem;
}

.connector-completed {
  background: hsl(52, 100%, 50%);
}

@media (max-width: 768px) {
  .step-label {
    display: none;
  }
  
  .step-connector {
    width: 30px;
    margin-bottom: 0;
  }
  
  .step-circle {
    width: 32px;
    height: 32px;
    font-size: 0.9rem;
  }
}
</style>
