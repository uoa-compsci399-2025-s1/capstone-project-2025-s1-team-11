import {Button, Col, Divider, Empty, Progress, Radio, Row, Statistic, Typography, Tabs, Select, Space} from "antd";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import React, {useState, useEffect} from "react";
import QuestionStats from "./QuestionStats.jsx";
import StudentReport from "./StudentReport.jsx";
// import {updateCorrectAnswerAndRemark} from "../../utilities/marker/examMarker.js";
import {generateResultOutput} from "../../utilities/marker/outputFormatter.js";
import {calculateStatistics} from "../../utilities/statistics/examStatistics.js";

export const Results = ({setExportFormat, exportFormat, resultsData, handleExportResults, examData}) => {
  console.log("Results component received:", resultsData);
  
  // Always define hooks at the top level, never conditionally
  const [activeTab, setActiveTab] = useState("summary");
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [questionStats, setQuestionStats] = useState({});
  const [hasValidData, setHasValidData] = useState(false);
  const [statistics, setStatistics] = useState(null);

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

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Typography.Title level={4}>Score Distribution</Typography.Title>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={statistics?.summary?.scoreDistribution || []}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1890ff" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Col>
          </Row>
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
              {resultsData.map((student, index) => (
                <Select.Option key={`student-${index}-${student.studentId || 'unknown'}`} value={student.studentId}>
                  {student.studentId || 'Unknown ID'} - {student.firstName || 'Unknown'} {student.lastName || 'Student'}
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