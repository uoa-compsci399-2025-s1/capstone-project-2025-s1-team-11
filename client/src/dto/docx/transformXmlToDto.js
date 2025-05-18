// client/docxDTO/transformXmlToDto.js

import { buildContentFormatted, detectMathElements } from './utils/buildContentFormatted.js';
import { createExam } from '../../store/exam/examUtils.js';
import { sanitizeContentFormatted } from './utils/sanitizeContentFormatted.js';
import { extractPlainText } from './utils/extractPlainText.js';

export const transformXmlToDto = (xmlJson, relationships = {}, imageData = {}) => {
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

  const dto = createExam();

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
      console.log(`Found section break at block ${i}`);
      flushQuestion();
      flushSection();
      afterSectionBreak = true;
      continue;
    }

    // Extract the paragraph content
    const para = block['w:p'] ?? block;

    // Check if this paragraph contains math elements
    const mathElements = detectMathElements(para);
    const containsMath = mathElements.length > 0;

    console.log(`Processing block ${i}, has math:`, containsMath);
    if (containsMath) {
      console.log(`Math elements found:`, mathElements.length);
    }

    // Get all runs
    const runs = Array.isArray(para['w:r']) ? para['w:r'] : (para['w:r'] ? [para['w:r']] : []);

    // Build content with math handling, passing the parent paragraph for direct math access
    let text = buildContentFormatted(runs, {
      relationships,
      imageData,
      preserveMath: true
    }, para);

    console.log(`Block ${i}: type=${block['w:p'] ? 'paragraph' : 'other'}, text="${text}"`,
        text.trim() === '' ? '(EMPTY)' : '');

    // Handle empty lines
    if (text.trim() === '') {
      emptyLineCounter++;
      if (currentQuestion && emptyLineCounter >= 1 && currentAnswers.length > 0) {
        flushQuestion();
      }
      continue;
    }

    // Reset empty line counter for non-empty text
    emptyLineCounter = 0;

    // Check if this is a new question
    if (isNewQuestion(text)) {
      console.log(`Found question marker: ${text.substring(0, 30)}...`);
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
      const questionText = buildContentFormatted(runs, {
        removeMarks: true,
        relationships,
        imageData,
        preserveMath: true
      }, para);

      currentQuestion = {
        type: 'question',
        contentFormatted: sanitizeContentFormatted(questionText),
        marks: marks,
        answers: []
      };

      console.log(`Created question with content: ${currentQuestion.contentFormatted.substring(0, 100)}...`);
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
        preserveMath: true
      }, para);

      currentAnswers.push({
        type: 'answer',
        contentFormatted: sanitizeContentFormatted(answerText)
      });

      console.log(`Added answer with content: ${answerText.substring(0, 50)}...`);
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
  // Check if text starts with [X mark] or [X marks] pattern
  return /^\[\d+(?:\.\d+)?\s*marks?\]/i.test(text.trim());
};

const extractMarks = (text) => {
  const match = text.match(/^\[(\d+(?:\.\d+)?)\s*marks?\]/i);
  if (match) {
    return parseFloat(match[1]);
  }
  return 1;
};