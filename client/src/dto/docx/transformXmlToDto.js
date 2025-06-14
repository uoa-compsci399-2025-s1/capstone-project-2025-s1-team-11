// client/docxDTO/transformXmlToDto.js

import { buildContentFormatted } from './utils/buildContentFormatted.js';
import { sanitizeContentFormatted } from './utils/sanitizeContentFormatted.js';
import { getMarksRegexPattern, extractMarks } from './utils/marksExtraction.js';
import { classifyContent } from './patterns/contentClassifier.js';
import { isSectionBreak, analyzeSectionStructure, isDocumentStart, isTableBlock } from './patterns/sectionDetectors.js';
import { createInitialState, createFlushQuestion, createFlushSection } from './utils/stateManagement.js';
import { createQuestion, createAnswer, handleSectionContentCreation, createStandaloneSection } from './handlers/contentHandlers.js';
import { handleDocumentStartSection, handleConsecutiveSectionBreaks, processSectionContent, finalizeSection } from './handlers/sectionHandlers.js';



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

// Section break detection moved to patterns/sectionDetectors.js

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
    
    // Analyze section structure for enhanced handling
    const sectionAnalysis = analyzeSectionStructure(blocks);
    
    // Debug: Check for table blocks
    const blockTypes = {};
    blocks.forEach((block, i) => {
        if (!block) {
            blockTypes['null'] = (blockTypes['null'] || 0) + 1;
        } else if (block['w:sectPr']) {
            blockTypes['sectPr'] = (blockTypes['sectPr'] || 0) + 1;
        } else if (block['w:pPr']?.['w:sectPr']) {
            blockTypes['pPr.sectPr'] = (blockTypes['pPr.sectPr'] || 0) + 1;
        } else if (block['w:tbl']) {
            blockTypes['table'] = (blockTypes['table'] || 0) + 1;
            console.log(`🔍 DEBUG: Found w:tbl at block ${i}`);
        } else if (block['w:p']) {
            blockTypes['paragraph'] = (blockTypes['paragraph'] || 0) + 1;
            // Check if paragraph contains table content
            const para = block['w:p'] ?? block;
            const runs = Array.isArray(para['w:r']) ? para['w:r'] : (para['w:r'] ? [para['w:r']] : []);
            const text = runs.map(run => {
                if (run['w:t']) return run['w:t'];
                return '';
            }).join('');
            if (text.includes('C0R0') || text.includes('C1R0')) {
                console.log(`🔍 DEBUG: Block ${i} contains table-like content: "${text.substring(0, 50)}..."`);
            }
        } else {
            blockTypes['other'] = (blockTypes['other'] || 0) + 1;
            // Debug: Check what's in the 'other' blocks
            const keys = Object.keys(block);
            if (keys.length > 0 && keys.some(key => key.includes('tbl') || key.includes('table'))) {
                console.log(`🔍 DEBUG: Block ${i} might be a table! Keys: ${keys.join(', ')}`);
            }
        }
    });
    
    if (blockTypes['table']) {
        console.log(`🔍 DEBUG: Found ${blockTypes['table']} table block(s)`);
    }
    
    // Note: Consecutive section breaks will be handled during normal processing
    // to ensure they're created at the right time in the document flow

    // Process each block
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (!block) continue;

        // Check if this is a section break
        if (isSectionBreak(block)) {
            // Handle section break at document start
            if (isDocumentStart(i, blocks)) {
                handleDocumentStartSection(state, addWarning);
                continue;
            }
            
            // Normal section break handling
            flushQuestion();
            
            // Check if we have section content to finalize
            const hadSectionContent = state.sectionContentBlocks.length > 0 || state.currentSection;
            finalizeSection(state, dto, addWarning);
            
            // Only set afterSectionBreak if we're starting a new section
            // If we just closed a section with content, return to normal mode
            if (hadSectionContent) {
                state.afterSectionBreak = false;
            } else {
                state.afterSectionBreak = true;
            }
            continue;
        }

        // Check if this is a table block BEFORE extracting paragraph content
        if (isTableBlock(block)) {
            console.log(`🔍 DEBUG: 📊 TABLE BLOCK detected at block ${i} - processing as table`);
            // Handle table in section body
            const tableResult = processSectionContent('', block, state, addWarning);
            if (tableResult.action === 'table_replaced') {
                // Reset empty line counter since table replacement counts as content, not empty space
                state.emptyLineCounter = 0;
                continue;
            }
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
            addWarning,
            state
        );
        
        // Special debugging for table content
        if (text.includes('C0R0') || text.includes('C1R0') || text.includes('simple table')) {
            console.log(`🔍 DEBUG: 📊 POTENTIAL TABLE CONTENT detected in block ${i}:`);
            console.log(`🔍 DEBUG: Text: "${text}"`);
            console.log(`🔍 DEBUG: Block keys: ${Object.keys(block).join(', ')}`);
            console.log(`🔍 DEBUG: isTableBlock result: ${isTableBlock(block)}`);
            console.log(`🔍 DEBUG: Classification: ${classification.type}`);
        }
        
        // Handle different content types
        if (handleContentType(classification, text, runs, para, documentXml, globalCounters, state, dto, flushQuestion, mathRegistry, mathElementsWithXml, drawingInstances, i, relationships, imageData, addWarning)) {
            continue;
        }
    }

    // Flush any remaining question or section
    flushQuestion();
    finalizeSection(state, dto, addWarning);

    // Debug log: Print examBody structure
    console.log('\n🔍 DEBUG: === FINAL EXAM BODY STRUCTURE ===');
    dto.examBody.forEach((item, index) => {
        if (item.type === 'question') {
            console.log(`${index}: UN-NESTED QUESTION - "${item.contentFormatted?.substring(0, 50)}..."`);
        } else if (item.type === 'section') {
            console.log(`${index}: SECTION - "${item.contentFormatted?.substring(0, 50)}..." (${item.questions?.length || 0} nested questions)`);
            item.questions?.forEach((q, qIndex) => {
                console.log(`  ${qIndex}: NESTED QUESTION - "${q.contentFormatted?.substring(0, 50)}..."`);
            });
        }
    });
    console.log('=== END EXAM BODY STRUCTURE ===\n');

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
 * @param {Function} addWarning - Warning function
 * @returns {boolean} - True if should continue to next block
 */
const handleContentType = (classification, text, runs, para, documentXml, globalCounters, state, dto, flushQuestion, mathRegistry, mathElementsWithXml, drawingInstances, i, relationships, imageData, addWarning) => {
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
            
            // If we have a current question, end it after an empty line (if it has answers)
            if (state.currentQuestion && state.emptyLineCounter >= 1 && state.currentAnswers.length > 0) {
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
                return true;
            }
            break;
            
        case 'table_block':
            // Handle table in section body
            const tableResult = processSectionContent(text, classification.block, state, addWarning);
            if (tableResult.action === 'table_replaced') {
                return true;
            }
            break;
            
        case 'section_content':
            // Process content for section body
            const contentResult = processSectionContent(text, classification.block, state, addWarning);
            return true;
            
        case 'section_body_end':
            // Section body has ended, treat this as a question
            
            // Create section from accumulated content
            if (state.sectionContentBlocks.length > 0) {
                state.currentSection = {
                    type: 'section',
                    contentFormatted: state.sectionContentBlocks.join('<p>\n'),
                    questions: []
                };
                state.inSection = true;
                state.sectionContentBlocks = [];
                state.afterSectionBreak = false;
            }
            
            // Fall through to question handling
            state.emptyLineCounter = 0;
            state.questionJustFlushedByEmptyLine = false;
            flushQuestion();
            state.currentQuestion = createQuestion(text, runs, formatOptions, para, documentXml, globalCounters);
            return true;
            
        case 'question':
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
            
            // Legacy section content handling (now handled by section_content case above)
            if (state.afterSectionBreak && !state.currentQuestion) {
                const legacyResult = processSectionContent(text, para, state, addWarning);
                return true;
            }

            // Handle question answers
            if (state.currentQuestion) {
                const answer = createAnswer(runs, formatOptions, para, documentXml, globalCounters);
                state.currentAnswers.push(answer);
                return true;
            }

            // If we have non-question, non-section content, treat as standalone section content
            if (text.trim() !== '' && !state.currentQuestion && !state.inSection && !state.afterSectionBreak) {
                state.currentSection = createStandaloneSection(text);
                state.inSection = true;
            }
            break;
    }
    
    return false;
};

// Export the shared marks regex pattern for backward compatibility
export { getMarksRegexPattern }; 