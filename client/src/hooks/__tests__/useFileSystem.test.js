import React from 'react';
import { renderHook, act } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { useFileSystem } from '../useFileSystem';
import * as fileSystemAccess from '../../services/fileSystemAccess';
import * as examSlice from '../../store/exam/examSlice';
import examImportService from '../../services/examImportService';
import TestExam from './Test.json';

const mockStore = configureStore([]);
const initialState = { exam: { examData: null } };

jest.mock('../../services/fileSystemAccess', () => ({
  ...jest.requireActual('../../services/fileSystemAccess'),
  loadExamFromFile: jest.fn(),
  saveExamToDisk: jest.fn()
}));

jest.mock('../../services/examImportService', () => ({
  importExamToDTO: jest.fn()
}));

describe('useFileSystem hook', () => {
  let store;

  const renderWithProvider = () => {
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    return renderHook(() => useFileSystem(), { wrapper });
  };

  beforeEach(() => {
    store = mockStore(initialState);
    jest.clearAllMocks();
  });

  it('openExam: loads and dispatches exam data', async () => {
    fileSystemAccess.loadExamFromFile.mockResolvedValue({
      exam: TestExam,
      fileHandle: { name: 'Test.json' }
    });

    const { result } = renderWithProvider();

    await act(async () => {
      const data = await result.current.openExam();
      expect(data.exam.examTitle).toBe('Test');
    });

    expect(store.getActions()).toContainEqual(
      examSlice.initialiseExamState(expect.objectContaining({ examTitle: 'Test' }))
    );
  });

  it('createExam: dispatches initialiseExamState', async () => {
    const { result } = renderWithProvider();

    await act(async () => {
      await result.current.createExam(TestExam);
    });

    expect(store.getActions()).toContainEqual(
      examSlice.initialiseExamState(expect.objectContaining({ examTitle: 'Test' }))
    );
  });

  it('saveExam: saves exam and updates fileHandle', async () => {
    const examState = { examData: TestExam };
    store = mockStore({ exam: examState });
    fileSystemAccess.saveExamToDisk.mockResolvedValue({ name: 'saved.json' });

    const { result } = renderWithProvider();

    await act(async () => {
      const handle = await result.current.saveExam();
      expect(handle.name).toBe('saved.json');
    });

    expect(fileSystemAccess.saveExamToDisk).toHaveBeenCalledWith(examState, null);
  });

  it('importFromFileInput: calls onError for unsupported format', async () => {
    const onError = jest.fn();
    const { result } = renderWithProvider();

    await act(async () => {
      const success = await result.current.importFromFileInput({ name: 'file.txt' }, onError);
      expect(success).toBeUndefined();
      expect(onError).toHaveBeenCalledWith('Unsupported file format');
    });
  });

  it('importFromFileInput: handles import error and triggers onError', async () => {
    examImportService.importExamToDTO.mockRejectedValue(new Error('bad import'));

    const onError = jest.fn();
    const { result } = renderWithProvider();

    await act(async () => {
      const success = await result.current.importFromFileInput({ name: 'file.xml' }, onError);
      expect(success).toBe(false);
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('bad import'));
    });
  });

  it('closeExam: clears exam and fileHandle', async () => {
    const { result } = renderWithProvider();

    await act(() => {
      result.current.closeExam();
    });

    expect(store.getActions()).toContainEqual(examSlice.clearExamState());
  });
});