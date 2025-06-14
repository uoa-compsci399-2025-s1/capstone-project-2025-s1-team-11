import { buildContentFormatted } from '../utils/buildContentFormatted.js';
import { sanitizeContentFormatted } from '../utils/sanitizeContentFormatted.js';
import { extractMarks } from '../utils/marksExtraction.js';

/**
 * Create a new question from the given content
 * @param {string} text - Question text content
 * @param {Array} runs - Document runs for formatting
 * @param {Object} formatOptions - Formatting options
 * @param {Object} para - Paragraph object
 * @param {string} documentXml - Document XML
 * @param {Object} globalCounters - Global counters
 * @returns {Object} - New question object
 */
export const createQuestion = (text, runs, formatOptions, para, documentXml, globalCounters) => {
  const marks = extractMarks(text);
  const contentText = buildContentFormatted(runs, {
    ...formatOptions,
    removeMarks: true
  }, para, documentXml, globalCounters);
  
  return {
    type: 'question',
    contentFormatted: sanitizeContentFormatted(contentText),
    marks: marks,
    answers: []
  };
};

/**
 * Create a new answer from the given content
 * @param {Array} runs - Document runs for formatting
 * @param {Object} formatOptions - Formatting options
 * @param {Object} para - Paragraph object
 * @param {string} documentXml - Document XML
 * @param {Object} globalCounters - Global counters
 * @returns {Object} - New answer object
 */
export const createAnswer = (runs, formatOptions, para, documentXml, globalCounters) => {
  const answerText = buildContentFormatted(runs, formatOptions, para, documentXml, globalCounters);
  
  return {
    type: 'answer',
    contentFormatted: sanitizeContentFormatted(answerText)
  };
};

/**
 * Handle section content creation when needed
 * @param {Object} state - Parser state
 * @returns {Object} - Section object or null
 */
export const handleSectionContentCreation = (state) => {
  if (state.afterSectionBreak) {
    const section = {
      type: 'section',
      contentFormatted: state.sectionContentBlocks.length > 0 
        ? state.sectionContentBlocks.join('<p>\n') 
        : '', // Empty section body
      questions: []
    };
    
    // Update state
    state.inSection = true;
    state.sectionContentBlocks = [];
    state.afterSectionBreak = false;
    
    return section;
  }
  
  return null;
};

/**
 * Handle standalone section creation for orphaned content
 * @param {string} text - Content text
 * @returns {Object} - Section object
 */
export const createStandaloneSection = (text) => {
  return {
    type: 'section',
    contentFormatted: text,
    questions: []
  };
}; 