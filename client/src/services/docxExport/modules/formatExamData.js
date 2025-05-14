// src/services/docxExport/modules/formatExamData.js

import { parseHtmlContent } from './contentProcessors/htmlParser';

/**
 * Formats exam data from Redux store format to Docxtemplater template format
 * @param {Object} examData - Exam data from Redux store
 * @param {string|number} version - Version number to include in the export
 * @returns {Object} - Formatted data ready for Docxtemplater
 */
export function formatExamDataForTemplate(examData, version = 1) {
    if (!examData) {
        return {};
    }

    // Use the selected version or default to the first version
    const versionToUse = version || examData.versions?.[0] || 1;

    // Extract basic exam information with fallbacks to prevent undefined
    const basicInfo = {
        examTitle: examData.examTitle || 'Exam',
        courseCode: examData.courseCode || '',
        courseName: examData.courseName || '',
        semester: examData.semester || '',
        year: examData.year || '',
        version: versionToUse,
        // Include additional metadata if available
        campus: examData.metadata?.campus || '',
        timeAllowed: examData.metadata?.timeAllowed || '',
        department: examData.metadata?.department || '',
        instructions: examData.metadata?.instructions || '',
    };

    // Process examBody in original order
    const formattedExamBody = [];

    // Process each exam body item preserving order
    examData.examBody.forEach((item, index) => {
        if (item.type === 'section') {
            // Process section with its associated questions
            const sectionQuestions = formatQuestionsWithVersion(
                item.questions || [],
                versionToUse,
                examData.versions
            );

            // Process section content
            const sectionContent = processContent(item.contentFormatted || item.contentText || '');

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
            const formattedQuestion = formatQuestionWithVersion(item, versionToUse, examData.versions);
            const questionItem = {
                isSection: false,
                isQuestion: true,
                ...formattedQuestion
            };
            formattedExamBody.push(questionItem);
        }
    });

    // Combine everything for template
    return {
        ...basicInfo,
        hasCoverPage: !!examData.coverPage,
        coverPageContent: examData.coverPage?.contentText || '',
        hasAppendix: !!examData.appendix,
        appendixContent: examData.appendix?.contentText || '',
        examBody: formattedExamBody,
        hasExamBody: formattedExamBody.length > 0,
        // Add total questions and marks to make it available to the template
        totalQuestions: countTotalQuestions(examData),
        totalMarks: calculateTotalMarks(examData)
    };
}

/**
 * Process content that may contain HTML formatting
 * @param {string} content - Content string (HTML or plain text)
 * @returns {Object} - Processed content with text and elements
 */
function processContent(content) {
    if (!content) {
        return { text: '', elements: [] };
    }

    // Check if content contains HTML tags
    if (/<[^>]+>/.test(content)) {
        return parseHtmlContent(content);
    }

    // Plain text
    return { text: content, elements: [] };
}

/**
 * Format an array of questions for template use, with version-specific answer ordering
 * @param {Array} questions - Array of question objects
 * @param {string|number} version - Version number being exported
 * @param {Array} versionList - List of all versions
 * @returns {Array} - Formatted questions
 */
function formatQuestionsWithVersion(questions, version, versionList) {
    return questions.map(question => formatQuestionWithVersion(question, version, versionList));
}

/**
 * Format a single question for template use, with version-specific answer ordering
 * @param {Object} question - Question object
 * @param {string|number} version - Version number being exported
 * @param {Array} versionList - List of all versions
 * @returns {Object} - Formatted question
 */
function formatQuestionWithVersion(question, version, versionList) {
    // Format the mark display (e.g., "[1 mark]" or "[2 marks]")
    const markText = question.marks
        ? `[${question.marks} mark${question.marks !== 1 ? 's' : ''}]`
        : '';

    // Process question content
    const questionContent = processContent(
        question.contentFormatted || question.contentText || ''
    );

    // Determine which shuffle map to use based on version
    const versionIndex = versionList ? versionList.indexOf(parseInt(version)) : 0;
    const shuffleMap = question.answerShuffleMaps?.[versionIndex] || [...Array(question.answers?.length || 0).keys()];

    // Format answers using the appropriate shuffle map for this version
    const formattedAnswers = [];

    if (question.answers && question.answers.length > 0) {
        // Use the shuffle map to reorder answers
        shuffleMap.forEach((originalIndex, newIndex) => {
            const answer = question.answers[originalIndex];
            if (answer) {
                const answerContent = processContent(
                    answer.contentFormatted || answer.contentText || ''
                );

                // Only include non-empty answers
                if (answerContent.text.trim()) {
                    // Use letters for answer labels (A, B, C, etc.)
                    const label = String.fromCharCode(65 + newIndex);
                    formattedAnswers.push({
                        label: label,
                        text: answerContent.text,
                        elements: answerContent.elements,
                        isCorrect: answer.correct || false
                    });
                }
            }
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

    examData.examBody.forEach(item => {
        if (item.type === 'section') {
            // Add questions in this section
            count += (item.questions || []).length;
        } else if (item.type === 'question') {
            // Standalone question
            count += 1;
        }
    });

    return count;
}

/**
 * Calculate the total marks for the exam
 * @param {Object} examData - Exam data from Redux store
 * @returns {number} - Total marks
 */
function calculateTotalMarks(examData) {
    let totalMarks = 0;

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

    return totalMarks;
}

