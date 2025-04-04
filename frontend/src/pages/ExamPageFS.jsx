// src/pages/ExamPage.jsx

import React, { useState } from "react";
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
            <h1>{exam.title}</h1>
            <p>Date: {exam.date}</p>
            <h2>Questions:</h2>
            <ul>
                {exam.questions.map((q) => (
                    <li key={q.id}>
                        {q.questionText} (Answer: {q.answer})
                    </li>
                ))}
            </ul>
            <button onClick={handleOpenFile}>Open Exam File</button>
            <button onClick={handleSaveFile}>Save Exam File</button>
            <button onClick={handleAddQuestion}>Add Question</button>
        </div>
    );
};

export default ExamPageFS;