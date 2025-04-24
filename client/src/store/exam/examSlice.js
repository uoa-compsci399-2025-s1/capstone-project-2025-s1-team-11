// examSlice.js
// To do: 
// Add contentText <-> contentFormatted link function

import { createSlice } from '@reduxjs/toolkit';
import { 
  createExam, 
  createExamComponent,
  createSection, 
  createQuestion,
  createAnswer,
} from './examUtils';

import {
  removeQuestionHelper,
  renumberQuestions,
  renumberSections,
  normaliseAnswersToLength,
  normaliseAnswersPerTeleformOptions,
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

    addQuestion: (state, action) => {
      const { examBodyIndex, questionData } = action.payload;
      const examData = state.examData;
      if (!examData) return;
    
      const examBody = examData.examBody;
      const versionCount = examData.versions.length;
      const optionCount = examData.teleformOptions.length;
      
      const rawAnswers = questionData.answers || [];
      let answers = rawAnswers.map((ans, idx) =>
        createAnswer(
          typeof ans === 'string'
            ? { contentText: ans, correct: idx === 0 }
            : { ...ans, correct: idx === 0 }
        )
      );

      const normalisedAnswers = normaliseAnswersToLength(answers, optionCount);

      const newQuestion = createQuestion({
        ...questionData,
        answers: normalisedAnswers,
      });
    
      // Create default (non-shuffled) answerShuffleMaps
      newQuestion.answerShuffleMaps = Array.from({ length: versionCount }, () =>
        [...Array(optionCount).keys()]
      );
    
      // Add question to examBody or a section
      if (examBodyIndex != null && examBody[examBodyIndex]?.type === 'section') {
        examBody[examBodyIndex].questions.push(newQuestion);
      } else {
        examBody.push(newQuestion);
      }
    
      // Update numbering
      renumberQuestions(examBody);
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
    //update-question 0 0 "answers" "1|4|5"
    updateQuestion: (state, action) => {
      if (!state.examData.examBody) return;
      const { location, newData } = action.payload;
      const { examBodyIndex, questionsIndex } = location;
      const optionsCount = state.examData.teleformOptions.length;
      const container = state.examData.examBody?.[examBodyIndex];
      if (!container) return;
    
      if (questionsIndex !== undefined && container.type === 'section') {
        const question = container.questions[questionsIndex]
        //Object.assign(container.questions[questionsIndex], newData);
        Object.assign(question, newData);
        if (optionsCount !== question.answers.length) {
          question.answers = normaliseAnswersToLength(question.answers, optionCount);
        }
      } else if (container.type === 'question') {
        Object.assign(container, newData);
        if (optionsCount !== container.answers.length) {
          container.answers = normaliseAnswersToLength(container.answers, optionsCount);
        }
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
      const examBody = state.examData?.examBody;
      if (!examBody) return;
    
      // Cache source and destination references early
      const sourceIsInSection = 'questionsIndex' in source;
      const destIsInSection = 'questionsIndex' in destination;
    
      const sourceSection = sourceIsInSection ? examBody[source.examBodyIndex] : null;
      const destSection = destIsInSection ? examBody[destination.examBodyIndex] : null;
    
      // Store question to move
      let questionToMove;
      if (sourceIsInSection && sourceSection?.type === 'section') {
        questionToMove = sourceSection.questions[source.questionsIndex];
      } else {
        questionToMove = examBody[source.examBodyIndex];
      }
    
      if (!questionToMove) return;
    
      // First, safely remove the question
      if (sourceIsInSection && sourceSection?.type === 'section') {
        sourceSection.questions.splice(source.questionsIndex, 1);
      } else {
        examBody.splice(source.examBodyIndex, 1);
      }
    
      // Then insert it at destination
      if (destIsInSection && destSection?.type === 'section') {
        destSection.questions.splice(destination.questionsIndex, 0, questionToMove);
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
      removeQuestionHelper(state.examData.examBody, action.payload);
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
      normaliseAnswersPerTeleformOptions(state.examData);
    },

    // Generate answer shuffling for all questions
    regenerateShuffleMaps: (state) => {
      if (!state.examData) return;
    
      const versionCount = state.examData.versions?.length || 0;
    
      const shuffleInPlace = (arr) => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
      };
    
      const generateShuffleMap = (answers) => {
        //fixedPostion should describe where the current answer falls in the output
        const count = answers.length;
        const fixed = {};
        const movable = [];
    
        answers.forEach((ans, i) => {
          if (
            ans.fixedPosition !== null &&
            ans.fixedPosition >= 0 &&
            ans.fixedPosition < count
          ) {
            fixed[i] = ans.fixedPosition;
          } else {
            movable.push(i);
            if (ans.fixedPosition >= count) {
              ans.fixedPosition = null;  //Reset fixedPosition if beyond answers.length
            }
          }
        });
    
        shuffleInPlace(movable);
    
        const result = new Array(count).fill(null);
        let m = 0;
        for (let i = 0; i < count; i++) {
          result[i] = fixed[i] !== undefined ? fixed[i] : movable[m++];
        }
        return result;
      };
    
      const processQuestion = (question) => {
        if (!question.answers || !Array.isArray(question.answers)) return;
    
        question.answerShuffleMaps = Array.from({ length: versionCount }, () =>
          generateShuffleMap(question.answers)
        );
      };
    
      state.examData.examBody.forEach((item) => {
        if (item.type === 'section') {
          item.questions.forEach(processQuestion);
        } else if (item.type === 'question') {
          processQuestion(item);
        }
      });
    },
    
    importExamFromJSON: (state, action) => {
      state.examData = action.payload;
    },

    importExamStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    importExamSuccess: (state, action) => {
      const exam = action.payload;
      state.examData = exam;
      state.loading = false;
    },
    importExamFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    // setCurrentExam: (state, action) => {
    //   state.examData = action.payload;
    // }
  }
});

// Thunk for importing an exam
export const importExam = (exam) => async (dispatch) => {
  try {
    dispatch(importExamStart());
    
    dispatch(importExamSuccess(exam));
    return exam;
  } catch (error) {
    dispatch(importExamFailure(error.message));
    throw error;
  }
};



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
  regenerateShuffleMaps,
  importExamFromJSON,
  importExamStart,
  importExamSuccess,
  importExamFailure,  
} = examSlice.actions;

// Export reducer
export default examSlice.reducer;
