export function convertMoodleXmlDTOToJsonWithSections(moodleXmlDTO) {
    // Group questions by section (assuming first question in each section has a section title)
    const examBody = [];
    let currentSection = null;
    
    // Filter out category questions and only process actual questions
    const actualQuestions = moodleXmlDTO.questions.filter(question => question.type !== 'category');

    // Sort questions so that sections (description type) come first, then other questions
    // This ensures sections appear at the start of the exam regardless of XML order
    actualQuestions.sort((a, b) => {
        if (a.type === 'description' && b.type !== 'description') {
            return -1; // a (description) comes before b (non-description)
        }
        if (a.type !== 'description' && b.type === 'description') {
            return 1; // b (description) comes before a (non-description)
        }
        return 0; // maintain original order for questions of same type
    });

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
            // Extract marks - prioritize defaultgrade from XML, fallback to text-based detection
            let marks = question.defaultgrade || 1; // Use defaultgrade from XML if available
            
            // If no defaultgrade, try to extract from question text (legacy support)
            if (marks === 1) {
                const marksMatch = question.questionText.match(/\[(\d+(?:\.\d+)?)\s*marks?\]/i);
                if (marksMatch) {
                    marks = parseFloat(marksMatch[1]);
                }
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
                    correct: answer.fraction >= 50 // >= 50% fraction rounds to correct, otherwise incorrect
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