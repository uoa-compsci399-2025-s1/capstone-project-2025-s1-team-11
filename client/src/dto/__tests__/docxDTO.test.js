import { parseDocxBuffer } from '../../parsers/docxParser.js';
import { buildDocxDTO } from '../docxDTO.js';
import { promises as fs } from 'fs';
import path from 'path';

describe('DOCX to DTO integration', () => {
    test('should convert valid DOCX to a structured DTO object', async () => {
        const filePath = path.resolve('cypress/fixtures/docx/valid_exam_control.docx');

        const buffer = await fs.readFile(filePath);
        const arrayBuffer = new Uint8Array(buffer).buffer;

        const dom = await parseDocxBuffer(arrayBuffer);
        const dto = buildDocxDTO(dom);

        // ✅ Output formatted DTO content to console
        // console.log('\n==== Preview of parsed exam DTO ====');
        // console.log(`Title: ${dto.title}`);
        // console.log(`Questions (${dto.questions.length} total):\n`);
        //
        // dto.questions.forEach((q, idx) => {
        //     console.log(`Q${idx + 1}:`);
        //     console.log(`Content HTML:\n${q.content}`);
        //     console.log(`Options:\n${q.options.map((opt, i) => `  ${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}`);
        //     console.log('---\n');
        // });

        // ✅ Basic assertions
        expect(dto).toBeDefined();
        expect(dto.questions).toBeInstanceOf(Array);
        expect(dto.questions.length).toBeGreaterThan(0);
        expect(dto.questions[0]).toHaveProperty('id');
        expect(dto.questions[0]).toHaveProperty('content');
        expect(dto.questions[0].options).toBeInstanceOf(Array);
    });
});