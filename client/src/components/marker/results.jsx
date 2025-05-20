import {Button, Col, Divider, Empty, Progress, Radio, Row, Statistic, Typography, Tabs, Select, Space} from "antd";
import { Column } from '@ant-design/charts';
import React, {useState, useEffect} from "react";
import QuestionStats from "./QuestionStats.jsx";
import StudentReport from "./StudentReport.jsx";
// import {updateCorrectAnswerAndRemark} from "../../utilities/marker/examMarker.js";
// import {sampleTestData} from "../../utilities/testing/sampleTestData.js";
import {generateResultOutput} from "../../utilities/marker/outputFormatter.js";
import {calculateStatistics} from "../../utilities/statistics/examStatistics.js";

export const Results = ({setExportFormat, exportFormat, resultsData, handleExportResults, examData}) => { //}, teleformData, markingKey, setResultsData, setExamData}) => {
  console.log("Results component received:", resultsData);
  
  // Always define hooks at the top level, never conditionally
  const [activeTab, setActiveTab] = useState("summary");
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [questionStats, setQuestionStats] = useState({});
  const [hasValidData, setHasValidData] = useState(false);
  const [statistics, setStatistics] = useState(null);
  // const [isLoadingTestData, setIsLoadingTestData] = useState(false);

  // When results data changes, calculate the statistics
  useEffect(() => {
    if (!resultsData || !Array.isArray(resultsData) || resultsData.length === 0) {
      console.log("No valid results data to process");
      setHasValidData(false);
      return;
    }

    setHasValidData(true);

    // Calculate statistics using the examStatistics utility
    const stats = calculateStatistics(resultsData);
    setStatistics(stats);
    setQuestionStats(stats.questionStats);

    // Set the first student as selected by default if there's data
    if (resultsData.length > 0 && resultsData[0].studentId) {
      setSelectedStudentId(resultsData[0].studentId);
    }
  }, [resultsData]);

  // Get the selected student data - always define this, even if we don't use it
  const selectedStudent = selectedStudentId && hasValidData
    ? resultsData.find(s => s.studentId === selectedStudentId)
    : (hasValidData && resultsData.length > 0 ? resultsData[0] : null);

  // Handler for loading test data from JSON
  /* const handleLoadTestData = async () => {
    try {
      setIsLoadingTestData(true);
      
      // Use the imported sample test data instead of fetching
      const testData = sampleTestData;
      console.log("Loaded test data:", testData);
      
      // Convert the test data format to match the expected format for resultsData
      const formattedResults = testData.studentResponses.map((student) => {
        // Create a results object for each student
        const studentResult = {
          studentId: student.studentId,
          firstName: `Student${student.studentId.substring(8)}`,
          lastName: `Test`,
          versionNumber: student.examVersion,
          totalMarks: 0,
          maxMarks: testData.exam.questions.length * 2.5, // Assuming each question is worth 2.5 marks
          questions: []
        };
        
        // Add each question's result
        testData.exam.questions.forEach((question, qIndex) => {
          const questionNumber = question.id;
          const studentAnswer = student.answers[qIndex] || "";
          const correctAnswer = testData.correctAnswers[student.examVersion]?.[questionNumber] || "";
          const isCorrect = studentAnswer === correctAnswer;
          
          // Add to total marks if correct
          if (isCorrect) {
            studentResult.totalMarks += 2.5;
          }
          
          // Map numeric answer codes to letters for display
          const answerMap = {
            "01": "A",
            "02": "B",
            "04": "C",
            "08": "D",
            "16": "E"
          };
          
          // Add question details
          studentResult.questions.push({
            questionNumber,
            studentAnswer,
            studentAnswerLetter: answerMap[studentAnswer] || "?",
            correctAnswer,
            correctAnswerLetter: answerMap[correctAnswer] || "?",
            isCorrect,
            marks: isCorrect ? 2.5 : 0,
            feedback: isCorrect ? "Correct" : "Incorrect"
          });
        });
        
        return studentResult;
      });
      
      // Set the results data and exam data
      setResultsData(formattedResults);
      
      // Add courseCode to the exam data
      const enhancedExamData = {
        ...testData.exam,
        courseCode: "CS111"
      };
      setExamData(enhancedExamData);
      
    } catch (error) {
      console.error("Error loading test data:", error);
      alert(`Failed to load test data: ${error.message}`);
    } finally {
      setIsLoadingTestData(false);
    }
  }; */
  
  // Validate resultsData
  if (!hasValidData) {
    return (
      <>
        <Empty 
          description={
            <div>
              <p>No results available. Mark exams to see results here.</p>
            </div>
          }
        />
      </>
    );
  }
  
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

      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleExportResults} style={{ marginRight: 16 }}>
          Export Results
        </Button>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="Summary" key="summary">
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="Total Students" value={statistics?.summary?.totalStudents || 0} />
            </Col>
            <Col span={6}>
              <Statistic 
                title="Average Score" 
                value={statistics?.summary?.averageMark || 0}
                suffix="%" 
                precision={1}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="Pass Rate" 
                value={statistics?.summary?.passRate || 0}
                suffix="%" 
                precision={1}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="Highest Score" 
                value={statistics?.summary?.highestMark || 0}
                suffix="%" 
                precision={1}
              />
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Statistic 
                title="Lowest Score" 
                value={statistics?.summary?.lowestMark || 0}
                suffix="%" 
                precision={1}
              />
            </Col>
          </Row>

          <Divider />

          <Typography.Title level={4}>Score Distribution</Typography.Title>
          {(() => {
            // Calculate percentage scores
            const scores = resultsData.map(student => 
              (student.totalMarks / student.maxMarks) * 100
            );
            
            // Use fixed 10% bins
            const binWidth = 10;
            const numBins = 10; // 0-10, 10-20, ..., 90-100
            
            // Create bins
            const bins = Array.from({ length: numBins }, (_, idx) => {
              const lower = idx * binWidth;
              const upper = lower + binWidth;
              const count = scores.filter(score => 
                score >= lower && (idx === numBins - 1 ? score <= upper : score < upper)
              ).length;
              return {
                range: `${lower}-${upper}%`,
                count: count,
              };
            });

            const config = {
              data: bins,
              xField: 'range',
              yField: 'count',
              label: false,
              xAxis: {
                label: {
                  autoRotate: true,
                  style: {
                    fontSize: 12,
                  }
                },
                tickLine: null,
                line: {
                  style: {
                    stroke: '#E5E5E5',
                  },
                },
              },
              yAxis: {
                tickLine: null,
                line: {
                  style: {
                    stroke: '#E5E5E5',
                  },
                },
              },
              height: 300,
              columnStyle: {
                fill: '#1890ff',
              },
            };

            return <Column {...config} />;
          })()}
        </Tabs.TabPane>

        <Tabs.TabPane tab="Question Analysis" key="questionStats">
          <QuestionStats 
            results={{ 
              all: resultsData,
              questionStats
            }}
            examData={examData}
          />
        </Tabs.TabPane>

        <Tabs.TabPane tab="Student Reports" key="students">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Select
              style={{ width: 200 }}
              placeholder="Select a student"
              value={selectedStudentId}
              onChange={setSelectedStudentId}
            >
              {resultsData.map(student => (
                <Select.Option key={student.studentId} value={student.studentId}>
                  {student.studentId} - {student.firstName} {student.lastName}
                </Select.Option>
              ))}
            </Select>

            {selectedStudent && (
              <StudentReport 
                student={selectedStudent}
                examData={examData}
              />
            )}
          </Space>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Student Results" key="studentResults">
          <div className="results-preview" style={{ padding: 16, maxHeight: 600, overflow: "auto" }}>
            <h4>Preview: {resultsData.length} students</h4>
            {resultsData.slice(0, 100).map((result, index) => (
              <div key={index} className="student-result" style={{ marginBottom: 12, padding: 8, borderRadius: 4 }}>
                <h5>{result.lastName || "Unknown"}, {result.firstName || "Student"} ({result.studentId || "N/A"})</h5>
                <p>Version: {result.versionNumber || result.versionId || "N/A"}</p>
                <p>Score: {result.totalMarks !== undefined ? result.totalMarks : "?"}/{result.maxMarks !== undefined ? result.maxMarks : "?"}</p>
                <details>
                  <summary>View Details</summary>
                  <pre>{generateResultOutput(result, examData)}</pre>
                </details>
              </div>
            ))}
            {resultsData.length > 100 && (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <Typography.Text type="secondary">
                  Showing first 100 of {resultsData.length} students for performance reasons
                </Typography.Text>
              </div>
            )}
          </div>
        </Tabs.TabPane>
      </Tabs>
    </>
  );
};