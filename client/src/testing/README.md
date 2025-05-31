# Testing Setup

## Overview

The codebase is set up for local unit, integration, and E2E testing. You can write and run tests individually using the commands below, enable Git hooks to trigger tests on specific actions (commit, push, merge), or use Jest watch mode (WIP, not yet configured or tested) for continuous testing during development.

## Quick Start
### *run commands from /client directory

```bash
# Run all Unit/Integration tests (jest)
npm test

# Run linter (eslint)
npm run lint

# Run testing in watch mode (development)
npm run test:watch

# Run specific test file
npm test -- path/to/file.test.js

# Run Cypress E2E testing
npm run cy:open  # Interactive mode
npm run cy:run   # Headless mode

# Setup Git hooks
npm run setup-hooks

# Run individual hooks at any time (will run from root)
git hook run pre-commit
git hook run pre-push
git hook run post-merge
```

## Testing Structure 
##### (see example files for working test structures)

| Test Type         | Location                                        | Purpose                              | Examples                                                                         |
|-------------------|-------------------------------------------------|--------------------------------------|----------------------------------------------------------------------------------|
| Unit Tests        | Create `__tests__` folders next to source files | Test individual components/functions | [EXAMPLE_examUtils.test.js](../store/exam/__tests__/EXAMPLE_examUtils.test.js)   |   
| Integration Tests | `/tests/integration/`                           | Test interactions between components | [EXAMPLE_examSlice.test.js](./integration/EXAMPLE_examSlice.test.js)             |
| E2E Tests         | `/tests/e2e/cypress/e2e/`                       | Test complete user workflows         | [EXAMPLE_basicNavigation.cy.js](./e2e/cypress/e2e/EXAMPLE_basicNavigation.cy.js) |

## Naming Conventions

### Unit & Integration Tests
- Test files: `componentName.test.js` or `serviceName.test.js`
- Test suites: `describe('componentName', () => {...})`
- Test cases: `test('should render correctly', () => {...})` or `it('should handle click events', () => {...})`

### Cypress E2E Tests
Cypress test files use the `.cy.js` extension and live within the `client/src/tests/e2e/cypress/e2e` directory.

## Git Hooks (Lefthook)

Lefthook is used to automate testing during Git operations. This automatically runs specific test combinations when you commit, push, or merge code.

### Enabling Git Hooks

All hooks are **DISABLED by default**. To configure (enable/disable) your local hooks settings, run:

```bash
npm run setup-hooks
```

The console will ask you which hooks you want to enable and sets the appropriate Git configuration values to enable or disable specific hooks:

- **pre-commit**: Runs lint-staged for code style checks on files staged for commit only.
- **pre-push**: Runs ESLint, Jest tests, and E2E tests before pushing
- **post-merge**: Runs all tests to verify code still works after pulling changes

If a hook fails, the corresponding Git operation will be aborted, preventing you from committing or pushing code that doesn't pass tests (we can circumvent this if we want, or just disabled the relevant hook)

NOTE: the individual hook configuration can only be changed via lefthook.yml

## Common Testing Patterns

The following code templates demonstrate common testing patterns. You can copy and adapt these snippets when writing tests for similar scenarios in the codebase.

### Testing Components with Redux

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

// Use in testing
test('displays question content', () => {
  const mockQuestion = {
    questionNumber: 1,
    contentFormatted: 'What is testing?',
    marks: 2
  };
  
  renderWithRedux(<ExamQuestion question={mockQuestion} />);
  expect(screen.getByText('What is testing?')).toBeInTheDocument();
});
```

### Mocking File System Access

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

## E2E Testing with Cypress

Cypress E2E tests run in a real browser and test complete user workflows. Our configuration uses `start-server-and-test` to automatically start a Vite development server before running tests.

To run Cypress tests:

```bash
# Open Cypress Test Runner (interactive)
npm run cy:open

# Run Cypress testing headless
npm run cy:run
```

## Watch Mode (WIP)

Jest's watch mode continuously monitors your files and automatically runs relevant tests when changes are detected.

```bash
npm run test:watch
```

## Command Reference

| Command                            | Purpose                    |
|------------------------------------|----------------------------|
| `npm test`                         | Run all Jest tests         |
| `npm run lint`                     | Runs ESLint                |
| `npm test -- path/to/file.test.js` | Run specific test file     |
| `npm test -- -t "test name"`       | Run tests matching pattern |
| `npm run test:watch`               | Run tests in watch mode    |
| `npm run cy:open`                  | Open Cypress Test Runner   |
| `npm run cy:run`                   | Run Cypress tests headless |
| `npm run setup-hooks`              | Configure Git hooks        |
