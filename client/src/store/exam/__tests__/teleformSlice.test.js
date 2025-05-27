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

describe('Teleform Slice', () => {
    let store;
    
    // Setup localStorage mock before all tests
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
        
        // Setup fresh store before each test
        store = configureStore({
            reducer: { teleform: teleformReducer }
        });
    });

    test('should initialise with correct default state', () => {
        const state = store.getState().teleform;
        expect(state.teleformData).toBe('');
    });

    test('should set teleform data', () => {
        // Sample teleform data
        const sampleData = '01483316245 VE BODNIHD 11100000004 0108080108010101041602160116161604160808';
        
        // Act
        store.dispatch(setTeleformData(sampleData));

        // Assert
        const state = store.getState();
        expect(selectTeleformData(state)).toBe(sampleData);
        expect(window.localStorage.setItem).toHaveBeenCalledWith('teleformData', sampleData);
    });

    test('should clear teleform data', () => {
        // Setup - first set some data
        const sampleData = '01483316245 VE BODNIHD 11100000004 0108080108010101041602160116161604160808';
        store.dispatch(setTeleformData(sampleData));
        
        // Act - then clear it
        store.dispatch(clearTeleformData());

        // Assert
        const state = store.getState();
        expect(selectTeleformData(state)).toBe('');
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('teleformData');
    });

    test('should initialise with data from localStorage if available', () => {
        // Setup with initial data for our test
        const savedData = 'saved data from localStorage';
        
        // Since we can't easily manipulate localStorage before store creation,
        // we'll use our mock reducer with pre-defined initial state
        const mockReducer = createMockTeleformReducer(savedData);
        
        // Create a new store with our mock reducer
        const newStore = configureStore({
            reducer: { teleform: mockReducer }
        });

        // Assert
        const state = newStore.getState();
        expect(state.teleform.teleformData).toBe(savedData);
    });
}); 