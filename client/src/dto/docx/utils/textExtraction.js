/**
 * Simple text extraction for lookahead (without full formatting)
 * Used for pattern detection that needs to peek ahead in the document
 * @param {Array} runs - Array of w:r elements
 * @returns {string} - Extracted plain text
 */
export const extractTextFromRuns = (runs) => {
  if (!runs || !Array.isArray(runs)) return '';
  
  return runs.map(run => {
    const t = run['w:t'];
    if (typeof t === 'string') return t;
    if (typeof t === 'object' && t?.['#text']) return t['#text'];
    return '';
  }).join('');
};

/**
 * Extract simple text content from a paragraph block
 * Used for quick content analysis without full formatting
 * @param {Object} block - Document block (paragraph or other)
 * @returns {string} - Extracted text content
 */
export const extractSimpleTextFromBlock = (block) => {
  if (!block) return '';
  
  // Handle paragraph blocks
  const para = block['w:p'] ?? block;
  const runs = Array.isArray(para['w:r']) ? para['w:r'] : (para['w:r'] ? [para['w:r']] : []);
  
  return extractTextFromRuns(runs);
}; 