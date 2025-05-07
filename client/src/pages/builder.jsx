import React from "react";

import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { createNewExam } from "../store/exam/examSlice.js";
import { selectExamData } from "../store/exam/selectors.js";
import ExamDisplay from "../components/examDisplay.jsx";
import ExamFileManager from "../components/ExamFileManager.jsx";
import MCQBuilderProgressWrapper from "../components/MCQBuilderProgressWrapper.jsx";
import { Typography, Button, Space } from "antd";
import { exportExamToPdf } from "../services/exportPdf.js";

const Builder = () => {
    const exam = useSelector(selectExamData);
    const navigate = useNavigate();
    const dispatch = useDispatch();

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
                    </div>
                );
            case 2:
                return (
                    <div>
                        <Typography.Title level={3}>Export & Randomise</Typography.Title>
                        <Typography.Paragraph type="secondary">
                            Export functions coming soon
                        </Typography.Paragraph>
                        <div style={{ marginTop: 24, marginBottom: 24 }}>
                            <Space>
                                <Button type="primary" onClick={() => navigate('/randomiser')}>
                                Open in Randomiser
                                </Button>
                            </Space>
                            </div>

                            <div style={{ marginBottom: 24 }}>
                            <Space>
                                <Button type="default" onClick={() => {/* TODO: implement DOCX download */}}>
                                Download as DOCX
                                </Button>
                                <Button type="default" onClick={() => exportExamToPdf(exam)}>
                                Download as PDF
                                </Button>
                            </Space>
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
            <ExamFileManager />
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
