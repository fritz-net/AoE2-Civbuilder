<template>
  <div class="build-page">
    <CivBuilder
      ref="civBuilderRef"
      :initial-config="initialConfig"
      :next-button-text="isCreating ? 'Creating Mod...' : 'Create Mod'"
      :is-loading="isCreating"
      :disable-civ-bonus-limit="true"
      @next="handleNext"
      @download="handleDownload"
      @reset="handleReset"
      @config-loaded="handleConfigLoaded"
    />
  </div>
</template>

<script setup lang="ts">
import type { CivConfig } from '~/composables/useCivData'
import { useModApi } from '~/composables/useModApi'

const router = useRouter()
const civBuilderRef = ref<{ civConfig: CivConfig } | null>(null)
const { isCreating, error, createMod } = useModApi()

const initialConfig = ref<Partial<CivConfig>>({})

// Track if user has made changes
const hasUnsavedChanges = computed(() => {
  if (!civBuilderRef.value) return false
  const config = civBuilderRef.value.civConfig
  return config?.alias !== '' || config?.description !== ''
})

// Flag to allow navigation after successful mod creation
const allowNavigation = ref(false)

// Prevent accidental navigation when user has unsaved changes
onBeforeRouteLeave((to, from, next) => {
  // Always allow navigation if flag is set (after mod creation)
  if (allowNavigation.value) {
    next()
    return
  }
  
  if (hasUnsavedChanges.value) {
    const answer = window.confirm('You have unsaved changes. Are you sure you want to leave?')
    if (!answer) {
      next(false)
      return
    }
  }
  next()
})

async function handleNext(config: CivConfig) {
  console.log('Creating mod for civ config:', config)
  
  try {
    const seed = await createMod([config])
    
    // Set flag to allow navigation without warning
    allowNavigation.value = true
    
    // Navigate to download success page
    await router.push({
      path: '/download-success',
      query: {
        civs: config.alias,
        filename: `${seed}.zip`
      }
    })
  } catch (err) {
    console.error('Error creating mod:', err)
    alert(`Failed to create mod: ${error.value || 'Unknown error'}`)
  }
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
