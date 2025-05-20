// src/services/docxExport/modules/docxtemplaterHelper.js

/**
 * Utility functions for Docxtemplater template processing
 */

/**
 * Creates a simple text paragraph with minimal styling
 * This is a helper function to construct text content when needed
 *
 * @param {string} text - Text content
 * @param {Object} options - Options for styling
 * @returns {string} - Simplified text representation
 */
export function createTextParagraph(text) {
    if (!text) return '';

    // For MVP we're just returning plain text
    // In future versions, this could be enhanced to add formatting
    return text;
}

/**
 * Sanitizes text to prevent template errors
 * Removes special characters and other content that might break the template
 *
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
export function sanitizeText(text) {
    if (!text) return '';

    // Replace any characters that might interfere with template
    return text
        .replace(/\{/g, '&#123;')  // Replace { with HTML entity
        .replace(/\}/g, '&#125;'); // Replace } with HTML entity
}

/**
 * Validates a template before rendering
 * Checks for common issues that could cause rendering problems
 *
 * @param {Object} doc - Docxtemplater document
 * @param {Object} data - Data to validate against template
 * @returns {Object} - Validation result {isValid, errors}
 */
export function validateTemplate(doc, data) {
    // This is a simple validation for MVP
    // Can be expanded later with more comprehensive checks

    const errors = [];

    // Check if data has the expected properties
    const requiredProperties = ['questions', 'examTitle', 'courseCode'];

    requiredProperties.forEach(prop => {
        if (data[prop] === undefined) {
            errors.push(`Missing required property: ${prop}`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Handles line breaks in text content correctly for DOCX
 *
 * @param {string} text - Text that may contain line breaks
 * @returns {string} - Text with proper line break handling
 */
export function handleLineBreaks(text) {
    if (!text) return '';

    // For simple MVP, we just preserve line breaks
    // This can be enhanced later to handle line breaks properly in DOCX
    return text;
}

/**
 * Generates a unique filename for the exported document
 *
 * @param {Object} examData - Exam data to base the filename on
 * @returns {string} - Generated filename
 */
export function generateFilename(examData) {
    const courseCode = examData.courseCode || 'Exam';
    const examTitle = examData.examTitle || 'Untitled';
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Clean up the filename to remove any problematic characters
    const cleanCourseCode = courseCode.replace(/[^a-zA-Z0-9]/g, '');
    const cleanExamTitle = examTitle.replace(/[^a-zA-Z0-9]/g, '');

    return `${cleanCourseCode}_${cleanExamTitle}_${date}.docx`;
}