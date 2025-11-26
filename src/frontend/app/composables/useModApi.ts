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
    // The Vue app is at /v2 or /{prefix}/v2, but the API is at / or /{prefix}
    // We need to remove the /v2 suffix from the current path to get the API base
    let apiPath = ''
    
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname
      
      // Extract the base path by removing /v2 and anything after it
      // Examples:
      //   /v2/build -> '' (root API)
      //   /civbuilder/v2/build -> /civbuilder (API at /civbuilder)
      const v2Index = pathname.indexOf('/v2')
      if (v2Index >= 0) {
        apiPath = pathname.substring(0, v2Index)
      }
    }
    
    // Create URL-encoded body (server expects this format, not FormData)
    const body = new URLSearchParams()
    body.append('seed', seed)
    body.append('presets', JSON.stringify(presets))
    body.append('modifiers', JSON.stringify(modifiers))
    
    // Make the request - apiPath already has leading slash or is empty
    const response = await fetch(`${apiPath}/create`, {
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
