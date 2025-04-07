// src/dto/examXML.js

export class ExamXmlDTO {
    constructor(title, date, questions) {
        this.title = title;
        this.date = date;
        this.questions = questions; // Array of QuestionXmlDTO
    }

    // Parse an XML string and return an ExamXmlDTO instance
    static fromXML(xmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlString, "application/xml");
        const examElem = doc.getElementsByTagName("exam")[0];
        if (!examElem) {
            throw new Error("Invalid XML: missing <exam> element");
        }
        const title = examElem.getAttribute("title") || "Untitled Exam";
        const date = examElem.getAttribute("date") || new Date().toISOString();
        const questionElems = examElem.getElementsByTagName("question");
        const questions = Array.from(questionElems).map((elem) =>
            QuestionXmlDTO.fromXMLElement(elem)
        );
        return new ExamXmlDTO(title, date, questions);
    }
}

export class QuestionXmlDTO {
    constructor(id, text, options, answer) {
        this.id = id;
        this.text = text;       // The question text from the XML
        this.options = options; // Array of option strings
        this.answer = answer;
    }

    // Parse a <question> element into a QuestionXmlDTO instance
    static fromXMLElement(elem) {
        const id = elem.getAttribute("id") || null;
        const textElem = elem.getElementsByTagName("text")[0];
        const text = textElem ? textElem.textContent : "";
        const optionElems = elem.getElementsByTagName("option");
        const options = Array.from(optionElems).map(opt => opt.textContent);
        const answerElem = elem.getElementsByTagName("answer")[0];
        const answer = answerElem ? answerElem.textContent : "";
        return new QuestionXmlDTO(id, text, options, answer);
    }
}