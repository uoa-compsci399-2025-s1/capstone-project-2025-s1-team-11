import { Question } from "./Question.js";

export default class Exam {
    constructor(title, date, questions = []) {
        this.title = title;
        this.date = date;
        this.questions = questions; // array of Question instances
    }

    // Serialize the exam instance (and its questions) into a JSON string
    toJSON() {
        // Convert questions to plain objects first
        const examObj = {
            title: this.title,
            date: this.date,
            questions: this.questions.map(q => q.toObject()),
        };
        return JSON.stringify(examObj, null, 2); // Pretty print with 2-space indentation
    }

    // Create an Exam instance from a JSON string
    static fromJSON(jsonString) {
        const data = JSON.parse(jsonString);
        // Rebuild questions as Question instances
        const questions = data.questions.map(qData => Question.fromObject(qData));
        return new Exam(data.title, data.date, questions);
    }
}