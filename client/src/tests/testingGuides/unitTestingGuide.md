# Unit Testing Guide

## Overview

This guide outlines the unit testing approach for Assessly, covering how to create, organize, and run unit tests using Jest and React Testing Library.

## Testing Stack

Assessly uses the following for unit testing:

- **Jest**: Test runner and assertion library
- **React Testing Library**: For testing React components
- **jest-dom**: Custom DOM element matchers

## Directory Structure

Unit tests should be placed in a `__tests__` directory adjacent to the file being tested:

```
/src
  /components
    /ExamBuilder
      ExamBuilder.js
      __tests__/
        ExamBuilder.test.js
      
  /services
    fileSystem.js
    __tests__/
      fileSystem.test.js

  /store
    /exam
      questionModel.js
      __tests__/
        questionModel.test.js
```

## Naming Conventions

- Test files: `ComponentName.test.js` or `serviceName.test.js`
- Test suites: `describe('ComponentName', () => {...})`
- Test cases: `test('should render correctly', () => {...})` or `it('should handle click events', () => {...})`

## Writing Unit Tests

### Component Tests

Component tests verify that UI elements render correctly and respond appropriately to user interactions.

#### Example: Basic Component Test

```jsx
// Button.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button', () => {
  test('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Testing Components with Context/Redux

For components that use context or Redux:

```jsx
// ExamQuestion.test.js
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ExamQuestion from '../ExamQuestion';
import examReducer from '../../store/examSlice';

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

test('displays question text from Redux store', () => {
  const initialState = {
    exam: {
      questions: [
        { id: '1', text: 'What is React?', type: 'multiple_choice' }
      ],
      currentQuestionId: '1'
    }
  };
  
  renderWithRedux(<ExamQuestion />, { initialState });
  expect(screen.getByText('What is React?')).toBeInTheDocument();
});
```

### Service/Utility Tests

For non-UI code like services, utilities, and models:

```javascript
// fileSystem.test.js
import { saveExam, loadExam } from '../fileSystem';

jest.mock('../fileSystemAccess', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('{"title": "Test Exam"}')
}));

describe('File System Service', () => {
  test('saveExam serializes and saves exam data', async () => {
    const examData = { title: 'Test Exam', questions: [] };
    await saveExam(examData, 'test.json');
    
    expect(require('../fileSystemAccess').writeFile).toHaveBeenCalledWith(
      'test.json',
      JSON.stringify(examData, null, 2)
    );
  });

  test('loadExam reads and parses exam data', async () => {
    const result = await loadExam('test.json');
    expect(result).toEqual({ title: 'Test Exam' });
  });
});
```

### Redux/State Tests

For testing Redux slices, reducers, actions, and selectors:

```javascript
// examSlice.test.js
import reducer, { 
  addQuestion, 
  updateQuestion, 
  selectCurrentQuestion 
} from '../examSlice';

describe('exam slice', () => {
  test('should return the initial state', () => {
    expect(reducer(undefined, {})).toEqual({
      questions: [],
      currentQuestionId: null,
      title: '',
      // ...other initial state
    });
  });

  test('should handle addQuestion', () => {
    const initialState = {
      questions: [],
      currentQuestionId: null
    };
    
    const action = addQuestion({
      type: 'multiple_choice',
      text: 'New question'
    });
    
    const state = reducer(initialState, action);
    expect(state.questions).toHaveLength(1);
    expect(state.questions[0].text).toBe('New question');
    expect(state.currentQuestionId).toBe(state.questions[0].id);
  });
  
  test('selectCurrentQuestion selector returns current question', () => {
    const state = {
      exam: {
        questions: [
          { id: '1', text: 'First question' },
          { id: '2', text: 'Second question' }
        ],
        currentQuestionId: '2'
      }
    };
    
    const result = selectCurrentQuestion(state);
    expect(result).toEqual({ id: '2', text: 'Second question' });
  });
});
```

## Mocking

### Basic Mocking

```javascript
// Create a mock function
const mockFunction = jest.fn();

// With implementation
const mockFunction = jest.fn(() => 'mock result');

// Mock return values
mockFunction.mockReturnValue('mock result');
mockFunction.mockResolvedValue('async mock result');
mockFunction.mockRejectedValue(new Error('mock error'));
```

### Mocking Modules

```javascript
// Manual mock
jest.mock('../api', () => ({
  fetchData: jest.fn().mockResolvedValue({ data: 'test' })
}));

// Auto mock
jest.mock('../complexModule');

// Partial mock
jest.mock('../utils', () => {
  const originalModule = jest.requireActual('../utils');
  return {
    ...originalModule,
    randomId: jest.fn(() => 'fixed-id-for-testing')
  };
});
```

### Mocking Browser APIs

```javascript
// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: 'mocked data' }),
    ok: true
  })
);
```

## Testing File System Interactions

Since Assessly uses the browser's File System API, you'll need special mocks:

```javascript
// Example mock for File System Access API
jest.mock('../fileSystemAccess', () => ({
  getFileHandle: jest.fn().mockResolvedValue({
    kind: 'file',
    name: 'test.json'
  }),
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('{"data":"test"}')
}));
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/components/ExamBuilder/__tests__/ExamBuilder.test.js

# Run tests with a specific name pattern
npm test -- -t "renders correctly"

# Watch mode (recommended during development)
npm run test:watch
```

### Watch Mode Commands

In watch mode, you can use these commands:
- `a` - Run all tests
- `f` - Run only failed tests
- `p` - Filter by filename
- `t` - Filter by test name
- `q` - Quit watch mode
- `Enter` - Trigger a test run

## Best Practices

### General Guidelines

1. **Test behavior, not implementation**: Focus on what the code does, not how it does it
2. **One assertion per test**: Keep tests focused and simple
3. **Descriptive test names**: Make it clear what's being tested
4. **Arrange-Act-Assert**: Structure tests in this pattern
5. **Avoid test interdependence**: Tests should not depend on each other

### React Component Testing

1. **Use screen queries**: Prefer `screen.getByText()` over destructuring `getByText`
2. **Test user interactions**: Verify components respond correctly to events
3. **Minimize implementation details**: Test what users see, not internal state
4. **Mock child components** when testing complex parent components

### Common Patterns

#### Testing Async Functions

```javascript
test('loads data asynchronously', async () => {
  render(<DataLoader />);
  
  // Wait for loading to complete
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  
  // Wait for element to appear
  const dataElement = await screen.findByText('Data loaded');
  expect(dataElement).toBeInTheDocument();
});
```

#### Test Data Setup

```javascript
// In a separate testData.js file
export const mockExamData = {
  title: 'Mock Exam',
  questions: [
    {
      id: 'q1',
      text: 'What is unit testing?',
      type: 'multiple_choice',
      options: [
        { id: 'a', text: 'Testing individual units of code' },
        { id: 'b', text: 'Testing the whole application' }
      ],
      correctAnswer: 'a'
    }
  ]
};

// Import in tests
import { mockExamData } from './testData';
```

## Code Coverage

Generate a coverage report:

```bash
npm test -- --coverage
```

Coverage report shows:
- Statement coverage
- Branch coverage
- Function coverage
- Line coverage

Aim for at least 80% coverage for critical application logic.

## Debugging Tests

If tests fail:

1. Use `console.log()` in test code to inspect values
2. Add `.debug()` to React Testing Library's render result:
   ```javascript
   const { debug } = render(<MyComponent />);
   debug();
   ```
3. Use `--verbose` flag for more detailed test output:
   ```bash
   npm test -- --verbose
   ```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM](https://github.com/testing-library/jest-dom)
- [Testing React with Jest & Testing Library (YouTube)](https://www.youtube.com/watch?v=7r4xVDI2vho)
