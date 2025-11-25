<template>
  <div class="bonus-selector">
    <h2 class="section-title">{{ title }}</h2>
    <p v-if="subtitle" class="section-subtitle">{{ subtitle }}</p>
    
    <div class="bonus-list">
      <BonusItem
        v-for="(bonus, index) in bonuses"
        :key="index"
        :name="bonus.name"
        :description="bonus.description"
        :selected="isSelected(bonus.id)"
        :disabled="isDisabled(bonus.id)"
        :show-checkbox="mode === 'multi'"
        :show-radio="mode === 'single'"
        @toggle="toggleBonus(bonus.id)"
      />
    </div>
    
    <div v-if="mode === 'multi' && maxSelections" class="selection-counter">
      {{ selectedCount }}/{{ maxSelections }} selected
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface Bonus {
  id: number | string
  name: string
  description?: string
}

const props = withDefaults(defineProps<{
  title: string
  subtitle?: string
  bonuses: Bonus[]
  modelValue: (number | string)[]
  mode?: 'single' | 'multi'
  maxSelections?: number
  disabled?: boolean
}>(), {
  mode: 'multi',
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: (number | string)[]): void
}>()

const selectedCount = computed(() => props.modelValue.length)

function isSelected(id: number | string): boolean {
  return props.modelValue.includes(id)
}

function isDisabled(id: number | string): boolean {
  if (props.disabled) return true
  if (props.mode === 'multi' && props.maxSelections) {
    return selectedCount.value >= props.maxSelections && !isSelected(id)
  }
  return false
}

function toggleBonus(id: number | string) {
  if (props.disabled) return
  
  if (props.mode === 'single') {
    emit('update:modelValue', [id])
  } else {
    const currentSelection = [...props.modelValue]
    const index = currentSelection.indexOf(id)
    
    if (index === -1) {
      if (props.maxSelections && currentSelection.length >= props.maxSelections) {
        return
      }
      currentSelection.push(id)
    } else {
      currentSelection.splice(index, 1)
    }
    
    emit('update:modelValue', currentSelection)
  }
}
</script>

<style scoped>
.bonus-selector {
  background: rgba(139, 69, 19, 0.75);
  border: 2px solid hsl(52, 100%, 50%);
  padding: 1.5rem;
  border-radius: 8px;
}

.section-title {
  color: hsl(52, 100%, 50%);
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  text-align: center;
}

.section-subtitle {
  color: hsla(52, 100%, 50%, 0.8);
  font-size: 0.9rem;
  text-align: center;
  margin-bottom: 1rem;
}

.bonus-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.bonus-list::-webkit-scrollbar {
  width: 8px;
}

.bonus-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.bonus-list::-webkit-scrollbar-thumb {
  background: hsl(52, 100%, 50%);
  border-radius: 4px;
}

.selection-counter {
  margin-top: 1rem;
  text-align: center;
  color: hsl(52, 100%, 50%);
  font-size: 0.9rem;
}
</style>
