// examUtils.js

const CURRENT_SCHEMA_VERSION = '1.0.0';

const DEFAULT_COMPONENT_PROPS = {
  type: 'content',
  contentFormatted: '',
  format: 'HTML',
}

// Create a new exam
export const createExam = (overrides = {}) => ({
  type: 'exam',
  schemaVersion: CURRENT_SCHEMA_VERSION, // Add schema version
  examTitle: '',
  courseCode: '',
  courseName: '',
  semester: '',
  year: '',
  versions: ['00000001', '00000002', '00000003', '00000004'], // Default versions
  teleformOptions: ['a', 'b', 'c', 'd', 'e'], // Default options
  examBody: [],
  ...overrides,
});

// Utility function to check if an exam needs migration
export const needsMigration = (examData) => {
  if (!examData.schemaVersion) return true;
  return examData.schemaVersion !== CURRENT_SCHEMA_VERSION;
};

// Utility function to migrate exam data to current version
export const migrateExam = (examData) => {
  if (!examData.schemaVersion) {
    // Migrate from pre-versioned schema
    return migrateFromLegacy(examData);
  }

  // Add future version migrations here
  switch (examData.schemaVersion) {
    // case '1.0.0':
    //   return migrateTo_1_1_0(examData);
    default:
      return examData;
  }
};

// Migrate from legacy (unversioned) format
const migrateFromLegacy = (examData) => {
  // Clone the exam data to avoid mutating the original
  const migratedExam = { ...examData };
  
  // Add schema version
  migratedExam.schemaVersion = CURRENT_SCHEMA_VERSION;
  
  // Add any missing fields that were introduced in 1.0.0
  if (!migratedExam.teleformOptions) {
    migratedExam.teleformOptions = ['a', 'b', 'c', 'd', 'e'];
  }
  
  // Ensure examBody is an array
  if (!Array.isArray(migratedExam.examBody)) {
    migratedExam.examBody = [];
  }

  return migratedExam;
};

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
  // shuffle map is created and managed by reducers
  ...overrides
} = {}) => ({
  ...createExamComponent({
      type: 'question',
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
  ...overrides
} = {}) => ({
  ...createExamComponent({
    type: 'answer',
    ...overrides,
  }),
  correct,
  fixedPosition,
});
