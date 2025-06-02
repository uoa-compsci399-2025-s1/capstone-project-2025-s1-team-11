export function convertMoodleXmlDTOToJsonWithSections(moodleXmlDTO) {
    // Group questions by section (assuming first question in each section has a section title)
    const examBody = [];
    let currentSection = null;
    
    // Filter out category questions and only process actual questions
    //const actualQuestions = moodleXmlDTO.questions.filter(question => question.type !== 'category');
    
    // Filter out category questions and only process actual questions
    const actualQuestions = moodleXmlDTO.questions.filter(question => question.type !== 'category');

    actualQuestions.forEach((question) => {
        // Check if this is a section header question
        if (question.type === 'description') {
            // Create new section
            currentSection = {
                type: 'section',
                contentFormatted: question.questionText,
                format: 'HTML',
                sectionTitle: question.name,
                questions: []
            };
            examBody.push(currentSection);
        } else if (question.type === 'multichoice' || question.type === 'truefalse' || question.type === 'calculatedmulti') {
            // Extract marks from question text if present
            let marks = 1;
            const marksMatch = question.questionText.match(/\[(\d+)\s*marks?\]/i);
            if (marksMatch) {
                marks = parseInt(marksMatch[1]);
            }

            // Add question to current section
            examBody.push({
                type: 'question',
                contentFormatted: question.questionText,
                format: 'HTML',
                pageBreakAfter: false,
                marks: marks,
                answers: question.answers.map((answer) => ({
                    type: 'answer',
                    contentFormatted: answer.text,
                    format: 'HTML',
                    correct: answer.fraction > 0
                }))
            });
        } else {
            // Skip unsupported question types
            console.log(`Skipping unsupported question type: ${question.type} (Question: ${question.name})`);
        }
    });

    return { 
        examBody: examBody 
    };
} 