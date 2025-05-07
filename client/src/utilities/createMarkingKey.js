// utilities/createMarkingKey.js
// Mostly out of claude. It made a marking script even though I didn't ask for it. The marking is a bit broken
// But this does produce a legacy marking key and a fancier JSON one.

// Doesn't handle non-integer marks in either JSON (can fix) or legacy keys (limitation of legacy format)

//Example 'Teleform Scan Data' to test with:
//01387333331 BROWN        JOAN    11000000002 0416080216                                     
//01722222229 SMITH        BOB     11000000001 1616160201  

/**
 * Exam Marking Utility
 * Creates marking keys and provides functionality to mark student exams
 */

/**
 * Generates a marking key in both legacy and enhanced JSON formats
 * @param {Object} examData - The exam data object
 * @returns {Object} Object containing both marking key formats
 */
function generateMarkingKeys(examData) {
    // Extract all questions from exam (both direct and in sections)
    const allQuestions = extractAllQuestions(examData.examBody);
    
    // Generate the legacy format marking key
    const legacyKey = generateLegacyMarkingKey(examData, allQuestions);
    
    // Generate the enhanced JSON format marking key
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
   * Generates a legacy format marking key
   * @param {Object} examData - The exam data object
   * @param {Array} allQuestions - Array of all questions
   * @returns {String} Legacy format marking key
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
   * Generates an enhanced JSON marking key with additional feedback
   * @param {Object} examData - The exam data object
   * @param {Array} allQuestions - Array of all questions
   * @returns {Object} Enhanced marking key in JSON format
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
  
  /**
   * Processes teleform scan data and marks students' exams
   * @param {String} teleformData - String containing teleform scan data
   * @param {Object} markingKey - The marking key (either legacy or enhanced)
   * @param {Boolean} useLegacyKey - Flag indicating whether to use legacy key format
   * @returns {Array} Results for each student
   */
  function markExams(teleformData, markingKey, useLegacyKey = false) {
    const results = [];
    
    // Split teleform data into lines
    const lines = teleformData.trim().split('\n');
    
    lines.forEach(line => {
      if (line.trim().length === 0) return;
      
      // Parse student data from line
      const studentId = line.substring(2, 11);
      const lastName = line.substring(12, 23).trim();
      const firstName = line.substring(23, 33).trim();
      const versionId = line.substring(35, 44);
      const answerString = line.substring(45).trim();
      
      // Mark this student using the appropriate key
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
    
    // Get the marking key for this version
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
  
  /**
   * Generates formatted output for a student's results
   * @param {Object} studentResult - Student's results
   * @param {Object} examData - Exam data
   * @returns {String} Formatted results
   */
  function generateResultOutput(studentResult, examData) {
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
  
  // Export utility functions
  export  {
    generateMarkingKeys,
    markExams,
    generateResultOutput
  };
