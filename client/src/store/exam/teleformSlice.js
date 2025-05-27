import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  teleformData: localStorage.getItem('teleformData') || '',
};

export const teleformSlice = createSlice({
  name: 'teleform',
  initialState,
  reducers: {
    setTeleformData: (state, action) => {
      state.teleformData = action.payload;
      // Save to localStorage for persistence across sessions
      localStorage.setItem('teleformData', action.payload);
    },
    clearTeleformData: (state) => {
      state.teleformData = '';
      localStorage.removeItem('teleformData');
    },
  },
});

export const { setTeleformData, clearTeleformData } = teleformSlice.actions;

export default teleformSlice.reducer; 