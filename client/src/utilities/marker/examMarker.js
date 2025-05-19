import {readTeleform} from "./teleformReader.js";
import { setResults, setLoading, setError } from '../../store/exam/examResultsSlice.js';
import { store } from '../../store/store.js';

/**
 * Processes teleform scan data and marks students' exams
 * @param examData
 * @param {String} teleformData - String containing teleform scan data
 * @param {Object} markingKey - The marker key (either legacy or enhanced)
 * @returns {Object} Results for each student
 */
export function markExams(examData, teleformData, markingKey) {
  try {
    store.dispatch(setLoading());

    const results = {
      all: [],                  // Maintain ordered array of all results
      byStudentId: {},         // Map of results indexed by studentId
      summary: {
        totalStudents: 0,
        averageMark: 0,
        highestMark: 0,
        lowestMark: Infinity
      },
      // Add question statistics
      questionStats: {}
    };

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
        firstName,
        lastName,
        versionId,
        answerString,
        markingKey,
        examData,
      );

      // Add to both array and lookup map
      results.all.push(studentResult);
      results.byStudentId[studentId] = studentResult;

      // Update summary statistics
      results.summary.totalStudents++;
      results.summary.averageMark += studentResult.totalMarks;
      results.summary.highestMark = Math.max(results.summary.highestMark, studentResult.totalMarks);
      results.summary.lowestMark = Math.min(results.summary.lowestMark, studentResult.totalMarks);

      // Update question statistics
      studentResult.questions.forEach(question => {
        const qNum = question.questionNumber;
        
        // Initialize question stats if not already done
        if (!results.questionStats[qNum]) {
          results.questionStats[qNum] = {
            totalAnswers: 0,
            correctCount: 0,
            incorrectCount: 0,
            answerFrequency: {
              "01": 0, // Option A
              "02": 0, // Option B
              "04": 0, // Option C
              "08": 0, // Option D
              "16": 0  // Option E
            },
            difficultyLevel: '',
            correctAnswer: question.correctAnswer
          };
        }
        
        // Increment counters
        results.questionStats[qNum].totalAnswers++;
        if (question.isCorrect) {
          results.questionStats[qNum].correctCount++;
        } else {
          results.questionStats[qNum].incorrectCount++;
        }
        
        // Increment answer frequency
        results.questionStats[qNum].answerFrequency[question.studentAnswer]++;
      });
    });

    // Finalize average calculation
    if (results.summary.totalStudents > 0) {
      results.summary.averageMark = results.summary.averageMark / results.summary.totalStudents;
    }
    
    // Handle edge case where no students were processed
    if (results.summary.lowestMark === Infinity) {
      results.summary.lowestMark = 0;
    }
    
    // Calculate difficulty levels for each question
    Object.keys(results.questionStats).forEach(qNum => {
      const stats = results.questionStats[qNum];
      const correctPercentage = (stats.correctCount / stats.totalAnswers) * 100;
      
      if (correctPercentage >= 80) {
        stats.difficultyLevel = 'Easy';
      } else if (correctPercentage >= 40) {
        stats.difficultyLevel = 'Medium';
      } else {
        stats.difficultyLevel = 'Hard';
      }
      
      stats.correctPercentage = correctPercentage.toFixed(1);
    });

    // Dispatch results to Redux store
    store.dispatch(setResults(results));
    return results;
  } catch (error) {
    store.dispatch(setError(error.message));
    throw error;
  }
}


/**
 * Marks an individual student's exam
 * @param {String} firstName - First name
 * @param {String} lastName - Last name
 * @param {String} versionId - Version ID
 * @param {String} answerString - String containing answers
 * @param {Object|String} markingKey - Marking key
 * @param {Boolean} useLegacyKey - Flag indicating whether to use legacy key
 * @returns {Object} Student's results
 */
function markStudentExam(firstName, lastName, versionId, answerString, markingKey, examData) {
  const versionKey = markingKey[versionId];
  if (!versionKey) {
    throw new Error(`Marking key for version ${versionId} not found.`);
  }

  const examBody = Array.isArray(examData?.examBody) ? examData.examBody : [];

  const studentResult = {
    firstName,
    lastName,
    versionId,
    totalMarks: 0,
    maxMarks: 0,
    questions: []        // Detailed information about each question
  };

  // Process the answer string into pairs of digits
  const studentAnswers = [];
  for (let i = 0; i < answerString.length; i += 2) {
    const twoDigits = answerString.substr(i, 2);
    studentAnswers.push(parseInt(twoDigits, 10) || 0);  // Keep as bitmask
  }

  // Process the version key into pairs of digits
  const correctAnswers = [];
  for (let i = 0; i < versionKey.length; i += 2) {
    const twoDigits = versionKey.substr(i, 2);
    correctAnswers.push(parseInt(twoDigits, 10) || 0);  // Keep as bitmask
  }

  // Mark each answer
  studentAnswers.forEach((studentAnswer, index) => {
    const correctAnswer = correctAnswers[index] || 0;
    
    // Find the corresponding question in examBody
    const examQuestion = examBody.find(
      q => q?.type === 'question' && q?.questionNumber === (index + 1)
    );
    
    const maxMarks = examQuestion?.marks ?? 1; // Default to 1 mark if not specified
    
    // Changed to support multiple correct answers (bitmask)
    // If correctAnswer is a bitmask (e.g. 6 = option B and C), 
    // then check if the student selected any of the correct options
    const isCorrect = (studentAnswer & correctAnswer) === studentAnswer && studentAnswer !== 0;
    const earnedMarks = isCorrect ? maxMarks : 0;

    // Find the corresponding option text for both answers
    const findOptionText = (bitmask) => {
      if (bitmask === 0) return 'None';
      
      // For multiple answers, build a string of options
      const options = [];
      if (bitmask & 1) options.push(examData?.teleformOptions?.[0] || 'A');
      if (bitmask & 2) options.push(examData?.teleformOptions?.[1] || 'B');
      if (bitmask & 4) options.push(examData?.teleformOptions?.[2] || 'C');
      if (bitmask & 8) options.push(examData?.teleformOptions?.[3] || 'D');
      if (bitmask & 16) options.push(examData?.teleformOptions?.[4] || 'E');
      
      return options.join(', ');
    };

    studentResult.totalMarks += earnedMarks;
    studentResult.maxMarks += maxMarks;
    
    studentResult.questions.push({
      questionNumber: index + 1,
      studentAnswer: formatBitmask(studentAnswer),  // Format as '01', '02', etc.
      studentAnswerLetter: findOptionText(studentAnswer),
      correctAnswer: formatBitmask(correctAnswer),  // Format as '01', '02', etc.
      correctAnswerLetter: findOptionText(correctAnswer),
      isCorrect,
      marks: earnedMarks,
      maxMarks,
      feedback: isCorrect ? "Correct" : "Incorrect"
    });
  });

  return studentResult;
}

/**
 * Formats a bitmask number as a two-digit string
 * @param {Number} bitmask - The bitmask value (1, 2, 4, 8, or 16)
 * @returns {String} Two-digit string representation ('01', '02', '04', '08', '16')
 */
function formatBitmask(bitmask) {
  return bitmask.toString().padStart(2, '0');
}

/**
 * Updates the correct answer for a specific question and remark exams
 * @param {Number} questionNumber - The question number to update
 * @param {String} newCorrectAnswer - The new correct answer
 * @param {Object} examData - The exam data
 * @param {String} teleformData - The teleform scan data
 * @param {Object} markingKey - The marking key
 */
export function updateCorrectAnswerAndRemark(questionNumber, newCorrectAnswer, examData, teleformData, markingKey) {
  // Update the marking key with the new correct answer
  const versionId = Object.keys(markingKey)[0]; // Assuming single version for now
  const keyArray = markingKey[versionId].split('');
  const answerIndex = (questionNumber - 1) * 2;
  keyArray[answerIndex] = newCorrectAnswer[0];
  keyArray[answerIndex + 1] = newCorrectAnswer[1];
  markingKey[versionId] = keyArray.join('');

  // Remark all exams with the updated key
  return markExams(examData, teleformData, markingKey);
}