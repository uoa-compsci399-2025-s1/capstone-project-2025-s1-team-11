// src/services/docxExport/modules/contentProcessors/utils/formatters.js

/**
 * Formatters utility
 * Contains utility functions for formatting and normalizing extracted data
 */

/**
 * Normalize semester values to a standard format
 * @param {string} semText - Semester text
 * @returns {string} Normalized semester value
 */
export function normalizeSemester(semText) {
    if (!semText) return '';

    semText = semText.toLowerCase().trim();

    // Convert digit to word
    if (semText === '1' || semText === 'one') return 'One';
    if (semText === '2' || semText === 'two') return 'Two';
    if (semText === '3' || semText === 'three') return 'Three';

    // Handle S1, S2 format
    if (semText === 's1') return 'One';
    if (semText === 's2') return 'Two';
    if (semText === 's3') return 'Three';

    // Return original if no match
    return semText.charAt(0).toUpperCase() + semText.slice(1);
}