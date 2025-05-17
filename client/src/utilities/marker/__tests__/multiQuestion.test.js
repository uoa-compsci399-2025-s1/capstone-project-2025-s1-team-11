import { markQuestion } from '../examMarker';

describe('markQuestion - single or multiple correct options', () => {
  const correctAnswer = 1 | 8; // A + D = bitmask 9

  const testCases = [
    { label: 'Select A only', student: 1, expected: true },
    { label: 'Select D only', student: 8, expected: true },
    { label: 'Select A + D', student: 9, expected: true },
    { label: 'Select B only', student: 2, expected: false },
    { label: 'Select E only', student: 16, expected: false },
    { label: 'Select B + C', student: 2 | 4, expected: false },
    { label: 'Select A + B', student: 1 | 2, expected: true },
    { label: 'Select D + E', student: 8 | 16, expected: true },
    { label: 'Select nothing', student: 0, expected: false },
  ];

  testCases.forEach(({ label, student, expected }) => {
    it(`${label} => ${expected ? '✔️' : '❌'}`, () => {
      const { isCorrect, marks } = markQuestion(correctAnswer, student, 1);
      expect(isCorrect).toBe(expected);
      expect(marks).toBe(expected ? 1 : 0);
    });
  });
});