# Assessly Testing Guide

## Overview

This guide provides a centralized reference for all testing in the Assessly project. We use a comprehensive testing approach with Jest for unit/integration tests and Cypress for end-to-end testing.

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode (during development)
npm run test:watch

# Run Cypress E2E tests
npm run cy:open  # Interactive mode
npm run cy:run   # Headless mode
```

## Testing Structure

| Test Type | Location | Purpose |
|-----------|----------|---------|
| Unit Tests | `__tests__` folders next to source files | Test individual components/functions |
| Integration Tests | `/tests/integration/` | Test interactions between components |
| E2E Tests | `/tests/e2e/cypress/e2e/` | Test complete user workflows |

## Git Hooks (Husky)

We use Husky to automate testing during Git operations. **Important**: Husky is installed at the project root level (not in the client directory).

To enable test hooks:
```bash
git config --local hooks.runPreCommitTests true
```

[Learn more about Husky setup →](./docs/testing/huskySetup.md)

## Detailed Guides

We've created specialized guides for each aspect of testing:

- [**Husky Setup Guide**](./docs/testing/huskySetup.md) - Setting up Git hooks for automated testing
- [**Unit Testing Guide**](./docs/testing/unitTestingGuide.md) - Writing effective unit tests
- [**Integration Testing Guide**](./docs/testing/integrationTestingGuide.md) - Testing component interactions
- [**E2E Testing Guide**](./docs/testing/e2eTestingGuide.md) - End-to-end testing with Cypress
- [**Testing FAQ**](./docs/testing/testingFAQ.md) - Common questions and solutions

## Testing Principles

1. **Write tests for behavior, not implementation** - Focus on what the code does, not how it does it
2. **Keep tests independent** - Tests should not depend on other tests
3. **Follow the testing pyramid** - Write many unit tests, fewer integration tests, and a handful of E2E tests
4. **Test real user workflows** - Prioritize testing common user journeys

## Key Commands

| Command | Purpose |
|---------|---------|
| `npm test` | Run all Jest tests |
| `npm test -- path/to/file.test.js` | Run specific test file |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run cy:open` | Open Cypress Test Runner |
| `npm run cy:run` | Run Cypress tests headlessly |

## Common Patterns

### Test Component with Redux

```javascript
// Import necessary tools and components
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MyComponent from '../MyComponent';
import rootReducer from '../../store/rootReducer';

// Create test renderer with Redux
const renderWithRedux = (
  ui,
  {
    initialState = {},
    store = configureStore({
      reducer: rootReducer,
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
test('component with Redux', () => {
  const { getByText } = renderWithRedux(<MyComponent />);
  // Test assertions...
});
```

### Mock File System Access

```javascript
// Mock the file system API
jest.mock('../../src/services/fileSystemAccess', () => ({
  getFileHandle: jest.fn().mockResolvedValue({
    kind: 'file',
    name: 'test.json'
  }),
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('{"data":"test"}')
}));
```

## CI/CD Integration

Tests run automatically via GitHub Actions on pull requests and merges to main.

## Need Help?

Check the [Testing FAQ](./docs/testing/testingFAQ.md) for solutions to common issues, or reach out to the team's testing champion.
