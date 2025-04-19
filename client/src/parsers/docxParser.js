import * as mammoth from 'mammoth';

/**
 * Converts .docx arrayBuffer into HTML DOM.
 *
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Document} Parsed DOM
 */
export async function parseDocxBuffer(arrayBuffer) {
    const { value: htmlString } = await mammoth.convertToHtml({
        buffer: arrayBuffer, // ✅ FIXED: use correct key name
    });

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    return doc;
}