import React from "react";
import MCQRandomiserProgressWrapper from "../components/MCQRandomiserProgressWrapper.jsx";

const Randomiser = ({ }) => {
    
    const renderStageContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <div>
                        <h2>Upload Exam File</h2>
                        <h2>Continue with Existing file</h2>
                        
                    </div>
                );
            case 1:
                return (
                    <div>
                        <h2>Randomise Questions</h2>
            
                    </div>
                );
            case 2:
                return (
                    <div>
                        <h2>Export</h2>
                        <p>Export functionality coming soon.</p>
                    </div>
                );
            default:
                return null;
        }
    };

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
