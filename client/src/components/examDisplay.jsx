// src/components/ExamDisplay.jsx
import React from 'react';
import {Button, Card, List, Space, Typography} from "antd";

const ExamDisplay = ({ exam, onAddQuestion }) => {
    if (!exam) {
        return <div>No exam loaded.</div>;
    }
    return (
        <div>
            <h1>MCQ Builder</h1>
            <Card title={exam.title} extra={<span>Date: {exam.date}</span>}>
                <Typography.Title level={3} style={{ margin: '0', paddingBottom: '8px'}}>Questions:</Typography.Title>
                <List
                    itemLayout="horizontal"
                    dataSource={exam.questions}
                    renderItem={(q) => (
                        <List.Item>
                            <List.Item.Meta
                                title={q.questionText}
                                description={`Answer: ${q.answer}`}
                            />
                        </List.Item>
                    )}
                />
                <Space style={{ marginTop: '16px' }}>
                    <Button type="dashed" onClick={onAddQuestion}>Add Question</Button>
                </Space>
            </Card>
            {/*--
            <Space style={{ marginTop: '16px' }}>
                <Button type="primary" onClick={handleOpenFile}>
                    Open Exam File
                </Button>
                <Button onClick={handleSaveFile}>Save Exam File</Button>
            </Space>
            --*/}
        </div>
    );
};

export default ExamDisplay;