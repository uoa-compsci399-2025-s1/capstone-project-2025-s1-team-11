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
    const questions  = [];
    let currentQuestion = null;

    // Regexes to detect start of question
    const markRegex       = /^\[\s*\d+\s*mark\]/i;  // “[1 mark] …”
    const numberRegex     = /^Q\d+\./i;             // “Q1. …”
    const optionRegex     = /^[A-E]\./i;            // “A. …” through “E. …”

    for (const p of paragraphs) {
        const text = p.textContent.trim();
        // 1) New question?
        if (markRegex.test(text) || numberRegex.test(text)) {
            // commit the last one
            if (currentQuestion) questions.push(currentQuestion);

            // strip off the “[1 mark]” or “Q1.” prefix
            const stem = text
                .replace(markRegex, '')
                .replace(numberRegex, '')
                .trim();

            currentQuestion = {
                id:      `q${questions.length + 1}`,
                text:    stem,
                options: [],
                answer:  null,
            };

            // 2) Answer option?
        } else if (optionRegex.test(text) && currentQuestion) {
            const opt = text.replace(optionRegex, '').trim();
            currentQuestion.options.push(opt);
        }
    }

    // push the last question
    if (currentQuestion) questions.push(currentQuestion);

    return {
        title:     'Imported DOCX Exam',
        date:      new Date().toISOString().split('T')[0],
        questions,
    };
}