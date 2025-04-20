// examUtils.js

const DEFAULT_COMPONENT_PROPS = {
  type: 'content',
  contentFormatted: '',
  format: 'HTML',
  contentText: '', //This is the text only content for table display
}

// Create a new exam (replaces the constructor)
export const createExam = (examTitle, courseCode, courseName, semester, year) => {
  return {
    type: 'exam',
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

export const shuffleAnswers = (exam) => {
  //shuffles answer sequence for all questions and versions of an exam
}

export const createExamComponent = (overrides = {}) => ({
  ...DEFAULT_COMPONENT_PROPS,
  ...overrides,
  pageBreakAfter: false,
})

export const createSection = ({
  sectionTitle = '', 
  sectionNumber = null, 
  questions = [],
  ...overrides
} = {}) => ({
  ...createExamComponent({
      type: 'section',
      ...overrides
  }),
  sectionTitle,
  sectionNumber,
  questions,
}); 

export const createQuestion = ({
  questionNumber = null, 
  marks = null, 
  answers = ['', '', '', '', ''],
  correctAnswers = [1, 0, 0, 0, 0], 
  lockedPositionsMap = [ -1, -1, -1, -1, -1], 
  answerShuffleMaps = [
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3, 4],
  ],
  ...overrides
} = {}) => ({
  ...createExamComponent({
      type: 'question',
      ...overrides
  }),
  questionNumber,
  marks,
  answers,
  correctAnswers,
  lockedPositionsMap,
  answerShuffleMaps,
})

