# Testing FAQ

## General Testing Questions

### Q: What testing framework does Assessly use?
**A:** Assessly uses Jest as the primary testing framework, with React Testing Library for component testing. We use Cypress for end-to-end testing.

### Q: Where should I put my test files?
**A:** 
- **Unit tests**: Place in a `__tests__` directory next to the file being tested
- **Integration tests**: Place in `/tests/integration/`
- **E2E tests**: Place in `/tests/e2e/cypress/e2e/`

### Q: How do I run the tests?
**A:**
```bash
# All tests
npm test

# Specific test file
npm test -- path/to/file.test.js

# Watch mode
npm run test:watch

# Cypress E2E tests
npm run cy:open  # UI mode
npm run cy:run   # Headless mode
```

## Git Hooks and CI/CD

### Q: Why do my tests run automatically when I commit?
**A:** We use Husky to run tests on Git operations. This is configured at the root level of the project, not in the client directory. See `huskySetup.md` for details.

### Q: How do I prevent tests from running on commit/push?
**A:** 
```bash
# Disable specific hook
git config --unset hooks.runPreCommitTests

# Or skip for a single command
git commit --no-verify -m "Your message"
```

### Q: Why are Husky hooks installed at the root level and not in /client?
**A:** Husky needs to be at the same level as the `.git` directory to properly interact with Git hooks. Since our Git repository is at the root level, Husky must be installed there even though most of our development happens in the client directory.

## Testing React Components

### Q: How do I test a component that uses Redux?
**A:** Wrap your component with a Redux Provider in your test:

```javascript
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MyComponent from '../MyComponent';
import rootReducer from '../../store/rootReducer';

test('component with Redux', () => {
  const store = configureStore({ reducer: rootReducer });
  
  render(
    <Provider store={store}>
      <MyComponent />
    </Provider>
  );
  
  // Rest of your test
});
```

### Q: How do I test components that use React Router?
**A:** Wrap your component with a MemoryRouter:

```javascript
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyComponent from '../MyComponent';

test('component with routing', () => {
  render(
    <MemoryRouter initialEntries={['/some-path']}>
      <MyComponent />
    </MemoryRouter>
  );
  
  // Rest of your test
});
```

### Q: How do I test async component behavior?
**A:** Use React Testing Library's async utilities:

```javascript
import { render, screen, waitFor } from '@testing-library/react';

test('async behavior', async () => {
  render(<AsyncComponent />);
  
  // Wait for element to appear
  await screen.findByText('Loaded data');
  
  // Or use waitFor for more complex assertions
  await waitFor(() => {
    expect(screen.getByText('Loaded data')).toBeInTheDocument();
  });
});
```

## File System Testing

### Q: How do I test file system operations?
**A:** Since Assessly uses the browser's File System Access API, you need to mock these operations:

```javascript
// Mock the file system API
jest.mock('./fileSystemAccess', () => ({
    getFileHandle: jest.fn().mockResolvedValue({
        kind: 'file',
        name: 'test.json'
    }),
    writeFile: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue('{"data":"test"}')
}));

test('file system interaction', async () => {
    // Test code that uses file system
    await saveExam(examData);

    // Verify mock was called with right arguments
    expect(require('./fileSystemAccess').writeFile)
        .toHaveBeenCalledWith(expect.anything(), expect.stringContaining('data'));
});
```

### Q: Tests fail with "ReferenceError: window is not defined"
**A:** This happens because Jest runs in Node.js, not a browser. You need to mock browser APIs:

```javascript
// In your setup file or at the top of the test
global.window = {
  showOpenFilePicker: jest.fn().mockResolvedValue([{ getFile: jest.fn() }]),
  showSaveFilePicker: jest.fn()
};

// Or mock the entire module that uses these APIs
jest.mock('../../src/services/fileSystemAccess');
```

## Mocking and Test Data

### Q: How do I create realistic test data?
**A:** Create factory functions in separate files:

```javascript
// tests/factories/examFactory.js
export const createExam = (overrides = {}) => ({
  id: 'exam-1',
  title: 'Test Exam',
  questions: [],
  ...overrides
});

export const createQuestion = (overrides = {}) => ({
  id: 'q-1',
  text: 'Sample question',
  type: 'multiple_choice',
  options: [],
  ...overrides
});

// In your test
import { createExam, createQuestion } from '../../factories/examFactory';

test('with test data', () => {
  const exam = createExam({
    questions: [
      createQuestion({ text: 'Custom question' })
    ]
  });
  
  // Use the test data
});
```

### Q: How do I mock imported functions?
**A:** Use Jest's mock functions:

```javascript
// Automatic mock
jest.mock('../../src/utils');

// Manual mock implementation
jest.mock('../../src/utils', () => ({
  formatDate: jest.fn(() => '2023-01-01'),
  generateId: jest.fn(() => 'test-id')
}));

// Spying on a real implementation
jest.spyOn(utils, 'formatDate').mockReturnValue('2023-01-01');
```

## Test Coverage and Quality

### Q: What's a good code coverage target?
**A:** We aim for at least 80% code coverage for critical application logic. Run coverage reports with:

```bash
npm test -- --coverage
```

### Q: How do I debug failing tests?
**A:**
1. Use `console.log()` statements
2. Use the `debug()` function from React Testing Library
3. Run tests with `--verbose` flag
4. Use a Jest debugger configuration in your IDE

```javascript
// Add debugging to a test
test('debugging example', () => {
  const { debug } = render(<MyComponent />);
  debug(); // Prints the DOM at this point
  
  // You can also debug specific elements
  screen.debug(screen.getByText('Some text'));
});
```

### Q: Tests are passing locally but failing in CI
**A:** Common reasons include:
1. **Timing issues**: Tests may run faster/slower in CI
2. **Environment differences**: Different Node versions or dependencies
3. **Path issues**: Case sensitivity in file paths (common when developing on Windows but deploying on Linux)

Add more waitFor/findBy assertions and ensure paths use consistent casing.

## Cypress E2E Testing

### Q: When should I use Cypress vs Jest tests?
**A:** 
- Use **Jest + React Testing Library** for unit and integration tests of components and logic
- Use **Cypress** for full end-to-end tests that test complete user flows and real browser behavior

### Q: How do I test file downloads in Cypress?
**A:** File downloads are tricky in E2E tests. One approach:

```javascript
// cypress/e2e/fileDownload.cy.js
describe('File download', () => {
  it('downloads an exam file', () => {
    // Set up download folder
    cy.task('clearDownloads');
    
    // Trigger the download
    cy.visit('/');
    cy.contains('Export Exam').click();
    
    // Verify download occurred (check a folder for the file)
    cy.task('checkDownloads', { name: 'exam.json' }).should('exist');
  });
});
```

This requires configuring custom tasks in `cypress.config.js`.

### Q: How do I select elements reliably in Cypress?
**A:** Use data attributes specifically for testing:

```html
<button data-testid="submit-button">Submit</button>
```

```javascript
// In Cypress test
cy.get('[data-testid=submit-button]').click();
```

## Common Errors and Solutions

### Q: "Cannot find module" error in tests
**A:** Check:
1. **Path correctness**: Make sure import paths are correct
2. **Module installation**: Ensure dependency is installed
3. **Jest configuration**: Check moduleNameMapper in Jest config

### Q: Tests time out with async operations
**A:** 
1. Make sure you're using `async/await` correctly
2. Increase Jest timeout if needed:

```javascript
jest.setTimeout(10000); // 10 second timeout
```

3. Ensure promises are properly resolved or rejected in your code

### Q: "TypeError: cannot read property 'X' of undefined"
**A:** Usually happens when:
1. A component prop is missing
2. Redux state isn't initialized properly
3. Async data isn't mocked correctly

Solution: Add proper default values and ensure mocks return appropriate structures.

## Testing Strategy

### Q: How many tests should I write?
**A:** Focus on value rather than quantity:
1. Critical user paths must have both unit and integration tests
2. Complex business logic should have thorough unit tests
3. UI components need basic render and interaction tests
4. A few end-to-end tests should cover main user flows

### Q: How do I know what to test?
**A:** Prioritize testing based on:
1. **Risk**: What would break the application if it fails?
2. **Complexity**: Complex logic has more potential for bugs
3. **Change frequency**: Frequently changing code needs more tests
4. **User impact**: Focus on features users depend on most

Write tests that verify behavior, not implementation details.

### Q: What's the best way to start testing an existing component?
**A:**
1. Start with a simple "renders without crashing" test
2. Add tests for the main functionality (not every prop/state combination)
3. Test key user interactions
4. Add edge case tests after the basics work

### Q: How do I approach testing a feature from scratch?
**A:** Consider Test-Driven Development (TDD):
1. Write a failing test that defines the expected behavior
2. Implement the minimum code to make the test pass
3. Refactor the code while keeping tests passing
4. Repeat for next feature/requirement

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Cypress Documentation](https://docs.cypress.io)
- [Testing Trophy article by Kent C. Dodds](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
