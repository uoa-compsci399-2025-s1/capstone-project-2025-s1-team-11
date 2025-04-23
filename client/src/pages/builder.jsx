// src/pages/ExamFileManager.jsx
import React from "react";
import ExamDisplay from "../components/examDisplay.jsx";
import ExamFileManager from "../components/ExamFileManager.jsx";
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
    );
  };
  
  export default Builder;