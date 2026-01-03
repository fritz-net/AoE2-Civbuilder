/**
 * Utility functions for normalizing and validating civilization data
 * TypeScript version for use in the Vue frontend
 */

import type { CivConfig } from '~/composables/useCivData'

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
 * data.json has a "techtrees" key containing multiple civilization objects
 * @param json - The parsed JSON object
 * @returns True if the JSON is a multi-civ data.json format
 */
export function isMultiCivDataJson(json: any): boolean {
  // Check if json has a "techtrees" property that is an object
  if (!json || typeof json !== 'object' || !json.techtrees || typeof json.techtrees !== 'object') {
    return false
  }
  
  // Check if techtrees contains at least one civilization object
  // Each civ in data.json has properties like "buildings", "techs", "units"
  const civKeys = Object.keys(json.techtrees)
  if (civKeys.length === 0) {
    return false
  }
  
  // Verify at least one entry looks like a civilization
  const firstCiv = json.techtrees[civKeys[0]]
  return firstCiv && typeof firstCiv === 'object' && 
         ('buildings' in firstCiv || 'techs' in firstCiv || 'units' in firstCiv)
}

/**
 * Convert a data.json civilization entry to CivConfig format
 * @param civName - The name of the civilization
 * @param civData - The civilization data from data.json
 * @returns A CivConfig object
 */
function convertDataJsonCivToConfig(civName: string, civData: any): CivConfig {
  // data.json format doesn't have the same structure as single civ JSON
  // We need to create a basic CivConfig with what's available
  return {
    alias: civName,
    description: `Civilization: ${civName}`,
    flag_palette: [-1, 0, 5, 6, 7, 3, 3, 3], // Default flag palette
    tree: [[], [], []], // Empty tech tree - data.json has different structure
    bonuses: [[], [], [], [], []], // Empty bonuses
    architecture: 1,
    language: 0,
    wonder: 0,
    castle: 0,
    customFlag: false,
    customFlagData: ''
  }
}

/**
 * Parse a JSON object and extract civilization configs
 * Handles both single civ JSON and multi-civ data.json formats
 * @param json - The parsed JSON object
 * @returns Array of CivConfig objects
 */
export function parseCivJson(json: any): CivConfig[] {
  // Check if it's a multi-civ data.json (with techtrees key)
  if (isMultiCivDataJson(json)) {
    const civs: CivConfig[] = []
    const civNames = Object.keys(json.techtrees)
    
    for (const civName of civNames) {
      const civData = json.techtrees[civName]
      const civConfig = convertDataJsonCivToConfig(civName, civData)
      civConfig.description = normalizeDescription(civConfig.description)
      civs.push(civConfig)
    }
    
    return civs
  }
  
  // Otherwise, treat as single civ JSON
  // Normalize the description field
  json.description = normalizeDescription(json.description)
  
  // Ensure all required fields exist with defaults
  const civConfig: CivConfig = {
    alias: json.alias || 'Unnamed Civ',
    description: json.description || '',
    flag_palette: json.flag_palette || [3, 4, 5, 6, 7, 3, 3, 3],
    tree: json.tree || [[], [], []],
    bonuses: json.bonuses || [[], [], [], [], []],
    architecture: json.architecture !== undefined ? json.architecture : 1,
    language: json.language !== undefined ? json.language : 0,
    wonder: json.wonder !== undefined ? json.wonder : 0,
    castle: json.castle !== undefined ? json.castle : 0,
    customFlag: json.customFlag || false,
    customFlagData: json.customFlagData || ''
  }
  
  return [civConfig]
}
