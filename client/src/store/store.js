import { configureStore } from "@reduxjs/toolkit";
import examReducer from "./exam/examSlice";

export const store = configureStore({
  reducer: {
    exam: examReducer, // ← must be named `exam`
  },
});