import React from 'react';
import { renderHook, act } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { useFileSystem } from '../useFileSystem.js';
import * as fileSystemAccess from '../../services/fileSystemAccess';
import * as examSlice from '../../store/exam/examSlice';
import TestExam from './Test.json';

// Setup mock store and initial state
const mockStore = configureStore([]);
const initialState = {
  exam: {
    examData: null
  }
};

// Mock the loadExamFromFile function
jest.mock('../../services/fileSystemAccess', () => ({
  ...jest.requireActual('../../services/fileSystemAccess'),
  loadExamFromFile: jest.fn()
}));

describe('useFileSystem - openExam', () => {
  let store;

  beforeEach(() => {
    store = mockStore(initialState);
    fileSystemAccess.loadExamFromFile.mockResolvedValue({
      exam: TestExam,
      fileHandle: { name: 'Test.json' }
    });
  });

  it('loads an exam and updates Redux state', async () => {
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;

    const { result } = renderHook(() => useFileSystem(), { wrapper });

    await act(async () => {
      const resultObj = await result.current.openExam();

      expect(resultObj.exam.examTitle).toBe('Test');
      expect(resultObj.fileHandle.name).toBe('Test.json');
    });

    const actions = store.getActions();
    expect(actions).toContainEqual(
      examSlice.initializeExamState(expect.objectContaining({
        examTitle: 'Test',
        courseCode: '101'
      }))
    );
  });

  it('does not dispatch if file load fails', async () => {
    fileSystemAccess.loadExamFromFile.mockResolvedValueOnce(null);
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;

    const { result } = renderHook(() => useFileSystem(), { wrapper });

    await act(async () => {
      const res = await result.current.openExam();
      expect(res).toBeNull();
    });

    const actions = store.getActions();
    expect(actions).toEqual([]);
  });
});