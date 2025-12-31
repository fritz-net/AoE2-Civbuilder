/**
 * Utility functions for normalizing and validating civilization data
 */

/**
 * Normalize description field to ensure it's always a string
 * Handles cases where description might be an array, null, undefined, or other types
 * @param {*} description - The description value to normalize
 * @returns {string} - A normalized string description
 */
function normalizeDescription(description) {
	// If description is an array, join its elements with ", "
	if (Array.isArray(description)) {
		// If array has elements, join them
		if (description.length > 0) {
			// Join all elements with comma-space separator
			return description.join(', ');
		}
		// Empty array becomes empty string
		return '';
	}
	
	// If description is null or undefined, return empty string
	if (description === null || description === undefined) {
		return '';
	}
	
	// If description is already a string, return it
	if (typeof description === 'string') {
		return description;
	}
	
	// For any other type (number, object, etc.), convert to string
	// This handles edge cases gracefully
	return String(description);
}

module.exports = {
	normalizeDescription
};
