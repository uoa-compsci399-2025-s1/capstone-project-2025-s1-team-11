// client/docxDTO/transformXmlToDto.js

import { buildContentFormatted } from './utils/buildContentFormatted.js';
import { sanitizeContentFormatted } from './utils/sanitizeContentFormatted.js';
import { getMarksRegexPattern, extractMarks } from './utils/marksExtraction.js';
import { classifyContent } from './patterns/contentClassifier.js';
import { createInitialState, createFlushQuestion, createFlushSection } from './utils/stateManagement.js';
import { createQuestion, createAnswer, handleSectionContentCreation, createStandaloneSection } from './handlers/contentHandlers.js';

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

/**
 * Check if a block represents a section break
 * @param {Object} block - Document block to check
 * @returns {boolean} - True if section break
 */
const isSectionBreak = (block) => {
  return (
    block['w:pPr']?.['w:sectPr'] !== undefined ||
    block['w:sectPr'] !== undefined
  );
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

    // Initialize parser state
    const state = createInitialState();
    
    // Create flush functions
    const flushQuestion = createFlushQuestion(state, dto);
    const flushSection = createFlushSection(state, dto);

    // Process each block
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (!block) continue;

        console.log(`\n🔍 DEBUG: === Processing block ${i} ===`);
        console.log(`🔍 DEBUG: Parser state - inSection: ${state.inSection}, afterSectionBreak: ${state.afterSectionBreak}, currentQuestion: ${!!state.currentQuestion}`);

        // Check if this is a section break
        if (isSectionBreak(block)) {
            console.log(`🔍 DEBUG: 🔧 SECTION BREAK detected`);
            flushQuestion();
            flushSection();
            state.afterSectionBreak = true;
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
        const classification = classifyContent(
            text, 
            state.emptyLineCounter, 
            i, 
            blocks, 
            state.currentQuestion, 
            state.currentAnswers, 
            state.questionJustFlushedByEmptyLine, 
            addWarning
        );
        
        // Handle different content types
        if (handleContentType(classification, text, runs, para, documentXml, globalCounters, state, dto, flushQuestion, mathRegistry, mathElementsWithXml, drawingInstances, i, relationships, imageData)) {
            continue;
        }
    }

    // Flush any remaining question or section
    flushQuestion();
    flushSection();

    return { dto, mathRegistry, warnings };
};

/**
 * Handle different content types based on classification
 * @param {Object} classification - Content classification result
 * @param {string} text - Text content
 * @param {Array} runs - Document runs
 * @param {Object} para - Paragraph object
 * @param {string} documentXml - Document XML
 * @param {Object} globalCounters - Global counters
 * @param {Object} state - Parser state
 * @param {Object} dto - Document DTO
 * @param {Function} flushQuestion - Question flush function
 * @param {Object} mathRegistry - Math registry
 * @param {Array} mathElementsWithXml - Math elements
 * @param {Array} drawingInstances - Drawing instances
 * @param {number} i - Block index
 * @param {Object} relationships - Document relationships
 * @param {Object} imageData - Image data
 * @returns {boolean} - True if should continue to next block
 */
const handleContentType = (classification, text, runs, para, documentXml, globalCounters, state, dto, flushQuestion, mathRegistry, mathElementsWithXml, drawingInstances, i, relationships, imageData) => {
    const formatOptions = {
        relationships,
        imageData,
        preserveMath: true,
        mathRegistry,
        mathElementsWithXml,
        drawingInstances,
        paragraphIndex: i
    };

    switch (classification.type) {
        case 'case13':
            const case13Result = classification.handler();
            if (case13Result.action === 'continue') return true;
            break;
            
        case 'empty_line':
            state.emptyLineCounter++;
            console.log(`🔍 DEBUG: Normal empty line. Counter now: ${state.emptyLineCounter}`);
            
            // If we have a current question, end it after an empty line (if it has answers)
            if (state.currentQuestion && state.emptyLineCounter >= 1 && state.currentAnswers.length > 0) {
                console.log(`🔍 DEBUG: Flushing question due to empty line`);
                state.questionJustFlushedByEmptyLine = true;
                flushQuestion();
            }
            return true;
            
        case 'case14':
            const case14Result = classification.handler();
            if (case14Result.action === 'create_section') {
                state.emptyLineCounter = 0;
                state.questionJustFlushedByEmptyLine = false;
                dto.examBody.push(case14Result.sectionData);
                console.log(`🔍 DEBUG: Added standalone section for Case 14`);
                return true;
            }
            break;
            
        case 'question':
            console.log(`🔍 DEBUG: ✅ NEW QUESTION DETECTED via ${classification.method.toUpperCase()}!`);
            state.emptyLineCounter = 0;
            state.questionJustFlushedByEmptyLine = false;
            
            flushQuestion();
            
            // Handle section content creation if needed
            const newSection = handleSectionContentCreation(state);
            if (newSection) {
                state.currentSection = newSection;
            }
            
            // Create new question
            state.currentQuestion = createQuestion(text, runs, formatOptions, para, documentXml, globalCounters);
            return true;
            
        case 'content':
        default:
            // Handle regular content (answers, section content, etc.)
            state.emptyLineCounter = 0;
            state.questionJustFlushedByEmptyLine = false;
            console.log(`🔍 DEBUG: Regular content processing`);
            
            // If we're after a section break and not in a question, collect section content
            if (state.afterSectionBreak && !state.currentQuestion) {
                if (text.trim() !== '') {
                    console.log(`🔍 DEBUG: 📝 Adding to SECTION CONTENT: "${text.substring(0, 50)}..."`);
                    state.sectionContentBlocks.push(text);
                }
                return true;
            }

            // Handle question answers
            if (state.currentQuestion) {
                console.log(`🔍 DEBUG: 📝 Adding as ANSWER: "${text.substring(0, 30)}..."`);
                const answer = createAnswer(runs, formatOptions, para, documentXml, globalCounters);
                state.currentAnswers.push(answer);
                return true;
            }

            // If we have non-question, non-section content, treat as standalone section content
            if (text.trim() !== '' && !state.currentQuestion && !state.inSection && !state.afterSectionBreak) {
                console.log(`🔍 DEBUG: 📝 Creating STANDALONE SECTION: "${text.substring(0, 50)}..."`);
                state.currentSection = createStandaloneSection(text);
                state.inSection = true;
            }
            break;
    }
    
    return false;
};

// Export the shared marks regex pattern for backward compatibility
export { getMarksRegexPattern }; 