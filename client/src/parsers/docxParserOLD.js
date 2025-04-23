import * as mammoth from 'mammoth';
import { JSDOM } from 'jsdom';

export async function parseDocxBuffer(arrayBuffer) {
    const { value: htmlString } = await mammoth.convertToHtml({
        buffer: arrayBuffer,
    });

    const dom = new JSDOM(htmlString);
    const doc = dom.window.document;
    return doc;
}