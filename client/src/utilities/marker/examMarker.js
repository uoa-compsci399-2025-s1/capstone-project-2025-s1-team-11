import {readTeleform} from "./teleformReader.js";

/**
 * Processes teleform scan data and marks students' exams
 * @param {String} teleformData - String containing teleform scan data
 * @param {Object} markingKey - The marker key (either legacy or enhanced)
 * @param {Boolean} useLegacyKey - Flag indicating whether to use legacy key format
 * @returns {Array} Results for each student
 */
export function markExams(teleformData, markingKey, useLegacyKey = false) {
  const results = [];

  const studentEntries = readTeleform(teleformData);

  studentEntries.forEach(({ studentId, firstName, lastName, versionId, answerString }) => {
    const studentResult = markStudentExam(
      studentId,
      firstName,
      lastName,
      versionId,
      answerString,
      markingKey,
      useLegacyKey
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
function markStudentExam(studentId, firstName, lastName, versionId, answerString, markingKey, useLegacyKey) {

  const versionNumber = parseInt(versionId, 10);
  const result = {
    studentId,
    firstName,
    lastName,
    versionNumber,
    totalMarks: 0,
    maxMarks: 0,
    questions: []
  };

  let versionKey;
  let marks;

  // Get the marker key for this version
  if (useLegacyKey) {
    // Parse legacy key
    // Note need to add validation so teleform can't accept multiple answers otherwise '31' ticks all answers
    // which would be a way to get always correct.
    const legacyLines = markingKey.split('\n');
    const versionLine = legacyLines.find(line => {
      const firstField = line.split(",")[0];
      return parseInt(firstField, 10) === parseInt(versionId, 10);
    });
    if (!versionLine) {
      throw new Error(`Version ${versionNumber} not found in marking key`);
    }

    const parts = versionLine.split(',');
    const answerKey = parts[1];
    marks = parts[2];

    // Process each question (2 digits per question in legacy format)
    for (let q = 0; q < answerKey.length / 2; q++) {
      const correctBitmask = parseInt(answerKey.substring(q * 2, q * 2 + 2), 10);
      const questionMarks = parseInt(marks.substring(q * 2, q * 2 + 2), 10);
      const studentAnswer = parseInt(answerString.substring(q * 2, q * 2 + 2), 10);

      // Student gets the mark if any of their selected answers are correct
      const isCorrect = (correctBitmask & studentAnswer) !== 0;
      const feedbackText = isCorrect ? "Correct. Well Done!" : "Incorrect.";
      const questionMark = isCorrect ? questionMarks : 0;

      result.maxMarks += questionMarks;
      result.totalMarks += questionMark;
      const answerLetter = bitmaskToLetter(studentAnswer);

      result.questions.push({
        questionNumber: q + 1,
        studentAnswer,
        studentAnswerLetter: answerLetter,
        correctAnswer: correctBitmask,
        isCorrect,
        marks: questionMark,
        maxMarks: questionMarks,
        feedback: feedbackText
      });
    }
  } else {
    // Use enhanced JSON key
    versionKey = markingKey.versions.find(v => v.versionNumber === versionNumber);

    if (!versionKey) {
      throw new Error(`Version ${versionNumber} not found in marking key`);
    }

    // Process each question
    for (let q = 0; q < versionKey.questions.length; q++) {
      const questionKey = versionKey.questions[q];
      const studentAnswer = parseInt(answerString.substring(q * 2, q * 2 + 2), 10);

      const isCorrect = (questionKey.correctBitmask & studentAnswer) !== 0;
      const feedbackText = isCorrect ? questionKey.feedback.correct : questionKey.feedback.incorrect;
      const questionMark = isCorrect ? questionKey.marks : 0;

      result.maxMarks += questionKey.marks;
      result.totalMarks += questionMark;

      // Convert student answer to letter
      const answerLetter = bitmaskToLetter(studentAnswer);

      result.questions.push({
        questionNumber: questionKey.questionNumber,
        studentAnswer,
        studentAnswerLetter: answerLetter,
        correctAnswer: questionKey.correctBitmask,
        correctAnswerLetters: questionKey.correctAnswers.map(a => a.letter),
        isCorrect,
        marks: questionMark,
        maxMarks: questionKey.marks,
        feedback: feedbackText
      });
    }
  }

  return result;
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