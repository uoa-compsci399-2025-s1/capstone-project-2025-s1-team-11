#!/usr/bin/env node

// Use npm run dump:docx for output in console

import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { parseDocxBuffer } from '../src/parsers/docxParser.js';
import { buildDocxDTO } from '../src/dto/docxDTO.js';

async function dump() {
    // 1. Load your .docx fixture
    const buffer = fs.readFileSync(path.join('cypress', 'fixtures', 'docx', 'valid_exam_control.docx')); // change this file for different test input files
    // 2. Turn it into an ArrayBuffer
    const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
    );
    // 3. Parse & build your DTO
    const dom = await parseDocxBuffer(arrayBuffer);
    const dto = buildDocxDTO(dom);
    // 4. Print it prettily
    console.log(JSON.stringify(dto, null, 2));
}

dump().catch(err => {
    console.error(err);
    process.exit(1);
});