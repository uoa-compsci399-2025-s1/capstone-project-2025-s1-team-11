// client/docxDTO/utils/buildContentFormatted.js

import { extractPlainText } from './extractPlainText.js';

/**
 * Detect math elements in a paragraph
 * @param {Object} para - Paragraph object
 * @returns {Array} - Array of math elements
 */
export const detectMathElements = (para) => {
    const mathElements = [];

    if (!para) return mathElements;

    // Check for math at the paragraph level
    if (para['m:oMath']) {
        if (Array.isArray(para['m:oMath'])) {
            mathElements.push(...para['m:oMath']);
        } else {
            mathElements.push(para['m:oMath']);
        }
    }

    // Check for math in oMathPara
    if (para['m:oMathPara']) {
        if (Array.isArray(para['m:oMathPara'])) {
            para['m:oMathPara'].forEach(mathPara => {
                if (mathPara['m:oMath']) {
                    if (Array.isArray(mathPara['m:oMath'])) {
                        mathElements.push(...mathPara['m:oMath']);
                    } else {
                        mathElements.push(mathPara['m:oMath']);
                    }
                }
            });
        } else if (para['m:oMathPara']['m:oMath']) {
            if (Array.isArray(para['m:oMathPara']['m:oMath'])) {
                mathElements.push(...para['m:oMathPara']['m:oMath']);
            } else {
                mathElements.push(para['m:oMathPara']['m:oMath']);
            }
        }
    }

    return mathElements;
};

/**
 * Serialize OMML element back to XML string
 * @param {Object} ommlElement - Parsed OMML element
 * @returns {string} - XML string representation
 */
function serializeOmmlToXml(ommlElement) {

    console.log('=== SERIALIZE OMML DEBUG ===');
    console.log('Input element type:', typeof ommlElement);
    console.log('Input element keys:', Object.keys(ommlElement));
    console.log('Sample element structure:', JSON.stringify(ommlElement).substring(0, 200));

    if (!ommlElement || typeof ommlElement !== 'object') {
        console.log('Invalid element, returning empty');
        return '';
    }

    const convertObjectToXml = (obj, tagName = '') => {
        if (typeof obj === 'string' || typeof obj === 'number') {
            return String(obj);
        }

        if (Array.isArray(obj)) {
            return obj.map(item => convertObjectToXml(item, tagName)).join('');
        }

        if (typeof obj === 'object') {
            let xml = '';

            for (const [key, value] of Object.entries(obj)) {
                if (key.startsWith('@_')) {
                    // Skip attributes for now, they'll be handled when processing the parent element
                    continue;
                }

                const attributes = [];
                // Collect attributes for this element
                const attrKey = '@_' + key.split(':').pop();
                if (obj[attrKey]) {
                    for (const [attrName, attrValue] of Object.entries(obj[attrKey])) {
                        if (attrName.startsWith('@_')) {
                            const cleanAttrName = attrName.substring(2);
                            attributes.push(`${cleanAttrName}="${attrValue}"`);
                        }
                    }
                }

                const attrString = attributes.length > 0 ? ` ${attributes.join(' ')}` : '';

                if (value === null || value === undefined) {
                    xml += `<${key}${attrString}/>`;
                } else if (typeof value === 'string' || typeof value === 'number') {
                    xml += `<${key}${attrString}>${value}</${key}>`;
                } else {
                    const innerXml = convertObjectToXml(value, key);
                    if (innerXml) {
                        xml += `<${key}${attrString}>${innerXml}</${key}>`;
                    } else {
                        xml += `<${key}${attrString}/>`;
                    }
                }
            }

            return xml;
        }

        return '';
    };


    const result = convertObjectToXml(ommlElement);
    console.log('Serialization result:', result.substring(0, 100));
    console.log('=== END SERIALIZE OMML DEBUG ===');
    return result;
}

/**
 * Extract paragraph XML from the full document XML using paragraph ID
 * @param {string} documentXml - Full document XML string
 * @param {Object} para - Paragraph object with ID
 * @returns {string|null} - Paragraph XML string or null if not found
 */
function extractParagraphXml(documentXml, para) {
    if (!documentXml || !para) return null;

    // Try to find paragraph ID in the para object
    const paraId = para['@_w14:paraId'] || para['@_w:paraId'];
    if (!paraId) {
        console.log('No paragraph ID found, cannot extract XML');
        return null;
    }

    // Find the paragraph in the XML using the ID
    const paraRegex = new RegExp(`<w:p[^>]*w14:paraId="${paraId}"[^>]*>(.*?)</w:p>`, 's');
    const match = documentXml.match(paraRegex);

    if (match) {
        return `<w:p${match[0].substring(4)}`; // Include the full paragraph with attributes
    }

    console.log(`Could not find paragraph with ID ${paraId} in XML`);
    return null;
}

/**
 * Parse paragraph XML to get children in correct order
 * @param {string} paragraphXml - Paragraph XML string
 * @returns {Array} - Array of child elements in document order
 */
function parseParagraphChildrenFromXml(paragraphXml) {
    if (!paragraphXml) return [];

    const children = [];

    // Simple regex to find all direct children of the paragraph
    // This matches w:r, m:oMath, m:oMathPara, w:br, etc.
    const childRegex = /<(w:r|m:oMath|m:oMathPara|w:br|w:proofErr)(?:\s[^>]*)?>(?:.*?<\/\1>|)/gs;

    let match;
    let position = 0;

    while ((match = childRegex.exec(paragraphXml)) !== null) {
        const tagName = match[1];
        const fullElement = match[0];

        children.push({
            type: tagName,
            xml: fullElement,
            position: position++
        });
    }

    console.log(`Parsed ${children.length} children from paragraph XML`);
    return children;
}

/**
 * Process paragraph children in exact document order using original XML
 * @param {Object} para - Paragraph object
 * @param {string} documentXml - Original document XML
 * @param {Object} options - Processing options
 * @returns {string} - Content with math placeholders in correct positions
 */
function processSequentialParagraphContent(para, documentXml, options = {}) {
    const {
        removeMarks = false,
        relationships = {},
        imageData = {},
        preserveMath = true,
        mathRegistry = {}
    } = options;

    if (!para) return '';

    console.log('=== SEQUENTIAL PARAGRAPH PROCESSING ===');
    console.log('Paragraph keys:', Object.keys(para));

    // Try to get the original paragraph XML for correct ordering
    let orderedChildren = [];

    if (documentXml) {
        const paragraphXml = extractParagraphXml(documentXml, para);
        if (paragraphXml) {
            console.log('Successfully extracted paragraph XML, parsing children...');
            orderedChildren = parseParagraphChildrenFromXml(paragraphXml);
        }
    }

    // Fallback: if we can't get XML order, use the original JSON-based approach
    if (orderedChildren.length === 0) {
        console.log('Falling back to JSON-based processing');
        return processParagraphFromJson(para, options);
    }

    // Process children in their exact XML document order
    let result = '';
    let mathIndex = 0;
    let runIndex = 0;

    // Get arrays from the JSON for easy access
    const runs = Array.isArray(para['w:r']) ? para['w:r'] : (para['w:r'] ? [para['w:r']] : []);
    const mathElements = [];

    // Collect math elements from JSON
    if (para['m:oMath']) {
        const elements = Array.isArray(para['m:oMath']) ? para['m:oMath'] : [para['m:oMath']];
        elements.forEach(elem => mathElements.push({ element: elem, isBlockMath: false }));
    }
    if (para['m:oMathPara']) {
        const mathParas = Array.isArray(para['m:oMathPara']) ? para['m:oMathPara'] : [para['m:oMathPara']];
        mathParas.forEach(mathPara => {
            if (mathPara['m:oMath']) {
                const elements = Array.isArray(mathPara['m:oMath']) ? mathPara['m:oMath'] : [mathPara['m:oMath']];
                elements.forEach(elem => mathElements.push({ element: elem, isBlockMath: true }));
            }
        });
    }

    // Process each child in XML order
    for (const child of orderedChildren) {
        if (child.type === 'w:r' && runIndex < runs.length) {
            // Process text run
            const runText = extractPlainText([runs[runIndex]], { relationships, imageData });
            console.log(`Processing run ${runIndex}: "${runText}"`);
            result += runText;
            runIndex++;

        } else if (child.type === 'm:oMath' && mathIndex < mathElements.length && preserveMath) {
            // Process inline math element
            const mathElement = mathElements[mathIndex];
            const simpleHash = Math.abs(JSON.stringify(mathElement.element).split('').reduce((a, b) => {
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
            }, 0)).toString(36);
            const mathId = `math-${simpleHash}-${mathIndex}`;

            // Store complete OMML in registry
            mathRegistry[mathId] = {
                type: "omml",
                originalXml: serializeOmmlToXml(mathElement.element),
                context: mathElement.isBlockMath ? "block" : "inline",
                placeholder: `[math]`
            };

            console.log(`Inserted math ${mathIndex} at correct XML position: ${mathElement.isBlockMath ? 'block' : 'inline'}`);
            result += `[math:${mathId}]`;
            mathIndex++;

        } else if (child.type === 'm:oMathPara' && mathIndex < mathElements.length && preserveMath) {
            // Process block math element (similar to above but mark as block)
            const mathElement = mathElements[mathIndex];
            const simpleHash = Math.abs(JSON.stringify(mathElement.element).split('').reduce((a, b) => {
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
            }, 0)).toString(36);
            const mathId = `math-${simpleHash}-${mathIndex}`;

            mathRegistry[mathId] = {
                type: "omml",
                originalXml: serializeOmmlToXml(mathElement.element),
                context: "block",
                placeholder: `[math]`
            };

            console.log(`Inserted block math ${mathIndex} at correct XML position`);
            result += `[math:${mathId}]`;
            mathIndex++;
        }
        // Skip other element types like w:proofErr for now
    }

    console.log('Sequential processing result:', JSON.stringify(result));
    console.log('=== END SEQUENTIAL PARAGRAPH PROCESSING ===');

    return result;
}

/**
 * Fallback: process paragraph from JSON structure (original logic)
 * @param {Object} para - Paragraph object
 * @param {Object} options - Processing options
 * @returns {string} - Content string
 */
function processParagraphFromJson(para, options = {}) {
    const {
        relationships = {},
        imageData = {},
        preserveMath = true,
        mathRegistry = {}
    } = options;

    console.log('Using fallback JSON processing');

    // Get text runs and process them
    const runs = Array.isArray(para['w:r']) ? para['w:r'] : (para['w:r'] ? [para['w:r']] : []);
    let result = extractPlainText(runs, { relationships, imageData });

    // Add math placeholders at the end (original behavior)
    if (preserveMath) {
        const mathElements = detectMathElements(para);
        mathElements.forEach((mathElement, index) => {
            const simpleHash = Math.abs(JSON.stringify(mathElement).split('').reduce((a, b) => {
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
            }, 0)).toString(36);
            const mathId = `math-${simpleHash}-${index}`;

            mathRegistry[mathId] = {
                type: "omml",
                originalXml: serializeOmmlToXml(mathElement),
                context: "inline",
                placeholder: `[math]`
            };

            result += `[math:${mathId}]`;
        });
    }

    return result;
}

/**
 * Build HTML formatted content from Word document runs, processing math elements as needed
 * @param {Array} runs - Array of Word document run elements
 * @param {Object} options - Processing options
 * @param {boolean} options.removeMarks - Whether to remove marks pattern
 * @param {Object} options.relationships - Document relationships
 * @param {Object} options.imageData - Image data mapping
 * @param {boolean} options.preserveMath - Whether to preserve math elements
 * @param {Object} options.mathRegistry - Registry to store math elements
 * @param {Object} parentPara - Parent paragraph object
 * @param {string} documentXml - Original document XML string
 * @returns {string} Formatted content string
 */
export const buildContentFormatted = (runs, options = {}, parentPara = null, documentXml = null) => {
    const {
        removeMarks = false,
        relationships = {},
        imageData = {},
        preserveMath = true,
        mathRegistry = {}
    } = options;

    console.log('=== BUILD CONTENT FORMATTED ===');
    console.log('Number of runs to process:', runs ? runs.length : 0);
    console.log('Preserve math:', preserveMath);
    console.log('Parent para has math?', parentPara ? (detectMathElements(parentPara).length > 0) : false);
    console.log('Has document XML?', !!documentXml);

    let content;

    // If we have a parent paragraph and need to preserve math, use sequential processing
    if (parentPara && preserveMath) {
        console.log('Using sequential paragraph processing for proper math positioning');
        content = processSequentialParagraphContent(parentPara, documentXml, options);
    } else {
        // Fallback to original run-only processing
        console.log('Using standard run processing (no parent paragraph or math preservation disabled)');
        content = extractPlainText(runs, { relationships, imageData });
    }

    console.log('Content after processing:', JSON.stringify(content));

    // Remove marks pattern if requested
    if (removeMarks) {
        const beforeMarks = content;
        content = content.replace(/^\[\d+(?:\.\d+)?\s*marks?\]\s*/i, '');
        if (beforeMarks !== content) {
            console.log('Removed marks pattern, new content:', JSON.stringify(content));
        }
    }

    // Process multiple br tags to preserve spacing
    content = content.replace(/<br>/g, '<br>');

    console.log('Final content:', JSON.stringify(content));
    console.log('=== END BUILD CONTENT FORMATTED ===');

    return content;
};