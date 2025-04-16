// examUtils.js

// Create a new exam (replaces the constructor)
export const createExam = (examTitle, courseCode, courseName, semester, year) => {
    return {
      examTitle,
      courseCode,
      courseName,
      semester,
      year,
      versions: [1, 2, 3, 4], // Default versions
      teleformOptions: ['a', 'b', 'c', 'd', 'e'], // Default options
      coverPage: null,
      examBody: [],
      appendix: null,
      metadata: [],
    };
  };
  
 export const createMarkingKey = (exam) => {
    //Takes an exam object and generates a marking key object
 }