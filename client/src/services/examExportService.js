// src/services/examExportService.js

import { exportExamToText } from './docxExport/modules/textExport';
import { exportExamToDocxWithDocxtemplater } from './docxExport/modules/docxtemplaterExport';
import { generateFilename } from './docxExport/modules/docxtemplaterHelper';


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
        try {
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
        } catch (error) {
            console.error('Error in exam export:', error);
            throw error;
        }
    }

    /**
     * Save the exported document to the user's device
     *
     * @param {Blob} blob - Document blob to save
     * @param {Object} examData - Exam data for generating filename
     * @param {string} format - File format extension
     */
    static saveExportedFile(blob, examData, format = 'docx') {
        try {
            // Generate appropriate filename
            const filename = generateFilename(examData);

            // Create a download link
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
        } catch (error) {
            console.error('Error saving exported file:', error);
            throw error;
        }
    }

    /**
     * Export and save exam in one operation
     *
     * @param {Object} examData - Exam data from Redux store
     * @param {string} format - Export format
     * @returns {Promise<void>}
     */
    static async exportAndSaveExam(examData, format = 'docxtemplater') {
        try {
            const blob = await this.exportExam(examData, format);
            this.saveExportedFile(blob, examData, format === 'text' ? 'txt' : 'docx');
            return { success: true };
        } catch (error) {
            console.error('Error in export and save operation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Export exam to DOCX format
     * @param {Object} examData - Exam data from Redux store
     * @param {number|string} version - Exam version to export
     * @returns {Promise<Blob>} - DOCX blob
     */
    static async exportToDocx(examData, version) {
        console.log("exportToDocx called with version:", version);
        // For the MVP, we're ignoring the version parameter and just using Docxtemplater
        return await exportExamToDocxWithDocxtemplater(examData);
    }

    /**
     * Export exam to PDF format (placeholder for future implementation)
     * @param {Object} examData - Exam data from Redux store
     * @param {number|string} version - Exam version to export
     * @returns {boolean} - Success indicator
     */
    static exportToPdf(examData, version) {
        console.log("PDF export requested (not implemented):", version);
        // This is just a placeholder - PDF export is not part of the MVP
        return false;
    }

    /**
     * Export exam to both DOCX and PDF formats
     * @param {Object} examData - Exam data from Redux store
     * @param {number|string} version - Exam version to export
     * @returns {Promise<[Blob, boolean]>} - Array with DOCX blob and PDF success indicator
     */
    static async exportToDocxAndPdf(examData, version) {
        const docxBlob = await this.exportToDocx(examData, version);
        const pdfSuccess = this.exportToPdf(examData, version);
        return [docxBlob, pdfSuccess];
    }
}

// Export default and named exports for flexibility
export default ExamExportService;

// Simple function for direct export to Docxtemplater format
export const exportToDocxtemplater = async (examData) => {
    return await exportExamToDocxWithDocxtemplater(examData);
};

// Simple function for direct export to text format
export const exportToText = async (examData) => {
    return await exportExamToText(examData);
};