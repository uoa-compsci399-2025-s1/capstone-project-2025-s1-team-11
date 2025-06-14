import { detectMarksTag } from '../utils/marksExtraction.js';

/**
 * Detect if text content indicates a bookmark-based question
 * This checks for content that would typically follow a bookmark in the source XML
 * @param {string} text - Text to check for bookmark patterns
 * @returns {boolean} - True if bookmark-based question detected
 */
export const detectBookmark = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  // Look for patterns that typically follow Word bookmarks for questions
  // Common patterns: Question numbers, marks tags at start
  const bookmarkPatterns = [
    /^\s*Question\s+\d+/i,           // "Question 17", "Question 1", etc.
    /^\s*Q\d+/i,                     // "Q17", "Q1", etc.
    /^\s*\[\s*\d+.*?marks?\s*\]/i,   // "[1 mark]", "[2 marks]", etc. at start
    /^\s*\d+\.\s+/,                  // "1. ", "17. ", etc. (numbered questions)
  ];
  
  return bookmarkPatterns.some(pattern => pattern.test(text.trim()));
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
  
  // Hierarchical detection: High confidence methods take precedence
  const result = hasMarksTag || hasBookmark || hasDoubleBreak;
  
  // Determine detection method used
  let detectionMethod = 'none';
  if (hasMarksTag) detectionMethod = 'marks_tag';
  else if (hasBookmark) detectionMethod = 'bookmark';
  else if (hasDoubleBreak) detectionMethod = 'double_break';
  
  return { detected: result, method: detectionMethod };
}; 