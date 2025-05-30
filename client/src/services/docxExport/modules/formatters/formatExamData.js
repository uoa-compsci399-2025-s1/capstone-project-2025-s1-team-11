// src/services/docxExport/modules/formatters/formatExamData.js

import { parseHtmlContent } from '../contentProcessors/htmlParser.js';
// import { formatCoverPageForTemplate, parseAppendixForExport } from './contentProcessors/coverPageParser.js';

/**
 * Formats exam data from Redux store format to Docxtemplater template format
 * @param {Object} examData - Exam data from Redux store
 * @param {string|number} version - Version number to include in the export
 * @param {Object} mathRegistry - Math registry for resolving math placeholders
 * @returns {Object} - Formatted data ready for Docxtemplater
 */
export function formatExamDataForTemplate(examData, version = 1, mathRegistry = null) {
    if (!examData) {
        return {};
    }

    // Default template data to prevent undefined errors
    const defaultTemplateData = {
        examTitle: '',
        courseCode: '',
        courseName: '',
        department: '',
        timeAllowed: '',
        instructions: '',
        semester: '',
        year: '',
        campus: '',
        hasAdditionalCoverContent: false,
        additionalCoverContent: [],
        hasAppendix: false,
        appendixElements: [],
        examBody: [],
        hasExamBody: false,
        totalQuestions: 0,
        totalMarks: 0,
        pageBreak: '{PAGEBREAK}'
    };

    // Use the selected version or default to the first version
    const versionToUse = version || examData.versions?.[0] || 1;

    // Extract basic exam information with fallbacks to prevent undefined
    const basicInfo = {
        examTitle: examData.examTitle || 'Exam',
        courseCode: examData.courseCode || '',
        courseName: examData.courseName || '',
        // Include additional metadata if available
        department: examData.metadata?.department || '',
        timeAllowed: examData.metadata?.timeAllowed || '',
        instructions: examData.metadata?.instructions || '',
    };

    // Process examBody in original order
    const formattedExamBody = [];

    // Process each exam body item preserving order
    if (examData.examBody) {
        examData.examBody.forEach((item, index) => {
            if (item.type === 'section') {
                // Process section with its associated questions
                const sectionQuestions = formatQuestionsWithVersion(
                    item.questions || [],
                    versionToUse,
                    mathRegistry,
                    examData.versions,
                    examData.teleformOptions
                );

                // Process section content
                const sectionContent = processContent(item.contentFormatted || item.contentText || '', mathRegistry);

                const section = {
                    isSection: true,
                    isQuestion: false,
                    sectionTitle: item.sectionTitle || `Section ${item.sectionNumber || (index + 1)}`,
                    sectionNumber: item.sectionNumber || (index + 1),
                    sectionContent: sectionContent.text,
                    sectionElements: sectionContent.elements,
                    questions: sectionQuestions,
                    hasQuestions: sectionQuestions.length > 0
                };
                formattedExamBody.push(section);
            } else if (item.type === 'question') {
                // Process standalone question with version-specific answer ordering
                const formattedQuestion = formatQuestionWithVersion(item, versionToUse, examData.versions, examData.teleformOptions);
                const questionItem = {
                    isSection: false,
                    isQuestion: true,
                    ...formattedQuestion
                };
                formattedExamBody.push(questionItem);
            }
        });
    }

    // Combine everything for template
    return {
        ...defaultTemplateData,
        ...basicInfo,
        examBody: formattedExamBody,
        hasExamBody: formattedExamBody.length > 0,
        // Add total questions and marks to make it available to the template
        totalQuestions: countTotalQuestions(examData),
        totalMarks: calculateTotalMarks(examData),
        // Page break marker
        pageBreak: '{PAGEBREAK}'
    };
}

/**
 * Resolve math placeholders with content from math registry
 * @param {string} content - Content with math placeholders
 * @param {Object} mathRegistry - Math registry
 * @returns {string} - Content with resolved math
 */
function resolveMathPlaceholders(content, mathRegistry) {
    console.log('=== RESOLVE MATH PLACEHOLDERS ===');
    console.log('Input content:', content);
    console.log('Math registry keys:', Object.keys(mathRegistry));
    console.log('Content contains [math:', content.includes('[math:'));



    if (!mathRegistry || Object.keys(mathRegistry).length === 0) {
        console.log('No math registry, returning original content');
        console.log('=== END RESOLVE MATH PLACEHOLDERS ===');
        return content;
    }

    const result = content.replace(/\[math:([^\]]+)\]/g, (match, mathId) => {
        console.log(`Processing math placeholder: ${match}, mathId: ${mathId}`);
        const mathEntry = mathRegistry[mathId];
        if (mathEntry) {
            console.log('Math entry originalXml length:', mathEntry.originalXml.length);
            console.log('Math entry originalXml preview:', mathEntry.originalXml.substring(0, 100));

            const escapedXml = mathEntry.originalXml
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            const replacement = mathEntry.context === 'block'
                ? `§MATH_OMML§${escapedXml}§/MATH_OMML§`
                : `§MATH_OMML§${escapedXml}§/MATH_OMML§`;

            console.log('Replacement preview:', replacement.substring(0, 100));
            return replacement;
        }
        console.log(`Math entry not found for ID: ${mathId}`);
        return match; // Keep original if not found
    });

    console.log('Output content:', result);
    console.log('=== END RESOLVE MATH PLACEHOLDERS ===');
    return result;
}

/**
 * Process content that may contain HTML formatting
 * @param {string} content - Content string (HTML or plain text)
 * @param {Object} mathRegistry - Math registry for resolving math placeholders
 * @returns {Object} - Processed content with text and elements
 */
function processContent(content, mathRegistry = {}) {
    if (!content) {
        return { text: '', elements: [] };
    }

    // Resolve math placeholders BEFORE HTML processing
    let processedContent = content;
    if (mathRegistry && Object.keys(mathRegistry).length > 0) {
        processedContent = resolveMathPlaceholders(content, mathRegistry);
    }

    // Check if content contains HTML tags
    if (/<[^>]+>/.test(processedContent)) {
        return parseHtmlContent(processedContent);
    }

    // Plain text
    return { text: processedContent, elements: [] };
}

/**
 * Format an array of questions for template use, with version-specific answer ordering
 * @param {Array} questions - Array of question objects
 * @param {string|number} version - Version number being exported
 * @param {Array} versionList - List of all versions
 * @param {Array} optionLabels - List of option labels
 * @param {Object} mathRegistry - Math registry for resolving math placeholders
 * @returns {Array} - Formatted questions
 */
function formatQuestionsWithVersion(questions, version, versionList, optionLabels) {
    return questions.map(question => formatQuestionWithVersion(question, version, versionList, optionLabels));
}

/**
 * Format a single question for template use, with version-specific answer ordering
 * @param {Object} question - Question object
 * @param {string|number} version - Version number being exported
 * @param {Array} versionList - List of all versions
 * @param {Object} mathRegistry - Math registry for resolving math placeholders
 * @param {Array} optionLabels - List of option labels
 * @returns {Object} - Formatted question
 */
function formatQuestionWithVersion(question, version, versionList, optionLabels) {
/**
 * Format a single question for template use, with version-specific answer ordering
 * @param {Object} question - Question object
 * @param {string|number} version - Version number being exported
 * @param {Array} versionList - List of all versions
 * @param {Object} mathRegistry - Math registry for resolving math placeholders
 * @returns {Object} - Formatted question
 */
function formatQuestionWithVersion(question, version, versionList, mathRegistry) {
    // Format the mark display
    const markText = question.marks
        ? `[${question.marks} mark${question.marks !== 1 ? 's' : ''}]`
        : '';

    // Process question content
    const questionContent = processContent(
        question.contentFormatted || question.contentText || '',
        mathRegistry
    );

    // Determine which shuffle map to use based on version position in versionList
    let versionIndex = 0;
    if (versionList && versionList.length > 0) {
        // Find the position of this version in the versionList
        const position = versionList.indexOf(version);
        // If found, use that position; otherwise use a position based on numeric value or default to 0
        if (position !== -1) {
            versionIndex = position;
        } else if (typeof version === 'string' && !isNaN(parseInt(version))) {
            // If version is numeric but not in the list, calculate position based on value
            versionIndex = (parseInt(version) - 1) % versionList.length;
        }
    }

    //console.log("Version:", version, "Position in list:", versionIndex);

    // Get the appropriate shuffle map for this version
    // Note: shuffleMap.[original index] = new index

    const shuffleMap = question.answerShuffleMaps?.[versionIndex] || [...Array(question.answers?.length || 0).keys()];

    //console.log("Using shuffle map:", shuffleMap);

    // Format answers using the appropriate shuffle map for this version
    const formattedAnswers = [];

    // Rest of the function remains the same...
    if (question.answers && question.answers.length > 0) {
        // Create a temporary array to hold answers in their new positions
        const tempAnswers = new Array(question.answers.length);
        console.log("optionLabels", optionLabels);
        console.log("shuffleMap", shuffleMap);

        // Place each answer in its new position in the temp array
        shuffleMap.forEach((newIndex, originalIndex) => {
            const answer = question.answers[originalIndex];
            if (answer) {
                const answerContent = processContent(
                    answer.contentFormatted || answer.contentText || '',
                    mathRegistry
                );

                // Only include non-empty answers
                if (answerContent.text.trim()) {
                    // Use letters for answer labels (A, B, C, etc.)
                    //const label = String.fromCharCode(65 + newIndex);
                    const label = optionLabels[newIndex];
                    tempAnswers[newIndex] = {
                        label: label,
                        text: answerContent.text,
                        elements: answerContent.elements,
                        isCorrect: answer.correct || false
                    };
                }
            }
        });

        // Now push the answers in their correct order to formattedAnswers
        tempAnswers.forEach(answer => {
            if (answer) formattedAnswers.push(answer);
        });
    }

    return {
        questionNumber: question.questionNumber || 0,
        questionText: questionContent.text,
        questionElements: questionContent.elements,
        markText: markText,
        marks: question.marks || 0,
        hasAnswers: formattedAnswers.length > 0,
        answers: formattedAnswers
    };
}

/**
 * Count the total number of questions in the exam
 * @param {Object} examData - Exam data from Redux store
 * @returns {number} - Total question count
 */
function countTotalQuestions(examData) {
    let count = 0;

    if (examData.examBody) {
        examData.examBody.forEach(item => {
            if (item.type === 'section') {
                // Add questions in this section
                count += (item.questions || []).length;
            } else if (item.type === 'question') {
                // Standalone question
                count += 1;
            }
        });
    }

    return count;
}

/**
 * Calculate the total marks for the exam
 * @param {Object} examData - Exam data from Redux store
 * @returns {number} - Total marks
 */
function calculateTotalMarks(examData) {
    let totalMarks = 0;

    if (examData.examBody) {
        examData.examBody.forEach(item => {
            if (item.type === 'section') {
                // Add marks for each question in the section
                (item.questions || []).forEach(question => {
                    totalMarks += question.marks || 0;
                });
            } else if (item.type === 'question') {
                // Add marks for standalone question
                totalMarks += item.marks || 0;
            }
        });
    }

    return totalMarks;
}