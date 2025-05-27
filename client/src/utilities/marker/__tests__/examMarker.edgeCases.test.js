import { markExams } from '../examMarker';
import TestExam from './Test.json';

// Mock the store module with a factory that doesn't reference external variables
jest.mock('../../../store/store.js', () => ({
  store: {
    getState: jest.fn(),
    dispatch: jest.fn()
  }
}));

jest.mock('../teleformReader.js', () => ({
  readTeleform: jest.fn()
}));

import { readTeleform } from '../teleformReader';
import { store } from '../../../store/store';

const baseExam = { ...TestExam };
baseExam.examBody = baseExam.examBody.filter(e => e.type === 'question').slice(0, 3);
baseExam.examBody.forEach(q => { q.marks = 1; });
baseExam.teleformOptions = ['a', 'b', 'c', 'd', 'e'];

const testCases = [
  {
    name: '2_no_answer',
    answerString: '00',
    markingKey: { '00000001': '16' },
    expectedMarks: 0
  },
  {
    name: '4_orphan_key',
    answerString: '16',
    markingKey: { '00000001': '16', '99999999': '08' },
    expectedMarks: 1
  },
  {
    name: '5_too_many_answers',
    answerString: '1616161616',
    markingKey: { '00000001': '161616' },
    expectedMarks: 3
  },
  {
    name: '6_too_few_answers',
    answerString: '16',
    markingKey: { '00000001': '161616' },
    expectedMarks: 1
  },
  {
    name: '7_invalid_string',
    answerString: '1X', // should parse as NaN -> 0
    markingKey: { '00000001': '16' },
    expectedMarks: 0
  },
  {
    name: '8_no_questions',
    answerString: '16',
    markingKey: { '00000001': '16' },
    expectedMarks: 0,
    examOverride: { ...baseExam, examBody: [] }
  },
  {
    name: '10_superset_answer',
    answerString: '14', // bitmask 1110, superset of 0110 (6)
    markingKey: { '00000001': '06' },
    expectedMarks: 1
  },
  {
    name: '11_subsets',
    answerString: '010208', // 10 subset examples, 1 non subset 
    markingKey: { '00000001': '030331' },
    expectedMarks: 3
  },
  {
    name: '12_not_subsets',
    answerString: '0101', // (for answer 01, key 30: 0001 not in 1110)
    markingKey: { '00000001': '0630' },
    expectedMarks: 0
  }, 
  {
    name: '13_gap in answers',
    answerString: '16  16', // unanswered question will be a two space gap
    markingKey: { '00000001': '161616' },
    expectedMarks: 2
  },
  {
    name: '12_not_subsets',
    answerString: '0101', // (for answer 01, key 30: 0001 not in 1110)
    markingKey: { '00000001': '0630' },
    expectedMarks: 0
  }, 
  {
    name: '13_gap in answers',
    answerString: '16  16', // unanswered question will be a two space gap
    markingKey: { '00000001': '161616' },
    expectedMarks: 2
  },
  {
    name: '14_missing_teleformOptions',
    answerString: '16',
    markingKey: { '00000001': '16' },
    expectedMarks: 1,
    examOverride: (() => {
      const clone = JSON.parse(JSON.stringify(baseExam));
      delete clone.teleformOptions;
      return clone;
    })()
  }
];

describe('markExams edge cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  testCases.forEach(({ name, answerString, markingKey, expectedMarks, examOverride }) => {
    it(name, () => {
      readTeleform.mockReturnValue([
        {
          studentId: 's123',
          firstName: 'Edge',
          lastName: 'Case',
          versionId: '00000001',
          answerString
        }
      ]);

      const exam = examOverride || TestExam;
      
      // Mock the store state with the correct exam data
      store.getState.mockReturnValue({
        exam: {
          examData: exam
        }
      });

      const result = markExams(exam, 'teleform', markingKey);
      const total = result.all[0]?.totalMarks || 0;
      expect(total).toBe(expectedMarks);
    });
  });
});