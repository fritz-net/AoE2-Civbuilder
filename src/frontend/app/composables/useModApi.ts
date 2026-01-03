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
 * @returns Promise that resolves with the actual filename (e.g., "2025-12-02T23-15-30Z_a3f2_v1.6.2.zip") when download starts
 */
export async function createMod(
  civs: CivConfig[],
  options: ModCreationOptions = {}
): Promise<string> {
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
    // The API router is mounted at both / and /{prefix} on the server
    // For the Vue UI (at /v2), we always use the root mount (/)
    // This avoids needing to detect the prefix from the URL
    const apiPath = ''
    
    // Create URL-encoded body (server expects this format, not FormData)
    const body = new URLSearchParams()
    body.append('seed', seed)
    body.append('presets', JSON.stringify(presets))
    body.append('modifiers', JSON.stringify(modifiers))
    
    // Make the request - apiPath is empty, so we use /create directly
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
    
    // Extract filename from Content-Disposition header
    // Server sends: attachment; filename="2025-12-02T23-15-30Z_a3f2_v1.6.2.zip"
    // Note: Express res.download() always quotes filenames
    const contentDisposition = response.headers.get('Content-Disposition')
    let filename = `${seed}.zip` // Fallback to old format
    
    if (contentDisposition) {
      // RFC 6266: Match both quoted and unquoted filenames for robustness
      const filenameMatch = contentDisposition.match(/filename=(?:"([^"]+)"|([^;,]+))/)
      if (filenameMatch) {
        filename = (filenameMatch[1] || filenameMatch[2] || '').trim()
        // If we couldn't extract a valid filename, keep the fallback
        if (!filename) {
          filename = `${seed}.zip`
        }
      }
    }
    
    // Get the blob from the response
    const blob = await response.blob()
    
    // Create a download link and trigger download
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    // Return the actual filename (not seed) for navigation purposes
    return filename
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
  ): Promise<string> {
    isCreating.value = true
    error.value = null
    
    try {
      const seed = await createMod(civs, options)
      return seed
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
