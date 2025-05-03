/*

Tests examUtils.js functions in isolation.
Tests the individual utility functions without any dependencies on React, Redux, or browser APIs.

 */

import {
  createExam,
  createSection,
  createQuestion,
  createAnswer
} from '../examUtils';

describe('Exam Utility Functions', () => {
  test('createExam creates a valid exam object with defaults', () => {
    const exam = createExam();

    // Verify default properties
    expect(exam.type).toBe('exam');
    expect(exam.examTitle).toBe('');
    expect(Array.isArray(exam.versions)).toBe(true);
    expect(exam.versions).toEqual([1, 2, 3, 4]);
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
});