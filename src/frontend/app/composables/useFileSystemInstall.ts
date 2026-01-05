/**
 * Composable for auto-installing mods using File System Access API
 * Allows direct installation to Steam mods folder
 */

export interface SteamProfile {
  id: string
  path: string
  displayName: string
}

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

/**
 * Get the default Steam mods path suggestions based on OS
 */
export function getDefaultSteamPaths(): string[] {
  if (typeof window === 'undefined') return []
  
  const userAgent = navigator.userAgent.toLowerCase()
  const isWindows = userAgent.includes('win')
  const isMac = userAgent.includes('mac')
  
  if (isWindows) {
    return [
      'C:\\Users\\{username}\\Games\\Age of Empires 2 DE',
      'C:\\Program Files (x86)\\Steam\\userdata',
    ]
  } else if (isMac) {
    return [
      '~/Library/Application Support/Steam/userdata',
    ]
  }
  
  // Linux
  return [
    '~/.local/share/Steam/userdata',
  ]
}

/**
 * Extract mod files from a ZIP blob and install to directory
 * @param modBlob The ZIP file blob
 * @param targetDirHandle The target directory handle
 * @param modName The name of the mod (without extension)
 */
export async function installModToDirectory(
  modBlob: Blob,
  targetDirHandle: FileSystemDirectoryHandle,
  modName: string
): Promise<void> {
  // Import JSZip dynamically
  const JSZip = (await import('jszip')).default
  
  // Load the ZIP file
  const zip = await JSZip.loadAsync(modBlob)
  
  // Extract all files
  const promises: Promise<void>[] = []
  
  zip.forEach((relativePath, file) => {
    if (!file.dir) {
      promises.push(
        (async () => {
          const content = await file.async('uint8array')
          const pathParts = relativePath.split('/')
          
          // Create nested directories if needed
          let currentDir = targetDirHandle
          for (let i = 0; i < pathParts.length - 1; i++) {
            currentDir = await currentDir.getDirectoryHandle(pathParts[i], { create: true })
          }
          
          // Write the file
          const fileName = pathParts[pathParts.length - 1]
          const fileHandle = await currentDir.getFileHandle(fileName, { create: true })
          const writable = await fileHandle.createWritable()
          await writable.write(content)
          await writable.close()
        })()
      )
    }
  })
  
  await Promise.all(promises)
}

/**
 * Detect Steam profiles in a directory
 * Looks for numeric folder names which are Steam user IDs
 */
export async function detectSteamProfiles(
  dirHandle: FileSystemDirectoryHandle
): Promise<SteamProfile[]> {
  const profiles: SteamProfile[] = []
  
  try {
    // Look for numeric directories (Steam user IDs)
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'directory') {
        const name = entry.name
        // Check if it's a numeric directory (Steam user ID)
        if (/^\d+$/.test(name)) {
          profiles.push({
            id: name,
            path: name,
            displayName: `Steam Profile ${name}`,
          })
        }
      }
    }
  } catch (error) {
    console.error('Error detecting Steam profiles:', error)
  }
  
  return profiles
}

/**
 * Main function to auto-install a mod
 * Returns true if installation succeeded, false otherwise
 */
export async function autoInstallMod(
  modBlob: Blob,
  modName: string,
  onProfileSelect?: (profiles: SteamProfile[]) => Promise<SteamProfile>
): Promise<boolean> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser')
  }
  
  try {
    // Ask user to select their Age of Empires 2 DE directory
    const dirHandle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents',
    })
    
    // Check if this looks like the right directory structure
    // Should have numeric subdirectories (Steam profile IDs)
    const profiles = await detectSteamProfiles(dirHandle)
    
    let targetProfileDir: FileSystemDirectoryHandle
    
    if (profiles.length === 0) {
      // No profiles found, assume user selected a profile directory directly
      // or it's not the right directory, but let them proceed
      targetProfileDir = dirHandle
    } else if (profiles.length === 1) {
      // Only one profile, use it
      targetProfileDir = await dirHandle.getDirectoryHandle(profiles[0].id)
    } else {
      // Multiple profiles, ask user which one to use
      if (!onProfileSelect) {
        throw new Error('Multiple Steam profiles found but no selector provided')
      }
      const selectedProfile = await onProfileSelect(profiles)
      targetProfileDir = await dirHandle.getDirectoryHandle(selectedProfile.id)
    }
    
    // Navigate to mods/local directory (create if doesn't exist)
    const modsDir = await targetProfileDir.getDirectoryHandle('mods', { create: true })
    const localDir = await modsDir.getDirectoryHandle('local', { create: true })
    
    // Extract and install the mod
    await installModToDirectory(modBlob, localDir, modName)
    
    return true
  } catch (error) {
    console.error('Error auto-installing mod:', error)
    if (error instanceof Error && error.name === 'AbortError') {
      // User cancelled the dialog
      return false
    }
    throw error
  }
}

/**
 * Composable for auto-install functionality with reactive state
 */
export function useFileSystemInstall() {
  const isInstalling = ref(false)
  const error = ref<string | null>(null)
  const isSupported = ref(isFileSystemAccessSupported())
  
  async function install(
    modBlob: Blob,
    modName: string,
    onProfileSelect?: (profiles: SteamProfile[]) => Promise<SteamProfile>
  ): Promise<boolean> {
    isInstalling.value = true
    error.value = null
    
    try {
      const result = await autoInstallMod(modBlob, modName, onProfileSelect)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      return false
    } finally {
      isInstalling.value = false
    }
  }
  
  return {
    isInstalling: readonly(isInstalling),
    error: readonly(error),
    isSupported: readonly(isSupported),
    install,
    getDefaultPaths: getDefaultSteamPaths,
  }
}
