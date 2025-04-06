import React, { useState } from "react";
import Exam from "./models/Exam.js";
import { Question } from "../models/Question.js";
import { exportExamToJSON, importExamFromJSON } from "../services/jsonExamService.js";

const ExamPage = () => {
    // Initialize a sample exam instance
    const [exam, setExam] = useState(
        new Exam("Midterm Exam", "2025-04-04", [
            new Question(1, "What is 2+2?", "4", ["3", "4", "5"]),
            new Question(2, "Capital of France?", "Paris", ["Paris", "London", "Rome"]),
        ])
    );

    // Trigger a JSON export
    const handleExport = () => {
        exportExamToJSON(exam, "Exam_Midterm.json");
    };

    // Import exam data from a JSON file
    const handleImport = (event) => {
        const file = event.target.files[0];
        if (file) {
            importExamFromJSON(file, (error, importedExam) => {
                if (error) {
                    console.error("Error importing exam:", error);
                } else {
                    setExam(importedExam);
                    console.log("Imported Exam:", importedExam);
                }
            });
        }
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
            <button onClick={handleExport}>Export Exam to JSON</button>
            <br />
            <input type="file" onChange={handleImport} accept=".json" />
        </div>
    );
};

export default ExamPage;