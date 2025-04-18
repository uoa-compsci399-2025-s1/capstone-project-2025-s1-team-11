import ExamComponent from "./ExamComponent"

export default class Section extends ExamComponent{
    constructor({
        content = '', //Section Body
        format = 'HTML', 
        sectionTitle = '', 
        sectionNumber = null, 
        questions = [],
    } = {}) {
        super({componentType: 'Section', content, format });
        this.sectionTitle = sectionTitle;
        this.sectionNumber = sectionNumber;
        this.questions = questions;
    }
    
    toJSON() {
        return {
            componentType: this.componentType,
            content: this.content,
            format: this.format,
            pageBreakAfter: this.pageBreakAfter,
            sectionTitle: this.sectionTitle,
            sectionNumber: this.sectionNumber,
            questions: this.questions.map(q => q.toJSON() ),
        }

    }

    static fromJSON(data) {
        return new Section({
            content: data.content,
            format: data.format,
            sectionTitle: data.sectionTitle,
            sectionNumber: data.sectionNumber,
            questions: (data.questions || []).map(q => Question.fromJSON(q)),
        });
    }

    getQuestion(index) {
        //Returns question at index in questions or null if out of range
        return this.questions[index] ?? null;
    }

}