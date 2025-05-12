// useFileSystem.importExam.docx.test.js
import { renderHook, act } from '@testing-library/react-hooks';
import { useFileSystem } from '../hooks/useFileSystem';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as examImportService from '../services/examImportService';

const mockStore = configureStore([thunk]);

jest.mock('../services/examImportService');

const wrapper = ({ children }) => (
  <Provider store={mockStore({ exam: { examData: null } })}>{children}</Provider>
);

describe('useFileSystem hook - importExam (DOCX)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('imports a DOCX exam file successfully', async () => {
    const fakeFile = new File(['dummy'], 'exam.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    examImportService.importExamToDTO.mockResolvedValue({ examTitle: 'Imported Exam', examBody: [] });

    const { result } = renderHook(() => useFileSystem(), { wrapper });

    let importResult;
    await act(async () => {
      importResult = await result.current.importExam(fakeFile, 'docx');
    });

    expect(importResult).toBe(true);
    expect(examImportService.importExamToDTO).toHaveBeenCalledWith(fakeFile, 'docx');
  });
});
