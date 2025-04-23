// examSlice.js
// To do: 
// Add contentText <-> contentFormatted link function

import { createSlice } from '@reduxjs/toolkit';
import { 
  createExam, 
  createSection, 
  createQuestion,
  createExamComponent,
} from './examUtils';

import {
  updateQuestionHelper,
  removeQuestionHelper,
  renumberQuestions,
  renumberSections,
} from './examHelpers';

const initialState = {
  examData: null,
  isLoading: false,
  error: null,
};

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    createNewExam: (state, action) => {
      if (state.examData) return;
      // Typical payload: { examTitle, courseCode, courseName, semester, year }
      state.examData = createExam(action.payload || {});
    },

    clearExam: (state) => {
      state.examData = null;
    },

    addSection: (state, action) => {
      if (!state.examData) return;
      const newSection = createSection(action.payload);
      state.examData.examBody.push(newSection);
      renumberSections(state.examData.examBody);
    },
    
    // Add a question to end of section at examBody index otherwise end of examBody
    addQuestion: (state, action) => {
      const { examBodyIndex, questionData } = action.payload; 
      //examBodyIndex is optional, for when adding to existing section
      const newQuestion = createQuestion(questionData);
      const examBody = state.examData?.examBody;

      if (!examBody) return;

      if (examBody[examBodyIndex]) {
        const target = examBody[examBodyIndex];
        if (target.type === 'section') {
          target.questions.push(newQuestion);
        }
      } else {
        examBody.push(newQuestion);
      }
      renumberQuestions(state.examData.examBody);
    },

    setCoverPage: (state, action) => {
      const { contentFormatted, format } = action.payload;
      if (!state.examData) return;
      state.examData.coverPage = createExamComponent(contentFormatted, format);
    },

    setAppendix: (state, action) => {
      const { contentFormatted, format = 'HTML' } = action.payload;
      if (!state.examData) return;
      state.examData.appendix = createExamComponent(contentFormatted, format);
    },

    removeCoverPage: (state) => {
      if (!state.examData) return;
      state.examData.coverPage = null;
    },

    removeAppendix: (state) => {
      if (!state.examData) return;
      state.examData.appendix = null;
    },

    updateQuestion: (state, action) => {
      if (!state.examData.examBody) return;
      const { location, newData } = action.payload;
      const { examBodyIndex, sectionIndex } = location;
      const container = state.examData.examBody?.[examBodyIndex];
      if (!container) return;
    
      if (sectionIndex !== undefined && container.type === 'section') {
        Object.assign(container.questions[sectionIndex], newData);
      } else if (container.type === 'question') {
        Object.assign(container, newData);
      }
    },

    updateSection: (state, action) => {
      const { examBodyIndex, newData } = action.payload;
      const section = state.examData?.examBody?.[examBodyIndex];
      if (section && section.type === 'section') {
        Object.assign(section, newData);
      }
    },

    moveQuestion: (state, action) => {
      const { source, destination } = action.payload;
      // expects { source: {examBodyIndex, questionsIndex}, destination {examBodyIndex, questionIndex} }
      // questionsIndex only required when moving from or to a section.
      const examBody = state.examData?.examBody;
      if (!examBody) return;
      let questionToMove;

      if ('questionsIndex' in source) {
        // Implies source question is in a section
        const sourceSection = examBody[source.examBodyIndex];
        if (sourceSection?.type === 'section') {
          questionToMove = sourceSection.questions.splice(source.questionsIndex, 1)[0];
        }
      } else {
        questionToMove = examBody.splice(source.examBodyIndex, 1)[0];
      }

      if (!questionToMove) return;

      if ('questionsIndex' in destination) {
        // Implies destination is a section
        const destSection = examBody[destination.examBodyIndex];
        if (destSection?.type === 'section') {
          destSection.questions.splice(destination.questionsIndex, 0, questionToMove);
        }
      } else {
        examBody.splice(destination.examBodyIndex, 0, questionToMove);
      }
      renumberQuestions(state.examData.examBody);
    },

    moveSection: (state, action) => {
      const { sourceIndex, destIndex } = action.payload;
      const examBody = state.examData?.examBody;
      if (!examBody) return;
      const sectionToMove = examBody.splice(sourceIndex, 1)[0];
      examBody.splice(destIndex, 0, sectionToMove);
      renumberSections(examBody);
      renumberQuestions(examBody);
    },

    removeSection: (state, action) => {
      // Payload should be examBodyIndex of section to remove
      const examBody = state.examData?.examBody;
      if (!examBody) return;
      examBody.splice(action.payload, 1);
      renumberSections(examBody);
      renumberQuestions(examBody);
    },

    removeQuestion: (state, action) => {
      // Payload should be examBodyIndex of section to remove
      if (!state.examData.examBody) return;
      removeQuestionHelper(state, action.payload);
      renumberQuestions(state.examData.examBody);
    },

    updateExamField: (state, action) => {
      const allowedFields = ['examTitle', 'courseCode', 'courseName', 'semester', 'year'];
      const { field, value } = action.payload;
      if (!state.examData) return;
      if (allowedFields.includes(field)) {
        state.examData[field] = value;
      }
    },

    updateExamMetadata: (state, action) => {
      if (!state.examData) return;
      if (!state.examData.metadata) state.examData.metadata = {};
      Object.assign(state.examData.metadata, action.payload);
    },

    setExamVersions: (state, action) => {
      if (!state.examData) return;
      state.examData.versions = action.payload; 
    },

    setTeleformOptions: (state, action) => {
      // Payload should be an array of option identifiers 'i.' or 'a)' etc. 
      if (!state.examData) return;
      state.examData.teleformOptions = action.payload;
    },

    // Generate answer shuffling for all questions
    shuffleAnswers: (state) => {
      if (!state.examData) return;
      
      // Process exam body items (both sections and directly included questions)
      state.examData.examBody.forEach(item => {
        if (item.type === 'section') {
          // Handle questions inside sections
          item.questions.forEach(question => {
            shuffleQuestionAnswers(question, state.examData.versions.length);
          });
        } else if (item.type === 'question') {
          // Handle questions directly in exam body
          shuffleQuestionAnswers(item, state.examData.versions.length);
        }
      });
      
      // Helper function to shuffle a single question's answers
      function shuffleQuestionAnswers(question, versionCount) {
        // Create a shuffle map for each version
        question.answerShuffleMaps = Array(versionCount).fill().map(() => {
          // Start with original order [0,1,2,3,4]
          const shuffled = [0, 1, 2, 3, 4];
          
          // Get positions that can be shuffled (those with -1 in lockedPositionsMap)
          const shufflableIndices = [];
          for (let i = 0; i < shuffled.length; i++) {
            if (question.lockedPositionsMap[i] === -1) {
              shufflableIndices.push(i);
            }
          }
          
          // Shuffle only the positions that can be shuffled
          for (let i = shufflableIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const indexI = shufflableIndices[i];
            const indexJ = shufflableIndices[j];
            [shuffled[indexI], shuffled[indexJ]] = [shuffled[indexJ], shuffled[indexI]];
          }
          
          // Make sure locked positions are enforced
          question.lockedPositionsMap.forEach((fixedPos, idx) => {
            if (fixedPos !== -1) {
              // If this position should be fixed to a specific place
              const currentPos = shuffled.indexOf(idx);
              if (currentPos !== fixedPos) {
                // Swap to put it in the correct position
                [shuffled[fixedPos], shuffled[currentPos]] = [shuffled[currentPos], shuffled[fixedPos]];
              }
            }
          });
          
          return shuffled;
        });
      }
    },

    importExamFromJSON: (state, action) => {
      state.examData = action.payload;
    },
  }
});


// Export actions
export const { 
  createNewExam, 
  clearExam,
  addSection, 
  addQuestion, 
  setCoverPage, // supplied as document, add from file system via UI
  setAppendix, // supplied as document, add from file system via UI
  removeCoverPage,
  removeAppendix,
  updateQuestion, 
  updateSection,
  moveQuestionToSection,
  moveQuestion,
  moveSection,
  removeQuestion,
  removeSection,
  updateExamField,
  updateExamMetadata,
  setExamVersions,
  setTeleformOptions,
  shuffleAnswers,
  importExamFromJSON,
} = examSlice.actions;

// Export reducer
export default examSlice.reducer;

// Selectors
// export const selectCurrentExam = (state) => state.exam.currentExam;
// export const selectSavedExams = (state) => state.exam.savedExams;
// export const selectExamHistory = (state) => state.exam.examHistory;

// export const selectExamSections = (state) => 
//   state.exam.currentExam?.examBody.filter(item => item.type === 'Section') || [];

// export const selectSectionQuestions = (state, sectionIndex) => 
//   state.exam.currentExam?.examBody[sectionIndex]?.questions || [];

// export const selectQuestionCount = (state) => {
//   let count = 0;
//   state.exam.currentExam?.examBody.forEach(section => {
//     if (section.type === 'Section') {
//       count += section.questions.length;
//     }
//   });
//   return count;
// };
//
// export const selectExamVersions = (state) => state.exam?.versions || [];