import { detectMarksTag } from '../utils/marksExtraction.js';
import { detectBookmark } from './questionDetectors.js';
import { extractTextFromRuns } from '../utils/textExtraction.js';

/**
 * Check if a block represents a section break
 * @param {Object} block - Document block to check
 * @returns {boolean} - True if section break
 */
const isSectionBreak = (block) => {
  return (
    block['w:pPr']?.['w:sectPr'] !== undefined ||
    block['w:sectPr'] !== undefined
  );
};

/**
 * Detect if content represents Case 13: Unexpected empty line within question
 * @param {boolean} isEmpty - Whether current content is empty
 * @param {Object} currentQuestion - Current question being processed
 * @param {Array} currentAnswers - Current answers array
 * @returns {boolean} - True if Case 13 pattern detected
 */
export const detectCase13Pattern = (isEmpty, currentQuestion, currentAnswers) => {
  return isEmpty && currentQuestion && currentAnswers.length === 0;
};

/**
 * Detect if content represents Case 14: Standalone paragraph between double breaks
 * @param {string} text - Text content to analyze
 * @param {number} emptyLineCounter - Number of preceding empty lines
 * @param {Array} nextBlocks - Unused parameter (kept for compatibility)
 * @param {number} i - Current block index
 * @param {Array} blocks - All document blocks
 * @returns {boolean} - True if Case 14 pattern detected
 */
export const detectCase14Pattern = (text, emptyLineCounter, nextBlocks, i, blocks) => {
  // Must have content (not empty)
  if (!text || text.trim() === '') return false;
  
  // Must be preceded by double break (or be at start with empty lines)
  const precededByDoubleBreak = emptyLineCounter >= 1;
  if (!precededByDoubleBreak) return false;
  
  // Must have no question indicators (marks, bookmarks)
  const hasQuestionIndicators = detectMarksTag(text) || detectBookmark(text);
  if (hasQuestionIndicators) return false;
  
  // Check if followed by double break by looking ahead
  const isFollowedByDoubleBreak = checkIfFollowedByDoubleBreak(i, blocks);
  
  return isFollowedByDoubleBreak;
};

/**
 * Look ahead to see if current content is followed by double break pattern
 * @param {number} currentIndex - Current block index
 * @param {Array} blocks - All document blocks
 * @returns {boolean} - True if followed by double break
 */
export const checkIfFollowedByDoubleBreak = (currentIndex, blocks) => {
  let emptyCount = 0;
  let foundNonEmpty = false;
  
  // Look at next few blocks
  for (let j = currentIndex + 1; j < Math.min(currentIndex + 5, blocks.length); j++) {
    const block = blocks[j];
    if (!block) continue;
    
    // Check if it's a section break
    if (isSectionBreak(block)) {
      return emptyCount >= 1; // Section break after empty line(s) counts as double break
    }
    
    // Extract text content
    const para = block['w:p'] ?? block;
    const runs = Array.isArray(para['w:r']) ? para['w:r'] : (para['w:r'] ? [para['w:r']] : []);
    const text = extractTextFromRuns(runs);
    
    if (text.trim() === '') {
      emptyCount++;
    } else {
      foundNonEmpty = true;
      break;
    }
  }
  
  // If we found empty line(s) followed by content, that's a double break pattern
  return emptyCount >= 1 && foundNonEmpty;
}; 