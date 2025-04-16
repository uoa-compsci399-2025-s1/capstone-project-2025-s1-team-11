import { xmlToJsonExamImporter } from '../xmlToJsonExamImporter.js';
import Exam from '../../models/Exam.js';

// Sample XML input
const sampleXml = \`
<exam>
  <title>Sample Exam</title>
  <date>2025-04-10</date>
  <questions>
    <question>
      <id>q1</id>
      <text>What is 2+2?</text>
      <answer>4</answer>
      <options>
        <option>A. 3</option>
        <option>B. 4</option>
        <option>C. 5</option>
      </options>
    </question>
  </questions>
</exam>\`;

describe('xmlToJsonExamImporter', () => {
  test('parses valid exam XML into an Exam instance', () => {
    const exam = xmlToJsonExamImporter(sampleXml);

    expect(exam).toBeInstanceOf(Exam);
    expect(exam.examTitle).toBe('Sample Exam');
    expect(exam.date).toBe('2025-04-10');
    expect(exam.questions).toHaveLength(1);
    expect(exam.questions[0].text).toBe('What is 2+2?');
    expect(exam.questions[0].answer).toBe('4');
  });

  test('throws error on malformed XML', () => {
    const badXml = '<exam><title>Bad XML</title>'; // missing closing tags

    expect(() => xmlToJsonExamImporter(badXml)).toThrow();
  });
});
