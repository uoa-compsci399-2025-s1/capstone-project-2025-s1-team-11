// patterns/contentClassifier.js

import { isNewQuestion } from './questionDetectors.js';
import { detectCase13Pattern, detectCase14Pattern } from './edgeCaseDetectors.js';
import { isTableBlock } from './sectionDetectors.js';
import { detectMarksTag } from '../utils/marksExtraction.js';
import { detectBookmark } from './questionDetectors.js';
import { handleCase13, handleCase14 } from '../handlers/edgeCaseHandlers.js';

/**
 * Check if content is image-only (contains only image tags with no meaningful text)
 * @param {string} text - Text content to check
 * @returns {boolean} - True if content contains only images
 */
const isImageOnlyContent = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  // Remove all image tags and check if any meaningful content remains
  const textWithoutImages = text.replace(/<img[^>]*>/gi, '').trim();
  
  // If nothing meaningful remains after removing images, it's image-only content
  return textWithoutImages === '' || textWithoutImages.match(/^\s*$/);
};

/**
 * Classify content and determine how to handle it
 * This is the main orchestrator that coordinates all pattern detection
 * @param {string} text - Text content to classify
 * @param {number} emptyLineCounter - Number of preceding empty lines
 * @param {number} i - Current block index
 * @param {Array} blocks - All document blocks
 * @param {Object} currentQuestion - Current question being processed
 * @param {Array} currentAnswers - Current answers array
 * @param {boolean} questionJustFlushedByEmptyLine - Whether previous question ended with empty line
 * @param {Function} addWarning - Warning function (passed for handler creation)
 * @param {Object} state - Parser state for section handling
 * @returns {Object} - Classification result with type and optional handler
 */
export const classifyContent = (text, emptyLineCounter, i, blocks, currentQuestion, currentAnswers, questionJustFlushedByEmptyLine, addWarning, state) => {
  const currentBlock = blocks[i];
  
  // Check for table blocks first
  if (isTableBlock(currentBlock)) {
    return { type: 'table_block', block: currentBlock };
  }
  
  // Empty content
  if (text.trim() === '') {
    if (detectCase13Pattern(true, currentQuestion, currentAnswers)) {
      return { 
        type: 'case13', 
        handler: () => handleCase13(addWarning, currentQuestion) 
      };
    }
    return { type: 'empty_line' };
  }

  // Non-empty content

  // Special handling for image-only content in section bodies that might trigger 
  // false positive question detection. Only applies when we're actively collecting
  // section content and have no current question context.
  if (state && state.afterSectionBreak && state.sectionContentBlocks && 
      !currentQuestion && !currentAnswers?.length && 
      isImageOnlyContent(text)) {
    // Image-only content in section body should be treated as section content
    return { type: 'section_content', block: currentBlock, isImageOnly: true };
  }

  // Check if we're in a section body and this might end it
  if (state && (state.afterSectionBreak || state.inSection) && !currentQuestion) {
    // HIGH CONFIDENCE: Explicit question indicators (marks tag, bookmark) 
    // These should create NESTED questions, not end the section body
    const hasQuestionIndicators = detectMarksTag(text) || detectBookmark(text);
    if (hasQuestionIndicators) {
      return { 
        type: 'question', 
        method: 'question_indicators',
        confidence: 'high'
      };
    }
    
    // MEDIUM CONFIDENCE: Double break pattern with question-like content
    // Only treat as section body end if it looks like a question AND we have double hard returns
    if (emptyLineCounter >= 2 && text.trim() !== '') {
      // Check if this looks like a question (starts with question number, has marks, etc.)
      const questionDetection = isNewQuestion(text, emptyLineCounter, i === blocks.length - 1, questionJustFlushedByEmptyLine);
      if (questionDetection.detected && questionDetection.method !== 'double_break') {
        // This is a real question (detected by marks/bookmark), end section body
        return { 
          type: 'section_body_end', 
          method: 'question_detected',
          confidence: 'high'
        };
      } else if (questionDetection.detected && questionDetection.method === 'double_break') {
        // This might be a question based on double break, but could also be section content
        
        // Special case: Table-related explanatory text should be treated as section content
        const isTableExplanation = text.toLowerCase().includes('table') && 
                                  (text.toLowerCase().includes('above') || 
                                   text.toLowerCase().includes('below') || 
                                   text.toLowerCase().includes('inserted') ||
                                   text.toLowerCase().includes('dropped'));
        
        if (isTableExplanation) {
          return { type: 'section_content', block: currentBlock };
        }
        

        
        // Use fallback logic - if it's the first content after section break, it's probably section content
        if (state.sectionContentBlocks.length === 0) {
          // First content after section break - likely section content
          return { type: 'section_content', block: currentBlock };
        } else {
          // We already have section content, this could be a nested question
          return { 
            type: 'question', 
            method: 'double_break',
            confidence: 'medium'
          };
        }
      }
    }
    
    // Continue collecting section content
    return { type: 'section_content', block: currentBlock };
  }

  // Case 14: Standalone paragraph
  if (detectCase14Pattern(text, emptyLineCounter, [], i, blocks)) {
    return { 
      type: 'case14', 
      handler: () => handleCase14(text, addWarning) 
    };
  }

  // Normal question detection
  const questionDetection = isNewQuestion(text, emptyLineCounter, i === blocks.length - 1, questionJustFlushedByEmptyLine);
  if (questionDetection.detected) {
    return { type: 'question', method: questionDetection.method };
  }

  // Default content classification
  return { type: 'content' };
};

// Handlers are now imported from dedicated handlers module 