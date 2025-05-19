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
      }
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
    });

    // Finalize average calculation
    if (results.summary.totalStudents > 0) {
      results.summary.averageMark = results.summary.averageMark / results.summary.totalStudents;
    }
    
    // Handle edge case where no students were processed
    if (results.summary.lowestMark === Infinity) {
      results.summary.lowestMark = 0;
    }

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
    
    const maxMarks = examQuestion?.marks ?? 0; // Default to 1 mark if not specified
    const { isCorrect, marks: earnedMarks } = markQuestion(correctAnswer, studentAnswer, maxMarks);

    // Find the corresponding option text for both answers
    const findOptionText = (bitmask) => {
      // Convert bitmask to index (01->0, 02->1, 04->2, 08->3, 16->4)
      const index = Math.log2(bitmask);
      return examData?.teleformOptions?.[index] || 'None';
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
 * Compares a student answer to the correct answer using bitmask logic
 * @param {number} correctAnswer - e.g., 6
 * @param {number} studentAnswer - e.g., 4
 * @param {number} maxMarks - typically 1
 * @returns {Object} { isCorrect, marks }
 */
export function markQuestion(correctAnswer, studentAnswer, maxMarks = 0) {
  const isCorrect = (studentAnswer & correctAnswer) !== 0;
  return {
    isCorrect,
    marks: isCorrect ? maxMarks : 0
  };
}