import { convertExamXmlDTOToJson } from '../convertExamXmlToJson';

test('parses simple exam XML into JSON', () => {
    const xml = `<exam><question>What is 2+2?</question></exam>`;
    const result = convertExamXmlDTOToJson(xml);

    expect(result).toHaveProperty('exam');
    expect(result.exam.question).toBe('What is 2+2?');
});