// src/pages/Marker.jsx

import React, { useState, useEffect } from "react";
import { Typography, message, Button, Input, Divider, Radio, Row, Col, Statistic } from "antd";
import { useSelector } from "react-redux";
import { generateMarkingKey } from "../utilities/marker/keyGenerator.js";
import { markExams } from "../utilities/marker/examMarker.js";
import { generateResultOutput } from "../utilities/marker/outputFormatter.js";
import { DataReview } from "../components/marker/dataReview.jsx";
import { Results } from "../components/marker/results.jsx";
import { TeleformReader } from "../components/marker/teleformReader.jsx";
import { AnswerGrid } from "../components/marker/AnswerGrid.jsx";
import { AnswerKeyPreview } from "../components/marker/AnswerKeyPreview.jsx";
import { selectCorrectAnswerIndices } from "../store/exam/selectors.js";

const { TextArea } = Input;

const Marker = () => {
  const examData = useSelector((state) => state.exam.examData);
  const examAnswers = useSelector(selectCorrectAnswerIndices);
  const [teleformData, setTeleformData] = useState("");
  const [markingKey, setMarkingKey] = useState(null);
  const [resultsData, setResultsData] = useState([]);
  const [exportFormat, setExportFormat] = useState("json");
  const [currentStep, setCurrentStep] = useState(0);
  const [markingKeyType, setMarkingKeyType] = useState("enhanced");

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
    if (!resultsData || resultsData.length === 0) {
      message.error("No results available to export.");
      return;
    }
    
    let content, filename, type;
    
    if (exportFormat === "json") {
      content = JSON.stringify(resultsData, null, 2);
      filename = `${examData.courseCode || 'exam'}_results.json`;
      type = "application/json";
    } else {
      content = resultsData.map(res => generateResultOutput(res, examData)).join('\n\n');
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

  const handleExportMarkingKey = () => {
    if (!markingKey) {
      message.error("No marking key available.");
      return;
    }

    const content = JSON.stringify(markingKey, null, 2);
    const filename = `${examData.courseCode || 'exam'}_marking_key.json`;
    
    try {
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      message.success("Marking key exported successfully.");
    } catch (error) {
      console.error("Export failed:", error);
      message.error("Failed to export marking key.");
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
          <Button type="primary" onClick={handleExportMarkingKey} disabled={!markingKey}>
            Export Marking Key
          </Button>
        </div>

        <AnswerKeyPreview markingKey={markingKey} />
        
        <Divider />
        
        <TeleformReader 
          value={teleformData}
          onChange={handleTeleformDataChange}
        />
        
        <div style={{ marginTop: 16 }}>
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
        
        <Radio.Group
          onChange={(e) => setExportFormat(e.target.value)}
          value={exportFormat}
          style={{ marginBottom: 16 }}
        >
          <Radio value="json">JSON Format</Radio>
          <Radio value="text">Text Format (Legacy Style)</Radio>
        </Radio.Group>
        
        {resultsData && resultsData.length > 0 && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" onClick={handleExportResults}>
                Export Results
              </Button>
            </div>

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

              <div style={{ marginTop: 32 }}>
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
              </div>
            </div>

            <Results results={resultsData} examData={examData} />
            <AnswerGrid results={resultsData} examData={examData} />
          </>
        )}
      </>
    );
  };

  const renderContent = () => {
    switch (currentStep) {
      case 0:
        return <DataReview examData={examData} />;
      case 1:
        return renderMarkingStep();
      case 2:
        return renderResultsStep();
      default:
        return null;
    }
  };

  const next = () => {
    setCurrentStep(currentStep + 1);
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div style={{ padding: '24px' }}>
      {renderContent()}
      
      <div style={{ marginTop: 24 }}>
        {currentStep > 0 && (
          <Button style={{ marginRight: 8 }} onClick={prev}>
            Previous
          </Button>
        )}
        {currentStep < 2 && (
          <Button type="primary" onClick={next}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
};

export default Marker;