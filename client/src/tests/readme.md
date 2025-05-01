
# Testing Guide

---

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
    someFeatureIntegration.test.js  # Integration across modules/features
  /e2e
    /cypress
      /e2e
        someWorkflow.cy.js           # Cypress E2E tests
      /support
      /fixtures
      /plugins
/tests/README.md                    
```

---

## Toolchain

| Type                | Tool                      |
|---------------------|---------------------------|
| Unit Testing        | Jest + React Testing Library |
| Integration Testing | Jest                      |
| E2E Testing         | Cypress                   |
| Linting             | ESLint                    |

---

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
- Example: `/tests/endToEnd/cypress/e2e/userFileUploadFlow.cy.js`

### 4. Mock Input Files
- create a sub-folder within relevant `__tests__` folder

---

## 📦 Naming Conventions

| Item                | Format           |
|---------------------|------------------|
| Files               | `myTest.test.js` |
| Test folders        | `__tests__`      |
| Cypress test files  | `*.cy.js`        |

---

##  Running Tests

### Run Unit / Integration Tests
```bash
npm run test          # Runs all Jest tests
npm run test:watch    # Watch mode (during development)
```

###  Run E2E Tests
- Open Cypress test runner:
```bash
npm run cy:open
```

- Run headless:
```bash
npm run cy:run
```

---

## Writing a Test

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

### 🧪 Cypress Example (E2E)
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

---

## (WIP) Local Test Automation

### Enable tests for each hook individually
- `git config --local hooks.runPreCommitTests true`
- `git config --local hooks.runPrePushTests true`
- `git config --local hooks.runPostMergeTests true`

See `tests/HUSKY_HOOKS_README.md`

---
