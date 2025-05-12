// __tests__/useFileSystem.integration.test.js

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

jest.mock('../../services/fileSystemAccess', () => ({
  loadExamFromFile: jest.fn(),
  saveExamToDisk: jest.fn()
}));

import { useFileSystem } from '../useFileSystem';
import * as fileAccess from '../../services/fileSystemAccess';

const mockStore = configureStore([thunk]);

const TestComponent = () => {
  const { openExam, closeExam, exam } = useFileSystem();

  return (
    <div>
      <button onClick={openExam}>Open Exam</button>
      <button onClick={closeExam}>Close Exam</button>
      <div data-testid="exam-title">{exam?.examTitle || 'No exam'}</div>
    </div>
  );
};

test('opens and closes an exam using useFileSystem', async () => {
  const store = mockStore({ exam: { examData: null } });

  const mockExam = {
    examTitle: 'Test Exam',
    examBody: [],
    versions: [1],
    teleformOptions: ['a']
  };

  fileAccess.loadExamFromFile.mockResolvedValue({
    exam: mockExam,
    fileHandle: {}
  });

  render(
    <Provider store={store}>
      <TestComponent />
    </Provider>
  );

  fireEvent.click(screen.getByText('Open Exam'));

  await waitFor(() => {
    expect(screen.getByTestId('exam-title')).toHaveTextContent('Test Exam');
  });

  fireEvent.click(screen.getByText('Close Exam'));

  await waitFor(() => {
    expect(screen.getByTestId('exam-title')).toHaveTextContent('No exam');
  });
});