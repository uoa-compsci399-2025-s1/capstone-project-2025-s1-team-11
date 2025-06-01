/*

Tests examUtils.js functions in isolation.
Tests the individual utility functions without any dependencies on React, Redux, or browser APIs.

 */

import {
  createExam,
  createSection,
  createQuestion,
  createAnswer,
  createExamComponent,
  needsMigration,
  migrateExam
} from '../examUtils';

describe('Exam Utility Functions', () => {
  test('createExam creates a valid exam object with defaults', () => {
    const exam = createExam();

    // Verify default properties
    expect(exam.type).toBe('exam');
    expect(exam.examTitle).toBe('');
    expect(Array.isArray(exam.versions)).toBe(true);
    expect(exam.versions).toEqual(['00000001', '00000002', '00000003', '00000004']);
    expect(exam.examBody).toEqual([]);
  });

  test('createExam applies overrides correctly', () => {
    const exam = createExam({
      examTitle: 'Test Exam',
      courseCode: 'TEST101'
    });

    expect(exam.examTitle).toBe('Test Exam');
    expect(exam.courseCode).toBe('TEST101');
  });

  test('createSection creates a valid section', () => {
    const section = createSection({
      sectionTitle: 'Basic Concepts'
    });

    expect(section.type).toBe('section');
    expect(section.sectionTitle).toBe('Basic Concepts');
    expect(Array.isArray(section.questions)).toBe(true);
  });

  test('createQuestion creates a question with correct defaults', () => {
    const question = createQuestion();

    expect(question.type).toBe('question');
    expect(Array.isArray(question.answers)).toBe(true);
  });

  test('createAnswer sets correct flag properly', () => {
    const answer = createAnswer({
      correct: true
    });

    expect(answer.type).toBe('answer');
    expect(answer.correct).toBe(true);
  });

  test('createAnswer handles fixedPosition property', () => {
    const answer = createAnswer({
      contentFormatted: '<p>Fixed answer</p>',
      fixedPosition: 2
    });

    expect(answer.type).toBe('answer');
    expect(answer.fixedPosition).toBe(2);
    expect(answer.contentFormatted).toBe('<p>Fixed answer</p>');
  });

  test('createExamComponent creates a base component with defaults', () => {
    const component = createExamComponent();

    expect(component.type).toBe('content');
    expect(component.contentFormatted).toBe('');
    expect(component.format).toBe('HTML');
    expect(component.pageBreakAfter).toBe(false);
  });

  test('createExamComponent applies overrides correctly', () => {
    const component = createExamComponent({
      type: 'custom',
      contentFormatted: '<p>Custom content</p>'
    });

    expect(component.type).toBe('custom');
    expect(component.contentFormatted).toBe('<p>Custom content</p>');
    expect(component.pageBreakAfter).toBe(false);
  });

  test('createQuestion applies all properties correctly', () => {
    const question = createQuestion({
      questionNumber: 5,
      marks: 10,
      contentFormatted: '<p>Complex question?</p>',
      answers: [
        { contentFormatted: '<p>Answer 1</p>', correct: true },
        { contentFormatted: '<p>Answer 2</p>', correct: false }
      ]
    });

    expect(question.type).toBe('question');
    expect(question.questionNumber).toBe(5);
    expect(question.marks).toBe(10);
    expect(question.contentFormatted).toBe('<p>Complex question?</p>');
    expect(question.answers).toHaveLength(2);
    expect(question.answers[0].correct).toBe(true);
    expect(question.answers[1].correct).toBe(false);
  });

  test('createSection applies all properties correctly', () => {
    const section = createSection({
      sectionTitle: 'Advanced Section',
      sectionNumber: 3,
      contentFormatted: '<p>Section instructions</p>',
      questions: [
        createQuestion({ contentFormatted: '<p>Question 1</p>' }),
        createQuestion({ contentFormatted: '<p>Question 2</p>' })
      ]
    });

    expect(section.type).toBe('section');
    expect(section.sectionTitle).toBe('Advanced Section');
    expect(section.sectionNumber).toBe(3);
    expect(section.contentFormatted).toBe('<p>Section instructions</p>');
    expect(section.questions).toHaveLength(2);
    expect(section.questions[0].type).toBe('question');
    expect(section.questions[1].type).toBe('question');
  });
});

describe('Exam Versioning', () => {
  test('new exams should have current schema version', () => {
    const exam = createExam();
    expect(exam.schemaVersion).toBeDefined();
    expect(exam.schemaVersion).toBe('1.0.0');
  });

  test('should detect when migration is needed', () => {
    // Legacy exam without version
    const legacyExam = {
      type: 'exam',
      examTitle: 'Old Exam',
      examBody: []
    };
    expect(needsMigration(legacyExam)).toBe(true);

    // Current version exam
    const currentExam = createExam();
    expect(needsMigration(currentExam)).toBe(false);

    // Future version exam (hypothetical)
    const futureExam = {
      ...createExam(),
      schemaVersion: '2.0.0'
    };
    expect(needsMigration(futureExam)).toBe(true);
  });

  test('should migrate legacy exam format', () => {
    const legacyExam = {
      type: 'exam',
      examTitle: 'Legacy Exam',
      examBody: null // Invalid examBody
    };

    const migratedExam = migrateExam(legacyExam);

    // Check that version was added
    expect(migratedExam.schemaVersion).toBe('1.0.0');

    // Check that required fields were added
    expect(migratedExam.teleformOptions).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(Array.isArray(migratedExam.examBody)).toBe(true);
    expect(migratedExam.examBody).toEqual([]);

    // Check that original fields were preserved
    expect(migratedExam.type).toBe('exam');
    expect(migratedExam.examTitle).toBe('Legacy Exam');
  });

  test('should not modify current version exams', () => {
    const currentExam = createExam({
      examTitle: 'Current Exam',
      customField: 'value'
    });

    const migratedExam = migrateExam(currentExam);

    // Should be the same object
    expect(migratedExam).toEqual(currentExam);
  });
});