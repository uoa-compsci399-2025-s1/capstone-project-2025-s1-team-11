import {Alert, Button, Card, Radio, Space, Typography} from "antd";
import React from "react";
//import {ExamDisplay} from "../examDisplay.jsx";
import AnswerKeyPreview from "./AnswerKeyPreview.jsx";
import EmptyExam from "../shared/emptyExam.jsx";

const DataReview = ({ examData, markingKey }) => {
  return (
    <>
      <Typography.Title level={3}>Review Exam</Typography.Title>
      {examData ? (
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
        </div>
      ) : (
        <EmptyExam/>
      )}
    </>
  );
};

export default DataReview;