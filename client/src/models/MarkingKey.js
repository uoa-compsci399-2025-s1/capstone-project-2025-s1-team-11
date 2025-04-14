
export default class MarkingKey {
    constructor(exam) {
        this.examTitle = exam.examTitle;
        this.courseCode = exam.courseCode;
        this.courseName = exam.courseName;
        this.semester = exam.semester;
        this.year = exam.year;
        this.answerKeys = []; // Will hold answer keys for each version (1-4)
        this.marksKey = [];
        this.populateKeys(exam);
    }

    populateKeys(exam) {
        // This creates a entry in versionKeys for each exam version, then traverses the exam 
        // to populate the versionKeys with correct answer bitmasks.
        exam.versions.forEach(version => this.versionKeys.push(version));

        for (const version of exam.versions) {
            this.versionKeys[version] = [];
        }

        exam.examBody.forEach(component => {
            //traverse examBody ..to do
        })
    }
    
  }