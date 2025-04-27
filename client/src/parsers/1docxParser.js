// src/parsers/1docxParser.js

import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
});

/**
 * Unzips and parses essential parts of a .docx file:
 * - document.xml: main content (text, formatting)
 * - document.xml.rels: maps image/media references
 * - zip: JSZip archive for accessing embedded files (e.g. images)
 *
 * @param {ArrayBuffer} arrayBuffer - Raw .docx binary buffer
 * @returns {Promise<{ doc: object, rels: object, zip: JSZip }>}
 */
export async function parseRawDocx(arrayBuffer) {
    try {
        const zip = await JSZip.loadAsync(arrayBuffer);

        // Load and parse core document files
        const [documentXml, relsXml] = await Promise.all([
            zip.file('word/document.xml')?.async('string'),
            zip.file('word/_rels/document.xml.rels')?.async('string'),
        ]);

        if (!documentXml || !relsXml) {
            throw new Error('Missing essential .docx components');
        }

        const doc = xmlParser.parse(documentXml);
        const rels = xmlParser.parse(relsXml);

        return { doc, rels, zip };
    } catch (err) {
        console.error('Failed to parse DOCX:', err);
        throw err;
    }
}