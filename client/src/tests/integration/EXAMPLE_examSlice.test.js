/*
Test verifies that:

The initial state is set up correctly
The createNewExam action properly creates an exam
The addSection action adds a section to the exam
The updateExamField action updates exam fields as expected

Expected Results: This test should pass if your Redux slice is correctly implemented.
It tests the integration between actions and reducers without involving React components or browser APIs.
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
    // First create an exam
    store.dispatch(createNewExam({ examTitle: 'Test Exam' }));

    // Then add a section
    store.dispatch(addSection({
      sectionTitle: 'Test Section',
      contentText: 'Section content'
    }));

    // Verify section was added
    const state = store.getState();
    expect(state.exam.examData.examBody).toHaveLength(1);
    expect(state.exam.examData.examBody[0].type).toBe('section');
    expect(state.exam.examData.examBody[0].sectionTitle).toBe('Test Section');
    expect(state.exam.examData.examBody[0].contentText).toBe('Section content');
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