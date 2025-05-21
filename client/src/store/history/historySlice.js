import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  past: [],
  present: null,
  future: [],
  maxHistorySize: 50
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    pushState: (state, action) => {
      //console.log('History slice: Pushing state, past length:', state.past.length);
      // If we have a present state, move it to past
      if (state.present !== null) {
        state.past.push(state.present);
        // Maintain max history size
        if (state.past.length > state.maxHistorySize) {
          state.past.shift();
        }
      }
      // Set new present state
      state.present = action.payload;
      // Clear future states as we're creating a new branch
      state.future = [];
      //console.log('History slice: New state pushed, past length:', state.past.length);
    },

    undo: (state) => {
      //console.log('History slice: Undo called, past length:', state.past.length);
      if (state.past.length === 0) {
        //console.log('History slice: Nothing to undo');
        return;
      }

      // Move current state to future
      if (state.present !== null) {
        state.future.unshift(state.present);
      }

      // Get the last state from past
      state.present = state.past.pop();
      //console.log('History slice: Undo complete, past length:', state.past.length, 'future length:', state.future.length);
    },

    redo: (state) => {
      //console.log('History slice: Redo called, future length:', state.future.length);
      if (state.future.length === 0) {
        //console.log('History slice: Nothing to redo');
        return;
      }

      // Move current state to past
      if (state.present !== null) {
        state.past.push(state.present);
      }

      // Get the first state from future
      state.present = state.future.shift();
      //console.log('History slice: Redo complete, past length:', state.past.length, 'future length:', state.future.length);
    },

    clearHistory: (state) => {
      //console.log('History slice: Clearing history');
      state.past = [];
      state.future = [];
    }
  }
});

export const { pushState, undo, redo, clearHistory } = historySlice.actions;

// Selectors
export const selectHistory = (state) => state.history;
export const selectCanUndo = (state) => state.history.past.length > 0;
export const selectCanRedo = (state) => state.history.future.length > 0;

export default historySlice.reducer; 