import { generateResultOutput } from '..//outputFormatter';
import TestExam from './Test.json';

describe('generateResultOutput', () => {
  const studentResult = {
    studentId: '123456789',
    firstName: 'Alice',
    lastName: 'Smith',
    versionNumber: '00000001',
    questions: [
      {
        questionNumber: 1,
        studentAnswerLetter: 'A',
        feedback: 'Correct!',
        marks: 1
      },
      {
        questionNumber: 2,
        studentAnswerLetter: 'C',
        feedback: 'Incorrect. Correct answer is A.',
        marks: 0
      }
    ]
  };

  it('generates readable result output', () => {
    const output = generateResultOutput(studentResult, TestExam);

    expect(output).toContain('AUID: 123456789');
    expect(output).toContain('Name: Smith        Alice   ');
    expect(output).toContain('Question: 1');
    expect(output).toContain('Feedback: Correct!');
    expect(output).toContain('Question: 2');
    expect(output).toContain('Feedback: Incorrect. Correct answer is A.');
  });

  it('uses fallback when courseCode is missing', () => {
    const noCode = { ...TestExam, courseCode: null };
    const output = generateResultOutput(studentResult, noCode);
    expect(output).toContain('COURSE CODE MISSING');
  });
});