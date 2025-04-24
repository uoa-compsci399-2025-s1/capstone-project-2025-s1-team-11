//examManager.jsx

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createExam } from '../store/exam/examSlice';
import { selectExamData } from '../store/exam/selectors';

const ExamManager = () => {
  const dispatch = useDispatch();
  const exam = useSelector(selectExamData);

  const handleCreateExam = () => {
    const newExam = { year: Date.getFullYear(), title: 'New Exam' };
    dispatch(createExam(newExam));
  };

  return (
    <div>
      <button onClick={handleCreateExam}>Add Exam</button>
      {exam ? (
        <ul>
          <li key={exam.id}>{exam.name}</li>
        </ul>
      ) : (
        <p>No exam loaded.</p>
      )}
    </div>
  );
};

export default ExamManager;
