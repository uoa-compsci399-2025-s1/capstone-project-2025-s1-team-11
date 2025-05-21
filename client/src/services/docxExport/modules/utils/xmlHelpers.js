// XML parsing configuration
import {XMLBuilder, XMLParser} from "fast-xml-parser";

export const xmlParserOptions = {
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    preserveOrder: true,
    trimValues: false
};
export const xmlBuilder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    preserveOrder: true,
    format: true
});
export const xmlParser = new XMLParser(xmlParserOptions);

/**
 * Ensures whitespace is preserved in text nodes
 */
export function preserveWhitespace(obj) {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
        obj.forEach(preserveWhitespace);
        return;
    }

    // Handle text nodes - just ensure the preserve attribute is set
    if ('w:t' in obj && !obj[':@']?.['@_xml:space']) {
        if (!obj[':@']) obj[':@'] = {};
        obj[':@']['@_xml:space'] = 'preserve';
    }

    // Recursively process all object properties
    for (const [, value] of Object.entries(obj)) {        //removed first array element "key"
        if (typeof value === 'object' && value !== null) {
            preserveWhitespace(value);
        }
    }
}