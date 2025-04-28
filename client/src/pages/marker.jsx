// src/pages/Marker.jsx

import React, { useState, useEffect } from "react";
import { Typography, Upload, message, Button, Radio, Input } from "antd";
import { useSelector } from "react-redux";
import { generateMarkingKeys, markExams, generateResultOutput } from "../utilities/createMarkingKey";
import MarkerProgressWrapper from "../components/MarkerProgressWrapper";

const { TextArea } = Input;

const Marker = () => {
  const examData = useSelector((state) => state.exam.examData);
  const [teleformData, setTeleformData] = useState("");
  const [markingKeyType, setMarkingKeyType] = useState("enhanced");
  const [markingKey, setMarkingKey] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (examData) {
      const keys = generateMarkingKeys(examData);
      setMarkingKey(keys);
    }
  }, [examData]);

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
    const isLegacy = markingKeyType === "legacy";
    const keyToUse = isLegacy ? markingKey.legacy : markingKey.enhanced;
    if (!keyToUse) {
      message.error("Selected marking key is not available.");
      return;
    }
    const markedResults = markExams(teleformData, keyToUse, isLegacy);
    const output = generateResultOutput(markedResults);
    setResults(output);
    message.success("Exams marked successfully.");
  };

  const handleExportMarkingKey = () => {
    if (!markingKey) {
      message.error("No marking key available to export.");
      return;
    }
    const keyToExport = markingKeyType === "legacy" ? markingKey.legacy : markingKey.enhanced;
    if (!keyToExport) {
      message.error("Selected marking key is not available for export.");
      return;
    }
    const keyDataStr = JSON.stringify(keyToExport, null, 2);
    const blob = new Blob([keyDataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marking_key_${markingKeyType}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportResults = () => {
    if (!results) {
      message.error("No results available to export.");
      return;
    }
    const resultsStr = JSON.stringify(results, null, 2);
    const blob = new Blob([resultsStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "marked_results.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderStageContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <Typography.Title level={3}>Upload Exam Sheet</Typography.Title>
            {examData ? (
              <p>Exam uploaded: {examData.examTitle || 'Unnamed Exam'}</p>
            ) : (
              <p>
                Please upload an exam in the Exam Builder page to begin.
              </p>
            )}
          </>
        );
      case 1:
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
      case 2:
        return (
          <>
            <Typography.Title level={3}>Results & Analytics</Typography.Title>
            <p>
              This is the results dashboard. It summarises overall performance statistics and provides detailed insights regarding student responses,
              question-level performance and analysis. You can also export your results for further review.
            </p>
            {results && (
              <>
                <pre style={{ backgroundColor: "#f5f5f5", padding: 16, maxHeight: 400, overflow: "auto" }}>
                  {JSON.stringify(results, null, 2)}
                </pre>
                <Button type="primary" onClick={handleExportResults} style={{ marginTop: 16 }}>
                  Export Results
                </Button>
              </>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Typography.Title>Auto-Marker</Typography.Title>
      <MarkerProgressWrapper canProceed={!!examData}>
        {(step) => renderStageContent(step)}
      </MarkerProgressWrapper>
    </>
  );
};

export default Marker;
