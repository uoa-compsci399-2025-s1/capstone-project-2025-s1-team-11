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

export const createExamComponent = ({
  type = 'ContentBlock',
  content = '',
  format = 'HTML',
} = {}) => ({
  type,
  content,
  format,
  pageBreakAfter: false,
})

export const createSection = ({
  content = '',
  format = 'HTML', 
  sectionTitle = '', 
  sectionNumber = null, 
  questions = [],
} = {}) => ({
  ...createExamComponent({
      type: 'Section',
      content,
      format,
  }),
  sectionTitle,
  sectionNumber,
  questions,
}); 

export const createQuestion = ({
  content = '', 
  format = 'HTML', 
  questionNumber = null, 
  marks = null, 
  answers = ['', '', '', '', ''],
  correctAnswers = [1, 0, 0, 0, 0], 
  lockedPositions = [ -1, -1, -1, -1, -1], 
  answerShuffleMap = [
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3, 4],
  ],
} = {}) => ({
  ...createExamComponent({
      type: 'Question',
      content,
      format,
  }),
  questionNumber,
  marks,
  answers,
  correctAnswers,
  lockedPositions,
  answerShuffleMap,
})

