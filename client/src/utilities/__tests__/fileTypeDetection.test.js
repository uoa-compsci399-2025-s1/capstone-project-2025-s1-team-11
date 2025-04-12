import { detectFileType } from '../fileTypeDetection';

describe('File type detection utility', () => {
    test('correctly detects file extensions', () => {
        expect(detectFileType('example.docx')).toBe('docx');
        expect(detectFileType('file.QTI')).toBe('qti');
        expect(detectFileType('test.xml')).toBe('xml');
        expect(detectFileType('latex-file.TEX')).toBe('tex');
    });

    test('handles files without an extension', () => {
        expect(detectFileType('README')).toBe('readme');
    });
});