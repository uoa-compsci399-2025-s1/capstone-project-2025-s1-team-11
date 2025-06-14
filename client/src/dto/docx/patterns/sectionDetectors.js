/**
 * Check if a block represents a section break
 * @param {Object} block - Document block to check
 * @returns {boolean} - True if section break
 */
export const isSectionBreak = (block) => {
  return (
    block['w:pPr']?.['w:sectPr'] !== undefined ||
    block['w:sectPr'] !== undefined
  );
};

/**
 * Check if a block represents a table that should be dropped
 * @param {Object} block - Document block to check
 * @returns {boolean} - True if table block
 */
export const isTableBlock = (block) => {
  return block['w:tbl'] !== undefined || 
         block['w:tblPr'] !== undefined ||
         (block['w:tblGrid'] !== undefined && block['w:tr'] !== undefined);
};

/**
 * Detect if we're at the document start (before any content)
 * @param {number} blockIndex - Current block index
 * @param {Array} blocks - All document blocks
 * @returns {boolean} - True if at document start
 */
export const isDocumentStart = (blockIndex, blocks) => {
  // Check if we've seen any non-empty content before this point
  for (let i = 0; i < blockIndex; i++) {
    const block = blocks[i];
    if (!block) continue;
    
    // Skip section breaks at the start
    if (isSectionBreak(block)) continue;
    
    // If we find any content, we're not at document start
    const para = block['w:p'] ?? block;
    if (para && para['w:r']) {
      return false;
    }
  }
  
  return true;
};

/**
 * Detect section body end using question indicators or double breaks
 * @param {string} text - Current text content
 * @param {number} emptyLineCounter - Number of preceding empty lines
 * @param {boolean} hasQuestionIndicators - Whether text has marks/bookmarks
 * @returns {Object} - Detection result
 */
export const detectSectionBodyEnd = (text, emptyLineCounter, hasQuestionIndicators) => {
  // High confidence: Question indicators (marks tag, bookmark)
  if (hasQuestionIndicators) {
    return {
      detected: true,
      method: 'question_indicators',
      confidence: 'high'
    };
  }
  
  // Medium confidence: Double break pattern
  if (emptyLineCounter >= 1 && text.trim() !== '') {
    return {
      detected: true,
      method: 'double_break',
      confidence: 'medium'
    };
  }
  
  return {
    detected: false,
    method: 'none',
    confidence: 'none'
  };
};

/**
 * Analyze section structure patterns
 * @param {Array} blocks - All document blocks
 * @returns {Object} - Section structure analysis
 */
export const analyzeSectionStructure = (blocks) => {
  const analysis = {
    hasInitialSectionBreak: false,
    sectionBreakIndices: [],
    consecutiveSectionBreaks: [],
    totalSections: 0
  };
  
  let consecutiveBreaks = [];
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    
    if (isSectionBreak(block)) {
      analysis.sectionBreakIndices.push(i);
      consecutiveBreaks.push(i);
      
      // Check if this is at document start
      if (isDocumentStart(i, blocks)) {
        analysis.hasInitialSectionBreak = true;
      }
    } else {
      // If we had consecutive breaks, record them
      if (consecutiveBreaks.length > 1) {
        analysis.consecutiveSectionBreaks.push([...consecutiveBreaks]);
      }
      consecutiveBreaks = [];
    }
  }
  
  // Handle consecutive breaks at end of document
  if (consecutiveBreaks.length > 1) {
    analysis.consecutiveSectionBreaks.push([...consecutiveBreaks]);
  }
  
  analysis.totalSections = analysis.sectionBreakIndices.length;
  
  return analysis;
}; 