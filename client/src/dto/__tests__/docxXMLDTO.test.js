import path from 'path';
import { promises as fs } from 'fs';
import { parseRawDocx } from '../../parsers/rawDocxParser.js';
import { buildDocxDTOFromXml } from '../docxXMLDTO.js';

describe('DOCX to DTO integration (raw XML)', () => {
    test('should convert valid DOCX to a structured DTO object', async () => {
        const filePath = path.resolve('cypress/fixtures/docx/valid_exam_control2.docx');
        const buffer = await fs.readFile(filePath);
        const arrayBuffer = new Uint8Array(buffer).buffer;

        const { doc, rels, zip } = await parseRawDocx(arrayBuffer);
        const dto = await buildDocxDTOFromXml(doc, rels, zip);

        expect(dto).toBeDefined();
        expect(dto.questions).toBeInstanceOf(Array);
        expect(dto.questions.length).toBeGreaterThan(0);

        const q0 = dto.questions[0];
        expect(q0).toHaveProperty('questionNo');
        expect(q0).toHaveProperty('questionText');
        expect(q0).toHaveProperty('answers');
        expect(q0.answers).toBeInstanceOf(Array);
        expect(q0.answers.length).toBeGreaterThan(0);
        expect(q0.correctAnswers).toBeInstanceOf(Array);
        expect(q0.correctAnswers.filter(x => x === 1).length).toBe(1);
    });
});
