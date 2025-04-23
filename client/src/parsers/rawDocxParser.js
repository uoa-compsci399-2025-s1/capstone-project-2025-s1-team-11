// src/parsers/rawDocxParser.js

import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

/**
 * Unzips and parses a raw .docx file to extract:
 * - document XML (paragraphs, bookmarks, etc)
 * - relationships (for image mapping)
 * - the zip archive (for image file access)
 *
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<{ doc: object, rels: object, zip: JSZip }>} parsed components
 */
export async function parseRawDocx(arrayBuffer) {
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Extract raw XML files
    const documentXml = await zip.file("word/document.xml").async("string");
    const relsXml = await zip.file("word/_rels/document.xml.rels").async("string");

    // Parse both XMLs to JSON
    const doc = xmlParser.parse(documentXml);
    const rels = xmlParser.parse(relsXml);

    return {
        doc,
        rels,
        zip,
    };
}
