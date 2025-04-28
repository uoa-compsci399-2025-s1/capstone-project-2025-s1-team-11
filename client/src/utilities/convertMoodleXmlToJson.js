export function convertMoodleXmlDTOToJson(moodleXmlDTO) {
    // Convert all questions directly to the examBody array
    const examBody = moodleXmlDTO.questions.map((question, index) => {
        // Extract marks from question text if present
        let marks = 1;
        const marksMatch = question.questionText.match(/\[(\d+)\s*marks?\]/i);
        if (marksMatch) {
            marks = parseInt(marksMatch[1]);
        }

        return {
            type: 'question',
            contentFormatted: question.questionText,
            format: 'HTML',
            pageBreakAfter: false,
            questionNumber: index,
            marks: marks,
            answers: question.answers.map((answer) => ({
                type: 'answer',
                contentFormatted: answer.text,
                format: 'HTML',
                correct: answer.fraction > 0
            }))
        };
    });

    return {
        examBody: examBody
    };
} 