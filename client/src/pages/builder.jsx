import React, { useState } from "react";
import ExamDisplay from "../components/examDisplay.jsx";
import ExamFileManager from "../components/ExamFileManager.jsx";
import MCQBuilderProgressWrapper from "../components/MCQBuilderProgressWrapper.jsx";
import { Typography } from "antd";

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
                        <Typography.Title level={3}>Cover Page</Typography.Title>
                        
                    </div>
                );
            case 1:
                return (
                    <div>
                        <Typography.Title level={3}>MCQ Exam Questions</Typography.Title>
            {exam ? (
                <ExamDisplay exam={exam} fileName={fileName} onAddQuestion={addQuestion} />
            ) : (
                <Typography.Paragraph type="secondary">
                             No exam loaded.
                        </Typography.Paragraph>
            )}
            <ExamFileManager onExamLoaded={handleExamLoaded} />
                    </div>
                );
            case 2:
                return (
                    <div>
                        <Typography.Title level={3}>Download Exam</Typography.Title>
                        <Typography.Paragraph type="secondary">
                             Export functions coming soon
                        </Typography.Paragraph>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <h1> Builder</h1>
        <MCQBuilderProgressWrapper>
            {(currentStep) => renderStageContent(currentStep)}
            </MCQBuilderProgressWrapper>
        </>
    );
};

export default Builder;
