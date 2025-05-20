import React, { useState } from 'react';
import { Card, Table, Typography, Progress, Tabs, Radio, Tag, Tooltip, InputNumber, Button, Space } from 'antd';
import { BarChartOutlined, PieChartOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons';

/**
 * Component to display detailed statistics for each question
 */
const QuestionStats = ({ results, examData }) => {
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [viewMode, setViewMode] = useState('table');

  // If no results or no question stats, show nothing
  if (!results || !results.questionStats || Object.keys(results.questionStats).length === 0) {
    return <Typography.Text>No question statistics available.</Typography.Text>;
  }

  const questionStats = results.questionStats;
  const questionNumbers = Object.keys(questionStats).map(Number).sort((a, b) => a - b);
  
  // Get teleform options
  const teleformOptions = examData?.teleformOptions || ['A', 'B', 'C', 'D', 'E'];
  
  // Helper function to convert bitmask to options - adjusted for the 4-i mapping
  const bitmaskToOptionLetters = (bitmask) => {
    if (!bitmask || bitmask === 0) return 'None';
    
    // Convert to binary and pad with 0s
    const binary = bitmask.toString(2).padStart(5, '0');
    const options = [];
    
    // In this format, the bits are reversed
    // Binary "10000" (16) would be option A
    // Binary "01000" (8) would be option B
    // etc.
    if (binary[0] === '1') options.push(teleformOptions[0]);
    if (binary[1] === '1') options.push(teleformOptions[1]);
    if (binary[2] === '1') options.push(teleformOptions[2]);
    if (binary[3] === '1') options.push(teleformOptions[3]);
    if (binary[4] === '1') options.push(teleformOptions[4]);
    
    return options.join(', ');
  };
  
  // Generate histogram data for the selected question
  const generateHistogramData = (questionNumber) => {
    if (!questionNumber || !questionStats[questionNumber]) return [];
    
    const stats = questionStats[questionNumber];
    const answerFreq = stats.answerFrequency || {};
    const correctAnswerNum = parseInt(stats.correctAnswer || '0', 10);
    
    // Convert to binary representation for determining correct options
    const binary = correctAnswerNum.toString(2).padStart(5, '0');
    
    return [
      { option: teleformOptions[0], value: answerFreq['01'] || 0, isCorrect: binary[4] === '1' },
      { option: teleformOptions[1], value: answerFreq['02'] || 0, isCorrect: binary[3] === '1' },
      { option: teleformOptions[2], value: answerFreq['04'] || 0, isCorrect: binary[2] === '1' },
      { option: teleformOptions[3], value: answerFreq['08'] || 0, isCorrect: binary[1] === '1' },
      { option: teleformOptions[4], value: answerFreq['16'] || 0, isCorrect: binary[0] === '1' },
    ];
  };
  

  

  
  // Generate the difficulty tag
  const getDifficultyTag = (difficultyLevel) => {
    const colorMap = {
      'Easy': 'success',
      'Medium': 'warning',
      'Hard': 'error'
    };
    
    return <Tag color={colorMap[difficultyLevel] || 'default'}>{difficultyLevel}</Tag>;
  };
  
  
  // The questions table
  const columns = [
    {
      title: 'Q#',
      dataIndex: 'questionNumber',
      key: 'questionNumber',
      width: 70,
    },
    {
      title: 'Difficulty',
      dataIndex: 'difficultyLevel',
      key: 'difficultyLevel',
      width: 100,
      render: (text) => getDifficultyTag(text),
    },
    {
      title: 'Correct Answer',
      dataIndex: 'correctAnswer',
      key: 'correctAnswer',
      width: 150,
      render: (text, record) => {
        return <span>{record.correctAnswerLetter}</span>;
      },
    },
    {
      title: 'Correct %',
      dataIndex: 'correctPercentage',
      key: 'correctPercentage',
      width: 120,
      render: (text) => <Progress percent={parseFloat(text || 0)} size="small" strokeColor="#52c41a" success={{ percent: 0 }} />,
    },
    {
      title: 'Answer Distribution',
      key: 'distribution',
      render: (_, record) => {
        const histData = generateHistogramData(record.questionNumber);
        
        if (histData.length === 0 || histData.every(item => item.value === 0)) {
          return <Typography.Text type="secondary">No data</Typography.Text>;
        }
        
        const max = Math.max(...histData.map(d => d.value));
        
        return (
          <div style={{ display: 'flex', width: '100%', height: 30 }}>
            {histData.map((item, index) => (
              <Tooltip key={index} title={`${item.option}: ${item.value} responses`}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${max > 0 ? (item.value / max) * 100 : 0}%`, 
                    backgroundColor: item.isCorrect ? token.colorSuccess : token.colorFillSecondary,
                    marginRight: 2,
                    color: item.isCorrect ? 'white' : undefined,
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    minWidth: item.value > 0 ? 20 : 0,
                  }}
                >
                  {item.value > 0 && `${item.option}`}
                </div>
              </Tooltip>
            ))}
          </div>
        );
      },
    },
  ];
  
  // Convert question stats to data for the table
  const tableData = questionNumbers.map(qNum => {
    const stats = questionStats[qNum] || {};
    
    // Use our helper function to convert bitmask to options
    const correctAnswerLetter = bitmaskToOptionLetters(parseInt(stats.correctAnswer || '0', 10));
    
    return {
      key: qNum,
      questionNumber: qNum,
      correctAnswer: stats.correctAnswer || '00',
      correctAnswerLetter,
      difficultyLevel: stats.difficultyLevel || 'Unknown',
      correctPercentage: stats.correctPercentage || '0',
      totalAnswers: stats.totalAnswers || 0,
      correctCount: stats.correctCount || 0,
      incorrectCount: stats.incorrectCount || 0,
      answerFrequency: stats.answerFrequency || {},
    };
  });
  
  // Detailed view of a selected question
  const renderQuestionDetail = () => {
    if (!selectedQuestion || !questionStats[selectedQuestion]) {
      return <Typography.Text>Select a question to view details</Typography.Text>;
    }
    
    const stats = questionStats[selectedQuestion];
    const histData = generateHistogramData(selectedQuestion);
    
    return (
      <Card title={`Question ${selectedQuestion} Details`}>
        <div style={{ marginBottom: 20 }}>
          <Typography.Title level={5}>
            Difficulty: {getDifficultyTag(stats.difficultyLevel || 'Unknown')}
          </Typography.Title>
          <Typography.Text>
            Correct Answer: {bitmaskToOptionLetters(parseInt(stats.correctAnswer || '0', 10))}
          </Typography.Text>
          <Typography.Text style={{ display: 'block', marginTop: 10 }}>
            Correct: {stats.correctCount || 0} ({stats.correctPercentage || '0.0'}%) 
            &nbsp;|&nbsp; 
            Incorrect: {stats.incorrectCount || 0} ({(100 - parseFloat(stats.correctPercentage || '0')).toFixed(1)}%)
          </Typography.Text>
        </div>
        
        <Typography.Title level={5}>Answer Distribution</Typography.Title>
        <div style={{ marginTop: 20 }}>
          {histData.map((item, index) => (
            <div key={index} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 40, marginRight: 10 }}>
                  <Typography.Text strong>{item.option}</Typography.Text>
                </div>
                <Progress 
                  percent={(item.value / (stats.totalAnswers || 1)) * 100} 
                  format={() => `${item.value} (${((item.value / (stats.totalAnswers || 1)) * 100).toFixed(1)}%)`}
                  strokeColor={item.isCorrect ? '#52c41a' : undefined}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };
  
  return (
    <div style={{ marginTop: 20 }}>
      <Typography.Title level={4}>Question Analysis</Typography.Title>
      
      <div style={{ display: 'flex', marginBottom: 16 }}>
        <Radio.Group
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="table">
            <BarChartOutlined /> Table View
          </Radio.Button>
          <Radio.Button value="detail">
            <PieChartOutlined /> Detail View
          </Radio.Button>
        </Radio.Group>
      </div>
      
      {viewMode === 'table' ? (
        <Table 
          columns={columns} 
          dataSource={tableData} 
          pagination={false}
          size="small"
          onRow={(record) => ({
            onClick: () => {
              setSelectedQuestion(record.questionNumber);
              setViewMode('detail');
            },
          })}
        />
      ) : (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Radio.Group 
              value={selectedQuestion} 
              onChange={(e) => setSelectedQuestion(e.target.value)}
              buttonStyle="solid"
            >
              {questionNumbers.map(qNum => (
                <Radio.Button key={qNum} value={qNum}>
                  Question {qNum}
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>
          
          {renderQuestionDetail()}
        </div>
      )}
    </div>
  );
};

export default QuestionStats; 