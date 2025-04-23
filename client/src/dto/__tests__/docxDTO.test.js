import { parseDocxBuffer } from '../../parsers/docxParserOLD.js';
import { buildDocxDTO } from '../docxDTOOLD.js';
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