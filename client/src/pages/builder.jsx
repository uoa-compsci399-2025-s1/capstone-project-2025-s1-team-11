import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import { selectExamData } from "../store/exam/selectors.js";
import ExamDisplay from "../components/examDisplay.jsx";
import ExamFileManager from "../components/ExamFileManager.jsx";
import MCQBuilderProgressWrapper from "../components/MCQBuilderProgressWrapper.jsx";
import { Typography, Button, Space, Select, Upload, message } from "antd";
import { processCoverPageForRedux } from "../dto/docx/coverPageProcessor.js";
import examExportService from "../services/examExportService";

const Builder = () => {
    const exam = useSelector(selectExamData);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [exportVersion, setExportVersion] = useState(exam?.versions?.[0] || 1);

    const handleCoverPageUpload = async (file) => {
        try {
            if (!exam) {
                dispatch({ type: 'exam/createNewExam', payload: {} });
            }

            const result = await processCoverPageForRedux(file, dispatch);
            console.log("✅ Cover page dispatched to Redux");
            console.log("Redux exam state after upload:", exam);

            if (result.success) {
                message.success('Cover page uploaded successfully!');
            } else {
                message.error(`Failed to upload cover page: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Cover page upload error:', error);
            message.error(`Upload error: ${error.message || 'Unknown error'}`);
        }
        return false;
    };

    const handleDownloadDocx = async () => {
        try {
            message.loading({ content: 'Creating DOCX...', key: 'docxExport' });

            if (!exam) {
                message.error({ content: 'No exam data available for export', key: 'docxExport' });
                return;
            }

            console.log("📦 Exam data at export button click:", exam);
            console.log("📄 CoverPage contentFormatted:", exam?.coverPage?.contentFormatted);

            const docxBlob = await examExportService.exportToDocx(exam, exportVersion);

            if (docxBlob && docxBlob instanceof Blob) {
                const fileName = `${exam.examTitle || 'Exam'}_Version_${exportVersion}.docx`;

                const url = URL.createObjectURL(docxBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                message.success({ content: 'DOCX created successfully!', key: 'docxExport' });
            } else {
                console.error("Invalid blob returned:", docxBlob);
                message.error({ content: 'Failed to create DOCX: invalid output', key: 'docxExport' });
            }
        } catch (error) {
            console.error('DOCX export error:', error);
            message.error({
                content: `Export error: ${error.message || "Unknown error"}`,
                key: 'docxExport'
            });
        }
    };

    const renderStageContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <div>
                        <Typography.Title level={3}>Cover Page</Typography.Title>
                        <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
                            <Typography.Text>
                                Upload a cover page DOCX file to extract exam metadata and content.
                                The first page will be used as the cover page, and any additional pages will be treated as appendices.
                            </Typography.Text>
                            <Upload
                                accept=".docx"
                                beforeUpload={handleCoverPageUpload}
                                showUploadList={false}
                            >
                                <Button type="primary">Import Cover Page</Button>
                            </Upload>

                            {exam?.coverPage && (
                                <div style={{ marginTop: 16 }}>
                                    <Typography.Text strong>Cover Page Preview:</Typography.Text>
                                    <div
                                        style={{
                                            border: '1px solid #d9d9d9',
                                            padding: 16,
                                            marginTop: 8,
                                            maxHeight: '300px',
                                            overflow: 'auto'
                                        }}
                                        dangerouslySetInnerHTML={{ __html: exam.coverPage.contentFormatted }}
                                    />
                                </div>
                            )}

                            {exam?.appendix && (
                                <div style={{ marginTop: 16 }}>
                                    <Typography.Text strong>Appendix Preview:</Typography.Text>
                                    <div
                                        style={{
                                            border: '1px solid #d9d9d9',
                                            padding: 16,
                                            marginTop: 8,
                                            maxHeight: '300px',
                                            overflow: 'auto'
                                        }}
                                        dangerouslySetInnerHTML={{ __html: exam.appendix.contentFormatted }}
                                    />
                                </div>
                            )}
                        </Space>
                    </div>
                );
            case 1:
                return (
                    <div>
                        <Typography.Title level={3}>MCQ Exam Questions</Typography.Title>
                        <ExamDisplay exam={exam} />
                        <ExamFileManager />
                    </div>
                );
            case 2:
                return (
                    <div>
                        <Typography.Title level={3}>Export & Randomise</Typography.Title>
                        <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
                            <Space>
                                <Typography.Text strong>Version to Export:</Typography.Text>
                                <Select
                                    value={exportVersion}
                                    onChange={setExportVersion}
                                    style={{ width: 120 }}
                                >
                                    {exam?.versions?.map((v, idx) => (
                                        <Select.Option key={idx} value={v}>{v}</Select.Option>
                                    )) || [<Select.Option key="1" value={1}>1</Select.Option>]}
                                </Select>
                            </Space>
                            <Button type="default" onClick={handleDownloadDocx}>
                                Download as DOCX
                            </Button>
                        </Space>

                        <Space>
                            <Button type="primary" onClick={() => navigate('/randomiser')}>
                                Open in Randomiser
                            </Button>
                        </Space>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <h1>Builder</h1>
            <MCQBuilderProgressWrapper>
                {(currentStep) => renderStageContent(currentStep)}
            </MCQBuilderProgressWrapper>
        </>
    );
};

export default Builder;