import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import { selectExamData } from "../store/exam/selectors.js";
import ExamDisplay from "../components/examDisplay.jsx";
import ExamFileManager from "../components/ExamFileManager.jsx";
import ExamSidebar from "../components/ExamSidebar.jsx";
import { Typography, Button, Space, Row, Col, Tooltip, Collapse, Divider } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { exportExamToPdf } from "../services/exportPdf.js";

const Builder = () => {
    const exam = useSelector(selectExamData);
    const navigate = useNavigate();
    const [currentItemId, setCurrentItemId] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

    const coverPageItems = [
        {
            key: '1',
            label: 'Cover Page',
            children: (
                <div style={{ padding: '16px 0' }}>
                    <Typography.Title level={3}>Cover Page</Typography.Title>
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
                                <Button type="default" onClick={() => {/* TODO: implement DOCX download */}}>
                                    Download as DOCX
                                </Button>
                                <Button type="default" onClick={() => exportExamToPdf(exam)}>
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
