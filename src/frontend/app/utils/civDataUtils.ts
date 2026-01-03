/**
 * Utility functions for normalizing and validating civilization data
 * TypeScript version for use in the Vue frontend
 */

import type { CivConfig } from '~/composables/useCivData'
import { createDefaultCiv } from '~/composables/useCivData'

/**
 * Normalize description field to ensure it's always a string
 * Handles cases where description might be an array, null, undefined, or other types
 * @param description - The description value to normalize
 * @returns A normalized string description
 */
export function normalizeDescription(description: any): string {
  // If description is an array, join its elements with ", "
  if (Array.isArray(description)) {
    // If array has elements, join them
    if (description.length > 0) {
      // Join all elements with comma-space separator
      return description.join(', ')
    }
    // Empty array becomes empty string
    return ''
  }
  
  // If description is null or undefined, return empty string
  if (description === null || description === undefined) {
    return ''
  }
  
  // If description is already a string, return it
  if (typeof description === 'string') {
    return description
  }
  
  // For any other type (number, object, etc.), convert to string
  // This handles edge cases gracefully
  return String(description)
}

/**
 * Check if a JSON object is a multi-civ data.json file
 * data.json can have different formats:
 * 1. techtrees object: { techtrees: { "Britons": {...}, "Franks": {...} } }
 * 2. techtrees array: { techtrees: [{...}, {...}] }
 * 3. Parallel arrays: { name: [...], description: [...], techtree: [[...], [...]] }
 * @param json - The parsed JSON object
 * @returns True if the JSON is a multi-civ data.json format
 */
export function isMultiCivDataJson(json: any): boolean {
  if (!json || typeof json !== 'object') {
    return false
  }
  
  // Format 3: Check for parallel arrays format (name, description, techtree)
  if (Array.isArray(json.name) && Array.isArray(json.techtree)) {
    return json.name.length > 0 && json.techtree.length > 0
  }
  
  // Format 1 & 2: Check if json has a "techtrees" property
  if (!json.techtrees) {
    return false
  }
  
  // Handle techtrees as an array
  if (Array.isArray(json.techtrees)) {
    if (json.techtrees.length === 0) {
      return false
    }
    // Check if first element looks like a civ
    const firstCiv = json.techtrees[0]
    return firstCiv && typeof firstCiv === 'object' && 
           ('buildings' in firstCiv || 'techs' in firstCiv || 'units' in firstCiv)
  }
  
  // Handle techtrees as an object with named keys
  if (typeof json.techtrees === 'object') {
    const civKeys = Object.keys(json.techtrees)
    if (civKeys.length === 0) {
      return false
    }
    // Verify at least one entry looks like a civilization
    const firstCiv = json.techtrees[civKeys[0]]
    return firstCiv && typeof firstCiv === 'object' && 
           ('buildings' in firstCiv || 'techs' in firstCiv || 'units' in firstCiv)
  }
  
  return false
}

/**
 * Convert a data.json civilization entry to CivConfig format
 * @param civName - The name of the civilization
 * @returns A CivConfig object
 * @note The civData parameter from data.json is not used because data.json has a different
 *       structure (buildings/techs/units arrays) that is incompatible with CivConfig format.
 *       We create a placeholder config that can be used for display in the combine view.
 */
function convertDataJsonCivToConfig(civName: string): CivConfig {
  // Start with default civ config for consistency
  const config = createDefaultCiv()
  
  // Override with data.json specific values
  // data.json format doesn't have compatible tree/bonus structure, so we leave those empty
  config.alias = civName
  config.description = `Civilization: ${civName}`
  config.tree = [[], [], []] // Empty tech tree - data.json has different structure
  
  return config
}

/**
 * Parse a JSON object and extract civilization configs
 * Handles both single civ JSON and multi-civ data.json formats
 * @param json - The parsed JSON object
 * @returns Array of CivConfig objects
 */
export function parseCivJson(json: any): CivConfig[] {
  // Check if it's a multi-civ data.json
  if (isMultiCivDataJson(json)) {
    const civs: CivConfig[] = []
    
    // Format 3: Handle parallel arrays format (name, description, techtree)
    if (Array.isArray(json.name) && Array.isArray(json.techtree)) {
      const count = Math.max(json.name.length, json.techtree.length)
      const descriptions = Array.isArray(json.description) ? json.description : []
      
      for (let i = 0; i < count; i++) {
        const civName = json.name[i] || `Civilization ${i + 1}`
        const civConfig = convertDataJsonCivToConfig(civName)
        
        // Use description from description array if available
        if (i < descriptions.length && descriptions[i]) {
          civConfig.description = normalizeDescription(descriptions[i])
        } else {
          civConfig.description = normalizeDescription(civConfig.description)
        }
        
        // Store the techtree data if available (note: techtree is singular in this format)
        if (i < json.techtree.length && json.techtree[i]) {
          // techtree is stored as a flat array in this format
          // We need to convert it to the expected [units, buildings, techs] format
          if (Array.isArray(json.techtree[i])) {
            civConfig.tree = [json.techtree[i], [], []]
          }
        }
        
        civs.push(civConfig)
      }
      return civs
    }
    
    // Format 2: Handle techtrees as an array
    if (Array.isArray(json.techtrees)) {
      for (let i = 0; i < json.techtrees.length; i++) {
        const civData = json.techtrees[i]
        // Try to get civ name from various possible properties
        const civName = civData.name || civData.civ || civData.alias || 
                       json.civ_names?.[i] || `Civilization ${i + 1}`
        const civConfig = convertDataJsonCivToConfig(civName)
        civConfig.description = normalizeDescription(civConfig.description)
        civs.push(civConfig)
      }
      return civs
    }
    
    // Format 1: Handle techtrees as an object with named keys
    const civNames = Object.keys(json.techtrees)
    for (const civName of civNames) {
      const civConfig = convertDataJsonCivToConfig(civName)
      civConfig.description = normalizeDescription(civConfig.description)
      civs.push(civConfig)
    }
    
    return civs
  }
  
  // Otherwise, treat as single civ JSON
  // Start with defaults for consistency
  const defaults = createDefaultCiv()
  
  // Normalize the description field
  json.description = normalizeDescription(json.description)
  
  // Merge with defaults, allowing json to override
  const civConfig: CivConfig = {
    ...defaults,
    ...json,
    // Ensure these fields exist even if not in json
    alias: json.alias || defaults.alias,
    flag_palette: json.flag_palette || defaults.flag_palette,
    tree: json.tree || defaults.tree,
    bonuses: json.bonuses || defaults.bonuses,
    architecture: json.architecture !== undefined ? json.architecture : defaults.architecture,
    language: json.language !== undefined ? json.language : defaults.language,
    wonder: json.wonder !== undefined ? json.wonder : defaults.wonder,
    castle: json.castle !== undefined ? json.castle : defaults.castle,
    customFlag: json.customFlag || defaults.customFlag,
    customFlagData: json.customFlagData || defaults.customFlagData,
    description: json.description || defaults.description,
  }
  
  return [civConfig]
}
