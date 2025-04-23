// examUtils.js

const DEFAULT_COMPONENT_PROPS = {
  type: 'content',
  contentFormatted: '',
  format: 'HTML',
  contentText: '', //This is the text only content for table display
}

// Create a new exam
export const createExam = (overrides = {}) => ({
  type: 'exam',
  examTitle: '',
  courseCode: '',
  courseName: '',
  semester: '',
  year: '',
  versions: [1, 2, 3, 4], // Default versions
  teleformOptions: ['a', 'b', 'c', 'd', 'e'], // Default options
  coverPage: null,
  examBody: [],
  appendix: null,
  metadata: [],
  ...overrides,
});


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
  // [1, 0, 0, 0, 0] indicates answer only at answers[0] is correct
  lockedPositionsMap = [ -1, -1, -1, -1, -1], 
  // [ -1, -1, -1, -1, 0] indicates answer[0] ('a') always maps to index 4 ('e') even after shuffling
  answerShuffleMaps = [
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3, 4],
  ],
  // e.g. [1, 2, 3, 4, 0],... answer[0] (original 'a') to appear at index 4 (now 'e'), 
  // and answer[1] (original 'b') to appear at index 0 (now 'a').
  contentText = '',
  ...overrides
} = {}) => ({
  ...createExamComponent({
      type: 'question',
      contentText,
      ...overrides,
  }),
  questionNumber,
  marks,
  answers,
  correctAnswers,
  lockedPositionsMap,
  answerShuffleMaps,
})

