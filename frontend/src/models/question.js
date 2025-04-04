export class Question {
    constructor(id, questionText, answer, options = []) {
        this.id = id;
        this.questionText = questionText;
        this.answer = answer;
        this.options = options;
    }

    // Convert this question instance into a plain object
    toObject() {
        return {
            id: this.id,
            questionText: this.questionText,
            answer: this.answer,
            options: this.options,
        };
    }

    // Create a Question instance from a plain object
    static fromObject(obj) {
        return new Question(obj.id, obj.questionText, obj.answer, obj.options);
    }
}