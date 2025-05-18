import React from "react";

import { useSelector } from 'react-redux';
import { selectExamData } from "../store/exam/selectors.js";
import ExamDisplay from "../components/examDisplay.jsx";
import { Typography, Button } from "antd";

const Builder = () => {
    const exam = useSelector(selectExamData);

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
