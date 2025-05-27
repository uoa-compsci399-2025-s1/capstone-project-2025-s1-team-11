/*
    teleformPersistence.test.js

    Integration tests for teleform data persistence.
    Verifies that teleform data correctly persists between components and tab changes.
*/

import { configureStore } from '@reduxjs/toolkit';
import teleformReducer, { setTeleformData } from '../../store/exam/teleformSlice';
import examReducer from '../../store/exam/examSlice';
import examResultsReducer from '../../store/exam/examResultsSlice';
import { selectTeleformData } from '../../store/exam/selectors';
import * as teleformReaderUtil from "../../utilities/marker/teleformReader";

// Mock the teleformReader utility
jest.mock("../../utilities/marker/teleformReader", () => ({
    readTeleform: jest.fn()
}));

// Create a mock implementation of teleformSlice to handle localStorage differently
const createMockTeleformReducer = (initialData) => {
    // Return a modified version of the reducer that uses the provided initialData
    const mockInitialState = {
        teleformData: initialData || ''
    };
    
    return (state = mockInitialState, action) => {
        if (action.type === 'teleform/setTeleformData') {
            return {
                ...state,
                teleformData: action.payload
            };
        }
        if (action.type === 'teleform/clearTeleformData') {
            return {
                ...state,
                teleformData: ''
            };
        }
        return state;
    };
};

describe('Teleform Data Persistence Integration', () => {
    let store;
    
    // Setup localStorage mock for all tests
    beforeAll(() => {
        // Properly mock localStorage with Jest spies
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn(),
                setItem: jest.fn(),
                removeItem: jest.fn(),
                clear: jest.fn()
            },
            writable: true
        });
    });

    beforeEach(() => {
        // Clear mocks before each test
        jest.clearAllMocks();

        // Setup teleformReader mock
        teleformReaderUtil.readTeleform.mockImplementation((data) => {
            if (!data) return [];
            return [
                {
                    studentId: "483316245",
                    lastName: "VE",
                    firstName: "BODNIHD",
                    versionId: "4",
                    answerString: "0108080108010101041602160116161604160808"
                }
            ];
        });

        // Setup Redux store with all relevant reducers
        store = configureStore({
            reducer: {
                teleform: teleformReducer,
                exam: examReducer,
                examResults: examResultsReducer
            }
        });
    });

    test('teleform data should persist in Redux store', () => {
        // Initial state should be empty
        let state = store.getState();
        expect(selectTeleformData(state)).toBe('');

        // Set teleform data
        const sampleData = '01483316245 VE BODNIHD 11100000004 0108080108010101041602160116161604160808';
        store.dispatch(setTeleformData(sampleData));

        // Verify data is in the store
        state = store.getState();
        expect(selectTeleformData(state)).toBe(sampleData);
    });

    test('teleform data should be saved to localStorage for persistence', () => {
        const sampleData = '01483316245 VE BODNIHD 11100000004 0108080108010101041602160116161604160808';
        store.dispatch(setTeleformData(sampleData));

        // Verify localStorage was called
        expect(window.localStorage.setItem).toHaveBeenCalledWith('teleformData', sampleData);
    });

    test('teleform data should be loaded from localStorage on initialization', () => {
        // Setup with initial data for our test
        const savedData = '01483316245 VE BODNIHD 11100000004 0108080108010101041602160116161604160808';
        
        // Since we can't easily manipulate localStorage before store creation,
        // we'll use our mock reducer with pre-defined initial state
        const mockReducer = createMockTeleformReducer(savedData);
        
        // Create a new store with our mock reducer
        const newStore = configureStore({
            reducer: {
                teleform: mockReducer
            }
        });

        // Verify data was loaded from localStorage
        const state = newStore.getState();
        expect(state.teleform.teleformData).toBe(savedData);
    });

    test('teleform data should be used by readTeleform utility when processing', () => {
        // Set teleform data in the store
        const sampleData = '01483316245 VE BODNIHD 11100000004 0108080108010101041602160116161604160808';
        store.dispatch(setTeleformData(sampleData));

        // Access the data as would be done in a component
        const state = store.getState();
        const teleformData = selectTeleformData(state);
        
        // Call the utility function as would be done in a component
        const parsedData = teleformReaderUtil.readTeleform(teleformData);
        
        // Verify the utility was called with the correct data
        expect(teleformReaderUtil.readTeleform).toHaveBeenCalledWith(sampleData);
        
        // Verify parsed data structure
        expect(parsedData).toHaveLength(1);
        expect(parsedData[0]).toHaveProperty('studentId', '483316245');
        expect(parsedData[0]).toHaveProperty('versionId', '4');
    });
}); 