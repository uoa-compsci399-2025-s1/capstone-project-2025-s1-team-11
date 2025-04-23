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

  console.log("Exam in display:", exam);

  const handleAddQuestion = () => {
    const questionData = {
      contentText: 'New Question',
      answers: ['Answer 1', 'Answer 2', 'Answer 3', 'Answer 4', 'Answer 5'],
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
      render: (answers) => answers.join(', '),
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

  // if (!exam) {
  //   return <div>No exam loaded.</div>;
  // }
//   return (
//     <div>
//       {exam && (
//         <Card
//           title={exam.examTitle}
//           extra={<span>Course: {exam.courseName} ({exam.semester} {exam.year})</span>}
//           style={{ marginTop: 24 }}
//         >
//           <Typography.Title level={3} style={{ margin: 0, paddingBottom: 8 }}>
//             Questions:
//           </Typography.Title>
//           <Table
//             const questions = useSelector(selectQuestionsForTable);
//             dataSource={exam.examBody.flatMap(section =>
//               section.questions.map((q, index) => ({
//                 key: q.questionNumber, // Use `questionNumber` for the key
//                 number: index + 1,
//                 questionText: q.questionText,
//                 marks: q.marks,  // Marks per question
//                 answer: q.answers.join(', '),  // Join all possible answers
//               }))
//             )}
//             columns={[
//               { title: "#", dataIndex: "number", key: "number" },
//               { title: "Question", dataIndex: "questionText", key: "questionText" },
//               { title: "Marks", dataIndex: "marks", key: "marks" },
//               { title: "Answer Options", dataIndex: "answer", key: "answer" },
//             ]}
//             pagination={false}
//           />
//         </Card>
//       )}
//       <Space style={{ marginTop: "16px" }}>
//         <Button type="dashed" onClick={handleAddQuestion}>
//           Add Question
//         </Button>
//       </Space>
//     </div>
//   );
// };

export default ExamDisplay;
