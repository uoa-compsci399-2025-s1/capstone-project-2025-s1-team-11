/**
 * Generates formatted output for a student's results
 * @param {Object} studentResult - Student's results
 * @param {Object} examData - Exam data
 * @param includeFeedback - true or false, determines whether to include feedback in output
 * @returns {String} Formatted results
 */
export function generateResultOutput(studentResult, examData, includeFeedback = true) {
  let output = (examData.courseCode || "COURSE CODE MISSING") + "\n";
  output += `AUID: ${studentResult.studentId}\n`;
  output += `Name: ${studentResult.lastName.padEnd(12)} ${studentResult.firstName.padEnd(8)}\n`;
  output += `Version: ${studentResult.versionId}\n`;
  if (includeFeedback) {
    output += `Score: ${studentResult.totalMarks} / ${studentResult.maxMarks} Marks\n`;
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
