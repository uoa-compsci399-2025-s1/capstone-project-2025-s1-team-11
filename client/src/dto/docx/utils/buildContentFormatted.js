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
    if (!ommlElement || typeof ommlElement !== 'object') {
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
        return null;
    }

    // Find the paragraph in the XML using the ID
    const paraRegex = new RegExp(`<w:p[^>]*w14:paraId="${paraId}"[^>]*>(.*?)</w:p>`, 's');
    const match = documentXml.match(paraRegex);

    if (match) {
        return `<w:p${match[0].substring(4)}`; // Include the full paragraph with attributes
    }

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

    // Try to get the original paragraph XML for correct ordering
    let orderedChildren = [];

    if (documentXml) {
        const paragraphXml = extractParagraphXml(documentXml, para);
        if (paragraphXml) {
            orderedChildren = parseParagraphChildrenFromXml(paragraphXml);
        }
    }

    // Fallback: if we can't get XML order, use the original JSON-based approach
    if (orderedChildren.length === 0) {
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

    // Helper function to extract raw text from a single run without processing
    const extractRawTextFromRun = (run) => {
        if (!run) return '';

        // Handle line breaks
        let text = '';
        if (run['w:br'] !== undefined) {
            text += '<br>';
        }

        // Handle images
        if (run['w:drawing']) {
            const inline = run['w:drawing']['wp:inline'];
            const anchor = run['w:drawing']['wp:anchor'];
            let embedId = null;

            if (inline) {
                const blip = inline?.['a:graphic']?.['a:graphicData']?.['pic:pic']?.['pic:blipFill']?.['a:blip'];
                embedId = blip?.['@_r:embed'];
            }
            if (!embedId && anchor) {
                const blip = anchor?.['a:graphic']?.['a:graphicData']?.['pic:pic']?.['pic:blipFill']?.['a:blip'];
                embedId = blip?.['@_r:embed'];
            }

            if (embedId && imageData[embedId]) {
                const imgData = imageData[embedId];
                const width = imgData.width ? ` width="${Math.round(imgData.width)}"` : '';
                const height = imgData.height ? ` height="${Math.round(imgData.height)}"` : '';
                const alt = imgData.filename || 'Image';
                text += `<img alt="${alt}" src="${imgData.dataUrl}"${width}${height}>`;
            } else {
                text += `<img alt="Image" src="[Image Placeholder]">`;
            }
        }

        // Extract text content preserving original spacing
        const t = run['w:t'];
        let textContent = '';

        if (typeof t === 'string') {
            textContent = t;
        } else if (typeof t === 'number') {
            textContent = String(t);
        } else if (typeof t === 'object' && t) {
            if (t['#text']) {
                textContent = t['#text'];
            }
        }

        // Apply basic formatting if needed
        if (textContent) {
            const rPr = run['w:rPr'];
            if (rPr) {
                if (rPr['w:b'] !== undefined) textContent = `<strong>${textContent}</strong>`;
                if (rPr['w:i'] !== undefined) textContent = `<em>${textContent}</em>`;
                if (rPr['w:u'] !== undefined) textContent = `<u>${textContent}</u>`;

                if (rPr['w:vertAlign']) {
                    const vertAlign = rPr['w:vertAlign'];
                    const val = vertAlign['@_w:val'] || vertAlign['w:val'] || vertAlign?.['$']?.['w:val'];
                    if (val === 'subscript') textContent = `<sub>${textContent}</sub>`;
                    else if (val === 'superscript') textContent = `<sup>${textContent}</sup>`;
                }
            }
        }

        text += textContent;
        return text;
    };

    // Process each child in XML order
    for (const child of orderedChildren) {
        if (child.type === 'w:r' && runIndex < runs.length) {
            // Use raw text extraction to preserve original spacing
            const runText = extractRawTextFromRun(runs[runIndex]);
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

            result += `[math:${mathId}]`;
            mathIndex++;
        }
        // Skip other element types like w:proofErr for now
    }

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

    let content;

    // If we have a parent paragraph and need to preserve math, use sequential processing
    if (parentPara && preserveMath) {
        content = processSequentialParagraphContent(parentPara, documentXml, options);
    } else {
        content = extractPlainText(runs, { relationships, imageData });
    }

    // Remove marks pattern if requested
    if (removeMarks) {
        const beforeMarks = content;
        content = content.replace(/^\[\d+(?:\.\d+)?\s*marks?\]\s*/i, '');
    }

    // Process multiple br tags to preserve spacing
    content = content.replace(/<br>/g, '<br>');

    return content;
};