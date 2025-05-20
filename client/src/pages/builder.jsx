import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setCoverPage } from "../store/exam/examSlice";
import { selectExamData } from "../store/exam/selectors.js";
import ExamDisplay from "../components/examDisplay.jsx";
import ExamFileManager from "../components/ExamFileManager.jsx";
import ExamSidebar from "../components/ExamSidebar.jsx";
import { Typography, Button, Space, Row, Col, Tooltip, Collapse, Divider, message } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
// import { exportExamToPdf } from "../services/exportPdf.js";
import { ExamExportService } from "../services/examExportService";

const Builder = () => {
    const exam = useSelector(selectExamData);
    const navigate = useNavigate();
    const [currentItemId, setCurrentItemId] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const coverPage = useSelector((state) => state.exam.coverPage);
    const dispatch = useDispatch();

    // Function to handle sidebar navigation
    const handleNavigateToItem = (itemId, itemType) => {
        setCurrentItemId(itemId);
        if (itemType) {
            // Do something?
        }
    };

    // Function to toggle sidebar visibility
    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const handleUploadClick = () => {
        document.getElementById("cover-upload").click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            console.log("Dispatching file:", file.name);
            dispatch(setCoverPage(file));
        }
    };

    const handleExportDocx = async () => {
        try {
            if (!exam) {
                message.error("No exam data available for export");
                return;
            }

            if (!coverPage) {
                message.error("No cover page available. Please upload a cover page first.");
                return;
            }

            message.info("Exporting DOCX versions...");

            const result = await ExamExportService.exportAndSaveVersionedExam(exam, coverPage);

            if (result.success) {
                message.success("All exam versions exported successfully");
            } else {
                message.error(`Export failed: ${result.error}`);
            }
        } catch (error) {
            message.error(`Export error: ${error.message}`);
            console.error(error);
        }
    };

    const coverPageItems = [
        {
            key: '1',
            label: 'Cover Page',
            children: (
                <div style={{ padding: '16px 0' }}>
                    <Typography.Title level={3}>Cover Page</Typography.Title>
                    <Button type="default" style={{ marginBottom: 12 }} onClick={handleUploadClick}>
                        Upload Cover Page
                    </Button>
                    <input
                        id="cover-upload"
                        type="file"
                        accept=".docx"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                    />
                    {coverPage && (
                        <p style={{ marginBottom: 24, color: "green" }}>
                            Cover page uploaded: {coverPage.name}
                        </p>
                    )}
                </div>
            ),
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: 16
            }}>
                <Tooltip title={sidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}>
                    <Button
                        type="default"
                        icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={toggleSidebar}
                    >
                        {sidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
                    </Button>
                </Tooltip>
            </div>

            <Row gutter={24}>
                <Col xs={24} xl={sidebarCollapsed ? 24 : 18} style={{ transition: 'width 0.3s' }}>
                    <h1>Builder</h1>

                    {/* Cover Page Section */}
                    <Collapse
                        defaultActiveKey={[]}
                        items={coverPageItems}
                        style={{ marginTop: '16px' }}
                    />

                    <Divider />

                    {/* MCQ Exam Questions Section */}
                    <div style={{ marginTop: '24px' }}>
                        <Typography.Title level={3}>MCQ Exam Questions</Typography.Title>
                        <ExamDisplay
                            exam={exam}
                            currentItemId={currentItemId}
                            setCurrentItemId={setCurrentItemId}
                        />
                        {exam && <ExamFileManager />}
                    </div>

                    <Divider />

                    {/* Export & Randomise Section */}
                    <div style={{ marginTop: '24px' }}>
                        <Typography.Title level={3}>Export & Randomise</Typography.Title>
                        <Typography.Paragraph type="secondary">
                            Export functions coming soon
                        </Typography.Paragraph>
                        <div style={{ marginTop: 24, marginBottom: 24 }}>
                            <Space>
                                <Button type="primary" onClick={() => navigate('/randomiser')}>
                                    Open in Randomiser
                                </Button>
                            </Space>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <Space>
                                <Button type="default" onClick={handleExportDocx}>
                                    Download as DOCX
                                </Button>
                                <Button type="default" onClick={() => {/* TODO: implement PDF export */}}>
                                    Download as PDF
                                </Button>
                            </Space>
                        </div>
                    </div>
                </Col>
                {!sidebarCollapsed && (
                    <Col xs={6} style={{ transition: 'width 0.3s' }}>
                        <ExamSidebar
                            exam={exam}
                            currentItemId={currentItemId}
                            onNavigateToItem={handleNavigateToItem}
                            collapsed={false}
                            onToggleCollapse={toggleSidebar}
                        />
                    </Col>
                )}
            </Row>
        </div>
    );
};

export default Builder;