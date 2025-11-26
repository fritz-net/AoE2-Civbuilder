/**
 * Composable for interacting with mod creation API
 */

import type { CivConfig } from './useCivData'

export interface ModCreationOptions {
  seed?: string
  modifiers?: {
    randomCosts?: boolean
    hp?: number
    speed?: number
    blind?: boolean
    infinity?: boolean
    building?: number
  }
}

/**
 * Generate a random seed for mod creation
 */
function generateSeed(): string {
  let seed = ''
  for (let i = 0; i < 15; i++) {
    seed += Math.floor(Math.random() * 10)
  }
  return seed
}

/**
 * Create a mod from one or more civ configurations
 * @param civs Array of civ configurations to include in the mod
 * @param options Optional parameters for mod creation
 * @returns Promise that resolves when download starts
 */
export async function createMod(
  civs: CivConfig[],
  options: ModCreationOptions = {}
): Promise<void> {
  const seed = options.seed || generateSeed()
  
  // Format civs into the presets format expected by the server
  // The server expects { presets: [...civs] }
  const presets = {
    presets: civs.map(civ => ({
      alias: civ.alias,
      description: civ.description,
      flag_palette: civ.flag_palette,
      customFlag: civ.customFlag,
      customFlagData: civ.customFlagData,
      tree: civ.tree,
      bonuses: civ.bonuses,
      architecture: civ.architecture,
      language: civ.language,
      wonder: civ.wonder
    }))
  }
  
  // Add modifiers - server expects this even if empty
  const defaultModifiers = {
    randomCosts: false,
    hp: 1.0,
    speed: 1.0,
    blind: false,
    infinity: false,
    building: 1.0
  }
  const modifiers = options.modifiers || defaultModifiers
  
  try {
    // Get the base URL for the API
    // The API is served at the root path with a possible subdirectory prefix
    // For example, if the site is at http://localhost:4000/civbuilder, the API is at /civbuilder/create
    // But the Vue app is always at /v2, so we need to figure out the correct base path
    let baseUrl = ''
    
    if (typeof window !== 'undefined') {
      // In production/development, detect the correct base URL
      // If we're at /v2, the API is at the parent level
      const origin = window.location.origin
      const pathname = window.location.pathname
      
      // If pathname starts with /v2, we need to remove it to get the API base
      if (pathname.startsWith('/v2')) {
        // Check if there's a prefix before /v2 (e.g., /civbuilder/v2)
        const match = pathname.match(/^(.*?)\/v2/)
        baseUrl = origin + (match ? match[1] : '')
      } else {
        baseUrl = origin
      }
    }
    
    // Create URL-encoded body (server expects this format, not FormData)
    const body = new URLSearchParams()
    body.append('seed', seed)
    body.append('presets', JSON.stringify(presets))
    body.append('modifiers', JSON.stringify(modifiers))
    
    // Make the request
    const response = await fetch(`${baseUrl}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    })
    
    if (!response.ok) {
      throw new Error(`Mod creation failed: ${response.statusText}`)
    }
    
    // Get the blob from the response
    const blob = await response.blob()
    
    // Create a download link and trigger download
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${seed}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error creating mod:', error)
    throw error
  }
}

/**
 * Composable for mod creation with reactive state
 */
export function useModApi() {
  const isCreating = ref(false)
  const error = ref<string | null>(null)
  
  async function createModWithState(
    civs: CivConfig[],
    options: ModCreationOptions = {}
  ): Promise<void> {
    isCreating.value = true
    error.value = null
    
    try {
      await createMod(civs, options)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      throw err
    } finally {
      isCreating.value = false
    }
  }
  
  return {
    isCreating: readonly(isCreating),
    error: readonly(error),
    createMod: createModWithState
  }
}
