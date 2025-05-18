// client/src/services/docxExport/modules/contentProcessors/extractors/contentControlDataExtractor.js

/**
 * Content Control Data Extractor
 * Processes content controls to extract structured metadata
 *
 * This extractor specifically handles the mapping from content control data
 * to structured metadata fields like semester, course info, etc.
 */

/**
 * Extract information from content controls
 * @param {Object} contentControls - Content controls extracted from DOCX
 * @param {Object} result - Result object to populate
 */
export function extractFromContentControls(contentControls, result) {
    console.log("🔍 Starting content control extraction with:", contentControls);

    // Extract Term Description (semester and year)
    if (contentControls.termDescription) {
        console.log("📝 Raw termDescription:", contentControls.termDescription);

        const termInfo = extractSemesterAndYearFromTerm(contentControls.termDescription);
        if (termInfo.semester) result.semester = termInfo.semester;
        if (termInfo.year) result.year = termInfo.year;

        // Handle truncated year (e.g., "Semester 1, 202" should be "Semester 1, 2024")
        if (!result.year && contentControls.termDescription.match(/\d{3}$/)) {
            // Assuming this is "202" at the end that should be "2024"
            const currentYear = new Date().getFullYear();
            console.log("📅 Fixing truncated year to:", currentYear);
            result.year = currentYear.toString();
        }

        console.log("📅 Extracted semester/year from termDescription:", {
            semester: result.semester,
            year: result.year
        });
    }

    // Extract Campus
    if (contentControls.taughtCampus) {
        result.campus = contentControls.taughtCampus.trim();
        console.log("🏢 Extracted campus:", result.campus);
    }

    // Extract Long Subject (subject name)
    if (contentControls.longSubject) {
        result.subjectName = contentControls.longSubject.trim();
        console.log("📚 Extracted subject name:", result.subjectName);
    }

    // Extract Full Course Title
    if (contentControls.fullCourseTitle) {
        console.log("📝 Raw fullCourseTitle:", contentControls.fullCourseTitle);

        // Try to extract course code and exam title from full course title
        const courseTitleInfo = extractCourseInfoFromTitle(contentControls.fullCourseTitle);

        if (courseTitleInfo.courseSubject) {
            result.courseSubject = courseTitleInfo.courseSubject;
            console.log("🔤 Extracted course subject:", result.courseSubject);
        }

        if (courseTitleInfo.courseNumber) {
            result.courseNumber = courseTitleInfo.courseNumber;
            console.log("🔢 Extracted course number:", result.courseNumber);
        }

        if (courseTitleInfo.courseCode) {
            result.courseCode = courseTitleInfo.courseCode;
            console.log("📋 Extracted course code:", result.courseCode);
        }

        if (courseTitleInfo.examTitle && !result.examTitle) {
            result.examTitle = courseTitleInfo.examTitle;
            console.log("📝 Extracted exam title:", result.examTitle);
        }

        // If no subject name was found but we have course info, use that
        if (!result.subjectName && courseTitleInfo.courseName) {
            result.subjectName = courseTitleInfo.courseName;
            console.log("📚 Using course name as subject name:", result.subjectName);
        }
    }

    // Extract Time Allowed / Exam Duration
    if (contentControls.examDuration) {
        result.timeAllowed = contentControls.examDuration.trim();
        console.log("⏱️ Extracted time allowed:", result.timeAllowed);
    }

    // Final check for missing fields that could be extracted from other fields
    if (!result.courseCode && result.courseSubject && result.courseNumber) {
        result.courseCode = `${result.courseSubject} ${result.courseNumber}`;
        console.log("📋 Constructed course code from parts:", result.courseCode);
    }

    // Log the final extracted content
    console.log("✅ Final content control extraction result:", result);

    return result;
}

/**
 * Extract semester and year from term description
 * @param {string} termText - Term description text
 * @returns {Object} Extracted semester and year
 */
function extractSemesterAndYearFromTerm(termText) {
    const result = { semester: '', year: '' };

    if (!termText) return result;

    console.log("📅 Analyzing term description:", termText);

    // Common patterns for semester/term extraction
    const patterns = [
        // Semester 1, 2024 or Semester One, 2024
        { regex: /semester\s+(one|1|two|2|three|3),\s+(\d{4})/i, semesterIndex: 1, yearIndex: 2 },
        // Sem 1, 2024 or Sem One, 2024
        { regex: /sem\.?\s+(one|1|two|2|three|3),\s+(\d{4})/i, semesterIndex: 1, yearIndex: 2 },
        // S1 2024 or S2 2024
        { regex: /s(1|2|3)\s+(\d{4})/i, semesterIndex: 1, yearIndex: 2 },
        // Just year with semester nearby
        { regex: /(\d{4}).*?(semester|sem\.?)\s+(one|1|two|2|three|3)/i, yearIndex: 1, semesterIndex: 3 },
        // Summer School 2024
        { regex: /summer\s+school\s+(\d{4})/i, semesterValue: 'Summer School', yearIndex: 1 },
        // Just year with Summer School nearby
        { regex: /(\d{4}).*?summer\s+school/i, yearIndex: 1, semesterValue: 'Summer School' },
        // Semester 1, 202 (truncated year)
        { regex: /semester\s+(one|1|two|2|three|3),\s+(\d{3})/i, semesterIndex: 1 },
        // Just Semester 1 without year
        { regex: /semester\s+(one|1|two|2|three|3)(?:\s|$)/i, semesterIndex: 1 },
    ];

    // Try each pattern
    for (const pattern of patterns) {
        const match = termText.match(pattern.regex);
        if (match) {
            console.log("📅 Found pattern match:", match[0]);

            // Set semester - either from a fixed value or from a capture group
            if (pattern.semesterValue) {
                result.semester = pattern.semesterValue;
            } else if (pattern.semesterIndex) {
                const semValue = match[pattern.semesterIndex];
                result.semester = normalizeSemester(semValue);
            }

            // Set year from capture group
            if (pattern.yearIndex) {
                result.year = match[pattern.yearIndex];
            }

            break; // Stop after first match
        }
    }

    // If we still don't have a year, try to find any 4-digit number
    if (!result.year) {
        const yearMatch = termText.match(/(\d{4})/);
        if (yearMatch) {
            result.year = yearMatch[1];
            console.log("📅 Found year from 4-digit number:", result.year);
        }
        // If there's a truncated 3-digit number that might be a year
        else {
            const truncatedYearMatch = termText.match(/(\d{3})(?:\s|$)/);
            if (truncatedYearMatch) {
                // Assuming current century for the first digit (e.g. 202 -> 2023)
                const century = Math.floor(new Date().getFullYear() / 1000) * 1000;
                result.year = (century + parseInt(truncatedYearMatch[1])).toString();
                console.log("📅 Constructed year from truncated digits:", result.year);
            }
        }
    }

    console.log("📅 Final extracted semester/year:", result);
    return result;
}

/**
 * Normalize semester values to a standard format
 * @param {string} semText - Semester text
 * @returns {string} Normalized semester value
 */
function normalizeSemester(semText) {
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

/**
 * Extract course information from full course title
 * @param {string} fullTitle - Full course title text
 * @returns {Object} Extracted course information
 */
function extractCourseInfoFromTitle(fullTitle) {
    const result = {
        courseSubject: '',
        courseNumber: '',
        courseCode: '',
        examTitle: '',
        courseName: ''
    };

    if (!fullTitle) return result;

    console.log("📚 Analyzing full course title:", fullTitle);

    // Pattern 1: COMPSCI 110: Introduction to Computer Systems
    const titleMatch = fullTitle.match(/([A-Z]+)\s*(\d{3,4}):\s*(.*)/i);
    if (titleMatch) {
        result.courseSubject = titleMatch[1].trim();
        result.courseNumber = titleMatch[2].trim();
        result.courseCode = `${result.courseSubject} ${result.courseNumber}`;

        const remainder = titleMatch[3].trim();
        result.courseName = remainder;

        // Check if the course name contains exam title info
        const examTitleMatch = remainder.match(/(.*?)(Test|Exam|Final|Mid-Semester|Midterm|Quiz)(.*)/i);
        if (examTitleMatch) {
            result.examTitle = remainder;
        }

        console.log("📚 Extracted from pattern 1:", result);
        return result;
    }

    // Pattern 2: COMPSCI 110 Introduction to Computer Systems
    const noColonMatch = fullTitle.match(/([A-Z]+)\s*(\d{3,4})\s+(.*)/i);
    if (noColonMatch) {
        result.courseSubject = noColonMatch[1].trim();
        result.courseNumber = noColonMatch[2].trim();
        result.courseCode = `${result.courseSubject} ${result.courseNumber}`;

        const remainder = noColonMatch[3].trim();
        result.courseName = remainder;

        // Check if the course name contains exam title info
        const examTitleMatch = remainder.match(/(.*?)(Test|Exam|Final|Mid-Semester|Midterm|Quiz)(.*)/i);
        if (examTitleMatch) {
            result.examTitle = remainder;
        }

        console.log("📚 Extracted from pattern 2:", result);
        return result;
    }

    // Pattern 3: Just COMPSCI110 without spaces
    const noSpaceMatch = fullTitle.match(/([A-Z]+)(\d{3,4})(.*)/i);
    if (noSpaceMatch) {
        result.courseSubject = noSpaceMatch[1].trim();
        result.courseNumber = noSpaceMatch[2].trim();
        result.courseCode = `${result.courseSubject} ${result.courseNumber}`;

        const remainder = noSpaceMatch[3].trim();
        if (remainder) {
            result.courseName = remainder.replace(/^[:\s]+/, '').trim();
        }

        console.log("📚 Extracted from pattern 3:", result);
        return result;
    }

    // Pattern 4: Course code might be separate from title
    if (fullTitle.match(/(Test|Exam|Final|Mid-Semester|Midterm|Quiz)/i)) {
        result.examTitle = fullTitle.trim();
        console.log("📚 Extracted exam title only:", result.examTitle);
    }

    console.log("📚 No course info patterns matched");
    return result;
}