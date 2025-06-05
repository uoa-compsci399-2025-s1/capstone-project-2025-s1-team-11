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
    format: true,
    suppressEmptyNode: false,
    suppressBooleanAttributes: false,
    // CRITICAL FIX: Prevent re-escaping of content that's already been processed
    // This stops the XMLBuilder from escaping math content we've already unescaped
    tagValueProcessor: (tagName, tagValue) => {
        // Don't escape content in text nodes - we've already processed it
        if (tagName === 'w:t' && typeof tagValue === 'string') {
            // If the content contains math markers or already contains unescaped XML,
            // return it as-is without further escaping
            if (tagValue.includes('<m:') || tagValue.includes('§MATH_')) {
                return tagValue;
            }
        }
        // For all other content, use default processing (which includes escaping)
        return tagValue;
    }
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