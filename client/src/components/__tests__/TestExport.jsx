import React from "react";
import { useSelector } from "react-redux";
import { Button, Space, Typography, message, Alert } from "antd";
import { exportExamToDocx } from "../../services/docxExport";
import { exportExamToPdf } from "../../services/pdfExport";

const TestExport = () => {
    const exam = useSelector((state) => state.exam.examData);

    const handleDocxExport = async () => {
        try {
            if (!exam) {
                message.error("No exam data available to export");
                return;
            }

            await exportExamToDocx(exam);
            message.success("DOCX successfully exported");
        } catch (error) {
            console.error("DOCX export failed:", error);
            message.error(`DOCX export failed: ${error.message}`);
        }
    };

    const handlePdfExport = () => {
        try {
            if (!exam) {
                message.error("No exam data available to export");
                return;
            }

            exportExamToPdf(exam);
            message.success("PDF successfully exported");
        } catch (error) {
            console.error("PDF export failed:", error);
            message.error(`PDF export failed: ${error.message}`);
        }
    };

    return (
        <div>
            <Typography.Title level={4}>Export Test</Typography.Title>
            <Typography.Paragraph>
                Use the buttons below to test the export functionality:
            </Typography.Paragraph>

            <Space>
                <Button
                    type="primary"
                    onClick={handleDocxExport}
                    disabled={!exam}
                >
                    Test DOCX Export
                </Button>

                <Button
                    type="primary"
                    onClick={handlePdfExport}
                    disabled={!exam}
                >
                    Test PDF Export
                </Button>
            </Space>

            {!exam && (
                <Typography.Paragraph type="warning" style={{ marginTop: 16 }}>
                    No exam data loaded. Please create or load an exam first.
                </Typography.Paragraph>
            )}
        </div>
    );
};

export default TestExport;