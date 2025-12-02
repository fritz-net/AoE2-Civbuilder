/**
 * Module for generating mod filenames with version, datetime, and random hex
 * Format: {iso_datetime}_{hex*4}_v{version}.zip
 * Example: 2025-12-02T23-15-30Z_a3f2_v1.6.2.zip
 */

const fs = require('fs');
const path = require('path');

/**
 * Reads the version from .release-please-manifest.json
 * @param {string} projectRoot - Path to project root directory
 * @returns {string} - Version string (e.g., "1.6.2")
 * 
 * Note: This function reads from the "." key in the manifest file. In release-please's
 * monorepo configuration, the "." key represents the root package at the repository root.
 * For non-monorepo projects or different configurations, you may need to adjust the key
 * used to retrieve the version. See: https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md
 */
function getVersion(projectRoot) {
  try {
    const manifestPath = path.join(projectRoot, '.release-please-manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    // The "." key represents the root package in release-please manifests
    return manifest['.'] || '0.0.0';
  } catch (error) {
    console.error('Error reading version from .release-please-manifest.json:', error);
    return '0.0.0';
  }
}

/**
 * Generates an ISO datetime string suitable for filenames
 * Replaces colons with hyphens for filesystem compatibility
 * @returns {string} - ISO datetime (e.g., "2025-12-02T23-15-30Z")
 */
function getIsoDatetime() {
  const now = new Date();
  // Get ISO string and replace colons with hyphens for filesystem compatibility
  // Also remove milliseconds for cleaner filename
  return now.toISOString()
    .split('.')[0] // Remove milliseconds
    .replace(/:/g, '-') + 'Z';
}

/**
 * Generates a 4-digit hexadecimal string
 * @returns {string} - 4-digit hex (e.g., "a3f2")
 */
function getHex4() {
  // Generate a random 16-bit number (0 to 65535) and convert to hex
  const randomNum = Math.floor(Math.random() * 0x10000);
  return randomNum.toString(16).padStart(4, '0');
}

/**
 * Generates a complete mod filename with version, datetime, and hex
 * Format: {iso_datetime}_{hex*4}_v{version}.zip
 * @param {string} projectRoot - Path to project root directory
 * @returns {string} - Filename (e.g., "2025-12-02T23-15-30Z_a3f2_v1.6.2.zip")
 */
function generateModFilename(projectRoot) {
  const isoDatetime = getIsoDatetime();
  const hex = getHex4();
  const version = getVersion(projectRoot);
  return `${isoDatetime}_${hex}_v${version}.zip`;
}

/**
 * Generates filename without .zip extension (for directory names)
 * @param {string} projectRoot - Path to project root directory
 * @returns {string} - Filename without extension
 */
function generateModFilenameNoExt(projectRoot) {
  const filename = generateModFilename(projectRoot);
  return filename.replace(/\.zip$/, '');
}

module.exports = {
  getVersion,
  getIsoDatetime,
  getHex4,
  generateModFilename,
  generateModFilenameNoExt
};
