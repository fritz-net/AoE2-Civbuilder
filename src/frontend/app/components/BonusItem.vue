<template>
  <div 
    class="bonus-item"
    :class="{ 
      'bonus-selected': selected,
      'bonus-disabled': disabled
    }"
    @click="handleClick"
  >
    <div class="bonus-checkbox" v-if="showCheckbox">
      <input 
        type="checkbox" 
        :checked="selected"
        :disabled="disabled"
        @click.stop
        @change="handleClick"
      />
    </div>
    <div class="bonus-radio" v-else-if="showRadio">
      <input 
        type="radio" 
        :checked="selected"
        :disabled="disabled"
        @click.stop
        @change="handleClick"
      />
    </div>
    <div class="bonus-content">
      <span class="bonus-name">{{ name }}</span>
      <span v-if="description" class="bonus-description">{{ description }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  name: string
  description?: string
  selected?: boolean
  disabled?: boolean
  showCheckbox?: boolean
  showRadio?: boolean
}>(), {
  selected: false,
  disabled: false,
  showCheckbox: false,
  showRadio: false
})

const emit = defineEmits<{
  (e: 'toggle'): void
}>()

function handleClick() {
  if (!props.disabled) {
    emit('toggle')
  }
}
</script>

<style scoped>
.bonus-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.bonus-item:hover:not(.bonus-disabled) {
  background: rgba(139, 69, 19, 0.5);
  transform: translateX(4px);
}

.bonus-selected {
  background: rgba(139, 69, 19, 0.6);
  border-color: hsl(52, 100%, 60%);
  box-shadow: 0 0 8px hsla(52, 100%, 50%, 0.3);
}

.bonus-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bonus-checkbox input,
.bonus-radio input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: hsl(52, 100%, 50%);
}

.bonus-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.bonus-name {
  color: hsl(52, 100%, 50%);
  font-size: 0.95rem;
}

.bonus-description {
  color: hsla(52, 100%, 50%, 0.7);
  font-size: 0.8rem;
}
</style>
