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
        console.log(`Starting exam export in ${format} format`);

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

        console.log(`Export completed successfully in ${format} format`);
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

        console.log(`File "${filename}" has been saved`);
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

        console.log(`Starting export of ${examData.versions.length} exam versions`);

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

            console.log(`Version ${version} export completed`);
        }

        console.log('All versions exported successfully');
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
     * @param {Blob} coverPageBlob - The cover page as a DOCX blob
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    static async exportAndSaveVersionedExam(examData, coverPageBlob) {
        try {
            const versionedBlobs = await this.exportVersionedDocx(examData, coverPageBlob);
            this.saveVersionedFiles(versionedBlobs, examData);
            return { success: true };
        } catch (error) {
            console.error('Error in export and save versioned operation:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export default for flexibility
export default ExamExportService;