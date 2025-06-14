// patterns/contentClassifier.js

import { isNewQuestion } from './questionDetectors.js';
import { detectCase13Pattern, detectCase14Pattern } from './edgeCaseDetectors.js';
import { handleCase13, handleCase14 } from '../handlers/edgeCaseHandlers.js';

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
 * @returns {Object} - Classification result with type and optional handler
 */
export const classifyContent = (text, emptyLineCounter, i, blocks, currentQuestion, currentAnswers, questionJustFlushedByEmptyLine, addWarning) => {
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
  console.log(`🔍 DEBUG: Processing non-empty text (block ${i}): "${text.substring(0, 50)}..." (emptyLineCounter: ${emptyLineCounter})`);

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