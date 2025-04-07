import React, { useState } from "react";
import { Button, Space, Card, List, Typography, Alert, Table } from 'antd'; 
import Exam from "../models/ExamFS.js";
import { Question } from "../models/QuestionFS.js";
import { openExamFile, saveExamToFile } from "../services/fileSystemAccess.js";

const ExamPageFS = () => {
    // Initialize with a default exam in case no file is loaded yet.
    const [exam, setExam] = useState(
        new Exam("Midterm Exam", "2025-04-04", [
            new Question(1, "What is 2+2?", "4", ["3", "4", "5", "6"]),
            new Question(2, "Capital of France?", "Paris", ["Paris", "London", "Rome", "Auckland"]),
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

    const tableData = exam.questions.map((q, index) => ({
        key: q.id,
        number: index + 1,
        questionText: q.questionText,
        answer: q.answer,
        optionA: q.options[0] || '',
        optionB: q.options[1] || '',
        optionC: q.options[2] || '',
        optionD: q.options[3] || '',
    }));

    const tableColumns = [
        {
            title: '#',
            dataIndex: 'number',
            key: 'number',
        },
        {
            title: 'Question',
            dataIndex: 'questionText',
            key: 'questionText',
        },
        {
            title: 'Answer',
            dataIndex: 'answer',
            key: 'answer',
        },
        {
            title: 'Option A',
            dataIndex: 'optionA',
            key: 'optionA',
        },
        {
            title: 'Option B',
            dataIndex: 'optionB',
            key: 'optionB',
        },
        {
            title: 'Option C',
            dataIndex: 'optionC',
            key: 'optionC',
        },
        {
            title: 'Option D',
            dataIndex: 'optionD',
            key: 'optionD',
        },
    ];

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
            <Card title={ exam.title } extra={ <span>Date: { exam.date }</span> }>
                <Typography.Title level={ 3 } style={{ margin: '0', paddingBottom: '8px' }}>Questions:</Typography.Title>
                <Table
                    dataSource={ tableData }
                    columns={ tableColumns }
                    pagination={ false }
                />
                <Space style={{ marginTop: '16px' }}>
                    <Button type="dashed" onClick={ handleAddQuestion }>Add Question</Button>
                </Space>
            </Card>
            <Space style={{ marginTop: '16px' }}>
                <Button type="primary" onClick={ handleOpenFile }>
                    Open Exam File
                </Button>
                <Button onClick={ handleSaveFile }>Save Exam File</Button>
            </Space>
        </div>
    );
};

export default ExamPageFS;