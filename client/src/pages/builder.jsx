import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ExamDisplay from "../components/examDisplay.jsx";
import ExamFileManager from "../components/ExamFileManager.jsx";
import MCQBuilderProgressWrapper from "../components/MCQBuilderProgressWrapper.jsx";
import { Typography, Button } from "antd";

const Builder = () => {
    const exam = useSelector((state) => state.exam.examData);
    const navigate = useNavigate();

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
                        <ExamDisplay exam={exam} />
                        <ExamFileManager />
                    </div>
                );
            case 2:
                return (
                    <div>
                        <Typography.Title level={3}>Export & Randomise</Typography.Title>
                        <Typography.Paragraph type="secondary">
                            Export functions coming soon
                        </Typography.Paragraph>
                        <div style={{ marginTop: 16 }}>
                            <Button type="default" style={{ marginRight: 8 }}>
                                Download Exam
                            </Button>
                            <Button type="primary" onClick={() => navigate('/randomiser')}>
                                Open in Randomiser
                            </Button>
                        </div>
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
/*
        //Check Changes
import { useDispatch, useSelector } from 'react-redux';
import { createNewExam } from "../store/exam/examSlice.js";
import { selectExamData } from "../store/exam/selectors.js";
import { Button } from "antd";

const Builder = () => {
    const exam = useSelector(selectExamData); // Get examData from redux
    const dispatch = useDispatch();
  
    return (
      <div>
        <h1>MCQ Builder</h1>
        {exam ? (
          <ExamDisplay />
        ) : (
          <><p>No exam loaded.</p><p><Button onClick={() => dispatch(createNewExam({examTitle: 'New Exam'}))} type="primary" style={{ marginBottom: 16 }}>
              New Exam
            </Button></p></>
        )}
        <ExamFileManager />
      </div>
          */
    );
  };
  export default Builder;
