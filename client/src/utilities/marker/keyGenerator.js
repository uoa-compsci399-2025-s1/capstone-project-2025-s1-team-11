// utilities/keyGenerator.js

//Example 'Teleform Scan Data' to test with:
//01387333331 BROWN        JOAN    11000000002 0416080216                                     
//01722222229 SMITH        BOB     11000000001 1616160201  

/**
 * Exam Marking Utility
 * Creates marker keys and provides functionality to mark student exams
 */

/**
 * Generates a simplified marking key containing only bitmasks and marks
 * for each version. Only used internally for marking.
 * @param {Object} examData - The structured exam object
 * @returns {Array} Array of versions [{ bitmasks: [], marks: [] }]
 */
export function generateMarkingKeys(examData) {
  const questions = extractAllQuestions(examData.examBody);

  return examData.versions.map((_, versionIndex) => {
    const bitmasks = questions.map(q => getCorrectAnswerBitmask(q, versionIndex));
    const marks = questions.map(q => q.marks);
    return { bitmasks, marks };
  });
}

/**
 * Extracts all questions from an exam body, including those inside sections.
 * @param {Array} examBody - The array of exam items
 * @returns {Array} Flattened list of all questions
 */
function extractAllQuestions(examBody) {
  return examBody
    .flatMap(item => item.type === 'question' ? [item] : item.questions || [])
    .sort((a, b) => a.questionNumber - b.questionNumber);
}

/**
 * Computes the correct answer bitmask for a question in a specific version.
 * @param {Object} question - The question object
 * @param {Number} versionIndex - Index of the version
 * @returns {Number} Bitmask of correct answers
 */
function getCorrectAnswerBitmask(question, versionIndex) {
  const map = question.answerShuffleMaps[versionIndex];
  let mask = 0;
  for (let i = 0; i < question.answers.length; i++) {
    const original = map.indexOf(i);
    const answer = question.answers[original];
    if (answer?.correct) {
      mask |= (1 << (question.answers.length - 1 - i));
    }
  }
  return mask;
}
