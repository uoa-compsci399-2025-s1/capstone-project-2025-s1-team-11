// examSlice.js

/*
 * Important: This module does not handle the file loading of exams, this is used to manage the exam state.
 * Do not use this module to load, close or import an exam. Use the hook.
 */

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
  coverPage: null,
  isLoading: false,
  error: null,
  fileName: null,
  messages: [],
};
const generateId = (() => {
  let counter = 1;
  return () => `id-${Date.now()}-${counter++}`;
})();

function ensureUniqueIds(examData) {
  const seen = new Set();

  examData.examBody.forEach((entry) => {
    if (!entry.id || seen.has(entry.id)) {
      entry.id = generateId();
    }
    seen.add(entry.id);

    if (entry.type === "section" && Array.isArray(entry.questions)) {
      entry.questions.forEach((q) => {
        if (!q.id || seen.has(q.id)) {
          q.id = generateId();
        }
        seen.add(q.id);
      });
    }
  });

  return examData;
}

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    initialiseExamState: (state, action) => {
      state.examData = createExam(action.payload || {});
      ensureUniqueIds(state.examData);
    },

    clearExamState: (state) => {
      state.examData = null;
    },

    clearExamBody: (state) => {
      if (state.examData) {
        state.examData.examBody = [];
      }
    },

    addSection: (state, action) => {
      if (!state.examData) { return; }
      const newSection = createSection(action.payload);
      newSection.id = generateId();
      state.examData.examBody.push(newSection);
      renumberSections(state.examData.examBody);
    },

    addQuestion: (state, action) => {
      if (!state.examData) { return; }
      const { examBodyIndex, questionData } = action.payload;

      const examData = state.examData;
      const examBody = examData.examBody;
      const versionCount = examData.versions.length;
      const optionCount = examData.teleformOptions.length;

      const rawAnswers = questionData.answers || [];
      let answers = rawAnswers.map((ans, idx) => {
        return createAnswer({ 
          contentFormatted: ans.contentFormatted,
          correct: idx === 0,
          fixedPosition: ans.fixedPosition ? ans.fixedPosition : null
        });
      });

      const normalisedAnswers = normaliseAnswersToLength(answers, optionCount);

      const newQuestion = createQuestion({
        id: questionData.id || generateId(),
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
      state.coverPage = action.payload;
    },

    setAppendix: (state, action) => {
      const { contentFormatted, format = 'HTML' } = action.payload;
      if (!state.examData) { return; }
      state.examData.appendix = createExamComponent(contentFormatted, format);
    },

    removeCoverPage: (state) => {
      state.coverPage = null;
    },

    removeAppendix: (state) => {
      if (!state.examData) { return; }
      state.examData.appendix = null;
    },
    //update-question 0 0 "answers" "1|4|5"
    updateQuestion: (state, action) => {
      if (!state.examData.examBody) { return; }
      const { location, newData } = action.payload;
      const { examBodyIndex, questionsIndex } = location;
      const optionsCount = state.examData.teleformOptions.length;
      const container = state.examData.examBody?.[examBodyIndex];
      if (!container) { return; }
    
      if (questionsIndex !== undefined && container.type === 'section') {
        const question = container.questions[questionsIndex]
        //Object.assign(container.questions[questionsIndex], newData);
        Object.assign(question, newData);
        if (optionsCount !== question.answers.length) {
          question.answers = normaliseAnswersToLength(question.answers, optionsCount);
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
      if (!examBody) { return; }
    
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
    
      if (!questionToMove) { return; }
    
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
      if (!examBody) { return; }
      const sectionToMove = examBody.splice(sourceIndex, 1)[0];
      examBody.splice(destIndex, 0, sectionToMove);
      renumberSections(examBody);
      renumberQuestions(examBody);
    },

    removeSection: (state, action) => {
      // Payload should be examBodyIndex of section to remove
      const examBody = state.examData?.examBody;
      if (!examBody) { return; }
      examBody.splice(action.payload, 1);
      renumberSections(examBody);
      renumberQuestions(examBody);
    },

    removeQuestion: (state, action) => {
      // Payload should be an object with examBodyIndex and questionsIndex
      if (!state.examData?.examBody) { return; }
      const { examBodyIndex, questionsIndex } = action.payload;
      removeQuestionHelper(state.examData.examBody, { examBodyIndex, questionsIndex });
      renumberQuestions(state.examData.examBody);
    },

    updateExamField: (state, action) => {
      if (!state.examData) { return; }
      const allowedProperties = [
        'examTitle', 
        'courseCode', 
        'courseName', 
        'semester', 
        'year',
        'versions',
        'teleformOptions'
      ];
      const { field, value } = action.payload;
      if (allowedProperties.includes(field)) {
        state.examData[field] = value;
      }
    },

    setExamVersions: (state, action) => {
      if (!state.examData) { return; }
      state.examData.versions = action.payload; 
    },

    setTeleformOptions: (state, action) => {
      // Payload should be an array of option identifiers 'i.' or 'a)' etc. 
      if (!state.examData) { return; }
      console.log("setTeleformOptions", action.payload);
      console.log("state.examData.teleformOptions", state.examData.teleformOptions);
      state.examData.teleformOptions = action.payload;
      normaliseAnswersPerTeleformOptions(state.examData);
    },

    // Generate answer shuffling for all questions
    // Note: answersShuffleMap[version][original index] = new index
    regenerateShuffleMaps: (state) => {
      if (!state.examData) { return; }
    
      const versionCount = state.examData.versions?.length || 0;
    
      const shuffleInPlace = (arr) => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
      };
    
      const generateShuffleMap = (answers) => {
        const count = answers.length;
        const fixed = {};
        const fixedPositions = new Set(); // Track which positions are taken
        const movable = [];
        const availablePositions = []; // Track which positions are still available
    
        // First pass: identify fixed positions and movable answers
        answers.forEach((ans, i) => {
          if (
            ans.fixedPosition !== null &&
            ans.fixedPosition >= 0 &&
            ans.fixedPosition < count
          ) {
            fixed[i] = ans.fixedPosition;
            fixedPositions.add(ans.fixedPosition);
          } else {
            movable.push(i);
            if (ans.fixedPosition >= count) {
              ans.fixedPosition = null;  // Reset fixedPosition if beyond answers.length
            }
          }
        });

        // Create list of available positions (those not fixed)
        for (let i = 0; i < count; i++) {
          if (!fixedPositions.has(i)) {
            availablePositions.push(i);
          }
        }

        // Shuffle the available positions
        shuffleInPlace(availablePositions);
    
        // Create the result array
        const result = new Array(count).fill(null);
        let availableIndex = 0;

        // Fill in fixed positions first
        for (let i = 0; i < count; i++) {
          if (fixed[i] !== undefined) {
            result[i] = fixed[i];
          }
        }

        // Then fill remaining positions with shuffled available positions
        for (let i = 0; i < count; i++) {
          if (result[i] === null) {
            result[i] = availablePositions[availableIndex++];
          }
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

    importExamStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    importExamSuccess: (state) => {
      state.isLoading = false;
    },
    importExamFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    addExamMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setFileName: (state, action) => {
      state.fileName = action.payload;
    },
    importMarkingKey: (state, action) => {
      if (!state.examData) return;
      
      const { versions, questionMappings, markWeights } = action.payload;
      
      // Update exam versions if needed
      if (versions && versions.length > 0) {
        state.examData.versions = versions;
      }
      
      // Go through each question in the exam and update based on marking key
      const examBody = state.examData.examBody;
      if (!examBody) return;
      
      // Helper function to update a question
      const updateQuestionWithMarkingKey = (question, questionNumber) => {
        // Skip if no mapping for this question
        if (!questionMappings[questionNumber]) return;
        
        // Update marks if available
        if (markWeights[questionNumber]) {
          question.marks = markWeights[questionNumber];
        }
        
        // Update shuffle maps and correct answers for each version
        const answerShuffleMaps = [];
        const versionCount = versions.length;
        
        // Initialize all answers as incorrect
        question.answers.forEach(answer => {
          answer.correct = false;
        });
        
        // For each version, create a shuffle map
        for (let versionIndex = 0; versionIndex < versionCount; versionIndex++) {
          const versionId = versions[versionIndex];
          const mappingData = questionMappings[questionNumber][versionId];
          
          if (mappingData) {
            answerShuffleMaps[versionIndex] = mappingData.shuffleMap;
            
            // Set correct answers for the first version (original)
            if (versionIndex === 0) {
              // The shuffle map represents map[originalIndex] = newIndex
              // So if position 1 is correct, we need to find which original index maps to position 1
              mappingData.correctAnswerIndices.forEach(correctIndex => {
                // Find which original answer maps to this correct position
                for (let i = 0; i < mappingData.shuffleMap.length; i++) {
                  if (mappingData.shuffleMap[i] === correctIndex) {
                    question.answers[i].correct = true;
                  }
                }
              });
            }
          }
        }
        
        // Update the shuffle maps
        question.answerShuffleMaps = answerShuffleMaps;
      };
      
      // Process each item in exam body
      examBody.forEach(item => {
        if (item.type === 'question') {
          updateQuestionWithMarkingKey(item, item.questionNumber.toString());
        } else if (item.type === 'section' && item.questions) {
          item.questions.forEach(question => {
            updateQuestionWithMarkingKey(question, question.questionNumber.toString());
          });
        }
      });
    },
  }
});

// Export actions
export const { 
  initialiseExamState,
  clearExamState,
  clearExamBody,
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
  setExamVersions,
  setTeleformOptions,
  regenerateShuffleMaps,
  importExamStart,
  importExamSuccess,
  importExamFailure,  
  addExamMessage,
  setFileName,
  importMarkingKey
} = examSlice.actions;

// Export reducer
export default examSlice.reducer;
