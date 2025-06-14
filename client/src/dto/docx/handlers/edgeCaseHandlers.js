// handlers/edgeCaseHandlers.js

/**
 * Handle Case 13: Unexpected empty line within question
 * @param {Function} addWarning - Function to add warnings
 * @param {Object} currentQuestion - Current question being processed
 * @returns {Object} - Action result
 */
export const handleCase13 = (addWarning, currentQuestion) => {
  addWarning(
    'Unexpected paragraph break after question', 
    `Question: "${currentQuestion.contentFormatted.substring(0, 50)}..."`
  );
  console.log(`🔍 DEBUG: Case 13 detected - handling unexpected empty line gracefully`);
  return { action: 'continue' }; // Skip this empty line
};

/**
 * Handle Case 14: Standalone paragraph between double breaks
 * @param {string} text - Text content of the standalone paragraph
 * @param {Function} addWarning - Function to add warnings
 * @returns {Object} - Action result with section data
 */
export const handleCase14 = (text, addWarning) => {
  addWarning(
    'Ambiguous standalone paragraph detected', 
    `Content: "${text.substring(0, 50)}..." - Interpreted as section content`
  );
  
  console.log(`🔍 DEBUG: Case 14 detected - creating section for standalone paragraph`);
  
  return {
    action: 'create_section',
    sectionData: {
      type: 'section',
      contentFormatted: text,
      questions: []
    }
  };
}; 