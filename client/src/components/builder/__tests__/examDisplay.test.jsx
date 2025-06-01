const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
const { Provider } = require('react-redux');
const { configureStore } = require('@reduxjs/toolkit');
const { 
  default: examReducer,
  initialiseExamState, 
  addSection, 
  addQuestion,
  removeSection,
  removeQuestion 
} = require('../../../store/exam/examSlice');

// Mock the components we don't want to fully render
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }) => <div>{children}</div>,
  useSensor: jest.fn(),
  useSensors: jest.fn(),
  PointerSensor: jest.fn(),
  KeyboardSensor: jest.fn(),
  closestCenter: jest.fn()
}));

jest.mock('@dnd-kit/modifiers', () => ({
  restrictToVerticalAxis: jest.fn(),
  restrictToParentElement: jest.fn()
}));

// Mock the RichTextEditor component
jest.mock('../../editor/RichTextEditor', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-rich-text-editor">Rich Text Editor</div>
}));

// Mock the message API
const mockMessage = {
  success: jest.fn(),
  error: jest.fn()
};

// Mock antd components
jest.mock('antd', () => {
  const antd = jest.requireActual('antd');
  return {
    ...antd,
    App: {
      useApp: () => ({
        message: mockMessage
      })
    },
    message: {
      success: (...args) => {
        console.log('Message success:', ...args);
        mockMessage.success(...args);
      },
      error: (...args) => {
        console.log('Message error:', ...args);
        mockMessage.error(...args);
      }
    },
    Modal: ({ children, onOk, onCancel, title, ...props }) => (
      <div role="dialog" {...props}>
        <div>{title}</div>
        {children}
        <div>
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onOk}>OK</button>
        </div>
      </div>
    ),
    Table: ({ dataSource, columns }) => (
      <div data-testid="mock-table">
        {dataSource?.map((item, index) => (
          <div key={item.id || index} data-testid={`row-${index}`}>
            {columns.map(column => (
              <div key={column.key}>
                {column.render ? column.render(item[column.dataIndex], item) : item[column.dataIndex]}
              </div>
            ))}
          </div>
        ))}
      </div>
    ),
    Button: ({ children, onClick, danger, type, size, ...props }) => (
      <button 
        onClick={onClick} 
        className={`ant-btn ${danger ? 'ant-btn-danger' : ''} ${type ? `ant-btn-${type}` : ''} ${size ? `ant-btn-${size}` : ''}`}
        {...props}
      >
        {children}
      </button>
    ),
    Typography: {
      Title: ({ children, level, ...props }) => {
        const Tag = `h${level || 1}`;
        return <Tag {...props}>{children}</Tag>;
      },
      Text: ({ children, type, ...props }) => (
        <span className={type ? `ant-typography-${type}` : ''} {...props}>{children}</span>
      ),
      Paragraph: ({ children, ...props }) => <p {...props}>{children}</p>
    }
  };
});

describe('ExamDisplay Component - Core Interactions', () => {
  let store;

  beforeEach(() => {
    // Create a fresh store before each test
    store = configureStore({
      reducer: {
        exam: examReducer
      }
    });
    
    // Initialize with a basic exam
    store.dispatch(initialiseExamState({
      examTitle: 'Test Exam',
      examBody: []
    }));

    // Clear mock calls
    mockMessage.success.mockClear();
    mockMessage.error.mockClear();
  });

  // Helper function to render component with store
  const renderWithStore = () => {
    const ExamDisplay = require('../examDisplay').default;
    return render(
      <Provider store={store}>
        <ExamDisplay />
      </Provider>
    );
  };

  // Helper to log state changes
  const logStateChange = (action, beforeState, afterState) => {
    console.log(`\nState change after ${action}:`);
    console.log('Before:', JSON.stringify(beforeState?.examBody || [], null, 2));
    console.log('After:', JSON.stringify(afterState?.examBody || [], null, 2));
  };

  describe('Add Operations', () => {
    test('should add a new section', async () => {
      const beforeState = store.getState().exam.examData;
      console.log('\nTesting add section:');
      
      store.dispatch(addSection({ sectionTitle: 'Test Section' }));
      
      const afterState = store.getState().exam.examData;
      logStateChange('addSection', beforeState, afterState);
      
      expect(afterState.examBody.length).toBe(1);
      expect(afterState.examBody[0].type).toBe('section');
      expect(afterState.examBody[0].sectionTitle).toBe('Test Section');
    });

    test('should add a new question to a section', async () => {
      console.log('\nTesting add question to section:');
      
      // First add a section
      store.dispatch(addSection({ sectionTitle: 'Test Section' }));
      const beforeState = store.getState().exam.examData;
      
      // Then add a question to it
      store.dispatch(addQuestion({
        examBodyIndex: 0,
        questionData: {
          contentFormatted: 'Test Question',
          answers: [
            { contentFormatted: 'Answer 1', correct: true },
            { contentFormatted: 'Answer 2', correct: false }
          ]
        }
      }));
      
      const afterState = store.getState().exam.examData;
      logStateChange('addQuestion to section', beforeState, afterState);
      
      expect(afterState.examBody[0].questions.length).toBe(1);
      expect(afterState.examBody[0].questions[0].contentFormatted).toBe('Test Question');
    });
  });

  describe('Delete Operations', () => {
    test('should delete a section', async () => {
      console.log('\nTesting delete section:');
      
      // Add a section first
      store.dispatch(addSection({ sectionTitle: 'Test Section' }));
      const beforeState = store.getState().exam.examData;
      
      // Delete the section
      store.dispatch(removeSection(0));
      
      const afterState = store.getState().exam.examData;
      logStateChange('removeSection', beforeState, afterState);
      
      expect(afterState.examBody.length).toBe(0);
    });

    test('should delete a question from a section', async () => {
      console.log('\nTesting delete question from section:');
      
      // Setup: Add section with question
      store.dispatch(addSection({ sectionTitle: 'Test Section' }));
      store.dispatch(addQuestion({
        examBodyIndex: 0,
        questionData: {
          contentFormatted: 'Test Question',
          answers: [{ contentFormatted: 'Answer 1', correct: true }]
        }
      }));
      
      const beforeState = store.getState().exam.examData;
      console.log('State before delete:', JSON.stringify(beforeState.examBody, null, 2));
      
      // Delete the question
      store.dispatch(removeQuestion({ 
        examBodyIndex: 0, 
        questionsIndex: 0 
      }));
      
      const afterState = store.getState().exam.examData;
      logStateChange('removeQuestion from section', beforeState, afterState);
      
      expect(afterState.examBody[0].questions.length).toBe(0);
    });

    test('should delete a standalone question', async () => {
      console.log('\nTesting delete standalone question:');
      
      // Add a standalone question
      store.dispatch(addQuestion({
        questionData: {
          contentFormatted: 'Standalone Question',
          answers: [{ contentFormatted: 'Answer 1', correct: true }]
        }
      }));
      
      const beforeState = store.getState().exam.examData;
      console.log('State before delete:', JSON.stringify(beforeState.examBody, null, 2));
      
      // Delete the question
      store.dispatch(removeQuestion({ 
        examBodyIndex: 0
      }));
      
      const afterState = store.getState().exam.examData;
      logStateChange('removeQuestion standalone', beforeState, afterState);
      
      expect(afterState.examBody.length).toBe(0);
    });
  });

  describe('UI Interaction Tests', () => {
    test('should show delete confirmation modal when delete button is clicked', async () => {
      // Add a section
      store.dispatch(addSection({ sectionTitle: 'Test Section' }));
      
      // Render the component
      renderWithStore();
      
      // Find and click delete button
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
      
      // Check if confirmation modal appears
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
      });
    });

    test('should delete section when confirmed in modal', async () => {
      // Add a section
      store.dispatch(addSection({ sectionTitle: 'Test Section' }));
      
      // Render the component
      renderWithStore();
      
      // Find and click delete button
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
      
      // Find and click confirm button in modal
      const confirmButton = await screen.findByRole('button', { name: /ok/i });
      fireEvent.click(confirmButton);
      
      // Verify section was deleted
      const state = store.getState().exam.examData;
      expect(state.examBody.length).toBe(0);
    });

    test('should delete question from section when confirmed in modal', async () => {
      // Add a section with a question
      store.dispatch(addSection({ sectionTitle: 'Test Section' }));
      store.dispatch(addQuestion({
        examBodyIndex: 0,
        questionData: {
          contentFormatted: 'Test Question',
          answers: [{ contentFormatted: 'Answer 1', correct: true }]
        }
      }));
      
      // Render the component
      renderWithStore();
      
      // Find and click delete button for the question
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[1]); // Second delete button is for the question
      
      // Find and click confirm button in modal
      const confirmButton = await screen.findByRole('button', { name: /ok/i });
      fireEvent.click(confirmButton);
      
      // Verify question was deleted but section remains
      const state = store.getState().exam.examData;
      expect(state.examBody.length).toBe(1);
      expect(state.examBody[0].questions.length).toBe(0);
    });

    test('should delete standalone question when confirmed in modal', async () => {
      // Add a standalone question
      store.dispatch(addQuestion({
        questionData: {
          contentFormatted: 'Standalone Question',
          answers: [{ contentFormatted: 'Answer 1', correct: true }]
        }
      }));
      
      // Render the component
      renderWithStore();
      
      // Find and click delete button
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
      
      // Find and click confirm button in modal
      const confirmButton = await screen.findByRole('button', { name: /ok/i });
      fireEvent.click(confirmButton);
      
      // Verify question was deleted
      const state = store.getState().exam.examData;
      expect(state.examBody.length).toBe(0);
    });

    test('should not delete when cancel is clicked in modal', async () => {
      // Add a section
      store.dispatch(addSection({ sectionTitle: 'Test Section' }));
      
      // Render the component
      renderWithStore();
      
      // Find and click delete button
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
      
      // Find and click cancel button in modal
      const cancelButton = await screen.findByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      // Verify section was not deleted
      const state = store.getState().exam.examData;
      expect(state.examBody.length).toBe(1);
    });
  });
}); 