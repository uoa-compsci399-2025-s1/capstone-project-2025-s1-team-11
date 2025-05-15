import React, { useState } from 'react';
import { Card, Table, Typography, Progress, Tabs, Radio, Tag, Tooltip, InputNumber, Button, Space } from 'antd';
import { BarChartOutlined, PieChartOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons';

/**
 * Component to display detailed statistics for each question
 */
const QuestionStats = ({ results, examData, onUpdateCorrectAnswer }) => {
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [editMode, setEditMode] = useState(false);
  const [newCorrectAnswer, setNewCorrectAnswer] = useState({});

  // If no results or no question stats, show nothing
  if (!results || !results.questionStats || Object.keys(results.questionStats).length === 0) {
    return <Typography.Text>No question statistics available.</Typography.Text>;
  }

  const questionStats = results.questionStats;
  const questionNumbers = Object.keys(questionStats).map(Number).sort((a, b) => a - b);
  
  // Get teleform options
  const teleformOptions = examData?.teleformOptions || ['A', 'B', 'C', 'D', 'E'];
  
  // Helper function to convert bitmask to options
  const bitmaskToOptionLetters = (bitmask) => {
    if (!bitmask || bitmask === 0) return 'None';
    
    const options = [];
    if (bitmask & 1) options.push(teleformOptions[0]);
    if (bitmask & 2) options.push(teleformOptions[1]);
    if (bitmask & 4) options.push(teleformOptions[2]);
    if (bitmask & 8) options.push(teleformOptions[3]);
    if (bitmask & 16) options.push(teleformOptions[4]);
    
    return options.join(', ');
  };
  
  // Generate histogram data for the selected question
  const generateHistogramData = (questionNumber) => {
    if (!questionNumber || !questionStats[questionNumber]) return [];
    
    const stats = questionStats[questionNumber];
    const answerFreq = stats.answerFrequency || {};
    const correctAnswerNum = parseInt(stats.correctAnswer || '0', 10);
    
    return [
      { option: teleformOptions[0], value: answerFreq['01'] || 0, isCorrect: Boolean(correctAnswerNum & 1) },
      { option: teleformOptions[1], value: answerFreq['02'] || 0, isCorrect: Boolean(correctAnswerNum & 2) },
      { option: teleformOptions[2], value: answerFreq['04'] || 0, isCorrect: Boolean(correctAnswerNum & 4) },
      { option: teleformOptions[3], value: answerFreq['08'] || 0, isCorrect: Boolean(correctAnswerNum & 8) },
      { option: teleformOptions[4], value: answerFreq['16'] || 0, isCorrect: Boolean(correctAnswerNum & 16) },
    ];
  };
  
  // Handle updating correct answer
  const handleSaveCorrectAnswer = () => {
    if (selectedQuestion && newCorrectAnswer[selectedQuestion]) {
      onUpdateCorrectAnswer(selectedQuestion, newCorrectAnswer[selectedQuestion]);
      setEditMode(false);
    }
  };
  
  // Handle selecting options for multiple correct answers
  const handleSelectOption = (questionNumber, option) => {
    const bitmaskValues = { 'A': 1, 'B': 2, 'C': 4, 'D': 8, 'E': 16 };
    const optionValue = bitmaskValues[option];
    
    // Toggle the bit for this option
    const currentValue = newCorrectAnswer[questionNumber] || 0;
    const newValue = currentValue ^ optionValue; // XOR to toggle
    
    setNewCorrectAnswer({
      ...newCorrectAnswer,
      [questionNumber]: newValue
    });
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
  
  // Convert a bitmask to an array of selected options
  const bitmaskToOptions = (bitmask) => {
    const options = [];
    if (bitmask & 1) options.push('A');
    if (bitmask & 2) options.push('B');
    if (bitmask & 4) options.push('C');
    if (bitmask & 8) options.push('D');
    if (bitmask & 16) options.push('E');
    return options;
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
      render: (text) => <Progress percent={parseFloat(text || 0)} size="small" />,
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
                    backgroundColor: item.isCorrect ? '#52c41a' : '#f5f5f5',
                    marginRight: 2,
                    color: item.isCorrect ? 'white' : 'black',
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
      <Card title={`Question ${selectedQuestion} Details`} extra={
        <Space>
          {!editMode ? (
            <Button 
              icon={<EditOutlined />} 
              onClick={() => {
                setEditMode(true);
                // Initialize with current correct answer
                const currentBitmask = parseInt(stats.correctAnswer || '0', 10);
                setNewCorrectAnswer({
                  ...newCorrectAnswer,
                  [selectedQuestion]: currentBitmask
                });
              }}
            >
              Edit Correct Answer
            </Button>
          ) : (
            <Button 
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleSaveCorrectAnswer}
            >
              Save
            </Button>
          )}
        </Space>
      }>
        <div style={{ marginBottom: 20 }}>
          <Typography.Title level={5}>
            Difficulty: {getDifficultyTag(stats.difficultyLevel || 'Unknown')}
          </Typography.Title>
          <Typography.Text>
            Correct Answer: {
              editMode ? (
                <Radio.Group 
                  value={bitmaskToOptions(newCorrectAnswer[selectedQuestion] || 0)}
                >
                  {teleformOptions.map((option, i) => (
                    <Radio.Button 
                      key={i} 
                      value={option}
                      checked={Boolean(newCorrectAnswer[selectedQuestion] & (1 << i))}
                      onClick={() => handleSelectOption(selectedQuestion, option)}
                      style={{
                        backgroundColor: (newCorrectAnswer[selectedQuestion] & (1 << i)) 
                          ? '#52c41a' 
                          : undefined,
                        color: (newCorrectAnswer[selectedQuestion] & (1 << i)) 
                          ? 'white' 
                          : undefined,
                      }}
                    >
                      {option}
                    </Radio.Button>
                  ))}
                </Radio.Group>
              ) : (
                // Use our helper function to convert bitmask to options
                bitmaskToOptionLetters(parseInt(stats.correctAnswer || '0', 10))
              )
            }
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
              setEditMode(false);
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