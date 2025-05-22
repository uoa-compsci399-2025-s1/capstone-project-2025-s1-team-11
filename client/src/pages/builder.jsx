import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCoverPage } from "../store/exam/examSlice";
import { selectExamData } from "../store/exam/selectors.js";
import ExamDisplay from "../components/shared/examDisplay.jsx";
import ExamFileManager from "../components/ExamContentManager.jsx";
import ExamSidebar from "../components/ExamSidebar.jsx";
import ExamPreview from "../components/exam/ExamPreview";
import { EmptyExam } from "../components/shared/emptyExam.jsx";
import { Typography, Button, Row, Col, Tooltip, Collapse, Divider, Tabs } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
//import { exportExamToPdf } from "../services/exportPdf.js";

const Builder = () => {
    const exam = useSelector(selectExamData);
    const [currentItemId, setCurrentItemId] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState("editor");
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
            //console.log("Dispatching file:", file.name);
            dispatch(setCoverPage(file));
        }
    };

    const handleTabChange = (key) => {
        setActiveTab(key);
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

                    {/* Tabs for Editor and Preview */}
                    <Tabs 
                        activeKey={activeTab} 
                        onChange={handleTabChange}
                        items={[
                            {
                                key: "editor",
                                label: "Editor",
                                children: (
                                    <div style={{ marginTop: '24px' }}>
                                        <Typography.Title level={3}>MCQ Exam Questions</Typography.Title>
                                        {exam?
                                        <ExamDisplay
                                            exam={exam}
                                            currentItemId={currentItemId}
                                            setCurrentItemId={setCurrentItemId}
                                        />
                                        : <EmptyExam />}
                                        <ExamFileManager />
                                    </div>
                                )
                            },
                            {
                                key: "preview",
                                label: "Preview",
                                children: (
                                    <div style={{ marginTop: '24px' }}>
                                        <ExamPreview />
                                    </div>
                                )
                            }
                        ]}
                    />

                    <Divider />

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