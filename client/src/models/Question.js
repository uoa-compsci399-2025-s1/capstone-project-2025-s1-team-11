import ExamComponent from "./ExamComponent";

export class Question extends ExamComponent{
    constructor(questionNumber, content, marks, answers) {
        this.questionNumber = questionNumber;
        this.marks = marks;
        this.content = questionBody;
        this.answer = answers;
        this.lockedPositions = [ -1, -1, -1, -1, -1];
        this.answerShuffleMap = [];
    } //revise above following Section example for optional parameters and super.

    toJSON() {

    }

    fromJSON() {
        return new Question(data);
    }

}