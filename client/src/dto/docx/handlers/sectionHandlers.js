import { isTableBlock } from '../patterns/sectionDetectors.js';

/**
 * Handle section break at document start
 * @param {Object} state - Parser state
 * @returns {Object} - Action result
 */
export const handleDocumentStartSection = (state) => {
  // Create section with empty body that will collect questions
  state.currentSection = {
    type: 'section',
    contentFormatted: '', // Empty section body
    questions: []
  };
  
  state.inSection = true;
  state.afterSectionBreak = false; // We're now in the section, not after a break
  
  return { action: 'section_created' };
};

/**
 * Handle consecutive section breaks (empty sections)
 * @param {Array} consecutiveBreakIndices - Indices of consecutive breaks
 * @param {Object} state - Parser state
 * @param {Object} dto - Document DTO
 * @param {Function} addWarning - Warning function
 * @returns {Object} - Action result
 */
export const handleConsecutiveSectionBreaks = (consecutiveBreakIndices, state, dto, addWarning) => {
  const numEmptySections = consecutiveBreakIndices.length - 1;
  
  if (numEmptySections > 0) {
    addWarning(
      `${numEmptySections} empty section(s) detected`,
      `Consecutive section breaks at indices: ${consecutiveBreakIndices.join(', ')}`
    );
    
    // Create empty sections
    for (let i = 0; i < numEmptySections; i++) {
      const emptySection = {
        type: 'section',
        contentFormatted: '',
        questions: []
      };
      dto.examBody.push(emptySection);
    }
  }
  
  return { action: 'empty_sections_created', count: numEmptySections };
};

/**
 * Handle table blocks in section bodies
 * @param {Object} block - Table block
 * @param {Function} addWarning - Warning function
 * @returns {Object} - Action result
 */
export const handleTableInSection = (block, addWarning) => {
  addWarning(
    'Table found in section body - replaced with paragraph break',
    'Tables are not supported in section content and have been replaced with <br>'
  );
  
  return { action: 'table_replaced', replacement: '<br>' };
};

/**
 * Enhanced section content processing
 * @param {string} text - Text content
 * @param {Object} block - Current block
 * @param {Object} state - Parser state
 * @param {Function} addWarning - Warning function
 * @returns {Object} - Processing result
 */
export const processSectionContent = (text, block, state, addWarning) => {
  // Check for table blocks
  if (isTableBlock(block)) {
    const tableResult = handleTableInSection(block, addWarning);
    if (tableResult.action === 'table_replaced') {
      // Add the replacement content (paragraph break) to section content
      state.sectionContentBlocks.push(tableResult.replacement);
      return { action: 'table_replaced' };
    }
    return tableResult;
  }
  
  // Add non-empty text to section content
  if (text.trim() !== '') {
    state.sectionContentBlocks.push(text);
    return { action: 'content_added' };
  }
  
  return { action: 'empty_content_ignored' };
};

/**
 * Finalize section when ending
 * @param {Object} state - Parser state
 * @param {Object} dto - Document DTO
 * @param {Function} addWarning - Warning function
 * @returns {Object} - Section object or null
 */
export const finalizeSection = (state, dto, addWarning) => {
  if (!state.currentSection) return null;
  
  // Format section content
  if (state.sectionContentBlocks.length > 0) {
    state.currentSection.contentFormatted = state.sectionContentBlocks.join('<p>\n');
  }
  
  // Check for section with no content and no questions
  if (!state.currentSection.contentFormatted.trim() && 
      (!state.currentSection.questions || state.currentSection.questions.length === 0)) {
    addWarning(
      'Empty section detected',
      'Section has no content and no nested questions'
    );
  }
  
  // Always add section to DTO (even if empty)
  dto.examBody.push(state.currentSection);
  
  const section = state.currentSection;
  
  // Reset section state
  state.currentSection = null;
  state.sectionContentBlocks = [];
  state.inSection = false;
  state.afterSectionBreak = false;
  

  
  return section;
};

/**
 * Create section from accumulated content blocks
 * @param {Object} state - Parser state
 * @returns {Object} - Section object
 */
export const createSectionFromContent = (state) => {
  const section = {
    type: 'section',
    contentFormatted: state.sectionContentBlocks.join('<p>\n'),
    questions: []
  };
  
  // Update state
  state.inSection = true;
  state.sectionContentBlocks = [];
  state.afterSectionBreak = false;
  
  return section;
}; 