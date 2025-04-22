import React from "react";
import ExamDisplay from "../components/examDisplay.jsx";
import ExamFileManager from "../components/ExamFileManager.jsx";
import MCQBuilderProgressWrapper from "../components/MCQBuilderProgressWrapper.jsx";
import { Typography } from "antd";

const Builder = () => {
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
                        <ExamDisplay />
                        <ExamFileManager />
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
