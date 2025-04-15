// this is a placeholder straight out of Claude
// not sure how/if this works
// prob need to learn about how react and redux work then revisit


import { createSlice } from '@reduxjs/toolkit';
import { createExam, examFromJSON } from './examUtils';

const examSlice = createSlice({
  name: 'exam',
  initialState: null, // Or a default exam object
  reducers: {
    initializeExam: (state, action) => {
      const { examTitle, courseCode, courseName, semester, year } = action.payload;
      return createExam(examTitle, courseCode, courseName, semester, year);
    },
    updateExamDetails: (state, action) => {
      // Redux Toolkit allows "mutating" code in reducers using Immer
      return { ...state, ...action.payload };
    },
    setCoverPage: (state, action) => {
      state.coverPage = action.payload;
    },
    addExamComponent: (state, action) => {
      state.examBody.push(action.payload);
    },
    // Add more reducers for other operations
    loadExamFromJSON: (state, action) => {
      return examFromJSON(action.payload);
    }
  }
});

export const { 
  initializeExam, 
  updateExamDetails, 
  setCoverPage, 
  addExamComponent,
  loadExamFromJSON
} = examSlice.actions;

export default examSlice.reducer;