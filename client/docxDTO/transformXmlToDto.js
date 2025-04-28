// client/docxDTO/transformXmlToSimpleDto.js

import { buildContentFormatted } from './utils/buildContentFormatted.js';
import { convertOmmlToMathML } from './utils/ommlToMathML.js';

export const transformXmlToSimpleDto = (xmlJson, relationships = {}, imageData = {}) => {
  const body = xmlJson['w:document']?.['w:body'];
  if (!body) {
    throw new Error('Invalid XML structure: missing w:body');
  }

  // Extract all blocks from the document body
  const blocks = [
    ...(Array.isArray(body['w:p']) ? body['w:p'] : (body['w:p'] ? [body['w:p']] : [])),
    ...(Array.isArray(body['w:tbl']) ? body['w:tbl'] : (body['w:tbl'] ? [body['w:tbl']] : [])),
    ...(body['w:sectPr'] ? [body['w:sectPr']] : [])
  ];

  // Diagnostic: Log total blocks to understand the content
//  console.log(`Total document blocks: ${blocks.length}`);

  const dto = [];

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
//        console.log(`Added question "${currentQuestion.contentFormatted}" to section`);
      } else {
        // Add directly to DTO
        dto.push(currentQuestion);
//        console.log(`Added standalone question "${currentQuestion.contentFormatted}"`);
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
        dto.push(currentSection);
//        console.log(`Added section with content: ${currentSection.contentFormatted.substring(0, 30)}...`);
      } else {
        // If section has no content, move any nested questions to top level
        if (currentSection.questions && currentSection.questions.length > 0) {
          dto.push(...currentSection.questions);
//          console.log(`Moved ${currentSection.questions.length} questions from empty section to top level`);
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
//      console.log(`Found section break at block ${i}`);

      // Finish current question and section
      flushQuestion();
      flushSection();

      // Mark that we just saw a section break
      afterSectionBreak = true;
      continue;
    }

    // Check if this block contains an equation (OMML)
    let containsEquation = false;
    let equationContent = '';

    if (block['m:oMath'] || block['m:oMathPara']) {
      containsEquation = true;
      // Use the proper math conversion function
      equationContent = convertOmmlToMathML(block);
    }

    // Get the runs and text from this block
    const runs = Array.isArray(block['w:r']) ? block['w:r'] : (block['w:r'] ? [block['w:r']] : []);
    let text;

    if (containsEquation) {
      text = equationContent;
    } else {
      text = buildContentFormatted(runs, { relationships, imageData });
    }

    if (text.trim() !== '') {
//      console.log(`Block ${i}: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`);
    }

    // Handle empty lines
    if (text.trim() === '') {
      emptyLineCounter++;

      // If we have a current question, end it after an empty line (if it has answers)
      if (currentQuestion && emptyLineCounter >= 1 && currentAnswers.length > 0) {
//        console.log(`Empty line detected, ending question "${currentQuestion.contentFormatted}"`);
        flushQuestion();
      }

      continue;
    }

    // Reset empty line counter for non-empty text
    emptyLineCounter = 0;

    // Check if this is a new question
    if (isNewQuestion(text)) {
//      console.log(`Found question marker: ${text.substring(0, 30)}...`);

      // End previous question if any
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
//        console.log(`Created new section from accumulated content`);
      }

      // Extract marks and create new question
      const marks = extractMarks(text);
      const questionText = buildContentFormatted(runs, { removeMarks: true, relationships, imageData });

      currentQuestion = {
        type: 'question',
        contentFormatted: questionText,
        marks: marks,
        answers: []
      };

//      console.log(`Created new question: "${questionText}" with ${marks} marks`);
      continue;
    }

    // If we're after a section break and not in a question, collect section content
    if (afterSectionBreak && !currentQuestion) {
      if (text.trim() !== '') {
        sectionContentBlocks.push(text);
//        console.log(`Added to section content: ${text.substring(0, 30)}...`);
      }
      continue;
    }

    // Handle question answers
    if (currentQuestion) {
      currentAnswers.push({
        type: 'answer',
        contentFormatted: text
      });
//      console.log(`Added answer to "${currentQuestion.contentFormatted}": ${text.substring(0, 30)}...`);
      continue;
    }

    // If we have non-question, non-section content, treat as standalone section content
    if (text.trim() !== '' && !currentQuestion && !inSection && !afterSectionBreak) {
//      console.log(`Found standalone content, creating new section`);

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

  // Final diagnostic
//  console.log(`Final DTO has ${dto.length} top-level items`);

  return dto;
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
  return /^\[\d+(?:\.\d+)?\s*marks?\]/i.test(text.trim());
};

const extractMarks = (text) => {
  const match = text.match(/^\[(\d+(?:\.\d+)?)\s*marks?\]/i);
  if (match) {
    return parseFloat(match[1]);
  }
  return 1;
};