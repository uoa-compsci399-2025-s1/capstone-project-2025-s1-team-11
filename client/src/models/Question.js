import ExamComponent from "./ExamComponent";

export default class Question extends ExamComponent{
    constructor({
        content = '', //Question Body
        format = 'HTML', 
        questionNumber = null, 
        marks = null, 
        answers = ['', '', '', '', ''],
        correctAnswers = [1, 0, 0, 0, 0], //First answer correct by default
        lockedPositions = [ -1, -1, -1, -1, -1], //-1 for unlocked 
        // e.g. [-1, -1, -1, 0, 1] locks answers at index 0 and 1 to indexes 3 and 4
        answerShuffleMap = [
            [0, 1, 2, 3, 4],
            [0, 1, 2, 3, 4],
            [0, 1, 2, 3, 4],
            [0, 1, 2, 3, 4],
        ], // Randomisation map per version.  Default is unshuffled.
    }) {
        super({componentType: 'Question', content, format }),

        this.questionNumber = questionNumber;
        this.marks = marks;
        this.answers = answers;
        this.correctAnswers = correctAnswers;
        this.lockedPositions = lockedPositions;
        this.answerShuffleMap = answerShuffleMap;
    } 

    toJSON() {

    }

    fromJSON() {
        return new Question(data);
    }

}