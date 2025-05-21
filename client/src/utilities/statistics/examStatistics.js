/**
 * Exam Statistics Utility
 * Handles calculation of exam statistics and metrics
 */

/**
 * Calculates statistics from marked exam results
 * @param {Array} markedResults - Array of marked student results
 * @returns {Object} Statistics including summary and per-question stats
 */
export function calculateStatistics(markedResults) {
  const results = {
    summary: {
      totalStudents: 0,
      averageMark: 0,
      highestMark: 0,
      lowestMark: Infinity,
      passRate: 0
    },
    questionStats: {}
  };

  // Process each student's results
  markedResults.forEach(studentResult => {
    // Calculate percentage score for this student
    const percentageScore = (studentResult.totalMarks / studentResult.maxMarks) * 100;

    // Update summary statistics
    results.summary.totalStudents++;
    results.summary.averageMark += percentageScore;
    results.summary.highestMark = Math.max(results.summary.highestMark, percentageScore);
    results.summary.lowestMark = Math.min(results.summary.lowestMark, percentageScore);

    // Count passing students (>=50%)
    if (percentageScore >= 50) {
      results.summary.passRate++;
    }

    // Update question statistics
    studentResult.questions.forEach(question => {
      const qNum = question.questionNumber;
      
      // initialise question stats if not already done
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
    results.summary.passRate = (results.summary.passRate / results.summary.totalStudents) * 100;
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

  const scoreDistribution = (() => {
    // Calculate percentage scores
    const scores = markedResults.map(student => 
      (student.totalMarks / student.maxMarks) * 100
    );
    
    // Use fixed 10% bins
    const binWidth = 10;
    const numBins = 10; // 0-10, 10-20, ..., 90-100
    
    // Create bins
    return Array.from({ length: numBins }, (_, idx) => {
      const lower = idx * binWidth;
      const upper = lower + binWidth;
      const count = scores.filter(score => 
        score >= lower && (idx === numBins - 1 ? score <= upper : score < upper)
      ).length;
      return {
        range: `${lower}-${upper}%`,
        count: count,
      };
    });
  })();

  results.summary = {
    totalStudents: markedResults.length,
    averageMark: results.summary.averageMark.toFixed(1),
    passRate: results.summary.passRate.toFixed(1),
    highestMark: results.summary.highestMark.toFixed(1),
    lowestMark: results.summary.lowestMark.toFixed(1),
    scoreDistribution: scoreDistribution
  };

  return results;
}

/**
 * Formats statistics for display
 * @param {Object} statistics - Raw statistics object
 * @returns {Object} Formatted statistics ready for display
 */
export function formatStatistics(statistics) {
  return {
    summary: {
      ...statistics.summary,
      averageMark: statistics.summary.averageMark.toFixed(1)
    },
    questionStats: statistics.questionStats
  };
} 