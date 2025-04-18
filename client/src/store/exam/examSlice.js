// examSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { 
  createExam, 
  createSection, 
  createQuestion,
  createExamComponent,
} from './examUtils';

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
      //state.examData = createExam(...action.payload);
      const { examTitle, courseCode, courseName, semester, year } = action.payload;
      state.examData = createExam(examTitle, courseCode, courseName, semester, year);
    },

    clearExam: (state) => {
      state.examData = null;
    },

    addSection: (state, action) => {
      if (!state.examData) return;
      
      const newSection = createSection(action.payload);
      state.examData.examBody.push(newSection);
    },
    
    // Add a question to end of section at examBody index otherwise end of examBody
    addQuestion: (state, action) => {
      if (!state.examData) return;
      
      const { examBodyIndex, questionData } = action.payload;
      const newQuestion = createQuestion(questionData);

      // should add check that target exists
      const target = state.examData.examBody[examBodyIndex];
      
      if (target.type === 'section') {
        state.examData.examBody[examBodyIndex].questions.push(newQuestion);
      } else {
        if (target.type === 'question') {
          state.examData.examBody.push(newQuestion);
        }                
      }
    },

    setCoverPage: (state, action) => {
      const { contentFormatted, format } = action.payload; //contentFormatted should be parsed from loaded file
      const coverPage = createExamComponent(contentFormatted, format);
      state.examData.coverPage = coverPage;  
    },

    setAppendix: (state, action) => {
      const { contentFormatted, format = 'HTML' } = action.payload; //contentFormatted should be parsed from loaded file
      const appendix = createExamComponent(contentFormatted, format);
      state.examData.appendix = appendix;  
    },

    removeCoverPage: (state) => {
      state.examData.coverPage = null;
    },

    removeAppendix: (state) => {
      state.examData.appendix = null;
    },

    updateQuestion: (state, action) => {
      const { location, newData } = action.payload; // location: { examBodyIndex, questionsIndex } or { examBodyIndex }
      // need to tidy up this function...
      target = state.examData[location.examBodyIndex]
      if ('questionsIndex' in location) {
        if (target.type === 'section') {
          target.questions[location.questionIndex] = {
          ...target.question[location.questionIndex],
          ...newData,
          };
        }
      } else if (target.type === 'question') {
        state.examData[location.examBodyIndex] = {
          ...target,
          ...newData,
        };
      }
    },

    updateSection: (state, action) => {
      const { examBodyIndex, newData } = action.payload;
      const section = state.examData.examBody[examBodyIndex];
      if (section && section.type === 'section') {
        state.examData.examBody[examBodyIndex] = {
          ...section,
          ...newData,
        }
      }
    },

    moveQuestionToSection: (state, action) => {
      const { fromIndex, toSectionIndex } = action.payload;
      const [question] = state.examData.examBody.splice(fromIndex, 1);
      const section = state.examData.examBody[toSectionIndex];
      if (question && section && section.type === 'section') {
        section.questions.push(question);
      }
    },

    moveQuestion: (state, action) => {
      const { from, to } = action.payload;
    
      // Get the source question
      let questionToMove;
    
      // Remove from section or top-level examBody
      if ('questionsIndex' in from) {
        const fromSection = state.examData.examBody[from.examBodyIndex];
        if (fromSection?.type === 'section') {
          questionToMove = fromSection.questions.splice(from.questionsIndex, 1)[0];
        }
      } else {
        questionToMove = state.examData.examBody.splice(from.examBodyIndex, 1)[0];
      }
    
      if (!questionToMove) return;
    
      // Insert into target location
      if ('questionsIndex' in to) {
        const toSection = state.examData.examBody[to.examBodyIndex];
        if (toSection?.type === 'section') {
          toSection.questions.splice(to.questionsIndex, 0, questionToMove);
        }
      } else {
        state.examData.examBody.splice(to.examBodyIndex, 0, questionToMove);
      }
    },

    removeSection: (state, action) => {
      const examBodyIndex = action.payload;
      state.examData.examBody.splice(examBodyIndex, 1);
      return;
    },

    removeQuestion: (state, action) => {
      const location = action.payload; // location: { examBodyIndex, questionsIndex } or { examBodyIndex }
      if ('questionsIndex' in location) {
        if (state.examData.examBody[location.examBodyIndex].type === 'section') {
          state.examData.examBody[location.examBodyIndex].questions.splice(location.questionsIndex, 1);
        }
      } else {
        if (state.examData.examBody[location.examBodyIndex].type === 'question') {
          state.examData.examBody.splice(location.examBodyIndex, 1);
        }
      }
      return;
    },

    updateExamField: (state, action) => {
      const allowedFields = ['examTitle', 'courseCode', 'courseName', 'semester', 'year'];
      const { field, value } = action.payload;
      if (allowedFields.includes(field)) {
        state.examData[field] = value;
      }
    },

    updateExamMetadata: (state, action) => {
      // does this allow updating exam fields like examTitle, courseCode etc.? 
      // or do those all need separate reducers?
      state.examData.metadata = {
        ...state.examData.metadata,
        ...action.payload
      };
    },

    setExamVersions: (state, action) => {
      // Payload should be an array of numbers or strings to ID versions
      state.examData.versions = action.payload; 
    },

    setTeleformOptions: (state, action) => {
      // Payload should be an array of option identifiers 'i.' or 'a)' etc. 
      state.examData.setTeleformOptions = action.payload;
    },
    // Generate answer shuffling for all questions
    shuffleAnswers: (state) => {
      if (!state.examData) return;
      
      // For each section and question, regenerate the answerShuffleMap
      state.examData.examBody.forEach(section => {
        if (section.type === 'Section') {
          section.questions.forEach(question => {
            // Generate random shuffling for each version (1-4)
            question.answerShuffleMap = Array(4).fill().map(() => {
              // Create a shuffled array [0,1,2,3,4]
              const shuffled = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5);
              
              // Handle locked positions
              question.lockedPositions.forEach((pos, idx) => {
                if (pos !== -1) {
                  // Find where the answer currently is in the shuffled array
                  const currentPos = shuffled.indexOf(idx);
                  // Swap to put it in the locked position
                  if (currentPos !== pos) {
                    const temp = shuffled[pos];
                    shuffled[pos] = shuffled[currentPos];
                    shuffled[currentPos] = temp;
                  }
                }
              });
              
              return shuffled;
            });
          });
        }
      });
    },
  }
});

// Export actions
export const { 
  //Building reducers
  createNewExam, 
  addSection, 
  addQuestion, 
  loadCoverPage, // supplied as document, add from file system via UI
  loadAppendix, // supplied as document, add from file system via UI
  //Modifying reducers
  updateQuestion, 
  updateSection,
  moveQuestionToSection,
  moveQuestion,
  removeSection,
  removeQuestion,
  removeCoverPage,
  removeAppendix,
  updateExamField,
  updateExamMetadata,
  setExamVersions,
  setTeleformOptions,
  clearExam,
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