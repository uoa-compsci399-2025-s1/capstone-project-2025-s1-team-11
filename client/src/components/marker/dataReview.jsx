import {Alert, Button, Card, Radio, Space, Typography} from "antd";
import React from "react";
import AnswerKeyPreview from "./AnswerKeyPreview.jsx";
import { EmptyExam } from "../shared/emptyExam.jsx";

const DataReview = ({ markingKey, navigationButtons }) => {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={2} style={{ margin: 0 }}>Review Exam</Typography.Title>
        {navigationButtons}
      </div>
      
      <div>
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