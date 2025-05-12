// useFileSystem.importExam.xml.test.js
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

describe('useFileSystem hook - importExam (Moodle XML)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('imports an XML exam file successfully', async () => {
    const fakeFile = new File(['<quiz></quiz>'], 'exam.xml', { type: 'application/xml' });
    examImportService.importExamToDTO.mockResolvedValue({ examTitle: 'Imported XML Exam', examBody: [] });

    const { result } = renderHook(() => useFileSystem(), { wrapper });

    let importResult;
    await act(async () => {
      importResult = await result.current.importExam(fakeFile, 'moodle');
    });

    expect(importResult).toBe(true);
    expect(examImportService.importExamToDTO).toHaveBeenCalledWith(fakeFile, 'moodle');
  });
});
