import ExamComponent from "./ExamComponent"

export class Section extends ExamComponent{
    constructor(content, format, sectionTitle = '', sectionNumber = null, questions = []) {
        super('Section', content, format)
        this.sectionTitle = sectionTitle;
        this.sectionNumber = sectionNumber;
        this.questions = questions;
    }

    getQuestion(index) {
        //returns question at index in questions or null if out of range
    }

}