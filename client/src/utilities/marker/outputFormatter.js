/**
 * Generates formatted output for a student's results
 * @param {Object} studentResult - Student's results
 * @param {Object} examData - Exam data
 * @returns {String} Formatted results
 */
export function generateResultOutput(studentResult, examData) {
  let output = examData.courseCode || "COURSE CODE MISSING\n";
  output += `AUID: ${studentResult.studentId}\n`;
  output += `Name: ${studentResult.lastName.padEnd(12)} ${studentResult.firstName.padEnd(8)}\n`;
  output += `Version: ${studentResult.versionNumber}\n`;
  output += "--------------------------------------------------------------------------\n";

  studentResult.questions.forEach(q => {
    output += `Question: ${q.questionNumber}\n`;
    output += `Your answer is: ${q.studentAnswerLetter}\n`;
    output += `Feedback: ${q.feedback}\n`;
    output += `Mark: ${q.marks}\n`;
  });

  return output;
}
