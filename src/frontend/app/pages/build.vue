<template>
  <div class="build-page">
    <CivBuilder
      ref="civBuilderRef"
      :initial-config="initialConfig"
      next-button-text="Create Civilization"
      @next="handleNext"
      @download="handleDownload"
      @reset="handleReset"
      @config-loaded="handleConfigLoaded"
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
  console.log('Civ config:', config)
  alert(`Civilization "${config.alias}" created successfully!\n\nFull mod creation will be available soon.`)
}

function handleDownload(config: CivConfig) {
  console.log('Downloaded config:', config)
}

function handleReset() {
  console.log('Config reset')
}

function handleConfigLoaded(config: CivConfig) {
  console.log('Config loaded:', config)
}
</script>

<style scoped>
.build-page {
  padding: 2rem;
  padding-bottom: 4rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
}

@media (max-width: 768px) {
  .build-page {
    padding: 1rem;
    padding-bottom: 3rem;
  }
}
</style>
