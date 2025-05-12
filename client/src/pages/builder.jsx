import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { createNewExam } from "../store/exam/examSlice.js";
import { selectExamData } from "../store/exam/selectors.js";
import ExamDisplay from "../components/examDisplay.jsx";
import ExamFileManager from "../components/ExamFileManager.jsx";
import ExamSidebar from "../components/ExamSidebar.jsx";
import MCQBuilderProgressWrapper from "../components/MCQBuilderProgressWrapper.jsx";
import { Typography, Button, Space, Row, Col, Tooltip } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { exportExamToPdf } from "../services/exportPdf.js";

const Builder = () => {
    const exam = useSelector(selectExamData);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [currentItemId, setCurrentItemId] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Function to handle sidebar navigation
    const handleNavigateToItem = (itemId, itemType) => {
        setCurrentItemId(itemId);
        // Could also add logic here to scroll to the item in the table
        // or highlight it in some way
    };

    // Function to toggle sidebar visibility
    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const renderStageContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <div>
                        <Typography.Title level={3}>Cover Page</Typography.Title>
                    </div>
                );
            case 1:
                return (
                    <>
                        {/* Sidebar Toggle Button with label now above the table */}
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
                                <div>
                                    <Typography.Title level={3}>MCQ Exam Questions</Typography.Title>
                                    <ExamDisplay 
                                        exam={exam} 
                                        currentItemId={currentItemId}
                                        setCurrentItemId={setCurrentItemId}
                                    />
                                    <ExamFileManager />
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
                    </>
                );
            case 2:
                return (
                    <div>
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
                                <Button type="default" onClick={() => {/* TODO: implement DOCX download */}}>
                                Download as DOCX
                                </Button>
                                <Button type="default" onClick={() => exportExamToPdf(exam)}>
                                Download as PDF
                                </Button>
                            </Space>
                            </div>
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