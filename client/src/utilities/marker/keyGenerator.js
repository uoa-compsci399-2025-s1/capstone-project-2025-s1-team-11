// utilities/keyGenerator.js

// Doesn't handle non-integer marks in either JSON (can fix) or legacy keys (limitation of legacy format)

//Example 'Teleform Scan Data' to test with:
//01387333331 BROWN        JOAN    11000000002 0416080216                                     
//01722222229 SMITH        BOB     11000000001 1616160201  

/**
 * Exam Marking Utility
 * Creates marker keys and provides functionality to mark student exams
 */

/**
 * Generates a marker key in both legacy and enhanced JSON formats
 * @param {Object} examData - The exam data object
 * @returns {Object} Object containing both marker key formats
 */
export function generateMarkingKeys(examData) {
    // Extract all questions from exam (both direct and in sections)
    const allQuestions = extractAllQuestions(examData.examBody);
    
    // Generate the legacy format marker key
    const legacyKey = generateLegacyMarkingKey(examData, allQuestions);
    
    // Generate the enhanced JSON format marker key
    const enhancedKey = generateEnhancedMarkingKey(examData, allQuestions);
    
    return {
      legacyKey,
      enhancedKey
    };
  }
  
  /**
   * Extracts all questions from an exam, including those in sections
   * @param {Object} examBody - The exam data object
   * @returns {Array} Array of all questions
   */
  function extractAllQuestions(examBody) {
    const questions = [];

    examBody.forEach(item => {
      if (item.type === 'question') {
        questions.push(item);
      } else if (item.type === 'section' && Array.isArray(item.questions)) {
        questions.push(...item.questions);
      }
    });
    
    // Sort by question number to ensure consistent ordering
    return questions.sort((a, b) => a.questionNumber - b.questionNumber);
  }
  
  /**
   * Generates a legacy format marker key
   * @param {Object} examData - The exam data object
   * @param {Array} allQuestions - Array of all questions
   * @returns {String} Legacy format marker key
   */
  function generateLegacyMarkingKey(examData, allQuestions) {
    let legacyKey = "Version,AnswerKey,NoOfMarks\n";
    
    // For each version
    for (let v = 0; v < examData.versions.length; v++) {
      const versionNumber = examData.versions[v];
      const versionId = padWithZeros(versionNumber, 9);
      
      let answerKeyPart = "";
      let marksPart = "";
      
      // For each question
      allQuestions.forEach(question => {
        // Find the correct answer's position in this version
        const correctAnswerMask = getCorrectAnswerMaskForVersion(question, v);
        answerKeyPart += padWithZeros(correctAnswerMask, 2);
        
        // Add marks (2 digits)
        marksPart += padWithZeros(question.marks, 2);
      });
      
      legacyKey += `${versionId},${answerKeyPart},${marksPart}\n`;
    }
    
    return legacyKey;
  }
  
  /**
   * Calculates the correct answer bitmask for a question in a specific version
   * @param {Object} question - The question object
   * @param {Number} versionIndex - Index of the version (0-based)
   * @returns {Number} Bitmask representing correct answers
   */
  function getCorrectAnswerMaskForVersion(question, versionIndex) {
    // Get shuffle map for this version
    const shuffleMap = question.answerShuffleMaps[versionIndex];
    let bitmask = 0;
    
    // Check each answer position in this version
    for (let i = 0; i < question.answers.length; i++) {
      const originalAnswerIndex = shuffleMap.indexOf(i);
      
      // If this is a fixed position answer, use that instead
      const answer = question.answers[originalAnswerIndex];
      
      if (answer && answer.correct) {
        // Set the corresponding bit (from right to left: abcde -> 10000, 01000, etc.)
        bitmask |= (1 << (question.answers.length - 1 - i));
      }
    }
    
    return bitmask;
  }
  
  /**
   * Pads a number with leading zeros
   * @param {Number} num - The number to pad
   * @param {Number} length - The desired length
   * @returns {String} Padded number
   */
  function padWithZeros(num, length) {
    return num.toString().padStart(length, '0');
  }
  
  /**
   * Generates an enhanced JSON marker key with additional feedback
   * @param {Object} examData - The exam data object
   * @param {Array} allQuestions - Array of all questions
   * @returns {Object} Enhanced marker key in JSON format
   */
  function generateEnhancedMarkingKey(examData, allQuestions) {
    const enhancedKey = {
      examTitle: examData.examTitle,
      courseCode: examData.courseCode,
      courseName: examData.courseName,
      semester: examData.semester,
      year: examData.year,
      versions: []
    };
    
    // For each version
    for (let v = 0; v < examData.versions.length; v++) {
      const versionNumber = examData.versions[v];
      const versionKey = {
        versionNumber,
        questions: []
      };
      
      // For each question
      allQuestions.forEach(question => {
        const correctAnswers = [];
        const correctIndexes = [];
        
        // Get shuffle map for this version
        const shuffleMap = question.answerShuffleMaps[v];
        
        // Find correct answers for this version
        for (let i = 0; i < question.answers.length; i++) {
          const originalAnswerIndex = shuffleMap.indexOf(i);
          const answer = question.answers[originalAnswerIndex];
          
          if (answer && answer.correct) {
            // Convert index to teleform letter (0->a, 1->b, etc.)
            const letter = String.fromCharCode(97 + i); // 97 is ASCII for 'a'
            correctIndexes.push(i);
            correctAnswers.push({
              index: i,
              letter: letter.toUpperCase(),
              text: answer.contentText || answer.content
            });
          }
        }
        
        versionKey.questions.push({
          questionNumber: question.questionNumber,
          marks: question.marks,
          correctAnswers,
          correctIndexes,
          correctBitmask: getCorrectAnswerMaskForVersion(question, v),
          feedback: {
            correct: "Correct. Well Done!",
            incorrect: "Incorrect."
          }
        });
      });
      
      enhancedKey.versions.push(versionKey);
    }
    
    return enhancedKey;
  }
