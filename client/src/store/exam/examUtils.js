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
  versions: ['00000001', '00000002', '00000003', '00000004'], // Default versions
  teleformOptions: ['a', 'b', 'c', 'd', 'e'], // Default options
  coverPage: null,
  examBody: [],
  appendix: null,
  metadata: [],
  ...overrides,
});


export const createMarkingKey = () => {
  //Takes an exam object and generates a marking key object
}

export const shuffleAnswers = () => {
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
  marks = 1, 
  answers = [],
  contentText = '',
  // shuffle map is created and managed by reducers
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
})

export const createAnswer = ({
  correct = false,
  fixedPosition = null, // null means "not fixed"
  //feedback = '', if other than "incorrect" desired
  //note = '', e.g. "trick", "common mistake"
  contentText = '',
  ...overrides
} = {}) => ({
  ...createExamComponent({
    type: 'answer',
    contentText,
    ...overrides,
  }),
  correct,
  fixedPosition,
});
