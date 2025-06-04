/**
 * Generates formatted output for a student's results
 * @param {Object} studentResult - Student's results
 * @param {Object} examData - Exam data
 * @param {boolean} includeFeedback - true or false, determines whether to include feedback in output
 * @param {number} totalExamMarks - Optional total marks for the entire exam (overrides studentResult.maxMarks)
 * @returns {String} Formatted results
 */
export function generateResultOutput(studentResult, examData, includeFeedback = true, totalExamMarks = null) {
  let output = (examData.courseCode || "COURSE CODE MISSING") + "\n";
  output += `AUID: ${studentResult.studentId}\n`;
  output += `Name: ${studentResult.lastName.padEnd(12)} ${studentResult.firstName.padEnd(8)}\n`;
  output += `Version: ${studentResult.versionId}\n`;
  if (includeFeedback) {
    const maxMarks = totalExamMarks !== null ? totalExamMarks : studentResult.maxMarks;
    output += `Score: ${studentResult.totalMarks} / ${maxMarks} Marks\n`;
  }
  output += "--------------------------------------------------------------------------\n";

  studentResult.questions.forEach(q => {
    output += "\n"
    output += `Question: ${q.questionNumber}\n`;
    output += `Your answer is: ${q.studentAnswerLetter}\n`;
    if (includeFeedback){
      output += `Feedback: ${q.feedback}\n`;
      output += `Mark: ${q.marks}\n`;
    }
  });

  return output;
}
