import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  teleformData: '',
};

export const teleformSlice = createSlice({
  name: 'teleform',
  initialState,
  reducers: {
    setTeleformData: (state, action) => {
      state.teleformData = action.payload;
    },
    clearTeleformData: (state) => {
      state.teleformData = '';
    },
  },
});

export const { setTeleformData, clearTeleformData } = teleformSlice.actions;

export default teleformSlice.reducer; 