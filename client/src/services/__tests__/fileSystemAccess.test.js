const mockXML = `<exam><question>What is 2+2?</question></exam>`;
const mockQTI = `<assessmentItem><itemBody><p>QTI Question</p></itemBody></assessmentItem>`;
const mockTEX = `\\begin{question}What is 2+2?\\end{question}`;
const mockDOCX = 'This is a simulated .docx text content.';

import { parseExamContent } from '../fileSystemAccess'; // assuming this parses based on type

describe('Exam file parsing', () => {
    test('parses .xml file correctly', () => {
        const result = parseExamContent(mockXML, 'xml');
        expect(result).toHaveProperty('exam');
    });

    test('parses .qti file correctly', () => {
        const result = parseExamContent(mockQTI, 'qti');
        expect(result).toHaveProperty('assessmentItem');
    });

    test('parses .tex file correctly', () => {
        const result = parseExamContent(mockTEX, 'tex');
        expect(result).toMatch(/question/i); // adjust to match your parsing output
    });

    test('handles .docx file correctly', () => {
        const result = parseExamContent(mockDOCX, 'docx');
        expect(result).toMatch(/simulated/i); // depends on your docx parsing
    });
});

export function detectFileType(filename) {
    return filename.split('.').pop().toLowerCase();
}