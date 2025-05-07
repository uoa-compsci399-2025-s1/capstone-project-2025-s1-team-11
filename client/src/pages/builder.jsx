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
        <Collapse defaultActiveKey={['1']} accordion>
          <Collapse.Panel header="Cover Page" key="1">
            <Typography.Paragraph type="secondary">
              Cover page content goes here.
            </Typography.Paragraph>
          </Collapse.Panel>
          <Collapse.Panel header="Questions" key="2">
            <ExamDisplay exam={exam} />
          </Collapse.Panel>
        </Collapse>
      </div>
    );
  };
  export default Builder;
