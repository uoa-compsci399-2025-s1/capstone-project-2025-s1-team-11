// // src/components/ReduxTest.jsx
// import React from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { examAdded } from '../features/exam/examSlice';

// const ReduxTest = () => {
//   const dispatch = useDispatch();
//   const exams = useSelector(state => state.exam.exams);

//   const handleAddExam = () => {
//     const newExam = { id: Date.now(), name: 'Test Exam', questions: [] };
//     dispatch(examAdded(newExam));
//   };

//   return (
//     <div>
//       <h2>Redux Test Component</h2>
//       <button onClick={handleAddExam}>Add Test Exam</button>
//       <pre>{JSON.stringify(exams, null, 2)}</pre>
//     </div>
//   );
// };

// export default ReduxTest;
test('Redux test placeholder', () => {
    expect(true).toBe(true);
});