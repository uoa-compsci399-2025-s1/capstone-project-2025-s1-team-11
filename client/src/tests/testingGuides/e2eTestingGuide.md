# E2E Testing with Cypress

## Overview

This guide covers end-to-end (E2E) testing for Assessly using Cypress. E2E tests verify that the entire application works correctly from a user's perspective, testing complete workflows and interactions across multiple components.

## What is E2E Testing?

End-to-end testing verifies that the application functions correctly as a complete system. Unlike unit or integration tests that focus on specific parts in isolation, E2E tests:

- Simulate real user behavior in a browser environment
- Test complete user flows from start to finish
- Verify that all parts of the application work together correctly
- Catch integration issues that might not appear in isolated tests

In Assessly, E2E tests help ensure that critical workflows like creating, editing, and saving exams work correctly from a user's perspective.

## Directory Structure

E2E tests in Assessly are organized as follows:

```
/tests
  /e2e
    /cypress
      /e2e
        createExam.cy.js
        editExam.cy.js
        fileOperations.cy.js
      /support
        commands.js
        e2e.js
      /fixtures
        exampleExam.json
      /plugins
        index.js
      cypress.config.js
```

## Setting Up Cypress

Cypress should already be installed as part of the project dependencies. If you need to install it manually:

```bash
# Navigate to client directory
cd client

# Install Cypress
npm install cypress --save-dev
```

### Cypress Configuration

Cypress is configured in `cypress.config.js`:

```javascript
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on, config) {
      // Implement node event listeners here
    },
    experimentalStudio: true
  },
  viewportWidth: 1280,
  viewportHeight: 800,
  video: false
});
```

## Writing E2E Tests

### Basic Test Structure

Cypress tests use a descriptive, behavior-driven structure:

```javascript
// tests/e2e/cypress/e2e/createExam.cy.js

describe('Exam Creation Process', () => {
  beforeEach(() => {
    // Visit the application before each test
    cy.visit('/');
  });

  it('allows creating a new exam', () => {
    // Test steps for creating an exam
    cy.contains('New Exam').click();
    cy.get('[data-testid="exam-title-input"]').type('Sample Exam');
    cy.contains('Add Question').click();
    
    // More test steps...
    
    // Assertion
    cy.contains('Sample Exam').should('exist');
    cy.contains('1 question').should('exist');
  });
});
```

### Test Files Naming

Cypress test files use the `.cy.js` extension:

- `createExam.cy.js`
- `editExam.cy.js`
- `fileOperations.cy.js`

### Element Selection Strategies

For robust E2E tests, select elements in this order of preference:

1. **Data attributes** (most preferred)
   ```javascript
   cy.get('[data-testid="exam-title-input"]')
   ```

2. **Semantic selectors**
   ```javascript
   cy.get('button[type="submit"]')
   ```

3. **Text content**
   ```javascript
   cy.contains('Add Question')
   ```

4. **Class names** (least preferred)
   ```javascript
   cy.get('.question-editor')
   ```

Add `data-testid` attributes to your components specifically for testing:

```javascript
<input 
  data-testid="exam-title-input"
  value={title}
  onChange={handleTitleChange}
/>
```

## Example E2E Tests

### Complete Exam Creation Flow

```javascript
// tests/e2e/cypress/e2e/createExam.cy.js

describe('Exam Creation', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('creates an exam with multiple choice questions', () => {
    // Start a new exam
    cy.contains('New Exam').click();
    
    // Set exam title
    cy.get('[data-testid="exam-title-input"]').type('Cypress Test Exam');
    
    // Add first question
    cy.contains('Add Question').click();
    cy.get('[data-testid="question-text-input"]').type('What is E2E testing?');
    cy.get('[data-testid="question-type-selector"]').select('Multiple Choice');
    
    // Add options
    cy.contains('Add Option').click();
    cy.get('[data-testid="option-0"]').type('Testing individual functions');
    cy.contains('Add Option').click();
    cy.get('[data-testid="option-1"]').type('Testing the complete application');
    
    // Mark correct answer
    cy.get('[data-testid="correct-1"]').click();
    
    // Save question
    cy.contains('Save Question').click();
    
    // Verify question appears in the list
    cy.contains('What is E2E testing?').should('exist');
    
    // Add second question
    cy.contains('Add Question').click();
    cy.get('[data-testid="question-text-input"]').type('Which tool is used for E2E testing?');
    cy.get('[data-testid="question-type-selector"]').select('Multiple Choice');
    
    // Add options
    cy.contains('Add Option').click();
    cy.get('[data-testid="option-0"]').type('Jest');
    cy.contains('Add Option').click();
    cy.get('[data-testid="option-1"]').type('Cypress');
    
    // Mark correct answer
    cy.get('[data-testid="correct-1"]').click();
    
    // Save question
    cy.contains('Save Question').click();
    
    // Verify both questions exist
    cy.contains('What is E2E testing?').should('exist');
    cy.contains('Which tool is used for E2E testing?').should('exist');
    
    // Verify exam summary
    cy.contains('Cypress Test Exam').should('exist');
    cy.contains('2 questions').should('exist');
  });
});
```

### Testing File Operations

When testing file operations, we need to handle the File System Access API:

```javascript
// tests/e2e/cypress/e2e/fileOperations.cy.js

describe('File Operations', () => {
  beforeEach(() => {
    // Visit app and create a basic exam
    cy.visit('/');
    cy.createBasicExam(); // Custom command defined in support/commands.js
    
    // Mock the file system API
    cy.window().then((win) => {
      cy.stub(win, 'showSaveFilePicker').resolves({
        createWritable: () => {
          return Promise.resolve({
            write: cy.stub().resolves(),
            close: cy.stub().resolves()
          });
        }
      });
      
      cy.stub(win, 'showOpenFilePicker').resolves([{
        getFile: () => {
          return Promise.resolve({
            text: () => Promise.resolve(JSON.stringify({
              title: 'Loaded Exam',
              questions: [
                {
                  id: 'q1',
                  text: 'Loaded question',
                  type: 'multiple_choice',
                  options: [
                    { id: 'o1', text: 'Option A' },
                    { id: 'o2', text: 'Option B' }
                  ],
                  correctAnswer: 'o2'
                }
              ]
            }))
          });
        }
      }]);
    });
  });

  it('can save an exam', () => {
    // Trigger save operation
    cy.contains('Save').click();
    
    // Verify the save was triggered
    cy.window().its('showSaveFilePicker').should('have.been.called');
    
    // Verify success message
    cy.contains('Exam saved successfully').should('be.visible');
  });

  it('can load an exam', () => {
    // Trigger load operation
    cy.contains('Open').click();
    
    // Verify the load was triggered
    cy.window().its('showOpenFilePicker').should('have.been.called');
    
    // Verify loaded content appears
    cy.contains('Loaded Exam').should('be.visible');
    cy.contains('Loaded question').should('be.visible');
  });
});
```

### Custom Commands

Create reusable commands for common operations:

```javascript
// tests/e2e/cypress/support/commands.js

// Create a basic exam with one question
Cypress.Commands.add('createBasicExam', () => {
  cy.contains('New Exam').click();
  cy.get('[data-testid="exam-title-input"]').type('Test Exam');
  cy.contains('Add Question').click();
  cy.get('[data-testid="question-text-input"]').type('Sample question');
  cy.get('[data-testid="question-type-selector"]').select('Multiple Choice');
  cy.contains('Add Option').click();
  cy.get('[data-testid="option-0"]').type('Option A');
  cy.contains('Add Option').click();
  cy.get('[data-testid="option-1"]').type('Option B');
  cy.get('[data-testid="correct-0"]').click();
  cy.contains('Save Question').click();
});

// Login helper (if needed)
Cypress.Commands.add('login', (username, password) => {
  cy.visit('/login');
  cy.get('[data-testid="username"]').type(username);
  cy.get('[data-testid="password"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  cy.url().should('not.include', '/login');
});
```

## Using Test Fixtures

Fixtures store static test data:

```javascript
// Load from fixture
cy.fixture('exampleExam.json').then((examData) => {
  // Use the data
  cy.window().then((win) => {
    win.localStorage.setItem('currentExam', JSON.stringify(examData));
  });
  
  // Reload page to use the data
  cy.reload();
});
```

Example fixture file:

```json
// tests/e2e/cypress/fixtures/exampleExam.json
{
  "title": "Example Exam",
  "questions": [
    {
      "id": "q1",
      "text": "What is Cypress?",
      "type": "multiple_choice",
      "options": [
        { "id": "o1", "text": "A type of tree" },
        { "id": "o2", "text": "An E2E testing framework" }
      ],
      "correctAnswer": "o2"
    }
  ]
}
```

## Running Cypress Tests

### Interactive Mode

```bash
# Start your dev server
npm run dev

# Then in another terminal
npm run cy:open
```

This opens the Cypress Test Runner UI where you can select and run tests while watching them execute in a browser.

### Headless Mode

```bash
# Run all tests headlessly (CI-friendly)
npm run cy:run

# Run specific test file
npm run cy:run -- --spec "tests/e2e/cypress/e2e/createExam.cy.js"
```

## Testing Best Practices

### Do's

1. **Use data-testid attributes**: Add data-testid attributes to key elements
2. **Chain commands logically**: Chain Cypress commands to create readable tests
3. **Create helper commands**: Use custom commands for repetitive operations
4. **Test complete workflows**: Focus on user journeys, not just individual pages
5. **Use realistic delays**: Add `.should()` assertions instead of arbitrary waits
6. **Keep tests independent**: Each test should be able to run independently
7. **Test error states**: Test both success and failure scenarios

### Don'ts

1. **Don't use `.wait()`**: Avoid arbitrary time-based waits
2. **Don't rely on UI text that may change**: Use data attributes instead
3. **Don't create complex, fragile selectors**: Keep selectors simple and robust
4. **Don't test every scenario with E2E**: Reserve E2E for critical flows
5. **Don't forget to handle async operations**: Use proper assertions to wait for operations to complete

## Handling Common Scenarios

### Testing Drag and Drop

```javascript
cy.get('[data-testid="draggable-item"]')
  .trigger('mousedown', { button: 0 })
  .trigger('mousemove', { clientX: 300, clientY: 200 })
  .trigger('mouseup');
```

### Testing File Uploads

```javascript
cy.fixture('test-file.json', 'binary')
  .then(Cypress.Blob.binaryStringToBlob)
  .then(blob => {
    const file = new File([blob], 'test-file.json', { type: 'application/json' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    cy.get('[data-testid="file-input"]').trigger('change', { 
      target: { files: dataTransfer.files }
    });
  });
```

### Testing Browser Storage

```javascript
// Set localStorage
cy.window().then(win => {
  win.localStorage.setItem('savedExam', JSON.stringify({ title: 'Saved Exam' }));
});

// Check localStorage
cy.window().then(win => {
  const savedExam = JSON.parse(win.localStorage.getItem('savedExam'));
  expect(savedExam.title).to.equal('Saved Exam');
});
```

### Testing Error Handling

```javascript
// Force an error condition
cy.intercept('GET', '/api/exams', {
  statusCode: 500,
  body: { error: 'Server error' }
}).as('getExamsError');

// Trigger the operation that causes the error
cy.contains('Load Exams').click();

// Wait for the request to complete
cy.wait('@getExamsError');

// Verify error message
cy.contains('Failed to load exams').should('be.visible');
```

## Debugging E2E Tests

### Using Debugging Commands

```javascript
// Pause test execution
cy.pause();

// Print value to console
cy.get('[data-testid="exam-title"]').then($el => {
  console.log('Title text:', $el.text());
});

// Debug current DOM state
cy.debug();

// Take a screenshot
cy.screenshot('exam-editor-state');
```

### Test Artifacts

Cypress can generate screenshots and videos to help debug failing tests:

```javascript
// In cypress.config.js
module.exports = defineConfig({
  e2e: {
    // Enable video recording
    video: true,
    
    // Screenshot on failure
    screenshotOnRunFailure: true,
    
    // Artifacts folder
    screenshotsFolder: 'tests/e2e/cypress/screenshots',
    videosFolder: 'tests/e2e/cypress/videos'
  }
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/cypress.yml
name: Cypress Tests

on: [push, pull_request]

jobs:
  cypress-run:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 16
          
      - name: Install dependencies
        run: |
          cd client
          npm ci
          
      - name: Start dev server
        run: |
          cd client
          npm run dev &
          npx wait-on http://localhost:5173
        
      - name: Run Cypress tests
        run: |
          cd client
          npm run cy:run
          
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: cypress-artifacts
          path: |
            client/tests/e2e/cypress/screenshots
            client/tests/e2e/cypress/videos
```

## Advanced Topics

### Visual Regression Testing

You can add visual testing to Cypress with plugins:

```javascript
// Install plugin
// npm install --save-dev cypress-image-snapshot

// In cypress/plugins/index.js
const { addMatchImageSnapshotPlugin } = require('cypress-image-snapshot/plugin');

module.exports = (on, config) => {
  addMatchImageSnapshotPlugin(on, config);
};

// In cypress/support/commands.js
import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command';
addMatchImageSnapshotCommand();

// In your test
cy.matchImageSnapshot('exam-editor');
```

### Accessibility Testing

Incorporate accessibility testing:

```javascript
// Install plugin
// npm install --save-dev cypress-axe

// In cypress/support/index.js
import 'cypress-axe';

// In your test
describe('Accessibility Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe();
  });

  it('has no detectable accessibility violations', () => {
    cy.checkA11y();
  });
});
```

## Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Cypress Testing Library](https://testing-library.com/docs/cypress-testing-library/intro/)
- [Cypress-Axe for Accessibility Testing](https://github.com/component-driven/cypress-axe)
- [Visual Testing with Cypress](https://docs.cypress.io/guides/tooling/visual-testing)
