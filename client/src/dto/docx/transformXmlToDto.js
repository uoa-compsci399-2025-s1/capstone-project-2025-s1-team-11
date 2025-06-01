// client/docxDTO/transformXmlToDto.js

import { buildContentFormatted, detectMathElements } from './utils/buildContentFormatted.js';
// import { createExam } from '../../store/exam/examUtils.js';
// import { convertOmmlToMathML } from './utils/ommlToMathML.js';
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
      mathCount += Array.isArray(para['m:oMathPara']['m:oMath']) ? para['m:oMathPara']['m:oMath'].length : 1;
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

export const transformXmlToDto = (xmlJson, relationships = {}, imageData = {}, documentXml = null, preExtractedMathElements = []) => {
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


  //const dto = [];
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
      // Format section content
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
    const containsMath = mathElementsWithXml.length > 0;

    // Get all runs
    const runs = Array.isArray(para['w:r']) ? para['w:r'] : (para['w:r'] ? [para['w:r']] : []);

    // Build content with math handling, passing math elements with original XML
    let text = buildContentFormatted(runs, {
      relationships,
      imageData,
      preserveMath: true,
      mathRegistry,
      mathElementsWithXml
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
    if (isNewQuestion(text)) {
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
        mathElementsWithXml
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
        mathElementsWithXml
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

const isNewQuestion = (text) => {
  if (!text) return false;
  // Normalize text by removing extra spaces and converting to lowercase
  const normalizedText = text.trim().toLowerCase();
  // Check if text starts with [X mark] or [X marks] pattern, allowing for any amount of spaces
  return /^\[\s*\d+(?:\.\d+)?\s*marks?\s*\]/i.test(normalizedText);
};

const extractMarks = (text) => {
  // Normalize text by removing extra spaces and converting to lowercase
  const normalizedText = text.trim().toLowerCase();
  // Extract the number, handling any amount of spaces
  const match = normalizedText.match(/^\[\s*(\d+(?:\.\d+)?)\s*marks?\s*\]/i);
  if (match) {
    return parseFloat(match[1]);
  }
  return 1;
};