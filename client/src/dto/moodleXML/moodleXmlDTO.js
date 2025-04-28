export class MoodleXmlDTO {
    constructor(questions) {
        this.questions = questions; // Array of QuestionXmlDTO
    }

    // Parse an XML string and return a MoodleXmlDTO instance
    static fromXML(xmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlString, "application/xml");
        const quizElem = doc.getElementsByTagName("quiz")[0];
        if (!quizElem) {
            throw new Error("Invalid XML: missing <quiz> element");
        }
        const questionElems = quizElem.getElementsByTagName("question");
        const questions = Array.from(questionElems).map((elem) =>
            QuestionXmlDTO.fromXMLElement(elem)
        );
        return new MoodleXmlDTO(questions);
    }
}

export class QuestionXmlDTO {
    constructor(type, name, questionText, generalFeedback, answers, images) {
        this.type = type;           // e.g., "multichoice", "truefalse", etc.
        this.name = name;           // Question name/title
        this.questionText = questionText; // The question text
        this.generalFeedback = generalFeedback; // General feedback for the question
        this.answers = answers;     // Array of AnswerXmlDTO
        this.images = images;       // Array of ImageDTO
    }

    // Parse a <question> element into a QuestionXmlDTO instance
    static fromXMLElement(elem) {
        const type = elem.getAttribute("type") || "multichoice";
        const nameElem = elem.getElementsByTagName("name")[0];
        const name = nameElem ? nameElem.getElementsByTagName("text")[0].textContent : "";
        
        const questionTextElem = elem.getElementsByTagName("questiontext")[0];
        const questionText = questionTextElem ? questionTextElem.getElementsByTagName("text")[0].textContent : "";
        
        const generalFeedbackElem = elem.getElementsByTagName("generalfeedback")[0];
        const generalFeedback = generalFeedbackElem ? generalFeedbackElem.getElementsByTagName("text")[0].textContent : "";
        
        const answerElems = elem.getElementsByTagName("answer");
        const answers = Array.from(answerElems).map(AnswerXmlDTO.fromXMLElement);

        // Extract images from question text and general feedback
        const images = [];
        const questionImages = extractImages(questionText);
        const feedbackImages = extractImages(generalFeedback);
        images.push(...questionImages, ...feedbackImages);
        
        return new QuestionXmlDTO(type, name, questionText, generalFeedback, answers, images);
    }
}

export class AnswerXmlDTO {
    constructor(fraction, text, feedback, images) {
        this.fraction = fraction;   // Score fraction (e.g., 100 for correct, 0 for incorrect)
        this.text = text;           // Answer text
        this.feedback = feedback;   // Feedback for this specific answer
        this.images = images;       // Array of ImageDTO
    }

    // Parse an <answer> element into an AnswerXmlDTO instance
    static fromXMLElement(elem) {
        const fraction = parseFloat(elem.getAttribute("fraction") || "0");
        const text = elem.getElementsByTagName("text")[0].textContent;
        const feedbackElem = elem.getElementsByTagName("feedback")[0];
        const feedback = feedbackElem ? feedbackElem.getElementsByTagName("text")[0].textContent : "";
        
        // Extract images from answer text and feedback
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