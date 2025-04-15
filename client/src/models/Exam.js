
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

        this.versions = [ 1, 2, 3, 4]; //Randomised version ID's
        this.teleformOptions = [ 'a', 'b', 'c', 'd', 'e'];

        this.coverPage = null; //ExamComponent
        this.examBody = []; //Array of ExamComponents
        this.appendix = null; //ExamComponent
        this.metadata = []; //Other data not used UI or logic?
    }

    getQuestion(questionNo) {
        // Traverses examBody to return the specified question object.
    }

    getNoOfQuestions() {
        // Traverses examBody and returns the count of questions in the examBody.
    }

    toJSON() {
        // Serialise exam object to plain text
        return {
            examTitle: this.examTitle,
            courseCode: this.courseCode,
            courseName: this.courseName,
            semester: this.semester,
            year: this.year,
            versions: this.versions,
            teleformOptions: this.teleformOptions,
            coverPage: this.coverPage ? this.coverPage.toJSON() : null,
            examBody: this.examBody.map(component => component.toJSON()),
            appendix: this.appendix ? this.appendix.toJSON() : null,
            metadata: this.metadata,
        }
    }

    static fromJSON(data) {
        const exam = new Exam(
            data.examTitle,
            data.courseCode,
            data.courseName,
            data.semester,
            data.year,
        )

        exam.versions = data.versions;
        exam.teleformOptions = data.teleformOptions;

        exam.coverPage = data.coverPage ? ExamComponent.fromJSON(data.coverPage) : null;

        exam.examBody = (data.examBody || []).map(componentData => {
            switch (componentData.type) {
                case 'Section' :
                    return Section.fromJSON(componentData);
                case 'Question' :
                    return Question.fromJSON(componentData);
                case 'Content':
                default:
                    if (componentData.type !== 'Content') {
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