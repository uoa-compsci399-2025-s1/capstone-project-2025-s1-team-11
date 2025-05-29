import {
  Col,
  Divider,
  Empty,
  Row,
  Statistic,
  Typography,
  Tabs,
  Select,
  Space,
} from "antd";
const { Title, Text, Paragraph } = Typography;
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import React, {useState, useEffect } from "react";
import QuestionStats from "./QuestionStats.jsx";
import StudentReport from "./StudentReport.jsx";

// import {updateCorrectAnswerAndRemark} from "../../utilities/marker/examMarker.js";
import {generateResultOutput} from "../../utilities/marker/outputFormatter.js";
import {calculateStatistics} from "../../utilities/statistics/examStatistics.js";
import { selectTotalMarks } from "../../store/exam/selectors.js";
import { useSelector } from "react-redux";
import ExportResults from "./exportResults.jsx";

export const Results = ({resultsData, examData}) => {
  //console.log("Results component received:", resultsData);
  
  // Always define hooks at the top level, never conditionally
  const [activeTab, setActiveTab] = useState("summary");
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [questionStats, setQuestionStats] = useState({});
  const [hasValidData, setHasValidData] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const totalExamMarks = useSelector(selectTotalMarks);

  // Get the selected student data
  const selectedStudent = React.useMemo(() => {
    if (!hasValidData || !selectedStudentId || !resultsData) return null;
    return resultsData.find(s => s.studentId === selectedStudentId);
  }, [selectedStudentId, hasValidData, resultsData]);

  // When results data changes, calculate the statistics
  useEffect(() => {
    if (!resultsData || !Array.isArray(resultsData) || resultsData.length === 0) {
      //console.log("No valid results data to process");
      setHasValidData(false);
      return;
    }

    setHasValidData(true);

    // Calculate statistics using the examStatistics utility
    const stats = calculateStatistics(resultsData, totalExamMarks);
    setStatistics(stats);
    setQuestionStats(stats.questionStats);

    // Set the first student as selected by default if there's data
    if (resultsData.length > 0) {
      const firstStudent = resultsData[0];
      //console.log("First student data:", firstStudent);
      setSelectedStudentId(firstStudent.studentId);
    }
  }, [resultsData, totalExamMarks]);

  // Validate resultsData
  if (!hasValidData) {
    return (
      <>
        <Empty 
          description={
            <div>
              <Paragraph>No results available. Mark exams to see results here.</Paragraph>
            </div>
          }
        />
      </>
    );
  }
  
  const tabItems = [
    {
      key: 'summary',
      label: 'Summary',
      children: (
        <>
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
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" aspect={16/9}>
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
        </>
      )
    },
    {
      key: 'questionStats',
      label: 'Question Analysis',
      children: (
        <QuestionStats 
          results={{ 
            all: resultsData,
            questionStats
          }}
          examData={examData}
        />
      )
    },
    {
      key: 'students',
      label: 'Student Reports',
      children: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select
            style={{ width: 300 }}
            placeholder="Select a student"
            value={selectedStudentId}
            onChange={(value) => {
              //console.log("Selecting student with ID:", value);
              setSelectedStudentId(value);
            }}
          >
            {resultsData.map((student) => (
              <Select.Option key={student.studentId} value={student.studentId}>
                {student.firstName} {student.lastName} ({student.studentId})
              </Select.Option>
            ))}
          </Select>

          {selectedStudent ? (
            <StudentReport 
              student={selectedStudent}
              questionStats={questionStats}
              examData={examData}
            />
          ) : (
            <Typography.Text type="warning">
              Please select a student to view their report
            </Typography.Text>
          )}
        </Space>
      )
    },
    {
      key: 'studentResults',
      label: 'Student Results',
      children: (
        <div className="results-preview" style={{ padding: 16, maxHeight: 600, overflow: "auto" }}>
          <Title level={4}>Preview: {resultsData.length} students</Title>
          {resultsData.slice(0, 100).map((result, index) => (
            <div key={index} className="student-result" style={{ marginBottom: 12, padding: 8, borderRadius: 4 }}>
              <Text strong>{result.lastName || "Unknown"}, {result.firstName || "Student"} ({result.studentId || "N/A"})</Text>
              <Paragraph>Version: {result.versionNumber || result.versionId || "N/A"}</Paragraph>
              <Paragraph>Score: {result.totalMarks !== undefined ? result.totalMarks : "?"}/{result.maxMarks !== undefined ? result.maxMarks : "?"}</Paragraph>
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
      )
    }
  ];

  return (
    <>
      <Title level={3}>Results & Analytics</Title>
      <Paragraph>
        This is the results dashboard. It summarises overall performance statistics and provides detailed insights regarding student responses,
        question-level performance and analysis. You can also export your results for further review.
      </Paragraph>

      <ExportResults
        resultsData = {resultsData}
        currentExamData = {examData}
      />


      <Tabs 
        activeKey={activeTab} 
        onChange={(key) => {
          setActiveTab(key);
        }}
        destroyOnHidden={true}
        items={tabItems}
      />
    </>
  );
};