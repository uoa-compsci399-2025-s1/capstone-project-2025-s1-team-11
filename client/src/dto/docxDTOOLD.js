// src/dto/docxDTOOLD.js

// to test: npx jest src/dto/__tests__/docxDTO.test.js

/**
 * Builds a structured JSON DTO from the provided DOM.
 * Extracts question text, supplemental content, answers, correct answer, and marks.
 *
 * @param {Document} doc – the DOM from parseDocxBuffer()
 * @returns {Object} DTO with title, date, and questions
 */
export function buildDocxDTO(doc) {
    const paragraphs = Array.from(doc.querySelectorAll('p'));
    const questions = [];

    let currentQuestion = null;
    let state = 'idle';
    let buffer = [];
    let consecutiveBlanks = 0;
    let supplementalBuffer = [];

    for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        const html = p.innerHTML.trim();
        const plain = p.textContent.trim();

        // Hard stop if two consecutive empty paragraphs
        if (!plain) {
            consecutiveBlanks++;
            if (consecutiveBlanks >= 2) break;
        } else {
            consecutiveBlanks = 0;
        }

        // Detect bookmark (start of a question)
        const hasBookmark = p.outerHTML.includes('bookmark');
        if (hasBookmark) {
            // Finalize previous question
            if (currentQuestion) {
                finalizeCurrentQuestion(currentQuestion, buffer);
                questions.push(currentQuestion);
            }

            // Start new question with any pending supplemental content
            currentQuestion = {
                sectionNo: null,
                questionNo: questions.length + 1,
                questionText: '',
                supplementalHtml: supplementalBuffer.join('\n'),
                marks: 1,
                answers: [],
                correctAnswers: []
            };
            supplementalBuffer = [];
            state = 'stem';
            buffer = [];
            continue;
        }

        if (!currentQuestion) {
            supplementalBuffer.push(`<p>${html}</p>`);
            continue;
        }

        if (state === 'stem') {
            // Detect [1 mark] to extract marks
            const markMatch = plain.match(/\[(\d+) mark/);
            if (markMatch) {
                currentQuestion.marks = parseInt(markMatch[1], 10);
            }

            if (plain && plain.length < 100 && /^[a-zA-Z0-9 ,\-\.\(\)"']+$/.test(plain)) {
                buffer.push(plain);
                state = 'answers';
            } else {
                currentQuestion.questionText += `<p>${html}</p>`;
            }
            continue;
        }

        if (state === 'answers') {
            if (!plain) {
                finalizeCurrentQuestion(currentQuestion, buffer);
                questions.push(currentQuestion);
                currentQuestion = null;
                state = 'idle';
            } else {
                buffer.push(plain);
            }
        }
    }

    // Final question
    if (currentQuestion) {
        finalizeCurrentQuestion(currentQuestion, buffer);
        questions.push(currentQuestion);
    }

    return {
        title: 'Imported DOCX Exam',
        date: new Date().toISOString().split('T')[0],
        questions,
    };
}

function finalizeCurrentQuestion(question, buffer) {
    question.answers = buffer.slice(0, 5);
    while (question.answers.length < 5) {
        question.answers.push('');
    }

    const lastIndex = question.answers.length - 1;
    const lastAnswer = question.answers[lastIndex].toLowerCase();
    const isAllOrNone = /(all|none).*above/.test(lastAnswer);

    question.correctAnswers = question.answers.map((_, idx) => {
        if (isAllOrNone) return idx === lastIndex ? 1 : 0;
        return idx === 0 ? 1 : 0;
    });
}
