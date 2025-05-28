/*
    teleformSlice.test.js

    Tests for the teleform Redux slice functionality.
    Verifies that reducers correctly handle actions and update state.
*/

import { configureStore } from '@reduxjs/toolkit';
import teleformReducer, {
    setTeleformData,
    clearTeleformData
} from '../teleformSlice';

import { selectTeleformData } from '../selectors';

describe('Teleform Slice', () => {
    let store;

    beforeEach(() => {
        store = configureStore({
            reducer: { teleform: teleformReducer }
        });
    });

    test('should initialize with empty state', () => {
        const state = store.getState().teleform;
        expect(state.teleformData).toBe('');
    });

    test('should set teleform data', () => {
        const sampleData = '01483316245 VE BODNIHD 11100000004 0108080108010101041602160116161604160808';
        store.dispatch(setTeleformData(sampleData));

        const state = store.getState();
        expect(selectTeleformData(state)).toBe(sampleData);
    });

    test('should clear teleform data', () => {
        const sampleData = '01483316245 VE BODNIHD 11100000004 0108080108010101041602160116161604160808';
        store.dispatch(setTeleformData(sampleData));
        store.dispatch(clearTeleformData());

        const state = store.getState();
        expect(selectTeleformData(state)).toBe('');
    });
}); 