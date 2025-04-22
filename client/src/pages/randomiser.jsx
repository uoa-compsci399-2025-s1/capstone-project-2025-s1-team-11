import React from "react";
import MCQRandomiserProgressWrapper from "../components/MCQRandomiserProgressWrapper.jsx";
import RandomisedExamDisplay from "../components/RandomisedExamDisplay.jsx";
import { Typography, Button } from "antd";

const Randomiser = ({ }) => {
    
    const renderStageContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <div>
                        
                        <Typography.Title level={3}>Exam File Upload</Typography.Title>
                        <Typography.Paragraph type="secondary">
                                                     No exam loaded.
                                                </Typography.Paragraph>
                        <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
                            <Button type="default">Import from MCQ Builder</Button>
                            <Button type="default">Upload JSON file</Button>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div>
                        <RandomisedExamDisplay />
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
const Randomiser = () => {

    return (
        <div>
            <h1>Randomiser</h1>
            <MCQRandomiserProgressWrapper>
            {(currentStep) => renderStageContent(currentStep)}
            </MCQRandomiserProgressWrapper>
        </div>
    );
};

export default Randomiser;
