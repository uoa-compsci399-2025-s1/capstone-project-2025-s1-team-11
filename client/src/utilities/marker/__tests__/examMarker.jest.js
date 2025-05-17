import { markExams } from '../examMarker';
import TestExam from './Test.json';

// Mock Redux actions
jest.mock('../../../store/store.js', () => ({
  store: {
    dispatch: jest.fn()
  }
}));

jest.mock('../teleformReader.js', () => ({
  readTeleform: jest.fn()
}));

import { readTeleform } from '../teleformReader';

describe('markExams', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('marks student answers correctly and calculates summary stats', () => {
    const teleformData = 'mocked scan data string';

    readTeleform.mockReturnValue([
      {
        studentId: '999999999',
        firstName: 'Test',
        lastName: 'Student',
        versionId: '00000001',
        answerString: '1616161616'
      }
    ]);

    const exam = {
      ...TestExam,
      examBody: TestExam.examBody
        .filter(q => q.type === 'question')
        .slice(0, 5)
        .map(q => ({ ...q, marks: 1 })), // ✅ explicitly set marks
      teleformOptions: ['A', 'B', 'C', 'D', 'E']
    };

    const markingKey = {
      '00000001': '1616161616'
    };

    const results = markExams(exam, teleformData, markingKey);

    expect(results.summary.totalStudents).toBe(1);
    expect(results.summary.averageMark).toBeGreaterThan(0);
    expect(results.all[0].firstName).toBe('Test');
    expect(results.all[0].questions.length).toBeGreaterThan(0);
    expect(results.all[0].questions.every(q => q.isCorrect)).toBe(true);
  });

  it('throws an error if version ID is not in the marking key', () => {
    readTeleform.mockReturnValue([
      {
        studentId: '123456789',
        firstName: 'John',
        lastName: 'Doe',
        versionId: '00009999', // unknown version
        answerString: '161616'
      }
    ]);

    expect(() => {
      markExams(TestExam, 'irrelevant', { '00000001': '161616' });
    }).toThrow('Marking key for version 00009999 not found.');
  });

  it('handles empty teleform data gracefully', () => {
    readTeleform.mockReturnValue([]);
    const result = markExams(TestExam, '', { '00000001': '1616161616' });
    expect(result.summary.totalStudents).toBe(0);
    expect(result.summary.lowestMark).toBe(0);
  });

  it('subset bitmask should be marked correct', () => {
    readTeleform.mockReturnValue([
      {
        studentId: 'bug123',
        firstName: 'Buggy',
        lastName: 'Mask',
        versionId: '00000001',
        answerString: '04' // Only option C selected
      }
    ]);

    const exam = {
      ...TestExam,
      examBody: [
        {
          type: 'question',
          questionNumber: 1,
          marks: 1
        }
      ],
      teleformOptions: ['A', 'B', 'C', 'D', 'E']
    };

    const markingKey = { '00000001': '06' }; // correct: 0110 (B and C)

    const results = markExams(exam, 'irrelevant', markingKey);
    const q = results.all[0].questions[0];

    expect(q.isCorrect).toBe(true);
  });
});