# Testing

## Overview

This project is set up for unit, integration, and E2E testing. You can write and run tests individually using the commands in this guide, enable Git hooks to trigger tests on specific actions (commit, push, etc.), or use Jest watch mode for continuous testing during development.
### (WIP) Additional test specific guides for writing tests are in: [`client/src/tests/testingGuides`](./testingGuides)

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run specific test file
npm test -- path/to/file.test.js

# Run Cypress E2E tests
npm run cy:open  # Interactive mode
npm run cy:run   # Headless mode
```

## Testing Structure

| Test Type         | Location                                 | Purpose                              | Examples                                                                         |
|-------------------|------------------------------------------|--------------------------------------|----------------------------------------------------------------------------------|
| Unit Tests        | `__tests__` folders next to source files | Test individual components/functions | [EXAMPLE_examUtils.test.js](../store/exam/__tests__/EXAMPLE_examUtils.test.js)   |
| Integration Tests | `/tests/integration/`                    | Test interactions between components | [EXAMPLE_examSlice.test.js](./integration/EXAMPLE_examSlice.test.js)             |
| E2E Tests         | `/tests/e2e/cypress/e2e/`                | Test complete user workflows         | [EXAMPLE_basicNavigation.cy.js](./e2e/cypress/e2e/EXAMPLE_basicNavigation.cy.js) |

## Naming Conventions

### Unit & Integration Tests
- Test files: `componentName.test.js` or `serviceName.test.js`
- Test suites: `describe('componentName', () => {...})`
- Test cases: `test('should render correctly', () => {...})` or `it('should handle click events', () => {...})`

### Cypress E2E Tests
Cypress test files use the `.cy.js` extension and live within the `client/src/tests/e2e/cypress/e2e` directory.



## Common Patterns/Templates

The following code templates demonstrate common testing patterns. You can copy and adapt these snippets when writing tests for similar scenarios in the codebase. More examples are provided in WIP WIP WIP [./testingGuides](./testingGuides).

### Testing Components with Redux (For components that rely on Redux state)

```javascript
// Import necessary tools and components
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ExamQuestion from '../ExamQuestion';
import examReducer from '../../store/exam/examSlice';

// Create test renderer with Redux
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

// Use in tests
test('displays question content', () => {
  const mockQuestion = {
    questionNumber: 1,
    contentText: 'What is testing?',
    marks: 2
  };
  
  renderWithRedux(<ExamQuestion question={mockQuestion} />);
  expect(screen.getByText('What is testing?')).toBeInTheDocument();
});
```

### Mocking File System Access (For tests involving file operations)

```javascript
// Mock the file system API
jest.mock('../../src/services/fileSystemAccess', () => ({
  openExamFile: jest.fn().mockResolvedValue({
    exam: { examTitle: 'Test Exam' },
    fileHandle: { name: 'test.json' }
  }),
  saveExamToFile: jest.fn().mockResolvedValue({ name: 'test.json' })
}));
```

## Git Hooks (Husky)

We use Husky to automate testing during Git operations. **Important**: Husky is installed at the project root level (not in the client directory).

All hooks are **DISABLED by default**. Enable them with:

```bash
# Enable pre-commit tests
git config --local hooks.runPreCommitTests true

# Enable pre-push tests
git config --local hooks.runPrePushTests true 

# Enable post-merge tests
git config --local hooks.runPostMergeTests true
```

When enabled, these hooks run:
- **pre-commit**: Lint-staged for code style checks on staged files
- **pre-push**: ESLint and Jest unit tests
- **post-merge**: Tests to verify code still works after pulling changes

[Learn more about Husky setup →](./testingGuides/huskyGuide.md)

## Watch Mode

Jest's watch mode continuously monitors your files and automatically runs relevant tests when changes are detected. 

```bash
npm run test:watch
```

When running in watch mode:
- Press `a` to run all tests
- Press `f` to run only failed tests
- Press `p` to filter by filename
- Press `t` to filter by test name
- Press `q` to quit watch mode

## Detailed Testing Guides

For guides:

- STILL WIP [**Unit Testing Guide**](./testingGuides/unitTestingGuide.md) - Writing effective unit tests with examples
- STILL WIP [**Integration Testing Guide**](./testingGuides/integrationTestingGuide.md) - Testing component interactions
- STILL WIP [**E2E Testing Guide**](./testingGuides/e2eTestingGuide.md) - End-to-end testing with Cypress
- STILL WIP [**Testing FAQ**](./testingGuides/testingFAQ.md) - Common questions and solutions

## Command Reference

| Command                            | Purpose                      |
|------------------------------------|------------------------------|
| `npm test`                         | Run all Jest tests           |
| `npm test -- path/to/file.test.js` | Run specific test file       |
| `npm test -- -t "test name"`       | Run tests matching pattern   |
| `npm run test:watch`               | Run tests in watch mode      |
| `npm run test:coverage`            | Generate coverage report     |
| `npm run cy:open`                  | Open Cypress Test Runner     |
| `npm run cy:run`                   | Run Cypress tests headless   |
