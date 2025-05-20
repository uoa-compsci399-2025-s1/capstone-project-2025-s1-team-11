export function convertMoodleXmlDTOToJsonWithSections(moodleXmlDTO) {
    // Group questions by section (assuming first question in each section has a section title)
    const examBody = [];
    let currentSection = null;
    
    moodleXmlDTO.questions.forEach((question) => {
        // Check if this is a section header question
        if (question.type === 'description') {
            // Create new section
            currentSection = {
                type: 'section',
                contentFormatted: question.questionText,
                contentText: question.questionText.replace(/<[^>]*>/g, '').trim(), // Strip HTML tags for plain text
                format: 'HTML',
                sectionTitle: question.name,
                questions: []
            };
            examBody.push(currentSection);
        } else if (currentSection) {
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
                contentText: question.questionText.replace(/<[^>]*>/g, '').trim(), // Strip HTML tags for plain text
                format: 'HTML',
                pageBreakAfter: false,
                marks: marks,
                answers: question.answers.map((answer) => ({
                    type: 'answer',
                    contentFormatted: answer.text,
                    contentText: answer.text.replace(/<[^>]*>/g, '').trim(), // Strip HTML tags for plain text
                    format: 'HTML',
                }))
            });
        }
    });

    // If no sections were created, create a default section with all questions
    // if (examBody.length === 0) {
    //     const defaultSection = {
    //         type: 'section',
    //         contentFormatted: 'Default Section',
    //         format: 'HTML',
    //         pageBreakAfter: true,
    //         sectionTitle: 'Default Section',
    //         sectionNumber: 0,
    //         questions: moodleXmlDTO.questions.map((question, index) => {
    //             // Extract marks from question text if present
    //             let marks = 1;
    //             const marksMatch = question.questionText.match(/\[(\d+)\s*marks?\]/i);
    //             if (marksMatch) {
    //                 marks = parseInt(marksMatch[1]);
    //             }

    //             return {
    //                 type: 'question',
    //                 contentFormatted: question.questionText,
    //                 format: 'HTML',
    //                 pageBreakAfter: false,
    //                 questionNumber: index,
    //                 marks: marks,
    //                 answers: question.answers.map((answer) => ({
    //                     type: 'answer',
    //                     contentFormatted: answer.text,
    //                     format: 'HTML',
    //                     correct: answer.fraction > 0
    //                 }))
    //             };
    //         })
    //     };
    //     sections.push(defaultSection);
    // }
    return { 
        examBody: examBody 
    };
} 