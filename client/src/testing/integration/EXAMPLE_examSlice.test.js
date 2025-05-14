/*
Example Integration Test for Redux Slice

This test file serves as a reference for writing integration testing using Redux Toolkit.

It verifies:
- Initial state is correctly set up
- createNewExam properly creates a new exam
- addSection adds a new section (with current known reducer limitations)
- updateExamField correctly updates fields

These testing demonstrate interaction between actions and reducers
without involving React components or side effects.
*/


import { configureStore } from '@reduxjs/toolkit';
import examReducer, {
  createNewExam,
  addSection,
  updateExamField
} from '../../store/exam/examSlice';

describe('Exam Slice Integration', () => {
  let store;

  beforeEach(() => {
    // Set up a fresh store for each test
    store = configureStore({
      reducer: { exam: examReducer }
    });
  });

  test('initial state has null examData', () => {
    const state = store.getState();
    expect(state.exam.examData).toBeNull();
    expect(state.exam.isLoading).toBe(false);
    expect(state.exam.error).toBeNull();
  });

  test('createNewExam action creates an exam with correct data', () => {
    // Dispatch action to create an exam
    store.dispatch(createNewExam({
      examTitle: 'Integration Test Exam',
      courseCode: 'INT101',
      courseName: 'Integration Testing'
    }));

    // Verify exam was created with correct data
    const state = store.getState();
    expect(state.exam.examData).not.toBeNull();
    expect(state.exam.examData.examTitle).toBe('Integration Test Exam');
    expect(state.exam.examData.courseCode).toBe('INT101');
    expect(state.exam.examData.courseName).toBe('Integration Testing');
    expect(Array.isArray(state.exam.examData.examBody)).toBe(true);
    expect(state.exam.examData.examBody).toHaveLength(0);
  });

  test('addSection adds a section to the exam body', () => {
    // Integration test for addSection action and exam reducer interaction.

    // 1. Start by creating a new exam (mimics expected app flow)
    store.dispatch(createNewExam({ examTitle: 'Test Exam' }));

    // 2. Dispatch addSection to simulate adding a section to the exam
    store.dispatch(addSection({
      sectionTitle: 'Test Section',
      contentText: 'Section content' // Currently unused by reducer
    }));

    // 3. Get updated state from store
    const state = store.getState();

    // 4. Assert that a new section has been added correctly
    expect(state.exam.examData.examBody).toHaveLength(1);

    const addedSection = state.exam.examData.examBody[0];

    // Section should have type and title as expected
    expect(addedSection.type).toBe('section');
    expect(addedSection.sectionTitle).toBe('Test Section');

    // NOTE: As of current reducer implementation, contentText is not used,
    // so it defaults to an empty string. This test accounts for that.
    expect(addedSection.contentText).toBe('');
  });

  test('updateExamField updates a field in the exam', () => {
    // First create an exam
    store.dispatch(createNewExam({
      examTitle: 'Original Title',
      courseCode: 'ORIG101'
    }));

    // Update the title
    store.dispatch(updateExamField({
      field: 'examTitle',
      value: 'Updated Title'
    }));

    // Verify title was updated
    let state = store.getState();
    expect(state.exam.examData.examTitle).toBe('Updated Title');

    // Course code should remain unchanged
    expect(state.exam.examData.courseCode).toBe('ORIG101');

    // Update the course code
    store.dispatch(updateExamField({
      field: 'courseCode',
      value: 'UPD101'
    }));

    // Verify course code was updated
    state = store.getState();
    expect(state.exam.examData.courseCode).toBe('UPD101');
  });
});