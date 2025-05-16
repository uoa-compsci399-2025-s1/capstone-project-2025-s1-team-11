import React from "react";

import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { createNewExam } from "../store/exam/examSlice.js";
import { selectExamData } from "../store/exam/selectors.js";
import ExamDisplay from "../components/examDisplay.jsx";
import ExamFileManager from "../components/ExamFileManager.jsx";
import { Typography, Button, Space, Collapse } from "antd";
import { exportExamToPdf } from "../services/exportPdf.js";

const Builder = () => {
    const exam = useSelector(selectExamData);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    return (
      <div style={{ padding: 24 }}>
        <Typography.Title level={2}>Builder</Typography.Title>
        <Typography.Title level={3}>Cover Page</Typography.Title>
        <Button type="default" style={{ marginBottom: 24 }}>
          Upload Cover Page
        </Button>
        <Typography.Title level={3}>Questions</Typography.Title>
        <ExamDisplay exam={exam} />
      </div>
    );
  };
  export default Builder;
