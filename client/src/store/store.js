import { configureStore } from "@reduxjs/toolkit";
import examReducer from "./exam/examSlice";
import examResultsReducer from '../store/exam/examResultsSlice';
import historyReducer from './history/historySlice';
import teleformReducer from './exam/teleformSlice';
import { historyMiddleware } from './history/historyMiddleware';

export const store = configureStore({
  reducer: {
    exam: examReducer, // ← must be named `exam`
    examResults: examResultsReducer,
    history: historyReducer,
    teleform: teleformReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(historyMiddleware),
});