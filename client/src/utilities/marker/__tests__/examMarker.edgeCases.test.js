import { markExams } from '../examMarker';
import TestExam from './Test.json';

jest.mock('../../../store/store.js', () => ({
  store: { dispatch: jest.fn() }
}));

jest.mock('../teleformReader.js', () => ({
  readTeleform: jest.fn()
}));

import { readTeleform } from '../teleformReader';

const baseExam = { ...TestExam };
baseExam.examBody = baseExam.examBody.filter(e => e.type === 'question').slice(0, 3);
baseExam.examBody[0].marks = undefined;
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
    answerString: '0E', // bitmask 1110, superset of 0110 (6)
    markingKey: { '00000001': '06' },
    expectedMarks: 1
  },
  {
    name: '11_missing_teleformOptions',
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

      const exam = examOverride || baseExam;
      const result = markExams(exam, 'teleform', markingKey);
      const total = result.all[0]?.totalMarks || 0;
      expect(total).toBe(expectedMarks);
    });
  });
});