// src/services/examExportService.js

import { exportExamToText } from './docxExport/modules/exporters/textExport.js';
import { generateFilename } from './docxExport/modules/utils/docxtemplaterHelper.js';
import { exportExamToDocxWithDocxtemplater } from "./docxExport/modules/exporters/docxtemplaterExporter.js";
import { mergeDocxFiles } from "./docxExport/docxMerger.js";

/**
 * Main entry point for exam export functionality
 * Provides a unified interface for all export formats
 */
export class ExamExportService {
    /**
     * Export exam data to a specific format
     *
     * @param {Object} examData - Exam data from Redux store
     * @param {string} format - Export format ('docx', 'text', 'docxtemplater')
     * @returns {Promise<Blob>} - Blob containing the exported document
     */
    static async exportExam(examData, format = 'docxtemplater') {
        //console.log(`Starting exam export in ${format} format`);

        if (!examData) {
            throw new Error('No exam data available for export');
        }

        let result;

        switch (format.toLowerCase()) {
            case 'docxtemplater':
                // New export method using Docxtemplater
                result = await exportExamToDocxWithDocxtemplater(examData);
                break;

            case 'text':
                // Plain text export
                result = await exportExamToText(examData);
                break;

            // Future formats can be added here (PDF, etc.)

            default:
                throw new Error(`Unsupported export format: ${format}`);
        }

        //console.log(`Export completed successfully in ${format} format`);
        return result;
    }

    /**
     * Helper for saving a blob with a filename
     * @private
     */
    static _saveBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        //console.log(`File "${filename}" has been saved`);
    }

    /**
     * Save the exported document to the user's device
     *
     * @param {Blob} blob - Document blob to save
     * @param {Object} examData - Exam data for generating filename
     */
    static saveExportedFile(blob, examData) {
        // Generate appropriate filename
        const filename = generateFilename(examData);
        this._saveBlob(blob, filename);
    }

    /**
     * Checks if exam questions have been shuffled
     * @param {Object} examData - The exam data to check
     * @returns {boolean} - True if at least one question has shuffled answers, false otherwise
     */
    static areAnswersShuffled(examData) {
        // If no exam data or no questions, return false
        if (!examData || !examData.examBody) {
            return false;
        }

        // Check each question for shuffle maps
        let hasShuffledAnswers = false;

        // Process each exam body item
        examData.examBody.forEach(item => {
            // Check standalone questions
            if (item.type === 'question' && item.answerShuffleMaps) {
                // Check if any shuffle maps are different from the identity map
                hasShuffledAnswers = hasShuffledAnswers || this.isNonIdentityShuffle(item.answerShuffleMaps);
            }

            // Check questions within sections
            if (item.type === 'section' && item.questions) {
                item.questions.forEach(question => {
                    if (question.answerShuffleMaps) {
                        hasShuffledAnswers = hasShuffledAnswers || this.isNonIdentityShuffle(question.answerShuffleMaps);
                    }
                });
            }
        });

        return hasShuffledAnswers;
    }

    /**
     * Helper function to check if shuffle maps are actually shuffled (not identity)
     * @param {Array} shuffleMaps - Array of shuffle maps
     * @returns {boolean} - True if at least one map is not an identity mapping
     */
    static isNonIdentityShuffle(shuffleMaps) {
        if (!Array.isArray(shuffleMaps) || shuffleMaps.length <= 1) {
            return false;
        }

        // Check if all maps are different from each other
        for (let i = 0; i < shuffleMaps.length; i++) {
            for (let j = i + 1; j < shuffleMaps.length; j++) {
                // Compare two shuffle maps
                if (shuffleMaps[i] && shuffleMaps[j] &&
                    JSON.stringify(shuffleMaps[i]) !== JSON.stringify(shuffleMaps[j])) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Checks if the exam is ready for versioned export
     * @param {Object} examData - The exam data to check
     * @returns {{ready: boolean, warnings: string[]}} - Ready status and any warnings
     */
    static checkExamVersionsReady(examData) {
        const warnings = [];

        // Check if exam has versions defined
        if (!examData.versions || examData.versions.length <= 1) {
            warnings.push("Exam has only one version. Multiple versions are recommended for versioned export.");
        }

        // Check if answers have been shuffled
        if (!this.areAnswersShuffled(examData)) {
            warnings.push("Answers are not shuffled. All versions will have identical answer orders.");
        }

        // Add other checks as needed (e.g., ensuring all questions have the same number of answers)

        return {
            ready: true, // You can set conditions for this
            warnings
        };
    }

    /**
     * Export multiple versions of an exam as separate DOCX files
     * Each version will have the same cover page but different body content
     *
     * @param {Object} examData - Complete exam data from Redux store
     * @param {Blob} coverPageBlob - The cover page as a DOCX blob
     * @returns {Promise<Array<{version: string, blob: Blob}>>} - Array of version-blob pairs
     */
    static async exportVersionedDocx(examData, coverPageBlob) {
        if (!examData || !examData.versions || !examData.versions.length) {
            throw new Error('No exam versions available for export');
        }

        if (!coverPageBlob) {
            throw new Error('Cover page is required for versioned export');
        }

        //console.log(`Starting export of ${examData.versions.length} exam versions`);

        // Array to hold the results
        const results = [];

        // Process each version
        for (const version of examData.versions) {
            // Generate a version-specific body DOCX
            const bodyBlob = await exportExamToDocxWithDocxtemplater(examData, version);

            // Merge the cover page with this body using the docxMerger function
            const mergedBlob = await mergeDocxFiles(coverPageBlob, bodyBlob);

            // Add to results
            results.push({
                version,
                blob: mergedBlob
            });

            //console.log(`Version ${version} export completed`);
        }

        //console.log('All versions exported successfully');
        return results;
    }

    /**
     * Save multiple versioned documents to the user's device
     *
     * @param {Array<{version: string, blob: Blob}>} versionedBlobs - Array of version-blob pairs
     * @param {Object} examData - Exam data for generating filenames
     */
    static saveVersionedFiles(versionedBlobs, examData) {
        if (!versionedBlobs || !versionedBlobs.length) {
            throw new Error('No files to save');
        }

        // Save each versioned file
        for (const {version, blob} of versionedBlobs) {
            // Generate appropriate filename with version included
            const baseFilename = generateFilename(examData);
            const filename = baseFilename.replace('.docx', `_Version${version}.docx`);
            this._saveBlob(blob, filename);
        }
    }

    /**
     * Export and save all versions of an exam in one operation
     *
     * @param {Object} examData - Exam data from Redux store
     * @param {Object} coverPageData - The cover page data with content as ArrayBuffer
     * @returns {Promise<{success: boolean, error?: string, warnings?: string[]}>}
     */
    static async exportAndSaveVersionedExam(examData, coverPageData) {
        try {
            // Check if exam is ready for versioned export
            const { warnings } = this.checkExamVersionsReady(examData);

            // Show warnings and get confirmation if there are warnings
            if (warnings && warnings.length > 0) {
                // For safety, check inside the export function too
                console.warn("Export warnings:", warnings);
            }

            // Convert cover page data to Blob if needed
            let coverPageBlob;
            if (coverPageData.content && typeof coverPageData.content === 'string') {
                // New format: convert base64 string back to Blob
                try {
                    const binaryString = atob(coverPageData.content);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    coverPageBlob = new Blob([bytes], { 
                        type: coverPageData.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
                    });
                } catch (error) {
                    throw new Error('Failed to decode cover page content: ' + error.message);
                }
            } else if (coverPageData instanceof Blob || coverPageData instanceof File) {
                // Legacy format: already a Blob/File
                coverPageBlob = coverPageData;
            } else {
                throw new Error('Invalid cover page format');
            }

            const versionedBlobs = await this.exportVersionedDocx(examData, coverPageBlob);
            this.saveVersionedFiles(versionedBlobs, examData);

            return {
                success: true,
                warnings: warnings && warnings.length > 0 ? warnings : undefined
            };
        } catch (error) {
            console.error('Error in export and save versioned operation:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export default for flexibility
export default ExamExportService;