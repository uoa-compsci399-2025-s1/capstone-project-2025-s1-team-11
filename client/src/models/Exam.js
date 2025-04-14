
import ExamComponent from './ExamComponent.js';
import Section from './Section.js';
import Question from './Question.js';

export default class Exam {
    constructor(examTitle, courseCode, courseName, semester, year) {
        this.examTitle = examTitle;
        this.courseCode = courseCode;
        this.courseName = courseName;
        this.semester = semester;
        this.year = year;

        this.versions = [ 1, 2, 3, 4];
        this.teleformAnswers = [ 'a', 'b', 'c', 'd', 'e'];

        this.coverPage = null; //ExamComponent
        this.examBody = []; //Array of ExamComponents
        this.appendix = null; //ExamComponent
        this.metadata = []; //Other data not used UI or logic
        //this.markingKey = []; // markingKey[questionNo][correctAnswerMap, marks], e.g. [[1045, 1],[0342, 1.5], ... ]
    }

    getQuestion(questionNo) {
        // Traverses examBody to return the specified question object.
    }

    getNoOfQuestions() {
        // Traverses examBody and returns the count of questions in the examBody.
    }

    toJSON() {
        // Serialise exam object to plain text
        const examObj = {
            examTitle: this.examTitle,
            courseCode: this.courseCode,
            courseName: this.courseName,
            semester: this.semester,
            year: this.year,
            coverPage: this.coverPage ? this.coverPage.toJSON() : null,
            examBody: this.examBody.map(component => component.toJSON()),
            appendix: this.appendix ? this.appendix.toJSON() : null,
            metadata: this.metadata,
            markingKey: this.markingKey
        }

        return examObj; // Pretty print with 2-space indentation
    }

    static fromJSON(data) {
        const exam = new Exam(
            data.examTitle,
            data.courseCode,
            data.courseName,
            data.semester,
            data.year
        )

        exam.coverPage = data.coverPage ? ExamComponent.fromJSON(data.coverPage) : null;

        exam.examBody = (data.examBody || []).map(componentData => {
            switch (componentData.type) {
                case 'Section' :
                    return Section.fromJSON(componentData);
                case 'Question' :
                    return Question.fromJSON(componentData);
                case 'Content':
                default:
                    if (componentData.type !== 'content') {
                        console.warn('Unknown component type:', componentData.type);
                    }
                    return ExamComponent.fromJSON(componentData);
            }
        })

        exam.appendix = data.appendix ? ExamComponent.fromJSON(data.appendix) : null;

        exam.metadata = data.metadata || [];
        exam.markingKey = data.markingKey || [];

        return exam;
    }

}