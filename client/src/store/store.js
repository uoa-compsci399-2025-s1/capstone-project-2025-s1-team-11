import { configureStore } from "@reduxjs/toolkit";
import examReducer from "./exam/examSlice";
import examResultsReducer from '../store/exam/examResultsSlice';

export const store = configureStore({
  reducer: {
    exam: examReducer, // ← must be named `exam`
    examResults: examResultsReducer,
  },
});

// Make Redux store accessible in browser for debugging
if (process.env.NODE_ENV === 'development') {
  window.store = store;
}