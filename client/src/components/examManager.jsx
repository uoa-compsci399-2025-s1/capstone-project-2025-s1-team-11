import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { examAdded } from '../features/exam/examSlice';

const ExamManager = () => {
  const dispatch = useDispatch();
  const exams = useSelector((state) => state.exam.exams);

  const handleAddExam = () => {
    const newExam = { id: Date.now(), name: 'New Exam', questions: [] };
    dispatch(examAdded(newExam));
  };

  return (
    <div>
      <button onClick={handleAddExam}>Add Exam</button>
      <ul>
        {exams.map((exam) => (
          <li key={exam.id}>{exam.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default ExamManager;
