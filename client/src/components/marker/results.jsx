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

export const Results = ({resultsData, examData, navigationButtons}) => {
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
            <Col span={6}>
              <Statistic 
                title="Min Marks" 
                value={statistics?.summary?.lowestRawMark || 0}
                suffix=" marks"
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="Max Marks" 
                value={statistics?.summary?.highestRawMark || 0}
                suffix=" marks"
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="Total Marks" 
                value={statistics?.summary?.totalMarksAvailable || 0}
                suffix=" marks"
              />
            </Col>
          </Row>

          <Divider />

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Typography.Title level={4}>Score Distribution</Typography.Title>
              <div style={{ width: '100%', height: '400px', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={statistics?.summary?.scoreDistribution || []}
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="range" 
                      tick={{ fontSize: 12 }}
                      interval={0}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Number of Students', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(24, 144, 255, 0.1)' }}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                      }}
                      labelStyle={{ fontWeight: 'bold', color: '#1890ff' }}
                      formatter={(value) => [
                        `${value} students`,
                        'Count'
                      ]}
                      labelFormatter={(label) => `Score Range: ${label}`}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#1890ff"
                      radius={[4, 4, 0, 0]}
                      stroke="#096dd9"
                      strokeWidth={1}
                    />
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
            questionStats,
            versions: statistics?.versions || {},
            versionList: statistics?.versionList || []
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
          <div>
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              Search by name or student ID:
            </Typography.Text>
            <Select
              style={{ width: 400 }}
              placeholder="Search or select a student"
              value={selectedStudentId}
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) => {
                // Get the student ID from the option
                const studentId = option.value.toString();
                const label = option.label.toLowerCase();
                const searchTerm = input.toLowerCase();
                
                // Check if search directly matches the student ID
                if (studentId.includes(searchTerm)) {
                  return true;
                }
                
                // Fall back to searching in the full label
                return label.includes(searchTerm);
              }}
              notFoundContent="No students found"
              allowClear
              onChange={(value) => {
                //console.log("Selecting student with ID:", value);
                setSelectedStudentId(value);
              }}
              options={resultsData.map((student) => ({
                value: student.studentId,
                label: `${student.firstName} ${student.lastName} (${student.studentId}) - ${student.totalMarks !== undefined ? `${student.totalMarks}/${totalExamMarks}` : "N/A"}`
              }))}
            />
          </div>

          {selectedStudent ? (
            <StudentReport 
              student={selectedStudent}
              questionStats={questionStats}
              examData={examData}
              totalExamMarks={totalExamMarks}
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
              <Paragraph>Score: {result.totalMarks !== undefined ? result.totalMarks : "?"}/{totalExamMarks !== undefined ? totalExamMarks : "?"}</Paragraph>
              <details>
                <summary>View Details</summary>
                <pre>{generateResultOutput(result, examData, true, totalExamMarks)}</pre>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Results & Analytics</Title>
        {navigationButtons}
      </div>
      <Paragraph>
        This is the results dashboard. It summarises overall performance statistics and provides detailed insights regarding student responses,
        question-level performance and analysis. You can also export your results for further review.
      </Paragraph>

      <ExportResults
        resultsData = {resultsData}
        currentExamData = {examData}
        totalExamMarks = {totalExamMarks}
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