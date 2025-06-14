// client/docxDTO/transformXmlToDto.js

import { buildContentFormatted } from './utils/buildContentFormatted.js';
import { sanitizeContentFormatted } from './utils/sanitizeContentFormatted.js';

/**
 * Match math elements in a paragraph to the pre-extracted math elements
 * @param {Object} para - Paragraph object
 * @param {Array} preExtractedMathElements - Pre-extracted math elements with original XML
 * @param {Object} globalCounters - Global counters for tracking position
 * @returns {Array} - Array of math elements for this paragraph with original XML
 */
const getMatchingMathElementsForParagraph = (para, preExtractedMathElements, globalCounters) => {
    const mathElementsForParagraph = [];

    if (!para || !preExtractedMathElements || preExtractedMathElements.length === 0) {
        return mathElementsForParagraph;
    }

    let currentMathIndex = globalCounters.mathIndex || 0;

    // Count math elements in this paragraph
    let mathCount = 0;

    // Check for math at the paragraph level
    if (para['m:oMath']) {
        mathCount += Array.isArray(para['m:oMath']) ? para['m:oMath'].length : 1;
    }

    // Check for math in oMathPara
    if (para['m:oMathPara']) {
        if (Array.isArray(para['m:oMathPara'])) {
            para['m:oMathPara'].forEach(mathPara => {
                if (mathPara['m:oMath']) {
                    mathCount += Array.isArray(mathPara['m:oMath']) ? mathPara['m:oMath'].length : 1;
                }
            });
        } else if (para['m:oMathPara']['m:oMath']) {
            mathCount += Array.isArray(para['m:oMathPara']['m:oMath']) ? para['m:oMath'].length : 1;
        }
    }

    // Extract the corresponding pre-extracted math elements
    for (let i = 0; i < mathCount; i++) {
        if (currentMathIndex + i < preExtractedMathElements.length) {
            const preExtracted = preExtractedMathElements[currentMathIndex + i];

            // Determine if this is block math based on the original type
            const isBlockMath = preExtracted.type === 'oMathPara' || preExtracted.isBlockMath;

            mathElementsForParagraph.push({
                element: null, // We don't need the JSON element since we have the original XML
                isBlockMath: isBlockMath,
                originalXml: preExtracted.originalXml,
                id: preExtracted.id
            });
        }
    }

    return mathElementsForParagraph;
};

export const transformXmlToDto = (xmlJson, relationships = {}, imageData = {}, documentXml = null, preExtractedMathElements = [], drawingInstances = []) => {
    const body = xmlJson['w:document']?.['w:body'];
    if (!body) {
        throw new Error('Invalid XML structure: missing w:body');
    }

  // Create math registry for this document
  const mathRegistry = {};

  // Add global math counter to track across all paragraphs
  const globalCounters = { mathIndex: 0 };

  // Extract all blocks from the document body
  const blocks = [
    ...(Array.isArray(body['w:p']) ? body['w:p'] : (body['w:p'] ? [body['w:p']] : [])),
    ...(Array.isArray(body['w:tbl']) ? body['w:tbl'] : (body['w:tbl'] ? [body['w:tbl']] : [])),
    ...(body['w:sectPr'] ? [body['w:sectPr']] : [])
  ];

  const dto = {
    type: 'exam',
    examBody: []
  };

  let currentSection = null;
  let currentQuestion = null;
  let currentAnswers = [];
  let sectionContentBlocks = [];
  let inSection = false;
  let afterSectionBreak = false;
  let emptyLineCounter = 0;

  const flushQuestion = () => {
    if (currentQuestion) {
      // Remove any empty answers at the end
      while (
          currentAnswers.length > 0 &&
          currentAnswers[currentAnswers.length - 1].contentFormatted.trim() === ''
          ) {
        currentAnswers.pop();
      }

      currentQuestion.answers = [...currentAnswers];

      if (inSection && currentSection) {
        // Add question to current section
        if (!currentSection.questions) {
          currentSection.questions = [];
        }
        currentSection.questions.push(currentQuestion);
      } else {
        // Add directly to DTO
        dto.examBody.push(currentQuestion);
      }

      currentQuestion = null;
      currentAnswers = [];
      emptyLineCounter = 0;
    }
  };

  const flushSection = () => {
    if (currentSection) {
      // Format section content (same pattern as questions)
      if (sectionContentBlocks.length > 0) {
        currentSection.contentFormatted = sectionContentBlocks.join('<p>\n');
      }

      // Only add section if it has content
      if (currentSection.contentFormatted && currentSection.contentFormatted.trim() !== '') {
        dto.examBody.push(currentSection);
      } else {
        // If section has no content, move any nested questions to top level
        if (currentSection.questions && currentSection.questions.length > 0) {
          dto.examBody.push(...currentSection.questions);
        }
      }

      currentSection = null;
      sectionContentBlocks = [];
    }
    inSection = false;
    afterSectionBreak = false;
  };

  // Process each block
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block) continue;

    // Check if this is a section break
    if (isSectionBreak(block)) {
      flushQuestion();
      flushSection();
      afterSectionBreak = true;
      continue;
    }

    // Extract the paragraph content
    const para = block['w:p'] ?? block;

    // Get matching math elements for this paragraph from pre-extracted elements
    const mathElementsWithXml = getMatchingMathElementsForParagraph(para, preExtractedMathElements, globalCounters);

    // Get all runs
    const runs = Array.isArray(para['w:r']) ? para['w:r'] : (para['w:r'] ? [para['w:r']] : []);

    // Build content with math handling, passing math elements with original XML
      let text = buildContentFormatted(runs, {
          relationships,
          imageData,
          preserveMath: true,
          mathRegistry,
          mathElementsWithXml,
          drawingInstances,
          paragraphIndex: i
      }, para, documentXml, globalCounters);

    // Update the global counter after processing this paragraph
    globalCounters.mathIndex += mathElementsWithXml.length;

    // Handle empty lines
    if (text.trim() === '') {
      emptyLineCounter++;

      // If we have a current question, end it after an empty line (if it has answers)
      if (currentQuestion && emptyLineCounter >= 1 && currentAnswers.length > 0) {
        flushQuestion();
      }

      continue;
    }

    // Reset empty line counter for non-empty text
    emptyLineCounter = 0;

    // Check if this is a new question
    if (isNewQuestion(text, emptyLineCounter, i === blocks.length - 1)) {
      flushQuestion();

      // If we've accumulated section content after a section break, create a new section
      if (afterSectionBreak && sectionContentBlocks.length > 0) {
        currentSection = {
          type: 'section',
          contentFormatted: sectionContentBlocks.join('<p>\n'),
          questions: []
        };
        inSection = true;
        sectionContentBlocks = [];
        afterSectionBreak = false;
      }

      // Extract marks and create new question
      const marks = extractMarks(text);

      // Process the question content with math preservation
        const contentText = buildContentFormatted(runs, {
            removeMarks: true,
            relationships,
            imageData,
            preserveMath: true,
            mathRegistry,
            mathElementsWithXml,
            drawingInstances,
            paragraphIndex: i
        }, para, documentXml, globalCounters);
      currentQuestion = {
        type: 'question',
        contentFormatted: sanitizeContentFormatted(contentText),
        marks: marks,
        answers: []
      };

      continue;
    }

    // If we're after a section break and not in a question, collect section content
    if (afterSectionBreak && !currentQuestion) {
      if (text.trim() !== '') {
        sectionContentBlocks.push(text);
      }
      continue;
    }

    // Handle question answers
      if (currentQuestion) {
          const answerText = buildContentFormatted(runs, {
              relationships,
              imageData,
              preserveMath: true,
              mathRegistry,
              mathElementsWithXml,
              drawingInstances,
              paragraphIndex: i
          }, para, documentXml, globalCounters);

      currentAnswers.push({
        type: 'answer',
        contentFormatted: sanitizeContentFormatted(answerText)
      });

      continue;
    }

    // If we have non-question, non-section content, treat as standalone section content
    if (text.trim() !== '' && !currentQuestion && !inSection && !afterSectionBreak) {
      currentSection = {
        type: 'section',
        contentFormatted: text,
        questions: []
      };
      inSection = true;
    }
  }

  // Flush any remaining question or section
  flushQuestion();
  flushSection();

  return { dto, mathRegistry };
};

// --- Helper functions ---

const isSectionBreak = (block) => {
  return (
      block['w:pPr']?.['w:sectPr'] !== undefined ||
      block['w:sectPr'] !== undefined
  );
};

// Shared marks pattern for consistent detection and removal
export const getMarksRegexPattern = () => {
  // Enhanced regex to handle edge cases:
  // - Empty brackets []
  // - Missing numbers [ marks]
  // - Malformed spacing [ 1 m ark ]
  // - Missing 's' [1 mark] vs [1 marks]
  return /^\[\s*(\d*(?:\.\d+)?)\s*m?\s*a?\s*r?\s*k?\s*s?\s*\]/i;
};

// Enhanced question detection with multiple methods
const isNewQuestion = (text, emptyLineCounter = 0, isAtDocumentEnd = false) => {
  if (!text) return false;
  
  // Method 1: Double paragraph break detection (primary)
  // If we just had empty lines and now have content, it could be a new question
  const hasDoubleBreak = emptyLineCounter >= 1 && !isAtDocumentEnd;
  
  // Method 2: Marks tag detection (enhanced to handle edge cases)
  const hasMarksTag = detectMarksTag(text);
  
  // Method 3: Bookmark detection (placeholder for future implementation)
  const hasBookmark = detectBookmark(text);
  
  // ANY of these methods indicates a new question
  return hasMarksTag || hasDoubleBreak || hasBookmark;
};

// Enhanced marks tag detection using shared pattern
const detectMarksTag = (text) => {
  if (!text) return false;
  
  const normalizedText = text.trim().toLowerCase();
  return getMarksRegexPattern().test(normalizedText);
};

// Bookmark detection placeholder
const detectBookmark = (text) => {
  // TODO: Implement bookmark detection when needed
  // For now, return false to maintain current behavior
  return false;
};

// Enhanced marks extraction to handle edge cases
const extractMarks = (text) => {
  if (!text) return 1;
  
  const normalizedText = text.trim().toLowerCase();
  
  // Use the same enhanced regex pattern for consistency
  const match = normalizedText.match(getMarksRegexPattern());
  
  if (match) {
    const marksValue = match[1];
    
    // Handle empty brackets [] or missing numbers
    if (!marksValue || marksValue === '') {
      return 1; // Default to 1 mark
    }
    
    const parsedMarks = parseFloat(marksValue);
    return isNaN(parsedMarks) ? 1 : parsedMarks;
  }
  
  // If no marks tag detected, default to 1
  return 1;
};