import { detectMarksTag } from '../utils/marksExtraction.js';

/**
 * Bookmark detection placeholder
 * TODO: Implement bookmark detection when needed
 * @param {string} text - Text to check for bookmarks
 * @returns {boolean} - True if bookmark detected
 */
export const detectBookmark = (text) => {
  // For now, return false to maintain current behavior
  return false;
};

/**
 * Enhanced question detection with hierarchical confidence levels
 * @param {string} text - Text content to analyze
 * @param {number} emptyLineCounter - Number of preceding empty lines
 * @param {boolean} isAtDocumentEnd - Whether this is the last block
 * @param {boolean} questionJustFlushedByEmptyLine - Whether previous question ended with empty line
 * @returns {Object} - {detected: boolean, method: string}
 */
export const isNewQuestion = (text, emptyLineCounter = 0, isAtDocumentEnd = false, questionJustFlushedByEmptyLine = false) => {
  if (!text) return { detected: false, method: 'none' };
  
  // High Confidence Detection (Definitive)
  const hasMarksTag = detectMarksTag(text);
  const hasBookmark = detectBookmark(text);
  
  // Low Confidence Detection (Fallback)
  const hasDoubleBreak = (emptyLineCounter >= 1 && !isAtDocumentEnd) || questionJustFlushedByEmptyLine;
  
  // Debug logging
  console.log(`🔍 DEBUG: Question detection for: "${text.substring(0, 40)}..."`);
  console.log(`🔍 DEBUG:   - emptyLineCounter: ${emptyLineCounter}`);
  console.log(`🔍 DEBUG:   - isAtDocumentEnd: ${isAtDocumentEnd}`);
  console.log(`🔍 DEBUG:   - questionJustFlushedByEmptyLine: ${questionJustFlushedByEmptyLine}`);
  console.log(`🔍 DEBUG:   - hasMarksTag: ${hasMarksTag} (HIGH CONFIDENCE)`);
  console.log(`🔍 DEBUG:   - hasBookmark: ${hasBookmark} (HIGH CONFIDENCE)`);
  console.log(`🔍 DEBUG:   - hasDoubleBreak: ${hasDoubleBreak} (LOW CONFIDENCE - FALLBACK)`);
  
  // Hierarchical detection: High confidence methods take precedence
  const result = hasMarksTag || hasBookmark || hasDoubleBreak;
  
  // Determine detection method used
  let detectionMethod = 'none';
  if (hasMarksTag) detectionMethod = 'marks_tag';
  else if (hasBookmark) detectionMethod = 'bookmark';
  else if (hasDoubleBreak) detectionMethod = 'double_break';
  
  console.log(`🔍 DEBUG:   - RESULT: ${result} (via ${detectionMethod})`);
  
  return { detected: result, method: detectionMethod };
}; 