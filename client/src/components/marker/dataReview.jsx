import {Alert, Button, Card, Radio, Space, Typography} from "antd";
import React from "react";
import ExamDisplay from "../shared/examDisplay.jsx";
import AnswerKeyPreview from "./AnswerKeyPreview.jsx";
import { EmptyExam } from "../shared/emptyExam.jsx";

const DataReview = ({ markingKey }) => {
  return (
    <>
      <Typography.Title level={3}>Review Exam</Typography.Title>
      
        <div>
          {/* <ExamDisplay exam={examData} /> */}
          <AnswerKeyPreview versionMap={markingKey} />
          { /**
           * Displays one or more versions of answer keys using AnswerGrid
           * @param {{
           *   versions: Array<{ bitmasks: number[] }>,
           *   title?: string
           * }} props
           */ }
           <EmptyExam/>
        </div>
    </>
  );
};

export default DataReview;