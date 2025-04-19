import fs from 'fs';
import path from 'path';
import { parseDocxBuffer } from '../../parsers/docxParser.js';
import { buildDocxDTO } from '../docxDTO.js';

describe('DOCX to DTO integration', () => {
    test('should convert valid DOCX to a structured DTO object', async () => {
        const filePath = path.resolve('cypress/fixtures/docx/valid_exam_control.docx');
        const buffer = fs.readFileSync(filePath);

        // 🧠 Fix: convert node Buffer to ArrayBuffer properly
        const arrayBuffer = Uint8Array.from(buffer).buffer;

        const dom = await parseDocxBuffer(arrayBuffer);
        const dto = buildDocxDTO(dom);

        expect(dto).toBeDefined();
        expect(dto.questions).toBeInstanceOf(Array);
        expect(dto.questions.length).toBe(20); // or however many your test file has
        expect(dto.questions[0]).toHaveProperty('id');
        expect(dto.questions[0]).toHaveProperty('text');
        expect(dto.questions[0].options).toBeInstanceOf(Array);
    });
});