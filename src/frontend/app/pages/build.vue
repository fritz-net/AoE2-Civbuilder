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
    
    <!-- Install Method Dialog -->
    <InstallMethodDialog
      :show="showInstallDialog"
      @auto-install="handleAutoInstall"
      @download="handleDownloadOption"
      @cancel="handleDialogCancel"
      ref="installDialogRef"
    />
    
    <!-- Profile Selector Dialog -->
    <ProfileSelector
      :show="showProfileSelector"
      :profiles="steamProfiles"
      @select="handleProfileSelect"
      @cancel="handleProfileCancel"
    />
  </div>
</template>

<script setup lang="ts">
import type { CivConfig } from '~/composables/useCivData'
import { useModApi, type ModCreationResult } from '~/composables/useModApi'
import { useFileSystemInstall, type SteamProfile } from '~/composables/useFileSystemInstall'
import InstallMethodDialog from '~/components/InstallMethodDialog.vue'
import ProfileSelector from '~/components/ProfileSelector.vue'

const router = useRouter()
const civBuilderRef = ref<{ civConfig: CivConfig } | null>(null)
const { isCreating, error, createMod } = useModApi()
const { install: installToFileSystem } = useFileSystemInstall()

const initialConfig = ref<Partial<CivConfig>>({})

// Dialog state
const showInstallDialog = ref(false)
const showProfileSelector = ref(false)
const steamProfiles = ref<SteamProfile[]>([])
const installDialogRef = ref<any>(null)

// Store handlers for profile selection to avoid window object pollution
interface ProfileHandlers {
  selectHandler: (profile: SteamProfile) => void
  cancelHandler: () => void
}
const profileSelectHandlers = ref<ProfileHandlers | null>(null)

// Store the mod result for installation
const currentModResult = ref<ModCreationResult | null>(null)
const currentCivName = ref('')

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
    // Create mod without downloading
    const result = await createMod([config], {}, false)
    
    // Store for later use
    currentModResult.value = result
    currentCivName.value = config.alias
    
    // Show install method dialog
    showInstallDialog.value = true
  } catch (err) {
    console.error('Error creating mod:', err)
    alert(`Failed to create mod: ${error.value || 'Unknown error'}`)
  }
}

async function handleAutoInstall() {
  if (!currentModResult.value) return
  
  try {
    // Profile selector callback using a cleaner promise approach
    const onProfileSelect = (profiles: SteamProfile[]): Promise<SteamProfile> => {
      return new Promise((resolve, reject) => {
        steamProfiles.value = profiles
        showProfileSelector.value = true
        
        // Store handlers in component state instead of window
        profileSelectHandlers.value = {
          selectHandler: resolve,
          cancelHandler: () => reject(new Error('User cancelled profile selection'))
        }
      })
    }
    
    // Attempt auto-install
    const success = await installToFileSystem(
      currentModResult.value.blob,
      currentModResult.value.filename.replace('.zip', ''),
      onProfileSelect
    )
    
    if (success) {
      // Close dialogs
      showInstallDialog.value = false
      showProfileSelector.value = false
      
      // Set flag to allow navigation
      allowNavigation.value = true
      
      // Navigate to success page
      await router.push({
        path: '/download-success',
        query: {
          civs: currentCivName.value,
          filename: currentModResult.value.filename,
          autoInstalled: 'true'
        }
      })
    } else {
      // User cancelled or installation failed
      installDialogRef.value?.resetProcessing()
    }
  } catch (err) {
    console.error('Error auto-installing mod:', err)
    const message = err instanceof Error ? err.message : 'Failed to install mod'
    installDialogRef.value?.setError(message)
  }
}

function handleDownloadOption() {
  if (!currentModResult.value) return
  
  // Trigger download
  const url = window.URL.createObjectURL(currentModResult.value.blob)
  const a = document.createElement('a')
  a.href = url
  a.download = currentModResult.value.filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
  
  // Close dialog
  showInstallDialog.value = false
  
  // Set flag to allow navigation
  allowNavigation.value = true
  
  // Navigate to success page
  router.push({
    path: '/download-success',
    query: {
      civs: currentCivName.value,
      filename: currentModResult.value.filename
    }
  })
}

function handleDialogCancel() {
  showInstallDialog.value = false
  currentModResult.value = null
  currentCivName.value = ''
}

function handleProfileSelect(profile: SteamProfile) {
  showProfileSelector.value = false
  
  // Resolve the promise using stored handler
  if (profileSelectHandlers.value?.selectHandler) {
    profileSelectHandlers.value.selectHandler(profile)
    profileSelectHandlers.value = null
  }
}

function handleProfileCancel() {
  showProfileSelector.value = false
  
  // Reject the promise using stored handler
  if (profileSelectHandlers.value?.cancelHandler) {
    profileSelectHandlers.value.cancelHandler()
    profileSelectHandlers.value = null
  }
  
  // Reset install dialog
  installDialogRef.value?.resetProcessing()
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
