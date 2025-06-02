import React from 'react';
import { Card, Typography, Table, Divider, Progress, Tag } from 'antd';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const { Title, Text } = Typography;

/**
 * Component to display a student's exam report with class statistics comparison
 */
const StudentReport = ({ student, questionStats, examData, totalExamMarks }) => {
  if (!student || !student.questions) {
    return <Text>No data available for this student.</Text>;
  }

  const totalCorrect = student.questions.filter(q => q.isCorrect).length;
  const totalQuestions = student.questions.length;
  const studentScore = (student.totalMarks / (totalExamMarks || student.maxMarks)) * 100;
  
  // Prepare summary data for pie chart
  const summaryData = [
    { name: 'Correct', value: totalCorrect, color: '#52c41a' },
    { name: 'Incorrect', value: totalQuestions - totalCorrect, color: '#f5222d' },
  ];
  
  // Prepare question data for comparison chart
  const questionComparisonData = student.questions.map(q => {
    const qNum = q.questionNumber;
    const qStats = questionStats && questionStats[qNum] ? questionStats[qNum] : null;
    return {
      question: `Q${qNum}`,
      student: q.isCorrect ? 100 : 0,
      class: qStats ? parseFloat(qStats.correctPercentage || '0') : 0,
      studentColor: q.isCorrect ? '#52c41a' : '#f5222d',
    };
  });
  
  // Define columns for questions table
  const columns = [
    {
      title: '#',
      dataIndex: 'number',
      key: 'number',
      width: 60,
    },
    {
      title: 'Your Answer',
      dataIndex: 'studentAnswer',
      key: 'studentAnswer',
    },
    {
      title: 'Correct Answer',
      dataIndex: 'correctAnswer',
      key: 'correctAnswer',
    },
    {
      title: 'Result',
      key: 'result',
      render: (_, record) => (
        <Tag color={record.isCorrect ? 'success' : 'error'}>
          {record.isCorrect ? 'Correct' : 'Incorrect'}
        </Tag>
      ),
    },
    {
      title: 'Class Correct %',
      dataIndex: 'classPercentage',
      key: 'classPercentage',
      render: (text) => <Progress percent={parseFloat(text || '0')} size="small" />,
    },
  ];
  
  // Prepare data for the questions table
  const tableData = student.questions.map(q => {
    const qNum = q.questionNumber;
    const qStats = questionStats && questionStats[qNum] ? questionStats[qNum] : null;
    return {
      key: qNum,
      number: qNum,
      studentAnswer: q.studentAnswerLetter || 'None',
      correctAnswer: q.correctAnswerLetter || 'None',
      isCorrect: q.isCorrect || false,
      classPercentage: qStats ? qStats.correctPercentage || '0' : '0',
    };
  });
  
  // Get student name safely
  const firstName = student.firstName || 'Unknown';
  const lastName = student.lastName || 'Student';
  
  return (
    <Card title={`Exam Results for ${firstName} ${lastName}`} style={{ marginBottom: 20 }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <Title level={4}>{examData?.examTitle || 'Untitled Exam'}</Title>
        <Text strong>{examData?.courseCode || ''}</Text>
      </div>
      
      <Card type="inner" title="Score Summary">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4}>{student.totalMarks || 0} / {totalExamMarks || student.maxMarks || 0} ({studentScore.toFixed(1)}%)</Title>
            <Text>Correct Answers: {totalCorrect} / {totalQuestions}</Text>
          </div>
          
          <div style={{ width: '200px', height: '200px' }}>
            <ResponsiveContainer width="100%" aspect={1}>
              <PieChart>
                <Pie
                  data={summaryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {summaryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
      
      <Divider />
      
      <Card type="inner" title="Performance Comparison" style={{ marginBottom: 20 }}>
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" aspect={16/9}>
            <BarChart
              data={questionComparisonData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis dataKey="question" />
              <YAxis label={{ value: 'Correct %', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="student" name="Your Score" fill="#52c41a">
                {
                  questionComparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.studentColor} />
                  ))
                }
              </Bar>
              <Bar dataKey="class" name="Class Average" fill="#1890ff" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      <Card type="inner" title="Question Details">
        <Table 
          columns={columns} 
          dataSource={tableData} 
          pagination={false}
          size="small"
        />
      </Card>
    </Card>
  );
};

export default StudentReport; 