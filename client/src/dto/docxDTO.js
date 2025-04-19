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

    // console.log("=== RAW PARAGRAPH STRUCTURE ===");
    // for (const p of paragraphs) {
    //     console.log(p.textContent.trim());
    // }

    const questions = [];
    let currentQuestion = null;

    for (const p of paragraphs) {
        const text = p.textContent.trim();

        // 🟢 New question detected
        if (/^\[\d+ mark\]/i.test(text)) {
            if (currentQuestion) {
                questions.push(currentQuestion);
            }

            currentQuestion = {
                id: `q${questions.length + 1}`,
                text: text,
                options: [],
                answer: null, // optional: first option as correct
            };
        }

        // 🟡 Option for current question
        else if (currentQuestion && text.length > 0) {
            currentQuestion.options.push(text);

            // If this is the first option, assume it's the correct answer
            if (currentQuestion.options.length === 1) {
                currentQuestion.answer = text;
            }
        }
    }

    // Push the final question
    if (currentQuestion) {
        questions.push(currentQuestion);
    }

    return {
        title: 'Imported DOCX Exam',
        date: new Date().toISOString().split('T')[0],
        questions,
    };
}