# Integration Testing Guide

## Overview

This guide covers integration testing for Assessly, focusing on how to test interactions between multiple components, services, and state management. Integration tests verify that different parts of the application work together correctly.

## What is Integration Testing?

Integration tests verify that different modules or services work well together. Unlike unit tests that isolate components, integration tests examine how components interact in real-world scenarios.

In Assessly, integration tests typically verify:
- Component hierarchies work together
- Components interact correctly with services
- Redux actions/reducers correctly update the UI
- File system operations properly persist and retrieve data

## Directory Structure

Integration tests are located in a dedicated directory separate from unit tests:

```
/tests
  /integration
    examWorkflow.test.js
    fileSystemIntegration.test.js
    stateManagement.test.js
```

## Testing Stack

Assessly uses these tools for integration testing:
- **Jest**: Test runner and assertion framework
- **React Testing Library**: For rendering and interacting with components
- **Redux Mock Store**: For testing Redux interactions
- **Mock Service Worker**: For mocking API calls (if applicable)

## Writing Integration Tests

### Testing Component Hierarchies

Testing how multiple components work together:

```javascript
// tests/integration/examEditor.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ExamEditor from '../../src/components/ExamEditor';
import examReducer from '../../src/store/examSlice';

describe('Exam Editor Integration', () => {
  const renderWithRedux = (
    ui,
    {
      initialState = {},
      store = configureStore({
        reducer: { exam: examReducer },
        preloadedState: initialState
      }),
    } = {}
  ) => {
    return {
      ...render(<Provider store={store}>{ui}</Provider>),
      store,
    };
  };

  test('adding a question updates the question list', () => {
    const { store } = renderWithRedux(<ExamEditor />);
    
    // Find and click the "Add Question" button
    fireEvent.click(screen.getByText('Add Question'));
    
    // Verify that a new question form appears
    expect(screen.getByTestId('question-editor')).toBeInTheDocument();
    
    // Enter question text
    fireEvent.change(screen.getByLabelText('Question Text'), {
      target: { value: 'What is integration testing?' }
    });
    
    // Save the question
    fireEvent.click(screen.getByText('Save Question'));
    
    // Verify that the question appears in the question list
    expect(screen.getByText('What is integration testing?')).toBeInTheDocument();
    
    // Verify store was updated correctly
    const state = store.getState();
    expect(state.exam.questions).toHaveLength(1);
    expect(state.exam.questions[0].text).toBe('What is integration testing?');
  });
});
```

### Testing Data Flow

Testing how data flows through multiple layers:

```javascript
// tests/integration/dataFlow.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from '../../src/components/App';
import rootReducer from '../../src/store/rootReducer';
import { saveExam, loadExam } from '../../src/services/fileSystem';

// Mock the file system service
jest.mock('../../src/services/fileSystem', () => ({
  saveExam: jest.fn().mockResolvedValue(undefined),
  loadExam: jest.fn().mockResolvedValue({
    title: 'Test Exam',
    questions: [
      { id: 'q1', text: 'Sample question', type: 'multiple_choice' }
    ]
  })
}));

describe('Data Flow Integration', () => {
  test('loading an exam updates the UI correctly', async () => {
    const store = configureStore({
      reducer: rootReducer
    });
    
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );
    
    // Click the load button
    fireEvent.click(screen.getByText('Open Exam'));
    
    // Wait for the exam to load
    await waitFor(() => {
      expect(loadExam).toHaveBeenCalled();
    });
    
    // Verify that the UI reflects the loaded exam
    expect(screen.getByText('Test Exam')).toBeInTheDocument();
    expect(screen.getByText('Sample question')).toBeInTheDocument();
    
    // Verify store state
    const state = store.getState();
    expect(state.exam.title).toBe('Test Exam');
    expect(state.exam.questions).toHaveLength(1);
  });
});
```

### Testing File System Integration

Testing how the app interacts with the file system:

```javascript
// tests/integration/fileSystemIntegration.test.js
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import ExamSaver from '../../src/components/ExamSaver';
import examReducer from '../../src/store/examSlice';
import {saveExam} from '../../src/services/fileSystem';
import * as fileSystemAccess from './fileSystemAccess';

// Mock low-level file system access
jest.mock('./fileSystemAccess', () => ({
    getFileHandle: jest.fn().mockResolvedValue({
        kind: 'file',
        name: 'test-exam.json'
    }),
    writeFile: jest.fn().mockResolvedValue(undefined)
}));

describe('File System Integration', () => {
    test('saving an exam calls the file system with correct data', async () => {
        const initialState = {
            exam: {
                title: 'Integration Test Exam',
                questions: [
                    {id: 'q1', text: 'Test Question', type: 'multiple_choice'}
                ]
            }
        };

        const store = configureStore({
            reducer: {exam: examReducer},
            preloadedState: initialState
        });

        render(
            <Provider store={store}>
                <ExamSaver/>
            </Provider>
        );

        // Click save button
        fireEvent.click(screen.getByText('Save Exam'));

        // Verify file system functions were called with correct data
        await waitFor(() => {
            expect(fileSystemAccess.getFileHandle).toHaveBeenCalled();
            expect(fileSystemAccess.writeFile).toHaveBeenCalledWith(
                expect.anything(),
                expect.stringContaining('Integration Test Exam')
            );
        });

        // Verify the save data contains the question
        const saveData = JSON.parse(fileSystemAccess.writeFile.mock.calls[0][1]);
        expect(saveData.questions[0].text).toBe('Test Question');
    });
});
```

### Testing Complex User Workflows

Testing multi-step user interactions:

```javascript
// tests/integration/examWorkflow.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from '../../src/components/App';
import rootReducer from '../../src/store/rootReducer';

describe('Exam Creation Workflow', () => {
  test('complete exam creation process works end-to-end', async () => {
    const store = configureStore({
      reducer: rootReducer
    });
    
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );
    
    // Step 1: Create a new exam
    fireEvent.click(screen.getByText('New Exam'));
    
    // Step 2: Set exam title
    fireEvent.change(screen.getByLabelText('Exam Title'), {
      target: { value: 'Integration Testing Exam' }
    });
    
    // Step 3: Add a question
    fireEvent.click(screen.getByText('Add Question'));
    
    // Step 4: Configure the question
    fireEvent.change(screen.getByLabelText('Question Text'), {
      target: { value: 'What is the purpose of integration testing?' }
    });
    
    // Select multiple choice type
    fireEvent.click(screen.getByLabelText('Multiple Choice'));
    
    // Add options
    fireEvent.click(screen.getByText('Add Option'));
    fireEvent.change(screen.getByTestId('option-0'), {
      target: { value: 'To test individual functions' }
    });
    
    fireEvent.click(screen.getByText('Add Option'));
    fireEvent.change(screen.getByTestId('option-1'), {
      target: { value: 'To test how components work together' }
    });
    
    // Mark correct answer
    fireEvent.click(screen.getByTestId('correct-1')); // Second option is correct
    
    // Save question
    fireEvent.click(screen.getByText('Save Question'));
    
    // Verify that all parts of the exam are in the store
    const state = store.getState();
    expect(state.exam.title).toBe('Integration Testing Exam');
    expect(state.exam.questions).toHaveLength(1);
    expect(state.exam.questions[0].options).toHaveLength(2);
    expect(state.exam.questions[0].correctAnswer).toBe(1);
    
    // Verify UI reflects this state
    expect(screen.getByText('Integration Testing Exam')).toBeInTheDocument();
    expect(screen.getByText('What is the purpose of integration testing?')).toBeInTheDocument();
  });
});
```

## Mocking Strategies for Integration Tests

### Mocking External Dependencies

While integration tests verify interactions between components, you still need to mock some external dependencies:

```javascript
// Mock file system
jest.mock('../../src/services/fileSystemAccess', () => ({
  // Mock implementation
}));

// Mock network requests (if using MSW)
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.get('/api/exams', (req, res, ctx) => {
    return res(ctx.json([
      { id: 1, title: 'Mock Exam' }
    ]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Partial Store Mocking

For testing specific slices of state management:

```javascript
// Combine real and mock reducers
const store = configureStore({
  reducer: {
    exam: examReducer, // Real reducer
    auth: () => ({ user: { id: '123', name: 'Test User' } }) // Mock state
  }
});
```

## Running Integration Tests

```bash
# Run all integration tests
npm test -- tests/integration

# Run a specific integration test file
npm test -- tests/integration/examWorkflow.test.js

# Run with coverage
npm test -- tests/integration --coverage
```

## Best Practices

### Do:
1. **Focus on component interaction**: Test how components work together, not individual details
2. **Test critical user flows**: Prioritize common user journeys
3. **Use realistic test data**: Test data should mirror real application data
4. **Mock external services**: But use real implementations for the parts being integrated
5. **Test error handling**: Verify that integrated components handle errors gracefully

### Don't:
1. **Don't duplicate unit tests**: Integration tests should focus on interactions, not details already covered by unit tests
2. **Don't make tests brittle**: Avoid testing implementation details that might change
3. **Don't overuse shallow rendering**: Use actual DOM rendering for integration tests
4. **Don't write overly complex tests**: If a test is too complex, break it down

## Common Integration Test Scenarios

### Redux Store Integration

```javascript
test('action dispatches update connected components', () => {
  const { store } = renderWithRedux(<ConnectedComponent />);
  
  // Dispatch an action
  store.dispatch(addQuestion({ text: 'New question' }));
  
  // Verify UI updated
  expect(screen.getByText('New question')).toBeInTheDocument();
});
```

### Form Submission Flow

```javascript
test('form submission updates store and redirects', async () => {
  const { store } = renderWithRedux(<ExamForm />);
  
  // Fill out form
  fireEvent.change(screen.getByLabelText('Title'), {
    target: { value: 'New Exam' }
  });
  
  // Submit form
  fireEvent.click(screen.getByText('Save'));
  
  // Verify store updated
  expect(store.getState().exam.title).toBe('New Exam');
  
  // Verify redirect
  await waitFor(() => {
    expect(screen.getByText('Exam Dashboard')).toBeInTheDocument();
  });
});
```

## Debugging Integration Tests

When integration tests fail, narrow down the issue:

1. **Add focused console.logs**: Log at key interaction points
2. **Use the debug() function**: From React Testing Library to see DOM state
3. **Inspect the store**: Log store state at different points
4. **Break complex tests**: Temporarily comment out parts to isolate issues

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Redux Testing](https://redux.js.org/usage/writing-tests)
- [Mock Service Worker](https://mswjs.io/docs/)
