// utilities/keyGenerator.js

//Example 'Teleform Scan Data' to test with:
//01387333331 BROWN        JOAN    11000000002 0416080216
//01722222229 SMITH        BOB     11000000001 1616160201

// The bitmask system works as follows:
// A = 01 (2^0 = 01)
// B = 02 (2^1 = 02)
// C = 04 (2^2 = 04)
// D = 08 (2^3 = 08)
// E = 16 (2^4 = 16)

/**
 * Converts correctAnswers object into a version-mapped Teleform string object.
 * @param {Object} correctAnswers - { [versionId: string]: { [questionIndex: number]: number[] } }
 * @returns {Object} - { [versionId]: encodedString }
 */
export function generateMarkingKey(correctAnswers) {
  const encodedKeys = {};

  for (const [versionId, questionMap] of Object.entries(correctAnswers)) {
    const sortedQuestions = Object.keys(questionMap)
      .map(Number)
      .sort((a, b) => a - b);

    encodedKeys[versionId] = sortedQuestions
      .map(qIndex => {
        const correctIndexes = questionMap[qIndex];
        const mask = correctIndexes.reduce((acc, i) => acc | (1 << i), 0);
        return String(mask).padStart(2, '0');
      })
      .join('');
  }

  return encodedKeys;
}