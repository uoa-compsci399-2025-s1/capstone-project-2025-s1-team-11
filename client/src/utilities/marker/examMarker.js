import {readTeleform} from "./teleformReader.js";

/**
 * Processes teleform scan data and marks students' exams
 * @param examData
 * @param {String} teleformData - String containing teleform scan data
 * @param {Object} markingKey - The marker key (either legacy or enhanced)
 * @returns {Array} Results for each student
 */
export function markExams(examData, teleformData, markingKey) {
  const results = [];

  const studentEntries = readTeleform(teleformData);
  /*
    answerString : "0108080108010101041602160116161604160808"
    firstName : "BODNIHD"
    lastName : "VE"
    studentId : "483316245"
    versionId : "00000004"
   */
  studentEntries.forEach(({ studentId, firstName, lastName, versionId, answerString }) => {
    const studentResult = markStudentExam(
      studentId,
      firstName,
      lastName,
      versionId,
      answerString,
      markingKey,
      examData,
    );

    results.push(studentResult);
  });

  return results;
}


/**
 * Marks an individual student's exam
 * @param {String} studentId - Student ID
 * @param {String} firstName - First name
 * @param {String} lastName - Last name
 * @param {String} versionId - Version ID
 * @param {String} answerString - String containing answers
 * @param {Object|String} markingKey - Marking key
 * @param {Boolean} useLegacyKey - Flag indicating whether to use legacy key
 * @returns {Object} Student's results
 */
function markStudentExam(studentId, firstName, lastName, versionId, answerString, markingKey, examData) {
  const versionKey = markingKey[versionId];
  if (!versionKey) {
    throw new Error(`Marking key for version ${versionId} not found.`);
  }

  const examBody = Array.isArray(examData?.examBody) ? examData.examBody : [];

  const studentResult = {
    studentId,
    firstName,
    lastName,
    versionId,
    totalMarks: 0,
    maxMarks: 0,
    questions: []
  };

  console.log('versionId:', versionId);
  console.log('markingKey:', markingKey);
  console.log('versionKey:', versionKey);

  versionKey.questions.forEach((questionAnswerKey, index) => {
    console.log('questionKey:', questionAnswerKey);
    /*
    const rawAnswer = answerString.substring(index * 2, index * 2 + 2);
    const studentAnswer = parseInt(rawAnswer, 10);
    const validAnswer = isNaN(studentAnswer) ? 0 : studentAnswer;

    // Lookup actual question in examData to get marks
    const examQuestion = examBody.find(
      q => q?.type === 'question' && q?.questionNumber === questionKey.questionNumber
    );

    const maxMarks = examQuestion?.marks ?? 0;
    const isCorrect = (questionKey.correctBitmask & validAnswer) !== 0;
    const earnedMarks = isCorrect ? maxMarks : 0;

    studentResult.totalMarks += earnedMarks;
    studentResult.maxMarks += maxMarks;

    studentResult.questions.push({
      questionNumber: questionKey.questionNumber ?? index + 1,
      studentAnswer: validAnswer,
      studentAnswerLetter: bitmaskToLetter(validAnswer),
      correctAnswer: questionKey.correctBitmask,
      correctAnswerLetters: (questionKey.correctAnswers || []).map(a => a.letter),
      isCorrect,
      marks: earnedMarks,
      maxMarks,
      feedback: isCorrect
        ? questionKey.feedback?.correct ?? "Correct"
        : questionKey.feedback?.incorrect ?? "Incorrect"
    });

     */
  });



  return studentResult;
}

/**
 * Converts a bitmask to a letter or letters
 * @param {Number} bitmask - Bitmask representing selected answers
 * @returns {String} Corresponding letter(s)
 */
function bitmaskToLetter(bitmask) {
  if (bitmask === 0) return "None";

  const letters = [];
  const options = ['A', 'B', 'C', 'D', 'E'];

  for (let i = 0; i < options.length; i++) {
    if (bitmask & (1 << (options.length - 1 - i))) {
      letters.push(options[i]);
    }
  }

  return letters.join(', ');
}