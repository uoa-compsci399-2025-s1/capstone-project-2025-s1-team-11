// src/models/Exam.js

import { Question } from "./Question.js";

export default class Exam {
    constructor(title, date, questions = []) {
        this.title = title;
        this.date = date;
        this.questions = questions; // Array of Question instances
    }

    // Returns a formatted JSON string representing the exam
    toJSON() {
        const examObj = {
            title: this.title,
            date: this.date,
            questions: this.questions.map(q => q.toObject()),
        };
        return JSON.stringify(examObj, null, 2);
    }

    // Creates an Exam instance from a JSON string
    static fromJSON(jsonString) {
        const data = JSON.parse(jsonString);
        const questions = data.questions.map(qData => Question.fromObject(qData));
        return new Exam(data.title, data.date, questions);
    }
}