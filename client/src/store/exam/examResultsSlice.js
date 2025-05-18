import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  results: null,  // Will hold the marking results object
  loading: false,
  error: null
};

const examResultsSlice = createSlice({
  name: 'examResults',
  initialState,
  reducers: {
    setResults: (state, action) => {
      state.results = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state) => {
      state.loading = true;
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearResults: (state) => {
      state.results = null;
      state.loading = false;
      state.error = null;
    }
  }
});

// Export actions
export const { setResults, setLoading, setError, clearResults } = examResultsSlice.actions;

// Selectors
export const selectExamResults = (state) => state.examResults.results;
export const selectExamResultsLoading = (state) => state.examResults.loading;
export const selectExamResultsError = (state) => state.examResults.error;

// Export reducer
export default examResultsSlice.reducer; 