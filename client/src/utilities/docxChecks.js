// client/src/utilities/docxChecks.js

//Stub WIP only.

export function importExamDocx(fileBuffer, mockFileName = '') {
    // Convert buffer to string so we can simulate based on filename
    const simulatedName = mockFileName.toLowerCase();

    if (simulatedName.includes('too_few_qs')) {
        throw new Error('Too few questions');
    }

    if (simulatedName.includes('too_many_qs')) {
        throw new Error('Too many questions');
    }

    if (simulatedName.includes('duplicate_question')) {
        throw new Error('Duplicate question');
    }

    if (simulatedName.includes('duplicate_answer_options')) {
        throw new Error('Duplicate answers');
    }

    if (simulatedName.includes('coloured_font')) {
        throw new Error('Unsupported formatting');
    }

    // Simulate a successful import
    return {
        examTitle: 'Mock Exam',
        examBody: Array(20).fill({ question: 'Sample' }),
    };
}