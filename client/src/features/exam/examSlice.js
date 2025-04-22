// import { createSlice } from '@reduxjs/toolkit';

// const initialState = {
//   exams: [],
//   status: 'idle',
//   error: null,
// };

// export const examSlice = createSlice({
//   name: 'exam',
//   initialState,
//   reducers: {
//     // Synchronous actions:
//     examAdded: (state, action) => {
//       state.exams.push(action.payload);
//     },
//     examUpdated: (state, action) => {
//       const { id, data } = action.payload;
//       const existingExam = state.exams.find(exam => exam.id === id);
//       if (existingExam) {
//         Object.assign(existingExam, data);
//       }
//     },
//     examDeleted: (state, action) => {
//       state.exams = state.exams.filter(exam => exam.id !== action.payload);
//     },
//   },
// });

// export const { examAdded, examUpdated, examDeleted } = examSlice.actions;
// export default examSlice.reducer;
