<template>
  <div class="budget-slider-container">
    <div 
      ref="sliderRef"
      class="budget-slider-track"
      @mousedown="startDrag"
      @touchstart="startDrag"
    >
      <!-- Track fill (current value) -->
      <div 
        class="budget-slider-fill"
        :style="{ width: fillPercentage + '%' }"
      ></div>
      
      <!-- Budget limit indicator (red line) -->
      <div 
        v-if="showBudgetLimit && limitPercentage < 100"
        class="budget-slider-limit"
        :style="{ left: limitPercentage + '%' }"
      >
        <div class="limit-line"></div>
        <div class="limit-label">{{ Math.round(budgetLimit) }}</div>
      </div>
      
      <!-- Slider thumb -->
      <div 
        class="budget-slider-thumb"
        :style="{ left: thumbPercentage + '%' }"
        @mousedown.stop="startDrag"
        @touchstart.stop="startDrag"
      >
        <span class="thumb-value">{{ displayValue }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  modelValue: number;
  min: number;
  max: number;
  budgetLimit?: number | null;
  step?: number;
  decimals?: number;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number];
  'change': [value: number];
}>();

const sliderRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);

// Calculate the effective max (either budgetLimit or max)
const effectiveMax = computed(() => {
  if (props.budgetLimit !== undefined && props.budgetLimit !== null && props.budgetLimit < props.max) {
    return props.budgetLimit;
  }
  return props.max;
});

// Show budget limit only if it's less than the max
const showBudgetLimit = computed(() => {
  return props.budgetLimit !== undefined && 
         props.budgetLimit !== null && 
         props.budgetLimit < props.max;
});

// Percentage for the limit marker
const limitPercentage = computed(() => {
  if (!showBudgetLimit.value || props.budgetLimit === null || props.budgetLimit === undefined) {
    return 100;
  }
  return ((props.budgetLimit - props.min) / (props.max - props.min)) * 100;
});

// Current value percentage (for thumb position)
const thumbPercentage = computed(() => {
  const value = Math.max(props.min, Math.min(effectiveMax.value, props.modelValue));
  return ((value - props.min) / (props.max - props.min)) * 100;
});

// Fill percentage (shows how much of the track is filled)
const fillPercentage = computed(() => thumbPercentage.value);

// Display value with optional decimals
const displayValue = computed(() => {
  const decimals = props.decimals ?? 0;
  return decimals > 0 ? props.modelValue.toFixed(decimals) : Math.round(props.modelValue);
});

const updateValue = (clientX: number) => {
  if (!sliderRef.value) return;
  
  const rect = sliderRef.value.getBoundingClientRect();
  const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  
  // Calculate the raw value based on percentage
  let newValue = props.min + (percentage / 100) * (props.max - props.min);
  
  // Apply step if provided
  if (props.step) {
    newValue = Math.round(newValue / props.step) * props.step;
  }
  
  // Enforce budget limit (hard stop)
  newValue = Math.max(props.min, Math.min(effectiveMax.value, newValue));
  
  // Round to specified decimals
  const decimals = props.decimals ?? 0;
  if (decimals > 0) {
    newValue = parseFloat(newValue.toFixed(decimals));
  } else {
    newValue = Math.round(newValue);
  }
  
  if (newValue !== props.modelValue) {
    emit('update:modelValue', newValue);
    emit('change', newValue);
  }
};

const startDrag = (event: MouseEvent | TouchEvent) => {
  isDragging.value = true;
  
  const clientX = event instanceof MouseEvent 
    ? event.clientX 
    : (event.touches && event.touches[0] ? event.touches[0].clientX : 0);
  
  if (clientX) {
    updateValue(clientX);
  }
  
  event.preventDefault();
};

const onDrag = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return;
  
  const clientX = event instanceof MouseEvent 
    ? event.clientX 
    : (event.touches && event.touches[0] ? event.touches[0].clientX : 0);
  
  if (clientX) {
    updateValue(clientX);
  }
};

const stopDrag = () => {
  isDragging.value = false;
};

onMounted(() => {
  // Use passive listeners where possible for better scroll performance
  document.addEventListener('mousemove', onDrag, { passive: false });
  document.addEventListener('mouseup', stopDrag, { passive: true });
  document.addEventListener('touchmove', onDrag, { passive: false });
  document.addEventListener('touchend', stopDrag, { passive: true });
});

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('touchmove', onDrag);
  document.removeEventListener('touchend', stopDrag);
});
</script>

<style scoped>
.budget-slider-container {
  width: 100%;
  padding: 1.5rem 0 0.5rem;
  position: relative;
}

.budget-slider-track {
  position: relative;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
}

.budget-slider-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #66BB6A);
  border-radius: 4px 0 0 4px;
  transition: width 0.1s ease;
}

.budget-slider-limit {
  position: absolute;
  top: -8px;
  bottom: -8px;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 2;
}

.limit-line {
  width: 3px;
  height: 100%;
  background: #f44336;
  box-shadow: 0 0 4px rgba(244, 67, 54, 0.5);
  margin: 8px auto;
}

.limit-label {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  background: #f44336;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: bold;
  white-space: nowrap;
}

.budget-slider-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: white;
  border: 3px solid #4CAF50;
  border-radius: 50%;
  cursor: grab;
  z-index: 3;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.budget-slider-thumb:hover {
  transform: translate(-50%, -50%) scale(1.1);
  box-shadow: 0 3px 6px rgba(0,0,0,0.3);
}

.budget-slider-thumb:active {
  cursor: grabbing;
  transform: translate(-50%, -50%) scale(1.05);
}

.thumb-value {
  position: absolute;
  top: -28px;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.budget-slider-thumb:hover .thumb-value,
.budget-slider-thumb:active .thumb-value {
  opacity: 1;
}
</style>
