import React, { useState } from "react";
import { Button, Space, Card, List, Typography, Alert } from 'antd';
import Exam from "../models/ExamFS.js";
import { Question } from "../models/QuestionFS.js";
import { openExamFile, saveExamToFile } from "../services/fileSystemAccess.js";

const ExamPageFS = () => {
    // Initialize with a default exam in case no file is loaded yet.
    const [exam, setExam] = useState(
        new Exam("Midterm Exam", "2025-04-04", [
            new Question(1, "What is 2+2?", "4", ["3", "4", "5"]),
            new Question(2, "Capital of France?", "Paris", ["Paris", "London", "Rome"]),
        ])
    );
    const [fileHandle, setFileHandle] = useState(null);

    // Handler to open an exam file.
    const handleOpenFile = async () => {
        const result = await openExamFile();
        if (result) {
            setExam(result.exam);
            setFileHandle(result.fileHandle);
        }
    };

    // Handler to save the exam to the previously opened file.
    const handleSaveFile = async () => {
        if (fileHandle) {
            await saveExamToFile(exam, fileHandle);
        } else {
            console.warn("No file handle available. Please open a file first.");
        }
    };

    // Example: Adding a new question to the exam.
    const handleAddQuestion = () => {
        const newQuestion = new Question(
            exam.questions.length + 1,
            "New Question?",
            "Answer",
            ["Option 1", "Option 2"]
        );
        const updatedExam = new Exam(exam.title, exam.date, [...exam.questions, newQuestion]);
        setExam(updatedExam);
    };

    return (
        <div>
            <Alert
            message="Warning"
            description="Assessly is in early development. Features may be incomplete and bugs are expected."
            type="warning"
            showIcon
            closable
        />
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
                <Button type="dashed" onClick={handleAddQuestion}>Add Question</Button>
            </Space>
        </Card>
        <Space style={{ marginTop: '16px' }}>
            <Button type="primary" onClick={handleOpenFile}>
                Open Exam File
            </Button>
            <Button onClick={handleSaveFile}>Save Exam File</Button>
        </Space>
    </div>
    );
};

export default ExamPageFS;