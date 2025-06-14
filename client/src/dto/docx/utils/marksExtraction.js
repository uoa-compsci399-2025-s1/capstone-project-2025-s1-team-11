/**
 * Shared marks pattern for consistent detection and removal across the parser
 * Enhanced regex to handle edge cases:
 * - Empty brackets []
 * - Missing numbers [ marks]
 * - Malformed spacing [ 1 m ark ]
 * - Missing 's' [1 mark] vs [1 marks]
 */
export const getMarksRegexPattern = () => {
  return /^\[\s*(\d*(?:\.\d+)?)\s*m?\s*a?\s*r?\s*k?\s*s?\s*\]/i;
};

/**
 * Enhanced marks tag detection using shared pattern
 * @param {string} text - Text to check for marks tag
 * @returns {boolean} - True if marks tag detected
 */
export const detectMarksTag = (text) => {
  if (!text) return false;
  
  const normalizedText = text.trim().toLowerCase();
  return getMarksRegexPattern().test(normalizedText);
};

/**
 * Enhanced marks extraction to handle edge cases
 * @param {string} text - Text containing marks tag
 * @returns {number} - Extracted marks value, defaults to 1
 */
export const extractMarks = (text) => {
  if (!text) return 1;
  
  const normalizedText = text.trim().toLowerCase();
  
  // Use the same enhanced regex pattern for consistency
  const match = normalizedText.match(getMarksRegexPattern());
  
  if (match) {
    const marksValue = match[1];
    
    // Handle empty brackets [] or missing numbers
    if (!marksValue || marksValue === '') {
      return 1; // Default to 1 mark
    }
    
    const parsedMarks = parseFloat(marksValue);
    return isNaN(parsedMarks) ? 1 : parsedMarks;
  }
  
  // If no marks tag detected, default to 1
  return 1;
}; 