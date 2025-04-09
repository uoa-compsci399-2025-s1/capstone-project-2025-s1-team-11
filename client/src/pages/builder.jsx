import React, { useState } from "react";
import ExamDisplay from "../components/examDisplay.jsx";
import ExamFileManager from "../components/ExamFileManager.jsx";
import MCQProgressWrapper from "../components/MCQProgressWrapper.jsx";

const Builder = () => {
    const [exam, setExam] = useState(null);
    const [fileName, setFileName] = useState(null);
    
    const handleExamLoaded = (examData, fileLabel) => {
        setExam(examData);
        setFileName(fileLabel);
      };

    const addQuestion = () => {
        if (!exam) return;
        const newId = exam.questions.length + 1;
        const newQuestion = {
            id: newId,
            questionText: `New Question ${newId}`,
            answer: "Answer",
            options: ["1", "2", "3", "4"],
        };
        setExam({ ...exam, questions: [...exam.questions, newQuestion] });
    };

    const renderStageContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <div>
                        <h1>Cover Page</h1>
                        
                    </div>
                );
            case 1:
                return (
                    <div>
                        <h1>Questions</h1>
            {exam ? (
                <ExamDisplay exam={exam} fileName={fileName} onAddQuestion={addQuestion} />
            ) : (
                <p>No exam loaded.</p>
            )}
            <ExamFileManager onExamLoaded={handleExamLoaded} />
                    </div>
                );
            case 2:
                return (
                    <div>
                        <h1>Export</h1>
                        <p>Export functionality coming soon.</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <MCQProgressWrapper>
            {(currentStep) => renderStageContent(currentStep)}
        </MCQProgressWrapper>
    );
};

export default Builder;
