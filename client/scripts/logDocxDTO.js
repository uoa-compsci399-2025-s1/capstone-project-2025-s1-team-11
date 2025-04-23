#!/usr/bin/env node

// Use: npm run dump:docx [--out output.json]

import fs from 'fs';
import path from 'path';
import { parseRawDocx } from '../src/parsers/rawDocxParser.js';
import { buildDocxDTOFromXml } from '../src/dto/docxXMLDTO.js';

function getOutputPath() {
    const arg = process.argv.find(arg => arg.startsWith('--out='));
    if (arg) return path.resolve(arg.split('=')[1]);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportDir = path.join('exports', 'json');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });
    return path.join(exportDir, `parsed_exam_${timestamp}.json`);
}

async function dump() {
    const filePath = path.join('cypress', 'fixtures', 'docx', 'valid_exam_control2.docx');
    const buffer = fs.readFileSync(filePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    const { doc, rels, zip } = await parseRawDocx(arrayBuffer);

    // TEMP: log all paragraph text content for debugging
    // const paragraphs = doc['w:document']['w:body']['w:p'] || [];
    // console.log(`🧩 Found ${paragraphs.length} paragraphs\n`);
    // for (const p of paragraphs) {
    //     const runs = Array.isArray(p['w:r']) ? p['w:r'] : p['w:r'] ? [p['w:r']] : [];
    //     const extractText = (r) => {
    //         const t = r?.['w:t'];
    //         if (!t) return '';
    //         if (typeof t === 'string') return t;
    //         if (typeof t === 'object' && '#text' in t) return t['#text'];
    //         if (Array.isArray(t)) return t.map(part => typeof part === 'string' ? part : part['#text'] || '').join('');
    //         return '';
    //     };
    //     const text = runs.map(extractText).join('').trim();
    //     console.log('[DEBUG Paragraph]:', text || '(empty)');
    // }

    const dto = await buildDocxDTOFromXml(doc, rels, zip);

    // console.log(JSON.stringify(dto, null, 2));
    const outPath = getOutputPath();
    fs.writeFileSync(outPath, JSON.stringify(dto, null, 2));
    console.log(`Exported .docx DTO to: ${outPath}\n`);
}

dump().catch(err => {
    console.error(err);
    process.exit(1);
});