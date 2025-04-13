import ExamComponent from "./ExamComponent";

export class Question extends ExamComponent{
    constructor(questionNumber, content, marks, answers) {
        this.questionNumber = questionNumber;
        this.marks = marks;
        this.content = questionBody;
        this.answer = answers;
        this.lockedPositions = [ -1, -1, -1, -1, -1];
        this.answerShuffleMap = [];
    }

    toJSON() {

    }

    fromJSON() {

    }

    // // Convert this question instance into a plain object
    // toObject() {
    //     return {
    //         id: this.id,
    //         questionText: this.questionText,
    //         answer: this.answer,
    //         options: this.options,
    //     };
    // }

    // // Create a Question instance from a plain object
    // static fromObject(obj) {
    //     return new Question(obj.id, obj.questionText, obj.answer, obj.options);
    // }
}