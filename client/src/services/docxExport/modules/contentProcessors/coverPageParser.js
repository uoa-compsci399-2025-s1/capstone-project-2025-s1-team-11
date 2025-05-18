// src/services/docxExport/modules/contentProcessors/coverPageParser.js

/**
 * Cover Page Parser - Main Module
 * Coordinates the parsing of DOCX cover pages using specialized extractors
 */

// Import extractors
import { extractFromContentControls } from './extractors/contentControlDataExtractor.js';
import { extractSemesterAndYear } from './extractors/semesterExtractor.js';
import { extractCampus } from './extractors/campusExtractor.js';
import { extractCourseInfo } from './extractors/courseInfoExtractor.js';
import { extractExamTitle } from './extractors/examTitleExtractor.js';
import { extractTimeAllowed } from './extractors/timeAllowedExtractor.js';
import { extractNoteSection } from './extractors/notesExtractor.js';

// Import utilities
import { extractElements } from './utils/contentProcessors.js';

/**
 * Parse DOCX cover page content to extract structured information
 * Prioritizes content controls when available, falls back to pattern matching
 * @param {string} htmlContent - HTML content converted from DOCX
 * @param {Object} contentControls - Content controls extracted from DOCX (optional)
 * @returns {Object} Structured cover page data
 */
export function parseCoverPage(htmlContent, contentControls = null) {
    console.log("🔍 Starting parseCoverPage");
    console.log("📄 HTML Content sample:", htmlContent ? htmlContent.substring(0, 150) : "none");
    console.log("🎛️ Content Controls:", contentControls);
    // Initialize result object with default empty values
    const result = {
        courseSubject: '',
        courseNumber: '',
        courseCode: '',
        subjectName: '',
        examTitle: '',
        timeAllowed: '',
        semester: '',
        year: '',
        campus: '',
        notes: '',
        additionalContent: []
    };

    // If no content provided, return empty result
    if (!htmlContent && !contentControls) {
        return result;
    }

    // First, try to extract from content controls if available
    if (contentControls && Object.keys(contentControls).length > 0) {
        extractFromContentControls(contentControls, result);
    }

    // Then, parse HTML content for anything not found in content controls
    if (htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const fullText = doc.body.textContent || '';

        // Get text lines for position-based analysis
        const textLines = fullText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        // Extract information not already found from content controls
        if (!result.courseSubject || !result.courseNumber || !result.courseCode) {
            const courseInfo = extractCourseInfo(fullText, textLines);
            if (courseInfo.courseSubject) result.courseSubject = courseInfo.courseSubject;
            if (courseInfo.courseNumber) result.courseNumber = courseInfo.courseNumber;
            if (courseInfo.courseCode) result.courseCode = courseInfo.courseCode;
            if (courseInfo.subjectName) result.subjectName = courseInfo.subjectName;
        }

        if (contentControls && Object.keys(contentControls).length > 0) {
            extractFromContentControls(contentControls, result);
            console.log("👀 After content control extraction:", result);
        }

        // Extract semester and year if not already found
        if (!result.semester || !result.year) {
            const semesterYearInfo = extractSemesterAndYear(fullText, textLines);
            if (semesterYearInfo.semester) result.semester = semesterYearInfo.semester;
            if (semesterYearInfo.year) result.year = semesterYearInfo.year;
        }

        // Extract campus if not already found
        if (!result.campus) {
            const campusInfo = extractCampus(fullText, textLines);
            if (campusInfo) result.campus = campusInfo;
        }

        // Extract exam title if not already found
        if (!result.examTitle) {
            result.examTitle = extractExamTitle(textLines, result.subjectName);
        }

        // Extract time allowed if not already found
        if (!result.timeAllowed) {
            result.timeAllowed = extractTimeAllowed(fullText, textLines);
        }

        // Extract notes section
        result.notes = extractNoteSection(textLines);

        // Extract additional content elements
        result.additionalContent = extractElements(doc.body);
    }
    console.log("✅ Final parsed cover page data:", result);
    return result;
}

/**
 * Export function to format parsed cover page for template
 * @param {Object} coverPageData - Parsed cover page data
 * @returns {Object} Data formatted for template
 */
export function formatCoverPageForTemplate(coverPageData) {
    if (!coverPageData) {
        return {
            courseCode: '',
            semester: '',
            year: '',
            campus: '',
            hasAdditionalCoverContent: false,
            additionalCoverContent: []
        };
    }

    // Transform additional content elements for template
    const transformedContent = [];

    // Add subject name as text element if present
    if (coverPageData.subjectName) {
        transformedContent.push({
            type_text: true,
            content: coverPageData.subjectName
        });
    }

    // Add exam title as text element if present
    if (coverPageData.examTitle) {
        transformedContent.push({
            type_text: true,
            content: coverPageData.examTitle
        });
    }

    // Add time allowed as text element if present
    if (coverPageData.timeAllowed) {
        transformedContent.push({
            type_text: true,
            content: `(Time Allowed: ${coverPageData.timeAllowed})`
        });
    }

    // Add notes section as text element if present
    if (coverPageData.notes) {
        transformedContent.push({
            type_text: true,
            content: coverPageData.notes
        });
    }

    // Add any additional content elements
    (coverPageData.additionalContent || []).forEach(element => {
        const transformed = {};

        switch (element.type) {
            case 'text':
                transformed.type_text = true;
                transformed.content = element.content;
                break;
            case 'table':
                transformed.type_table = true;
                transformed.html = element.html;
                break;
            case 'image':
                transformed.type_image = true;
                transformed.src = element.src;
                transformed.alt = element.alt;
                break;
            case 'list':
                transformed.type_list = true;
                transformed.items = element.items;
                break;
            default:
                transformed.type_text = true;
                transformed.content = element.content || '';
        }

        transformedContent.push(transformed);
    });

    // Return data formatted for template
    return {
        courseCode: coverPageData.courseCode || '',
        semester: coverPageData.semester || '',
        year: coverPageData.year || '',
        campus: coverPageData.campus || '',
        hasAdditionalCoverContent: transformedContent.length > 0,
        additionalCoverContent: transformedContent
    };
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