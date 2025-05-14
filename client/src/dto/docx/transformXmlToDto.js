// client/docxDTO/transformXmlToDto.js

import { buildContentFormatted } from './utils/buildContentFormatted.js';
import { convertOmmlToMathML } from './utils/ommlToMathML.js';
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
    console.log(`Processing block ${i}, has math:`, !!para['m:oMath']);

    // Check if this paragraph contains math (OMML)
    let containsMath = false;
    let mathElements = [];

    // Check for math at the paragraph level (sibling to runs)
    if (para['m:oMath']) {
      containsMath = true;
      if (Array.isArray(para['m:oMath'])) {
        mathElements.push(...para['m:oMath']);
      } else {
        mathElements.push(para['m:oMath']);
      }
    }

    // Get all child elements of the paragraph in order
    const childElements = [];
    if (para && typeof para === 'object') {
      for (const key in para) {
        if (key === 'w:r' || key === 'm:oMath' || key === 'w:br') {
          if (Array.isArray(para[key])) {
            para[key].forEach((item, index) => {
              childElements.push({ type: key, content: item, originalIndex: index });
            });
          } else {
            childElements.push({ type: key, content: para[key], originalIndex: 0 });
          }
        }
      }
    }

    // Build content with proper ordering
    let text = '';
    let mathCounter = 0;


    if (containsMath) {
      console.log(`Starting math processing for block ${i}`);
      console.log(`Number of math elements: ${mathElements.length}`);
      console.log(`Para structure:`, Object.keys(para));

      // Process all elements (runs and math) in their original order
      let text = '';
      let mathCounter = 0;

      // Get runs
      const runs = Array.isArray(para['w:r']) ? para['w:r'] : (para['w:r'] ? [para['w:r']] : []);
      const mathElems = Array.isArray(para['m:oMath']) ? para['m:oMath'] : (para['m:oMath'] ? [para['m:oMath']] : []);

      // Use extractPlainText to handle the runs properly
      text = extractPlainText(runs, { relationships, imageData });

      // Now insert math placeholders at the appropriate positions
      // Based on the content, we need to insert after each label
      const lines = text.split('<br>');
      let result = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (i > 0) {
          result += '<br>';
        }

        result += line;

        // Check if this line ends with a label that should have math
        if (line.endsWith('i.') && mathCounter < mathElems.length) {
          result += `[MATH_${mathCounter++}]`;
        } else if (line.endsWith('ii.') && mathCounter < mathElems.length) {
          result += `[MATH_${mathCounter++}]`;
        } else if (line.endsWith('iii.') && mathCounter < mathElems.length) {
          result += `[MATH_${mathCounter++}]`;
        } else if (line.endsWith('iv.') && mathCounter < mathElems.length) {
          result += `[MATH_${mathCounter++}]`;
        }
      }

      text = result;

      console.log(`Text with properly positioned math: "${text}"`);

      // Check if this is a question
      if (isNewQuestion(text)) {
        console.log(`Found math question: ${text.substring(0, 50)}...`);
        const marks = extractMarks(text);

        // Remove marks pattern
        let questionText = text.replace(/^\[\d+(?:\.\d+)?\s*marks?\]\s*/i, '');

        // Replace math placeholders with actual MathML
        mathElems.forEach((mathElement, index) => {
          const mathML = convertOmmlToMathML(mathElement);
          const placeholder = `[MATH_${index}]`;
          questionText = questionText.replace(placeholder, mathML);
        });

        currentQuestion = {
          type: 'question',
          contentFormatted: sanitizeContentFormatted(questionText),
          marks: marks,
          answers: []
        };

        console.log(`Created math question`);
        continue;
      }

    } else {
      // No math, process normally using existing logic
      const runs = Array.isArray(para['w:r']) ? para['w:r'] : (para['w:r'] ? [para['w:r']] : []);
      text = buildContentFormatted(runs, { relationships, imageData });
    }

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

    // Check if this is a new question (without math, as math questions are handled above)
    if (!containsMath && isNewQuestion(text)) {
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
      const runs = Array.isArray(para['w:r']) ? para['w:r'] : (para['w:r'] ? [para['w:r']] : []);
      const questionText = buildContentFormatted(runs, {
        removeMarks: true,
        relationships,
        imageData
      });

      currentQuestion = {
        type: 'question',
        contentFormatted: sanitizeContentFormatted(questionText),
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
      currentAnswers.push({
        type: 'answer',
        contentFormatted: sanitizeContentFormatted(text)
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