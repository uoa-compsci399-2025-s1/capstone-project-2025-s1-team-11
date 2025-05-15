import {Button, Col, Divider, Empty, Progress, Radio, Row, Statistic, Typography, Tabs, Select, Space} from "antd";
import {generateResultOutput} from "../../utilities/marker/outputFormatter.js";
import React, {useState} from "react";
import QuestionStats from "./QuestionStats.jsx";
import StudentReport from "./StudentReport.jsx";
import {updateCorrectAnswerAndRemark} from "../../utilities/marker/examMarker.js";

export const Results = ({setExportFormat, exportFormat, resultsData, handleExportResults, examData, teleformData, markingKey}) => {
  const [activeTab, setActiveTab] = useState("summary");
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // Handler for updating correct answers
  const handleUpdateCorrectAnswer = (questionNumber, newCorrectAnswer) => {
    // Re-mark exams with updated correct answer
    updateCorrectAnswerAndRemark(
      questionNumber,
      newCorrectAnswer,
      examData,
      teleformData,
      markingKey
    );
  };

  // Get the selected student data
  const selectedStudent = selectedStudentId 
    ? resultsData.find(s => s.studentId === selectedStudentId)
    : resultsData[0];
  
  // Calculate question statistics from all students
  const questionStats = resultsData.reduce((stats, student) => {
    student.questions.forEach(q => {
      const qNum = q.questionNumber;
      
      // Initialize question stats if not already done
      if (!stats[qNum]) {
        stats[qNum] = {
          totalAnswers: 0,
          correctCount: 0,
          incorrectCount: 0,
          answerFrequency: {
            "01": 0, // Option A
            "02": 0, // Option B
            "04": 0, // Option C
            "08": 0, // Option D
            "16": 0  // Option E
          },
          difficultyLevel: '',
          correctAnswer: q.correctAnswer
        };
      }
      
      // Increment counters
      stats[qNum].totalAnswers++;
      if (q.isCorrect) {
        stats[qNum].correctCount++;
      } else {
        stats[qNum].incorrectCount++;
      }
      
      // Increment answer frequency
      stats[qNum].answerFrequency[q.studentAnswer]++;
    });
    return stats;
  }, {});
  
  // Calculate the percentage for each question
  Object.keys(questionStats).forEach(qNum => {
    const stats = questionStats[qNum];
    stats.correctPercentage = ((stats.correctCount / stats.totalAnswers) * 100).toFixed(1);
    
    // Set difficulty level
    const correctPercentage = parseFloat(stats.correctPercentage);
    if (correctPercentage >= 80) {
      stats.difficultyLevel = 'Easy';
    } else if (correctPercentage >= 40) {
      stats.difficultyLevel = 'Medium';
    } else {
      stats.difficultyLevel = 'Hard';
    }
  });
  
  return (
    <>
      <Typography.Title level={3}>Results & Analytics</Typography.Title>
      <p>
        This is the results dashboard. It summarises overall performance statistics and provides detailed insights regarding student responses,
        question-level performance and analysis. You can also export your results for further review.
      </p>

      {/* Export format selection */}
      <Radio.Group
        onChange={(e) => setExportFormat(e.target.value)}
        value={exportFormat}
        style={{ marginBottom: 16 }}
      >
        <Radio value="json">JSON Format</Radio>
        <Radio value="text">Text Format (Legacy Style)</Radio>
      </Radio.Group>

      {/* Result's display */}
      {resultsData && resultsData.length > 0 ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" onClick={handleExportResults}>
              Export Results
            </Button>
          </div>

          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={[
              {
                label: "Performance Summary",
                key: "summary",
                children: (
                  <div style={{ marginBottom: 24 }}>
                    <Typography.Title level={4}>Statistics Summary</Typography.Title>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Statistic title="Total Students" value={resultsData.length} />
                      </Col>
                      <Col span={6}>
                        <Statistic title="Max Score" value={Math.max(...resultsData.map(r => r.totalMarks || 0))} />
                      </Col>
                      <Col span={6}>
                        <Statistic title="Min Score" value={Math.min(...resultsData.map(r => r.totalMarks || 0))} />
                      </Col>
                      <Col span={6}>
                        <Statistic title="Average Score" value={
                          (resultsData.reduce((acc, r) => acc + (r.totalMarks || 0), 0) / resultsData.length).toFixed(2)
                        } />
                      </Col>
                    </Row>
                    {/* Additional Insights and Distribution */}
                    <div style={{ marginTop: 32, marginBottom: 0 }}>
                      <div style={{ marginBottom: 24 }}>
                        <Typography.Title level={5}>Additional Insights</Typography.Title>
                        <Row gutter={16}>
                          <Col span={6}>
                            <Statistic
                              title="Pass Rate (%)"
                              value={
                                (
                                  (resultsData.filter(r => (r.totalMarks / r.maxMarks) >= 0.5).length / resultsData.length) * 100
                                ).toFixed(1)
                              }
                            />
                          </Col>
                          <Col span={6}>
                            <Statistic
                              title="Score Range"
                              value={
                                `${Math.min(...resultsData.map(r => r.totalMarks || 0))} - ${Math.max(...resultsData.map(r => r.totalMarks || 0))}`
                              }
                            />
                          </Col>
                        </Row>

                        <Divider />

                        <Typography.Title level={5}>Score Distribution</Typography.Title>
                        {Array.from({ length: 5 }).map((_, idx) => {
                          const lower = idx * 20;
                          const upper = lower + 20;
                          const count = resultsData.filter(r => {
                            const percent = (r.totalMarks / r.maxMarks) * 100;
                            return percent >= lower && percent < upper;
                          }).length;

                          return (
                            <div key={idx} style={{ marginBottom: 8 }}>
                              <Typography.Text>{`${lower}% - ${upper}%:`}</Typography.Text>
                              <Progress
                                percent={count / resultsData.length * 100}
                                showInfo={true}
                                format={() => `${count} students`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )
              },
              {
                label: "Question Analysis",
                key: "questionStats",
                children: (
                  <QuestionStats 
                    results={{ 
                      all: resultsData,
                      questionStats
                    }}
                    examData={examData}
                    onUpdateCorrectAnswer={handleUpdateCorrectAnswer}
                  />
                )
              },
              {
                label: "Student Reports",
                key: "studentReports",
                children: (
                  <div>
                    <div style={{ marginBottom: 20 }}>
                      <Space>
                        <Typography.Text strong>Select Student:</Typography.Text>
                        <Select 
                          style={{ width: 300 }}
                          placeholder="Select a student"
                          value={selectedStudentId}
                          onChange={setSelectedStudentId}
                          options={resultsData.map(student => ({
                            value: student.studentId,
                            label: `${student.lastName}, ${student.firstName} (${student.studentId})`
                          }))}
                        />
                        <Button 
                          type="primary"
                          onClick={() => {
                            const printWindow = window.open('', '_blank');
                            printWindow.document.write(`
                              <html>
                                <head>
                                  <title>Student Report</title>
                                  <link rel="stylesheet" href="${window.location.origin}/index.css" />
                                  <style>
                                    body { padding: 20px; }
                                    @media print {
                                      button { display: none !important; }
                                    }
                                  </style>
                                </head>
                                <body>
                                  <div id="report-content">${document.getElementById('student-report-container').innerHTML}</div>
                                  <button onclick="window.print()">Print Report</button>
                                </body>
                              </html>
                            `);
                            printWindow.document.close();
                          }}
                        >
                          Print/Export Report
                        </Button>
                      </Space>
                    </div>
                    
                    <div id="student-report-container">
                      <StudentReport 
                        student={selectedStudent}
                        questionStats={questionStats}
                        examData={examData}
                      />
                    </div>
                  </div>
                )
              },
              {
                label: "Student Results",
                key: "studentResults",
                children: (
                  <div className="results-preview" style={{ backgroundColor: "#f5f5f5", padding: 16, maxHeight: 600, overflow: "auto" }}>
                    <h4>Preview: {resultsData.length} students</h4>
                    {resultsData.map((result, index) => (
                      <div key={index} className="student-result" style={{ marginBottom: 12, padding: 8, border: "1px solid #ddd", borderRadius: 4 }}>
                        <h5>{result.lastName || "Unknown"}, {result.firstName || "Unknown"} ({result.studentId || "N/A"})</h5>
                        <p>Version: {result.versionNumber || "N/A"}</p>
                        <p>Score: {result.totalMarks !== undefined ? result.totalMarks : "?"}/{result.maxMarks !== undefined ? result.maxMarks : "?"}</p>
                        <details>
                          <summary>View Details</summary>
                          <pre>{generateResultOutput(result, examData)}</pre>
                        </details>
                      </div>
                    ))}
                  </div>
                )
              }
            ]}
          />
        </>
      ) : (
        <Empty description="No results available. Mark exams to see results here."/>
      )}
    </>
  );
};