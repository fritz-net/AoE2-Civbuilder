<template>
  <div class="build-page">
    <CivBuilder
      ref="civBuilderRef"
      :initial-config="initialConfig"
      next-button-text="Continue to Bonuses"
      @next="handleNext"
      @download="handleDownload"
      @reset="handleReset"
    />
  </div>
</template>

<script setup lang="ts">
import type { CivConfig } from '~/composables/useCivData'

const router = useRouter()
const civBuilderRef = ref<{ civConfig: CivConfig } | null>(null)

const initialConfig = ref<Partial<CivConfig>>({})

// Track if user has made changes
const hasUnsavedChanges = computed(() => {
  if (!civBuilderRef.value) return false
  const config = civBuilderRef.value.civConfig
  return config?.alias !== '' || config?.description !== ''
})

// Prevent accidental navigation when user has unsaved changes
onBeforeRouteLeave((to, from, next) => {
  if (hasUnsavedChanges.value) {
    const answer = window.confirm('You have unsaved changes. Are you sure you want to leave?')
    if (!answer) {
      next(false)
      return
    }
  }
  next()
})

function handleNext(config: CivConfig) {
  // Store config and navigate to bonus selection (placeholder for future implementation)
  console.log('Civ config:', config)
  alert(`Civilization "${config.alias}" configured successfully!\n\nBonus selection coming soon.`)
}

function handleDownload(config: CivConfig) {
  console.log('Downloaded config:', config)
}

function handleReset() {
  console.log('Config reset')
}
</script>

<style scoped>
.build-page {
  padding: 6rem 2rem 2rem;
  padding-left: max(2rem, 14vw);
  padding-right: max(2rem, 10vw);
  max-width: 1600px;
  margin: 0 auto;
  min-height: 80vh;
}

@media (max-width: 768px) {
  .build-page {
    padding: 1rem;
    padding-top: 4rem;
  }
}
</style>
