// src/services/docxExport/modules/contentProcessors/utils/contentProcessors.js

/**
 * Content Processors utility
 * Contains utility functions for processing HTML content elements
 */

/**
 * Extract all elements from container in order
 * @param {Element} container - Container element
 * @returns {Array} Array of elements
 */
export function extractElements(container) {
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