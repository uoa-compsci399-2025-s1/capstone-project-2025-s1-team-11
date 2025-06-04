export class MoodleXmlDTO {
    constructor(questions) {
        this.questions = questions; // Array of QuestionXmlDTO
    }

    // Parse an XML string and return a MoodleXmlDTO instance
    static fromXML(xmlString) {
        // console.log("=== Starting XML parsing ===");
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlString, "application/xml");
        const quizElem = doc.getElementsByTagName("quiz")[0];
        if (!quizElem) {
            console.error("No quiz element found!");
            throw new Error("Invalid XML: missing <quiz> element");
        }
        
        const questionElems = quizElem.getElementsByTagName("question");
        // console.log(`Found ${questionElems.length} question elements in XML`);
        
        const questions = [];
        Array.from(questionElems).forEach((elem, index) => {
            // console.log(`\n--- Processing question element ${index + 1} ---`);
            // console.log(`Question type: ${elem.getAttribute("type")}`);
            try {
                const question = QuestionXmlDTO.fromXMLElement(elem);
                // console.log(`Successfully parsed question: ${question.name}`);
                questions.push(question);
            } catch (error) {
                console.error(`Failed to parse question ${index + 1}:`, error);
                console.error("Question XML:", elem.outerHTML);
            }
        });
        
        // console.log(`\n=== Parsing complete. ${questions.length} questions successfully parsed ===\n`);
        return new MoodleXmlDTO(questions);
    }
}

export class QuestionXmlDTO {
    constructor(type, name, questionText, generalFeedback, answers, images) {
        this.type = type;           
        this.name = name;           
        this.questionText = questionText;
        this.generalFeedback = generalFeedback;
        this.answers = answers;     
        this.images = images;       
    }

    static fromXMLElement(elem) {
        // console.log("  Parsing question details:");
        const type = elem.getAttribute("type") || "multichoice";
        
        // Name parsing
        const nameElem = elem.getElementsByTagName("name")[0];
        // console.log("  - Name element found:", !!nameElem);
        // if (nameElem) {
        //     console.log("    Name XML:", nameElem.outerHTML);
        // }
        const name = nameElem ? nameElem.getElementsByTagName("text")[0].textContent : "";
        // console.log("  - Parsed name:", name);
        
        // Question text parsing
        const questionTextElem = elem.getElementsByTagName("questiontext")[0];
        // console.log("  - Question text element found:", !!questionTextElem);
        // if (questionTextElem) {
        //     console.log("    Question text XML:", questionTextElem.outerHTML);
        // }
        const questionText = questionTextElem ? questionTextElem.getElementsByTagName("text")[0].textContent : "";
        // console.log("  - Question text length:", questionText.length);
        
        // General feedback parsing
        const generalFeedbackElem = elem.getElementsByTagName("generalfeedback")[0];
        // console.log("  - General feedback element found:", !!generalFeedbackElem);
        const generalFeedback = generalFeedbackElem ? generalFeedbackElem.getElementsByTagName("text")[0].textContent : "";
        
        // Answer parsing
        const answerElems = elem.getElementsByTagName("answer");
        // console.log(`  - Found ${answerElems.length} answer elements`);
        const answers = [];
        Array.from(answerElems).forEach((answerElem, index) => {
            // console.log(`    Processing answer ${index + 1}`);
            try {
                const answer = AnswerXmlDTO.fromXMLElement(answerElem);
                answers.push(answer);
                // console.log(`    Answer ${index + 1} parsed successfully`);
            } catch (error) {
                console.error(`    Failed to parse answer ${index + 1}:`, error);
                console.error("    Answer XML:", answerElem.outerHTML);
                throw error; // Re-throw to catch in the main parsing
            }
        });

        // Image extraction
        const images = [];
        try {
            const questionImages = extractImages(questionText);
            const feedbackImages = extractImages(generalFeedback);
            images.push(...questionImages, ...feedbackImages);
            // console.log(`  - Extracted ${images.length} images`);
        } catch (error) {
            console.error("  - Failed to extract images:", error);
        }
        
        return new QuestionXmlDTO(type, name, questionText, generalFeedback, answers, images);
    }
}

export class AnswerXmlDTO {
    constructor(fraction, text, feedback, images) {
        this.fraction = fraction;   
        this.text = text;           
        this.feedback = feedback;   
        this.images = images;       
    }

    static fromXMLElement(elem) {
        // console.log("      Parsing answer details");
        const fraction = parseFloat(elem.getAttribute("fraction") || "0");
        // console.log("      - Answer fraction:", fraction);
        
        const textElem = elem.getElementsByTagName("text")[0];
        // console.log("      - Text element found:", !!textElem);
        if (!textElem) {
            console.error("      - Missing text element in answer");
            console.error("      - Answer XML:", elem.outerHTML);
            throw new Error("Missing text element in answer");
        }
        const text = textElem.textContent;
        // console.log("      - Answer text length:", text.length);
        
        const feedbackElem = elem.getElementsByTagName("feedback")[0];
        const feedback = feedbackElem ? feedbackElem.getElementsByTagName("text")[0].textContent : "";
        
        const images = [];
        const answerImages = extractImages(text);
        const feedbackImages = extractImages(feedback);
        images.push(...answerImages, ...feedbackImages);
        
        return new AnswerXmlDTO(fraction, text, feedback, images);
    }
}

export class ImageDTO {
    constructor(src, alt, width, height) {
        this.src = src;             // Image source (URL or base64 data)
        this.alt = alt;             // Alternative text
        this.width = width;         // Image width
        this.height = height;       // Image height
    }
}

// Helper function to extract images from HTML content
function extractImages(htmlContent) {
    const images = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const imgElements = doc.getElementsByTagName("img");
    
    Array.from(imgElements).forEach(img => {
        images.push(new ImageDTO(
            img.src,
            img.alt,
            img.width,
            img.height
        ));
    });
    
    return images;
} 