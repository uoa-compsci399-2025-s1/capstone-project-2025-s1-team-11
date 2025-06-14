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

  // Array to collect warnings during parsing
  const warnings = [];
  
  // Helper function to add warnings
  const addWarning = (message, context = '') => {
    warnings.push({
      type: 'parsing',
      message: message,
      context: context,
      timestamp: Date.now()
    });
    console.log(`⚠️ WARNING: ${message} ${context ? `(${context})` : ''}`);
  };

  let currentSection = null;
  let currentQuestion = null;
  let currentAnswers = [];
  let sectionContentBlocks = [];
  let inSection = false;
  let afterSectionBreak = false;
  let emptyLineCounter = 0;
  let questionJustFlushedByEmptyLine = false; // Track when question ended due to empty line

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
      // Note: Don't reset emptyLineCounter here - it should persist to detect
      // questions that start after empty lines
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

    console.log(`\n🔍 DEBUG: === Processing block ${i} ===`);
    console.log(`🔍 DEBUG: Parser state - inSection: ${inSection}, afterSectionBreak: ${afterSectionBreak}, currentQuestion: ${!!currentQuestion}`);

    // Check if this is a section break
    if (isSectionBreak(block)) {
      console.log(`🔍 DEBUG: 🔧 SECTION BREAK detected`);
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

    // Classify and handle content based on pattern detection
    const classification = classifyContent(text, emptyLineCounter, i, blocks, currentQuestion, currentAnswers, questionJustFlushedByEmptyLine, addWarning);
    
    switch (classification.type) {
      case 'case13':
        const case13Result = classification.handler();
        if (case13Result.action === 'continue') continue;
        break;
        
      case 'empty_line':
        emptyLineCounter++;
        console.log(`🔍 DEBUG: Normal empty line. Counter now: ${emptyLineCounter}`);
        
        // If we have a current question, end it after an empty line (if it has answers)
        if (currentQuestion && emptyLineCounter >= 1 && currentAnswers.length > 0) {
          console.log(`🔍 DEBUG: Flushing question due to empty line`);
          questionJustFlushedByEmptyLine = true;
          flushQuestion();
        }
        continue;
        
      case 'case14':
        const case14Result = classification.handler();
        if (case14Result.action === 'create_section') {
          emptyLineCounter = 0;
          questionJustFlushedByEmptyLine = false;
          dto.examBody.push(case14Result.sectionData);
          console.log(`🔍 DEBUG: Added standalone section for Case 14`);
          continue;
        }
        break;
        
      case 'question':
        console.log(`🔍 DEBUG: ✅ NEW QUESTION DETECTED via ${classification.method.toUpperCase()}!`);
        emptyLineCounter = 0;
        questionJustFlushedByEmptyLine = false;
        
        flushQuestion();
        
        // Handle section content creation if needed
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
        
        // Create new question
        const marks = extractMarks(text);
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
        
      case 'content':
      default:
        // Handle regular content (answers, section content, etc.)
        emptyLineCounter = 0;
        questionJustFlushedByEmptyLine = false;
        console.log(`🔍 DEBUG: Regular content processing`);
        
        // If we're after a section break and not in a question, collect section content
        if (afterSectionBreak && !currentQuestion) {
          if (text.trim() !== '') {
            console.log(`🔍 DEBUG: 📝 Adding to SECTION CONTENT: "${text.substring(0, 50)}..."`);
            sectionContentBlocks.push(text);
          }
          continue;
        }

        // Handle question answers
        if (currentQuestion) {
          console.log(`🔍 DEBUG: 📝 Adding as ANSWER: "${text.substring(0, 30)}..."`);
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
          console.log(`🔍 DEBUG: 📝 Creating STANDALONE SECTION: "${text.substring(0, 50)}..."`);
          currentSection = {
            type: 'section',
            contentFormatted: text,
            questions: []
          };
          inSection = true;
        }
        break;
    }
  }

  // Flush any remaining question or section
  flushQuestion();
  flushSection();

  return { dto, mathRegistry, warnings };
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

// Enhanced question detection with hierarchical confidence levels
const isNewQuestion = (text, emptyLineCounter = 0, isAtDocumentEnd = false, questionJustFlushedByEmptyLine = false) => {
  if (!text) return false;
  
  // High Confidence Detection (Definitive)
  const hasMarksTag = detectMarksTag(text);
  const hasBookmark = detectBookmark(text);
  
  // Low Confidence Detection (Fallback)
  const hasDoubleBreak = (emptyLineCounter >= 1 && !isAtDocumentEnd) || questionJustFlushedByEmptyLine;
  
  // Debug logging
  console.log(`🔍 DEBUG: Question detection for: "${text.substring(0, 40)}..."`);
  console.log(`🔍 DEBUG:   - emptyLineCounter: ${emptyLineCounter}`);
  console.log(`🔍 DEBUG:   - isAtDocumentEnd: ${isAtDocumentEnd}`);
  console.log(`🔍 DEBUG:   - questionJustFlushedByEmptyLine: ${questionJustFlushedByEmptyLine}`);
  console.log(`🔍 DEBUG:   - hasMarksTag: ${hasMarksTag} (HIGH CONFIDENCE)`);
  console.log(`🔍 DEBUG:   - hasBookmark: ${hasBookmark} (HIGH CONFIDENCE)`);
  console.log(`🔍 DEBUG:   - hasDoubleBreak: ${hasDoubleBreak} (LOW CONFIDENCE - FALLBACK)`);
  
  // Hierarchical detection: High confidence methods take precedence
  const result = hasMarksTag || hasBookmark || hasDoubleBreak;
  
  // Determine detection method used
  let detectionMethod = 'none';
  if (hasMarksTag) detectionMethod = 'marks_tag';
  else if (hasBookmark) detectionMethod = 'bookmark';
  else if (hasDoubleBreak) detectionMethod = 'double_break';
  
  console.log(`🔍 DEBUG:   - RESULT: ${result} (via ${detectionMethod})`);
  
  return { detected: result, method: detectionMethod };
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

// --- Pattern Detection Functions ---

/**
 * Detect if content represents Case 13: Unexpected empty line within question
 */
const detectCase13Pattern = (isEmpty, currentQuestion, currentAnswers) => {
  return isEmpty && currentQuestion && currentAnswers.length === 0;
};

/**
 * Detect if content represents Case 14: Standalone paragraph between double breaks
 */
const detectCase14Pattern = (text, emptyLineCounter, nextBlocks, i, blocks) => {
  // Must have content (not empty)
  if (!text || text.trim() === '') return false;
  
  // Must be preceded by double break (or be at start with empty lines)
  const precededByDoubleBreak = emptyLineCounter >= 1;
  if (!precededByDoubleBreak) return false;
  
  // Must have no question indicators (marks, bookmarks)
  const hasQuestionIndicators = detectMarksTag(text) || detectBookmark(text);
  if (hasQuestionIndicators) return false;
  
  // Check if followed by double break by looking ahead
  const isFollowedByDoubleBreak = checkIfFollowedByDoubleBreak(i, blocks);
  
  return isFollowedByDoubleBreak;
};

/**
 * Look ahead to see if current content is followed by double break pattern
 */
const checkIfFollowedByDoubleBreak = (currentIndex, blocks) => {
  let emptyCount = 0;
  let foundNonEmpty = false;
  
  // Look at next few blocks
  for (let j = currentIndex + 1; j < Math.min(currentIndex + 5, blocks.length); j++) {
    const block = blocks[j];
    if (!block) continue;
    
    // Check if it's a section break
    if (isSectionBreak(block)) {
      return emptyCount >= 1; // Section break after empty line(s) counts as double break
    }
    
    // Extract text content
    const para = block['w:p'] ?? block;
    const runs = Array.isArray(para['w:r']) ? para['w:r'] : (para['w:r'] ? [para['w:r']] : []);
    const text = extractTextFromRuns(runs);
    
    if (text.trim() === '') {
      emptyCount++;
    } else {
      foundNonEmpty = true;
      break;
    }
  }
  
  // If we found empty line(s) followed by content, that's a double break pattern
  return emptyCount >= 1 && foundNonEmpty;
};

/**
 * Simple text extraction for lookahead (without full formatting)
 */
const extractTextFromRuns = (runs) => {
  return runs.map(run => {
    const t = run['w:t'];
    if (typeof t === 'string') return t;
    if (typeof t === 'object' && t?.['#text']) return t['#text'];
    return '';
  }).join('');
};

// --- Content Handlers ---

/**
 * Handle Case 13: Unexpected empty line within question
 */
const handleCase13 = (addWarning, currentQuestion) => {
  addWarning(
    'Unexpected paragraph break after question', 
    `Question: "${currentQuestion.contentFormatted.substring(0, 50)}..."`
  );
  console.log(`🔍 DEBUG: Case 13 detected - handling unexpected empty line gracefully`);
  return { action: 'continue' }; // Skip this empty line
};

/**
 * Handle Case 14: Standalone paragraph between double breaks
 */
const handleCase14 = (text, addWarning) => {
  addWarning(
    'Ambiguous standalone paragraph detected', 
    `Content: "${text.substring(0, 50)}..." - Interpreted as section content`
  );
  
  console.log(`🔍 DEBUG: Case 14 detected - creating section for standalone paragraph`);
  
  return {
    action: 'create_section',
    sectionData: {
      type: 'section',
      contentFormatted: text,
      questions: []
    }
  };
};

// --- Main Content Classification ---

/**
 * Classify content and determine how to handle it
 */
const classifyContent = (text, emptyLineCounter, i, blocks, currentQuestion, currentAnswers, questionJustFlushedByEmptyLine, addWarning) => {
  // Empty content
  if (text.trim() === '') {
    if (detectCase13Pattern(true, currentQuestion, currentAnswers)) {
      return { type: 'case13', handler: () => handleCase13(addWarning, currentQuestion) };
    }
    return { type: 'empty_line' };
  }

  // Non-empty content
  console.log(`🔍 DEBUG: Processing non-empty text (block ${i}): "${text.substring(0, 50)}..." (emptyLineCounter: ${emptyLineCounter})`);

  // Case 14: Standalone paragraph
  if (detectCase14Pattern(text, emptyLineCounter, [], i, blocks)) {
    return { type: 'case14', handler: () => handleCase14(text, addWarning) };
  }

  // Normal question detection
  const questionDetection = isNewQuestion(text, emptyLineCounter, i === blocks.length - 1, questionJustFlushedByEmptyLine);
  if (questionDetection.detected) {
    return { type: 'question', method: questionDetection.method };
  }

  // Default content classification
  return { type: 'content' };
};