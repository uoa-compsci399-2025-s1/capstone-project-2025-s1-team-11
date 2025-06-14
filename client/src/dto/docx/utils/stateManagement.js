/**
 * Create a function to flush the current question to the DTO
 * @param {Object} state - Parser state object
 * @param {Object} dto - Document DTO being built
 * @returns {Function} - Flush function
 */
export const createFlushQuestion = (state, dto) => {
  return () => {
    if (state.currentQuestion) {
      // Remove any empty answers at the end
      while (
        state.currentAnswers.length > 0 &&
        state.currentAnswers[state.currentAnswers.length - 1].contentFormatted.trim() === ''
      ) {
        state.currentAnswers.pop();
      }

      state.currentQuestion.answers = [...state.currentAnswers];

      if (state.inSection && state.currentSection) {
        // Add question to current section
        if (!state.currentSection.questions) {
          state.currentSection.questions = [];
        }
        state.currentSection.questions.push(state.currentQuestion);
      } else {
        // Add directly to DTO
        dto.examBody.push(state.currentQuestion);
      }

      state.currentQuestion = null;
      state.currentAnswers = [];
      // Note: Don't reset emptyLineCounter here - it should persist to detect
      // questions that start after empty lines
    }
  };
};

/**
 * Create a function to flush the current section to the DTO
 * @param {Object} state - Parser state object
 * @param {Object} dto - Document DTO being built
 * @returns {Function} - Flush function
 */
export const createFlushSection = (state, dto) => {
  return () => {
    if (state.currentSection) {
      // Format section content (same pattern as questions)
      if (state.sectionContentBlocks.length > 0) {
        state.currentSection.contentFormatted = state.sectionContentBlocks.join('<p>\n');
      }

      // Only add section if it has content
      if (state.currentSection.contentFormatted && state.currentSection.contentFormatted.trim() !== '') {
        dto.examBody.push(state.currentSection);
      } else {
        // If section has no content, move any nested questions to top level
        if (state.currentSection.questions && state.currentSection.questions.length > 0) {
          dto.examBody.push(...state.currentSection.questions);
        }
      }

      state.currentSection = null;
      state.sectionContentBlocks = [];
    }
    state.inSection = false;
    state.afterSectionBreak = false;
  };
};

/**
 * Initialize parser state object
 * @returns {Object} - Initial parser state
 */
export const createInitialState = () => {
  return {
    currentSection: null,
    currentQuestion: null,
    currentAnswers: [],
    sectionContentBlocks: [],
    inSection: false,
    afterSectionBreak: false,
    emptyLineCounter: 0,
    questionJustFlushedByEmptyLine: false
  };
}; 