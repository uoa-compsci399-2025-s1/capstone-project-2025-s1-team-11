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
 * Process paragraph children in exact document order using pre-extracted math elements
 * @param {Object} para - Paragraph object
 * @param {string} documentXml - Original document XML
 * @param {Object} options - Processing options
 * @param {Array} mathElementsWithXml - Pre-extracted math elements with original XML
 * @param {Object} globalCounters - Global counters for tracking across paragraphs
 * @returns {string} - Content with math placeholders in correct positions
 */
function processSequentialParagraphContent(para, documentXml, options = {}, mathElementsWithXml = [], globalCounters = {}) {
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
        return processParagraphFromJson(para, options, mathElementsWithXml, globalCounters);
    }

    // Process children in their exact XML document order
    let result = '';
    let mathIndex = 0;
    let runIndex = 0;

    // Get arrays from the JSON for easy access
    const runs = Array.isArray(para['w:r']) ? para['w:r'] : (para['w:r'] ? [para['w:r']] : []);

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

        } else if ((child.type === 'm:oMath' || child.type === 'm:oMathPara') && mathIndex < mathElementsWithXml.length && preserveMath) {
            // Process math element using the pre-extracted original XML
            const mathElementWithXml = mathElementsWithXml[mathIndex];

            // Use the pre-extracted ID or generate one
            const mathId = mathElementWithXml.id || `math-preextracted-${mathIndex}`;

            // Use the original XML that was extracted during document parsing
            const originalXml = mathElementWithXml.originalXml || '';

            console.log(`Processing math element ${mathIndex}: ID=${mathId}, XML length=${originalXml.length}`);

            // Store original XML in registry
            mathRegistry[mathId] = {
                type: "omml",
                originalXml: originalXml,
                context: mathElementWithXml.isBlockMath ? "block" : "inline",
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
 * @param {Array} mathElementsWithXml - Pre-extracted math elements with original XML
 * @param {Object} globalCounters - Global counters for tracking across paragraphs
 * @returns {string} - Content string
 */
function processParagraphFromJson(para, options = {}, mathElementsWithXml = [], globalCounters = {}) {
    const {
        relationships = {},
        imageData = {},
        preserveMath = true,
        mathRegistry = {}
    } = options;

    // Get text runs and process them
    const runs = Array.isArray(para['w:r']) ? para['w:r'] : (para['w:r'] ? [para['w:r']] : []);
    let result = extractPlainText(runs, { relationships, imageData });

    // Add math placeholders using pre-extracted math elements
    if (preserveMath && mathElementsWithXml.length > 0) {
        mathElementsWithXml.forEach((mathElementWithXml, index) => {
            // Use the pre-extracted ID or generate one
            const mathId = mathElementWithXml.id || `math-fallback-${index}`;

            // Use the original XML that was extracted during document parsing
            const originalXml = mathElementWithXml.originalXml || '';

            console.log(`Processing math element (fallback) ${index}: ID=${mathId}, XML length=${originalXml.length}`);

            mathRegistry[mathId] = {
                type: "omml",
                originalXml: originalXml,
                context: mathElementWithXml.isBlockMath ? "block" : "inline",
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
 * @param {Array} options.mathElementsWithXml - Pre-extracted math elements with original XML
 * @param {Object} parentPara - Parent paragraph object
 * @param {string} documentXml - Original document XML string
 * @param {Object} globalCounters - Global counters for tracking across paragraphs
 * @returns {string} Formatted content string
 */
export const buildContentFormatted = (runs, options = {}, parentPara = null, documentXml = null, globalCounters = {}) => {
    const {
        removeMarks = false,
        relationships = {},
        imageData = {},
        preserveMath = true,
        mathRegistry = {},
        mathElementsWithXml = []
    } = options;

    let content;

    // If we have a parent paragraph and need to preserve math, use sequential processing
    if (parentPara && preserveMath && mathElementsWithXml.length > 0) {
        content = processSequentialParagraphContent(parentPara, documentXml, options, mathElementsWithXml, globalCounters);
    } else if (preserveMath && mathElementsWithXml.length > 0) {
        // Use the pre-extracted math elements even without XML ordering
        content = processParagraphFromJson(parentPara, options, mathElementsWithXml, globalCounters);
    } else {
        // No math elements, use plain text extraction
        content = extractPlainText(runs, { relationships, imageData });
    }

    // Remove marks pattern if requested
    if (removeMarks) {
        content = content.replace(/^\[\d+(?:\.\d+)?\s*marks?\]\s*/i, '');
    }

    // Process multiple br tags to preserve spacing
    content = content.replace(/<br>/g, '<br>');

    return content;
};