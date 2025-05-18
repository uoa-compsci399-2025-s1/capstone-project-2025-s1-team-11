// src/pages/Marker.jsx

import React, { useState, useEffect } from "react";
import { Typography, message, Button, Input, Divider } from "antd";
import { useSelector } from "react-redux";
import { generateMarkingKey } from "../utilities/marker/keyGenerator.js";
import { markExams } from "../utilities/marker/examMarker.js";
import { generateResultOutput } from "../utilities/marker/outputFormatter.js";
import {dataReview} from "../components/marker/dataReview.jsx";
import {results} from "../components/marker/results.jsx"
import {teleformReader} from "../components/marker/teleformReader.jsx";
import {selectCorrectAnswerIndices} from "../store/exam/selectors.js";

const Marker = () => {
  const examData = useSelector((state) => state.exam.examData);
  const examAnswers = useSelector(selectCorrectAnswerIndices);
  const [teleformData, setTeleformData] = useState("");
  const [markingKey, setMarkingKey] = useState(null);
  const [resultsData, setResultsData] = useState([]);
  const [exportFormat, setExportFormat] = useState("json");
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (examAnswers) {
      setMarkingKey(generateMarkingKey(examAnswers));
    }
  }, [examAnswers]);

  const handleTeleformDataChange = (e) => {
    setTeleformData(e.target.value);
  };

  const handleMarkExams = () => {
    if (!teleformData) {
      message.error("Please enter teleform scan data before marking.");
      return;
    }
    if (!markingKey) {
      message.error("Marking key is not available.");
      return;
    }
    
    try {
      console.log("Marking exams with data:", teleformData);
      
      const examResults = markExams(examData, teleformData, markingKey);
      console.log("Exam results:", examResults);
      
      setResultsData(examResults);
      message.success("Exams marked successfully.");
      
      // Automatically advance to the results step
      setCurrentStep(2);
    } catch (error) {
      console.error("Error marking exams:", error);
      message.error("Failed to mark exams: " + error.message);
    }
  };

  const handleExportResults = () => {
    if (!results || results.length === 0) {
      message.error("No results available to export.");
      return;
    }
    
    let content, filename, type;
    
    if (exportFormat === "json") {
      content = JSON.stringify(results, null, 2);
      filename = `${examData.courseCode || 'exam'}_results.json`;
      type = "application/json";
    } else {
      // Text format (similar to legacy output)
      content = results.map(res => generateResultOutput(res, examData)).join('\n\n');
      filename = `${examData.courseCode || 'exam'}_results.txt`;
      type = "text/plain";
    }
    
    try {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      message.success("Results exported successfully.");
    } catch (error) {
      console.error("Export failed:", error);
      message.error("Failed to export results.");
    }
  };


  const renderMarkingStep = () => {
    return (
      <>
        <Typography.Title level={3}>Exam Marking Utility</Typography.Title>
        <Radio.Group
          onChange={(e) => setMarkingKeyType(e.target.value)}
          value={markingKeyType}
          style={{ marginBottom: 16 }}
        >
          <Radio value="enhanced">Enhanced JSON Key</Radio>
          <Radio value="legacy">Legacy Format Key</Radio>
        </Radio.Group>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={handleExportMarkingKey} disabled={!markingKeys}>
            Export Marking Key
          </Button>
        </div>
        <TextArea
          rows={6}
          placeholder="Enter teleform scan data here"
          value={teleformData}
          onChange={handleTeleformDataChange}
          style={{ marginBottom: 16 }}
        />
        <div>
          <Button type="primary" onClick={handleMarkExams}>
            Mark Exams
          </Button>
        </div>
      </>
    );
  };

  const renderResultsStep = () => {
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
        
        {/* Results display */}
        {results && results.length > 0 ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" onClick={handleExportResults}>
                Export Results
              </Button>
            </div>

            {results && results.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <Typography.Title level={4}>Statistics Summary</Typography.Title>
                <Row gutter={16}>
                  <Col span={6}>
                    <Statistic title="Total Students" value={results.length} />
                  </Col>
                  <Col span={6}>
                    <Statistic title="Max Score" value={Math.max(...results.map(r => r.totalMarks || 0))} />
                  </Col>
                  <Col span={6}>
                    <Statistic title="Min Score" value={Math.min(...results.map(r => r.totalMarks || 0))} />
                  </Col>
                  <Col span={6}>
                    <Statistic title="Average Score" value={
                      (results.reduce((acc, r) => acc + (r.totalMarks || 0), 0) / results.length).toFixed(2)
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
                              (results.filter(r => (r.totalMarks / r.maxMarks) >= 0.5).length / results.length) * 100
                            ).toFixed(1)
                          }
                        />
                      </Col>
                      <Col span={6}>
                        <Statistic
                          title="Score Range"
                          value={
                            `${Math.min(...results.map(r => r.totalMarks || 0))} - ${Math.max(...results.map(r => r.totalMarks || 0))}`
                          }
                        />
                      </Col>
                    </Row>

                    <Divider />

                    <Typography.Title level={5}>Score Distribution</Typography.Title>
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const lower = idx * 20;
                      const upper = lower + 20;
                      const count = results.filter(r => {
                        const percent = (r.totalMarks / r.maxMarks) * 100;
                        return percent >= lower && percent < upper;
                      }).length;

                      return (
                        <div key={idx} style={{ marginBottom: 8 }}>
                          <Typography.Text>{`${lower}% - ${upper}%:`}</Typography.Text>
                          <Progress
                            percent={count / results.length * 100}
                            showInfo={true}
                            format={percent => `${Math.round((percent * results.length) / 100)} students`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            <div className="results-preview" style={{ backgroundColor: "#f5f5f5", padding: 16, maxHeight: 400, overflow: "auto" }}>
              <h4>Preview: {results.length} students</h4>
              {results.map((result, index) => (
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
          </>
        ) : (
          <div style={{ padding: 16, backgroundColor: "#f5f5f5", textAlign: "center" }}>
            <p>No results available. Mark exams to see results here.</p>
          </div>
        )}
      </>
    );
  };

  // Render content based on current step
  const renderContent = () => {
    switch (currentStep) {
      case 0:
        return dataReview({ examData, markingKey} );
      case 1:
        return teleformReader({teleformData,markingKey,handleTeleformDataChange,handleMarkExams});
      case 2:
        return results({setExportFormat,exportFormat,resultsData,handleExportResults,examData});
      default:
        return null;
    }
  };

  const next = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 2));
  };

  const prev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <>

      <Typography.Title>MCQ Auto-Marker</Typography.Title>
      <Divider />
      
      <div style={{ margin: "24px 0" }}>
        {renderContent()}
      </div>

      <Divider />
      
      <div>
        <Button onClick={prev} disabled={currentStep === 0} style={{ marginRight: 8 }}>
          Back
        </Button>
        <Button type="primary" onClick={next} disabled={currentStep === 2}>
          Next
        </Button>
      </div>
    </>
  );
};

export default Marker;