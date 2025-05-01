# Comprehensive Testing Guide

This guide explains the testing setup, structure, and workflows for this project.

## Directory Structure

```
/src
  /components
    /SomeComponent
      SomeComponent.jsx
      __tests__/
        someComponent.test.jsx       # Unit tests
        testInputData.js             # Input or mocks for testing
/tests
  /integration
    someFeatureIntegration.test.js   # Integration across modules/features
  /e2e
    /cypress
      /e2e
        someWorkflow.cy.js           # Cypress E2E tests
      /support
      /fixtures
      /plugins
  /scripts
    testOnTrigger.js                 # Script used by Git hooks
```

## Toolchain

| Type                | Tool                      |
|---------------------|---------------------------|
| Unit Testing        | Jest + React Testing Library |
| Integration Testing | Jest                      |
| E2E Testing         | Cypress                   |
| Linting             | ESLint                    |

## Test Types & Where to Put Them

### 1. Unit Tests
- Located in: `__tests__` folder **next to** the file being tested
- Example: `/components/__tests__/popupWarning.test.jsx`
- Goal: Test individual functions/components in isolation

### 2. Integration Tests
- Located in: `/tests/integration/`
- Purpose: Test interactions between modules, state, services, etc.
- Example: `/tests/integration/formWithState.test.js`

### 3. E2E Tests
- Located in: `/tests/e2e/cypress/e2e/`
- Use Cypress to simulate user interactions across the app in-browser
- Example: `/tests/e2e/cypress/e2e/userFileUploadFlow.cy.js`

### 4. Mock Input Files
- Create a sub-folder within relevant `__tests__` folder
- Example: `__tests__/__mocks__/sampleInput.js`

## Naming Conventions

| Item                | Format           |
|---------------------|------------------|
| Files               | `myTest.test.js` |
| Test folders        | `__tests__`      |
| Cypress test files  | `*.cy.js`        |

## Running Tests Manually

### Jest (Unit/Integration) Tests
```bash
npm run test          # Runs all Jest tests
npm run test:watch    # Watch mode (during development)
npm run test:watchAll # Run all tests every time a file changes
```

### Cypress (E2E) Tests
```bash
npm run cy:open       # Open Cypress test runner UI
npm run cy:run        # Run Cypress tests headlessly
```

## Automated Testing with Git Hooks

This project uses [Husky](https://typicode.github.io/husky/) to automatically run tests during Git lifecycle events.

### Setup

If you haven't already, run this once:

```bash
npm install
npx husky install
```

Ensure the `prepare` script is present in your `package.json`:
```json
"scripts": {
  "prepare": "husky install"
}
```

### Hook Configuration

These hooks are implemented in the `.husky/` directory:

| Hook        | File                | What It Does                        |
|-------------|---------------------|-------------------------------------|
| pre-commit  | `.husky/pre-commit` | Runs lint + Jest before commit      |
| pre-push    | `.husky/pre-push`   | Runs full test suite before push    |
| post-merge  | `.husky/post-merge` | Validates the project after merge   |

All hooks call the same script: `client/src/tests/scripts/testOnTrigger.js`

### Developer Control: Opt-In with Git Config

By default, **tests are skipped** unless you explicitly enable them per event.

#### Enable Tests for a Hook

```bash
git config --local hooks.runPreCommitTests true
git config --local hooks.runPrePushTests true
git config --local hooks.runPostMergeTests true
```

These settings are stored in your local `.git/config` file and are **not committed**.

#### Disable Tests Again

```bash
git config --unset hooks.runPrePushTests
```

### What Each Hook Runs

- **pre-commit**: Lint + Jest (unit/integration tests)
- **pre-push**: Lint + Jest + Cypress (E2E)
- **post-merge**: Lint + Jest + Cypress

The actual commands are defined in `testOnTrigger.js` and may evolve.

### Manual Execution (Optional)

You can run any test manually:
```bash
node client/src/tests/scripts/testOnTrigger.js pre-commit
```

This is helpful for debugging without committing/pushing.

## Writing Tests

### Jest (Unit) Test Example
```jsx
// __tests__/someComponent.test.jsx
import { render, screen } from '@testing-library/react';
import SomeComponent from '../SomeComponent';

test('renders title correctly', () => {
  render(<SomeComponent />);
  expect(screen.getByText(/hello world/i)).toBeInTheDocument();
});
```

### Cypress Example (E2E)
```js
// cypress/e2e/login.cy.js
describe('Login flow', () => {
  it('logs in successfully', () => {
    cy.visit('/');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('123456');
    cy.get('button[type="submit"]').click();
    cy.contains('Welcome back').should('exist');
  });
});
```

## Jest Watch Mode

While developing, you can run Jest in watch mode to get instant feedback when you edit files:

### Run only affected tests:
```bash
npm run test:watch
```

### Run all tests every time:
```bash
npm run test:watchAll
```

This is great for TDD, active UI work, and fast debugging.

You can also add this combo script to run both the dev server and tests in watch mode (optional):

```json
"scripts": {
  "dev:test": "concurrently \"npm run test:watch\" \"npm run dev\""
}
```

Requires:
```bash
npm install --save-dev concurrently
```

This is optional and intended for local development only.
