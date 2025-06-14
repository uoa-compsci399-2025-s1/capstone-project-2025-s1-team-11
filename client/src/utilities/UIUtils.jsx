import { App } from 'antd';
import { ExamExportService } from '../services/examExportService';
import React from 'react';

// Main export function that requires modal instance
const handleExportDocxInternal = async (exam, coverPage, mathRegistry, message, modal) => {
    try {
        if (!exam) {
            message.error("No exam data available for export");
            return;
        }

        if (!coverPage) {
            message.error("No cover page available. Please upload a cover page first.");
            return;
        }

        // Check if exam is ready for export
        const { warnings } = ExamExportService.checkExamVersionsReady(exam);

        // Show warnings if present
        if (warnings && warnings.length > 0) {
            modal.confirm({
                title: 'Warning: Issues with Export',
                content: (
                    <div>
                        {warnings.map((warning, index) => (
                            <p key={index}>{warning}</p>
                        ))}
                        <p>Do you want to proceed with the export anyway?</p>
                    </div>
                ),
                okText: 'Proceed',
                cancelText: 'Cancel',
                onOk: async () => {
                    // Continue with export
                    message.info("Exporting DOCX versions...");
                    const result = await ExamExportService.exportAndSaveVersionedExam(exam, coverPage, mathRegistry);

                    if (result.success) {
                        message.success("All exam versions exported successfully");

                        // Show any warnings that came back
                        if (result.warnings && result.warnings.length > 0) {
                            message.warning(result.warnings.join("\n"));
                        }
                    } else {
                        message.error(`Export failed: ${result.error}`);
                    }
                }
            });
            return; // Exit early, the Modal callback will handle continuation
        }

        // Only execute this code if there are no warnings
        message.info("Exporting DOCX versions...");
        const result = await ExamExportService.exportAndSaveVersionedExam(exam, coverPage, mathRegistry);

        if (result.success) {
            message.success("All exam versions exported successfully");

            // Show any warnings that came back
            if (result.warnings && result.warnings.length > 0) {
                message.warning(result.warnings.join("\n"));
            }
        } else {
            message.error(`Export failed: ${result.error}`);
        }
    } catch (error) {
        message.error(`Export error: ${error.message}`);
        console.error(error);
    }
};

// Hook version for components that can use hooks (recommended)
export const useExportDocx = () => {
    const { message, modal } = App.useApp();
    
    return (exam, coverPage, mathRegistry) => 
        handleExportDocxInternal(exam, coverPage, mathRegistry, message, modal);
};