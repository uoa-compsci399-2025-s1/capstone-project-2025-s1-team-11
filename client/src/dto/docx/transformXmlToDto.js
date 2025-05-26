// client/docxDTO/transformXmlToDto.js

import { buildContentFormatted, detectMathElements } from './utils/buildContentFormatted.js';
import { createExam } from '../../store/exam/examUtils.js';
// import { convertOmmlToMathML } from './utils/ommlToMathML.js';
import { sanitizeContentFormatted } from './utils/sanitizeContentFormatted.js';
// import { extractPlainText } from './utils/extractPlainText.js';

export const transformXmlToDto = (xmlJson, relationships = {}, imageData = {}, documentXml = null) => {
  const body = xmlJson['w:document']?.['w:body'];
  if (!body) {
    throw new Error('Invalid XML structure: missing w:body');
  }

  // Create math registry for this document
  const mathRegistry = {};

  // Extract all blocks from the document body
  const blocks = [
    ...(Array.isArray(body['w:p']) ? body['w:p'] : (body['w:p'] ? [body['w:p']] : [])),
    ...(Array.isArray(body['w:tbl']) ? body['w:tbl'] : (body['w:tbl'] ? [body['w:tbl']] : [])),
    ...(body['w:sectPr'] ? [body['w:sectPr']] : [])
  ];

  // Diagnostic: Log total blocks to understand the content
  console.log(`Total document blocks: ${blocks.length}`);

  //const dto = [];
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
        console.log(`Added question "${currentQuestion.contentFormatted}" to section`);
      } else {
        // Add directly to DTO
        dto.examBody.push(currentQuestion);
        console.log(`Added standalone question "${currentQuestion.contentFormatted}"`);
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
        console.log(`Added section with content: ${currentSection.contentFormatted.substring(0, 30)}...`);
      } else {
        // If section has no content, move any nested questions to top level
        if (currentSection.questions && currentSection.questions.length > 0) {
          dto.examBody.push(...currentSection.questions);
          console.log(`Moved ${currentSection.questions.length} questions from empty section to top level`);
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

    // Get all runs
    const runs = Array.isArray(para['w:r']) ? para['w:r'] : (para['w:r'] ? [para['w:r']] : []);

    console.log(`Processing block ${i}, has math:`, containsMath);
    if (containsMath) {
      console.log('=== PARAGRAPH WITH MATH ===');
      console.log('Paragraph keys:', Object.keys(para));
      console.log('Math elements detected:', mathElements.length);
      console.log('Number of runs:', runs.length);
      console.log('First few run keys:', runs.slice(0, 3).map(r => Object.keys(r || {})));

      // Let's also see the actual math element structure
      console.log('First math element structure:', JSON.stringify(mathElements[0], null, 2));
    }

    // Build content with math handling, passing the parent paragraph for direct math access
    let text = buildContentFormatted(runs, {
      relationships,
      imageData,
      preserveMath: true,
      mathRegistry
    }, para, documentXml);

    console.log(`Block ${i}: type=${block['w:p'] ? 'paragraph' : 'other'}, text="${text}"`,
        text.trim() === '' ? '(EMPTY)' : '');

    // Handle empty lines
    if (text.trim() === '') {
      emptyLineCounter++;

      // If we have a current question, end it after an empty line (if it has answers)
      if (currentQuestion && emptyLineCounter >= 1 && currentAnswers.length > 0) {
        console.log(`Empty line detected, ending question "${currentQuestion.contentFormatted}"`);
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
        console.log(`Created new section from accumulated content`);
      }

      // Extract marks and create new question
      const marks = extractMarks(text);

      // Process the question content with math preservation
      const contentText = buildContentFormatted(runs, {
        removeMarks: true,
        relationships,
        imageData,
        preserveMath: true,
        mathRegistry
      }, para, documentXml);

      currentQuestion = {
        type: 'question',
        contentFormatted: sanitizeContentFormatted(contentText),
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
        console.log(`Added to section content: ${text.substring(0, 30)}...`);
      }
      continue;
    }

    // Handle question answers
    if (currentQuestion) {
      const answerText = buildContentFormatted(runs, {
        relationships,
        imageData,
        preserveMath: true,
        mathRegistry
      }, para, documentXml);

      currentAnswers.push({
        type: 'answer',
        contentFormatted: sanitizeContentFormatted(answerText)
      });

      console.log(`Added answer with content: ${answerText.substring(0, 50)}...`);
      continue;
    }

    // If we have non-question, non-section content, treat as standalone section content
    if (text.trim() !== '' && !currentQuestion && !inSection && !afterSectionBreak) {
      console.log(`Found standalone content, creating new section`);

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
  console.log(`Final DTO has ${dto.examBody.length} top-level items`);

  // Add this debug for math registry
  console.log('=== FINAL MATH REGISTRY ===');
  console.log('Math Registry entries:', Object.keys(mathRegistry).length);
  if (Object.keys(mathRegistry).length > 0) {
    console.log('Sample math registry entry:', Object.values(mathRegistry)[0]);
    console.log('All math registry keys:', Object.keys(mathRegistry));
    console.log('Math registry contents:', mathRegistry);
  }

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