// src/dto/docxDTO.js

/**
 * Walks your converted HTML DOM and returns a JSON DTO:
 * {
 *   title: string,
 *   date:   YYYY-MM-DD,
 *   questions: [
 *     { id: 'q1', text: '...', options: [], answer: null },
 *     …
 *   ]
 * }
 *
 * @param {Document} doc – the DOM from parseDocxBuffer()
 */
export function buildDocxDTO(doc) {
    const paragraphs = Array.from(doc.querySelectorAll('p'));

    const questions = [];
    let currentQuestion = null;

    for (const p of paragraphs) {
        const html = p.innerHTML.trim();
        const plain = p.textContent.trim();

        // Detect start of new question (e.g., "Q1. ..." or "[1 mark] ..." etc)
        const isQuestionStart = /^Q\d+\./i.test(plain) || /^\[\d+ mark/.test(plain);

        const isOption = /^[A-E]\./.test(plain);

        if (isQuestionStart) {
            // Save previous question if exists
            if (currentQuestion) questions.push(currentQuestion);

            // Start a new question
            currentQuestion = {
                id: `q${questions.length + 1}`,
                content: `<p>${html}</p>`,  // This will accumulate full content
                options: [],
                answer: null,
            };
        } else if (isOption && currentQuestion) {
            const optionText = html.replace(/^[A-E]\.\s*/, '');
            currentQuestion.options.push(optionText);
        } else if (currentQuestion) {
            // Supporting content within the same question (e.g., images, tables, explanation)
            currentQuestion.content += `<p>${html}</p>`;
        }
    }

    // Push final question if not already
    if (currentQuestion) questions.push(currentQuestion);

    return {
        title: 'Imported DOCX Exam',
        date: new Date().toISOString().split('T')[0],
        questions,
    };
}