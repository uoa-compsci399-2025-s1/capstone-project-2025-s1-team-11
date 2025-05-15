// utilities/keyGenerator.js

//Example 'Teleform Scan Data' to test with:
//01387333331 BROWN        JOAN    11000000002 0416080216
//01722222229 SMITH        BOB     11000000001 1616160201

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
        
        // Fixed bitmask calculation:
        // - Option A (index 0) = 01 (bit 0 set)
        // - Option B (index 1) = 02 (bit 1 set)
        // - Option C (index 2) = 04 (bit 2 set)
        // - Option D (index 3) = 08 (bit 3 set)
        // - Option E (index 4) = 16 (bit 4 set)
        const mask = correctIndexes.reduce((acc, i) => acc | (1 << i), 0);
        return String(mask).padStart(2, '0');
      })
      .join('');
  }

  return encodedKeys;
}