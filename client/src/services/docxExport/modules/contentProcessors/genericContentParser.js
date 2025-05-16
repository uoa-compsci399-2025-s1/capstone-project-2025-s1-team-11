// src/services/docxExport/modules/contentProcessors/genericContentParser.js

/**
 * Parse cover page HTML content for export
 * @param {string} htmlContent - HTML string from Redux store
 * @returns {Object} Structured data with basic fields and additional elements
 */
export function parseCoverPageForExport(htmlContent) {
    if (!htmlContent) {
        return {
            semester: '',
            year: '',
            campus: '',
            additionalContent: []
        };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const fullText = doc.body.textContent || '';

    const result = {
        semester: '',
        year: '',
        campus: '',
        additionalContent: []
    };

    // Extract basic fields
    const semesterMatch = fullText.match(/Semester\s+(\d+),\s+(\d{4})/i);
    if (semesterMatch) {
        result.semester = `Semester ${semesterMatch[1]}`;
        result.year = semesterMatch[2];
    }

    const campusMatch = fullText.match(/Campus:\s*([^\n]+)/i);
    if (campusMatch) {
        result.campus = campusMatch[1].trim();
    }

    // Extract all elements in order
    result.additionalContent = extractElements(doc.body);

    return result;
}

/**
 * Parse appendix HTML content
 * @param {string} htmlContent - HTML string
 * @returns {Object} Structured appendix content
 */
export function parseAppendixForExport(htmlContent) {
    if (!htmlContent) {
        return { elements: [] };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    return {
        elements: extractElements(doc.body)
    };
}

/**
 * Extract all elements from container in order
 * @param {Element} container - Container element
 * @returns {Array} Array of elements
 */
function extractElements(container) {
    const elements = [];

    // First, get all direct text nodes
    for (const node of container.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text) {
                elements.push({
                    type: 'text',
                    content: text
                });
            }
        }
    }

    // Then process child elements
    for (const child of container.children) {
        const element = processElement(child);
        if (element) {
            elements.push(element);
        }
    }

    return elements;
}

/**
 * Process a single element
 * @param {Element} element - DOM element
 * @returns {Object|null} Processed element
 */
function processElement(element) {
    const tagName = element.tagName.toLowerCase();
    const text = element.textContent.trim();

    switch (tagName) {
        case 'table':
            return {
                type: 'table',
                html: element.outerHTML
            };

        case 'img':
            return {
                type: 'image',
                src: element.src,
                alt: element.alt || 'Image',
                width: element.width,
                height: element.height
            };

        case 'ul':
        case 'ol':
            return {
                type: 'list',
                items: Array.from(element.querySelectorAll('li'))
                    .map(li => li.textContent.trim())
            };

        case 'p':
        case 'div':
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
            if (text) {
                return {
                    type: 'text',
                    content: text
                };
            }
            break;

        default:
            if (text) {
                return {
                    type: 'text',
                    content: text
                };
            }
    }

    return null;
}