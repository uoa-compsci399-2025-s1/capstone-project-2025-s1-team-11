// src/pages/ExamFileManager.jsx
import React from "react";
import ExamDisplay from "../components/examDisplay.jsx";
import ExamFileManager from "../components/ExamFileManager.jsx";
import {useExam} from "../context/examContext.jsx";

const Builder = () => {
    const exam = useExam();

    return (
        <div>
            <h1>MCQ Builder</h1>
            {exam ? (
                <ExamDisplay/>
            ) : (
                <p>No exam loaded.</p>
            )}
            <ExamFileManager/>
        </div>
    );
};

export default Builder;
