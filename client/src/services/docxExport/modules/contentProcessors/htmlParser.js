// src/services/docxExport/modules/contentProcessors/htmlParser.js

import { processImage } from './imageProcessor';

/**
 * Parse HTML content and extract different types of content for DOCX export
 * @param {string} htmlString - HTML string to parse
 * @returns {Object} Parsed content with text and attachments
 */
export function parseHtmlContent(htmlString) {
    if (!htmlString) {
        return {
            text: '',
            elements: []
        };
    }

    // Pre-process LaTeX math expressions in the HTML
    htmlString = preprocessLatexMath(htmlString);

    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const body = doc.body;

    const result = {
        text: '',
        elements: []
    };

    // Process all child nodes
    processNode(body, result);

    return result;
}

/**
 * Preprocess LaTeX math expressions in HTML
 * @param {string} htmlString - HTML string to preprocess
 * @returns {string} HTML with LaTeX math tagged for processing
 */
function preprocessLatexMath(htmlString) {
    // Replace display math expressions $$ ... $$ with custom element
    htmlString = htmlString.replace(/\$\$(.*?)\$\$/gs, (match, content) => {
        return `<math-display data-latex="${encodeURIComponent(content)}"></math-display>`;
    });

    // Replace inline math expressions $ ... $ with custom element
    htmlString = htmlString.replace(/\$(.*?)\$/g, (match, content) => {
        return `<math-inline data-latex="${encodeURIComponent(content)}"></math-inline>`;
    });

    return htmlString;
}

/**
 * Recursively process DOM nodes
 * @param {Node} node - DOM node to process
 * @param {Object} result - Result object to populate
 */
function processNode(node, result) {
    if (node.nodeType === Node.TEXT_NODE) {
        result.text += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();

        switch (tagName) {
            case 'img':
                // Process image
                { const imageData = processImage(node);
                if (imageData) {
                    // Add placeholder in text
                    result.text += `{{image_${result.elements.length}}}`;
                    result.elements.push(imageData);
                }
                break; }

            case 'br':
                result.text += '\n';
                break;

            case 'p':
            case 'div':
                // Process children and add newline
                for (const child of node.childNodes) {
                    processNode(child, result);
                }
                result.text += '\n';
                break;

            case 'strong':
            case 'b':
                // Bold text with unique markers
                result.text += '§BOLD§';
                for (const child of node.childNodes) {
                    processNode(child, result);
                }
                result.text += '§/BOLD§';
                break;

            case 'em':
            case 'i':
                // Italic text with unique markers
                result.text += '§ITALIC§';
                for (const child of node.childNodes) {
                    processNode(child, result);
                }
                result.text += '§/ITALIC§';
                break;

            case 'u':
                // Underline text with unique markers
                result.text += '§UNDERLINE§';
                for (const child of node.childNodes) {
                    processNode(child, result);
                }
                result.text += '§/UNDERLINE§';
                break;

            case 'code':
                // Code block with unique markers
                result.text += '§CODE§';
                for (const child of node.childNodes) {
                    processNode(child, result);
                }
                result.text += '§/CODE§';
                break;

            case 'sub':
                // Subscript with unique markers
                result.text += '§SUBSCRIPT§';
                for (const child of node.childNodes) {
                    processNode(child, result);
                }
                result.text += '§/SUBSCRIPT§';
                break;

            case 'sup':
                // Superscript with unique markers
                result.text += '§SUPERSCRIPT§';
                for (const child of node.childNodes) {
                    processNode(child, result);
                }
                result.text += '§/SUPERSCRIPT§';
                break;

            case 'math':
                // Math notation - placeholder for now
                result.text += `{{math_${result.elements.length}}}`;
                result.elements.push({
                    type: 'math',
                    content: node.outerHTML
                });
                break;

            case 'math-inline':
                // Inline LaTeX math
                { const inlineLatex = decodeURIComponent(node.getAttribute('data-latex') || '');
                result.text += `§MATH_INLINE§${inlineLatex}§/MATH_INLINE§`;
                break; }

            case 'math-display':
                // Display LaTeX math
                { const displayLatex = decodeURIComponent(node.getAttribute('data-latex') || '');
                result.text += `§MATH_DISPLAY§${displayLatex}§/MATH_DISPLAY§`;
                break; }

            default:
                // Process children for any other tags
                for (const child of node.childNodes) {
                    processNode(child, result);
                }
        }
    }
}

/**
 * Extract plain text from HTML, preserving structure
 * @param {string} htmlString - HTML string to convert
 * @returns {string} Plain text representation
 */
export function extractTextFromHtml(htmlString) {
    const parsed = parseHtmlContent(htmlString);
    return parsed.text.trim();
}

/**
 * Check if HTML content contains images
 * @param {string} htmlString - HTML string to check
 * @returns {boolean} True if contains images
 */
export function containsImages(htmlString) {
    const parsed = parseHtmlContent(htmlString);
    return parsed.elements.some(el => el.type === 'image');
}

/**
 * Check if HTML content contains math expressions
 * @param {string} htmlString - HTML string to check
 * @returns {boolean} True if contains math expressions
 */
export function containsMath(htmlString) {
    if (!htmlString) return false;
    return /\$\$(.*?)\$\$/gs.test(htmlString) || 
           /\$(.*?)\$/g.test(htmlString) ||
           /<math/.test(htmlString);
}
