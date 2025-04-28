// src/components/ExamDisplay.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Space, Table, Typography, Card } from "antd";
//import { addQuestion } from '../actions/examActions';  // Assuming you have an action for adding a question
import { 
  addQuestion,
} from '../store/exam/examSlice';
import {
  selectExamData,
  selectQuestionsForTable,
} from '../store/exam/selectors';

const ExamDisplay = () => {
  // Get exam data from the Redux store
  //const exam = useSelector(state => state.exam);
  const exam = useSelector(selectExamData);
  const dispatch = useDispatch();
  const questions = useSelector(selectQuestionsForTable);

  const handleAddQuestion = () => {
    const questionData = {
      contentText: 'New Question',
      answers: ['Answer 1', 'Answer 2', 'Answer 3', 'Answer 4', 'Answer 5'],
      marks: 1,
    };
        
    dispatch(addQuestion({ questionData })); 
  };

  const columns = [
    {
      title: 'Section No',
      dataIndex: 'sectionNumber',
      key: 'sectionNumber',
    },
    {
      title: 'Q#',
      dataIndex: 'questionNumber',
      key: 'questionNumber',
    },
    {
      title: 'Question',
      dataIndex: 'questionText',
      key: 'questionText',
    },
    {
      title: 'Marks',
      dataIndex: 'marks',
      key: 'marks',
    },
    {
      title: 'Answers',
      dataIndex: 'answers',
      key: 'answers',
      render: (answers) => answers.map(a => a?.contentText || '').join(', '),
    },
  ];

  return (
    <div>
      <h2>Exam Questions</h2>
      <Button onClick={handleAddQuestion} type="primary" style={{ marginBottom: 16 }}>
        Add Question
      </Button>
      <Table
        dataSource={questions}
        columns={columns}
        rowKey={(record) => `${record.sectionNumber ?? 'none'}-${record.questionNumber}`}
        pagination={false}
      />
    </div>
  );
};


export default ExamDisplay;
