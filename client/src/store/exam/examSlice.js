// this is a placeholder straight out of Claude
// not sure how/if this works
// prob need to learn about how react and redux work then revisit


// examSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { createExam, createSection, createQuestion } from './examUtils';

const initialState = {
  currentExam: null,
  examHistory: [],
  savedExams: [],
  isLoading: false,
  error: null
};

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    // Create a new exam
    createNewExam: (state, action) => {
      const { examTitle, courseCode, courseName, semester, year } = action.payload;
      state.currentExam = createExam(examTitle, courseCode, courseName, semester, year);
    },
    
    // Add a section to the current exam
    addSection: (state, action) => {
      if (!state.currentExam) return;
      
      const newSection = createSection(action.payload);
      state.currentExam.examBody.push(newSection);
    },
    
    // Add a question to a specific section
    addQuestion: (state, action) => {
      if (!state.currentExam) return;
      
      const { sectionIndex, questionData } = action.payload;
      const newQuestion = createQuestion(questionData);
      
      if (state.currentExam.examBody[sectionIndex]?.type === 'Section') {
        state.currentExam.examBody[sectionIndex].questions.push(newQuestion);
      }
    },
    
    // Update an existing question
    updateQuestion: (state, action) => {
      const { sectionIndex, questionIndex, questionData } = action.payload;
      
      if (state.currentExam?.examBody[sectionIndex]?.questions[questionIndex]) {
        state.currentExam.examBody[sectionIndex].questions[questionIndex] = {
          ...state.currentExam.examBody[sectionIndex].questions[questionIndex],
          ...questionData
        };
      }
    },
    
    // Save the current exam
    saveExam: (state) => {
      if (!state.currentExam) return;
      
      // Add to saved exams if it's not already there
      const examExists = state.savedExams.some(
        exam => exam.examTitle === state.currentExam.examTitle
      );
      
      if (!examExists) {
        state.savedExams.push({ ...state.currentExam });
      } else {
        // Update existing exam
        state.savedExams = state.savedExams.map(exam => 
          exam.examTitle === state.currentExam.examTitle 
            ? { ...state.currentExam } 
            : exam
        );
      }
      
      // Add to history
      state.examHistory.push({ 
        timestamp: new Date().toISOString(),
        examTitle: state.currentExam.examTitle
      });
    },
    
    // Generate answer shuffling for all questions
    generateAnswerShuffling: (state) => {
      if (!state.currentExam) return;
      
      // For each section and question, regenerate the answerShuffleMap
      state.currentExam.examBody.forEach(section => {
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
    }
  }
});

// Export actions
export const { 
  createNewExam, 
  addSection, 
  addQuestion, 
  updateQuestion, 
  saveExam,
  generateAnswerShuffling
} = examSlice.actions;

// Export reducer
export default examSlice.reducer;

// Selectors
export const selectCurrentExam = (state) => state.exam.currentExam;
export const selectSavedExams = (state) => state.exam.savedExams;
export const selectExamHistory = (state) => state.exam.examHistory;

export const selectExamSections = (state) => 
  state.exam.currentExam?.examBody.filter(item => item.type === 'Section') || [];

export const selectSectionQuestions = (state, sectionIndex) => 
  state.exam.currentExam?.examBody[sectionIndex]?.questions || [];

export const selectQuestionCount = (state) => {
  let count = 0;
  state.exam.currentExam?.examBody.forEach(section => {
    if (section.type === 'Section') {
      count += section.questions.length;
    }
  });
  return count;
};

export const selectExamVersions = (state) => state.exam.currentExam?.versions || [];