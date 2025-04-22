import { configureStore } from '@reduxjs/toolkit';
import examReducer from '../store/exam/examSlice';

export const store = configureStore({
  reducer: {
    exam: examReducer,
    // add more reducers here if needed
  },
});
