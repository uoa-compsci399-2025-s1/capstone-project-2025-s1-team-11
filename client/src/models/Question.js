// src/models/Question.js

export class Question {
    constructor(id, questionText, answer, options = []) {
        this.id = id;
        this.questionText = questionText;
        this.answer = answer;
        this.options = options;
    }

    toObject() {
        return {
            id: this.id,
            questionText: this.questionText,
            answer: this.answer,
            options: this.options,
        };
    }

    static fromObject(obj) {
        return new Question(obj.id, obj.questionText, obj.answer, obj.options);
    }
}