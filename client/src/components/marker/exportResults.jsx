import React, { useState } from "react";
import { Button, Card, Checkbox, message, Radio, Space } from "antd";
import { generateResultOutput } from "../../utilities/marker/outputFormatter.js";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {DownloadOutlined} from "@ant-design/icons";

const ExportResults = ({ resultsData, currentExamData }) => {
  const [exportFormat, setExportFormat] = useState("text");
  const [includeFeedback, setIncludeFeedback] = useState(true);
  const courseCode = currentExamData?.courseCode || "exam";

  const handleExportStudentFiles = async () => {
    if (!Array.isArray(resultsData) || resultsData.length === 0) {
      message.error("No valid results available to export.");
      return;
    }

    if (exportFormat === "json") {
      const filename = `${courseCode}_student_results.json`;
      const content = JSON.stringify(resultsData, null, 2);
      const blob = new Blob([content], { type: "application/json" });
      saveAs(blob, filename);
      message.success("Results exported successfully.");
    } else {
      // Create a zip of all individual .txt files
      const zip = new JSZip();

      resultsData.forEach(res => {
        const content = generateResultOutput(res, currentExamData, includeFeedback);
        const filename = `${res.studentId || "student"}.txt`;
        zip.file(filename, content);
      });

      try {
        const blob = await zip.generateAsync({ type: "blob" });
        saveAs(blob, `${courseCode}_student_results.zip`);
        message.success("Results exported as ZIP file.");
      } catch (error) {
        console.error("Zip generation failed:", error);
        message.error("Failed to generate ZIP file.");
      }
    }
  };

  const handleExportMarksCsv = () => {
    if (!Array.isArray(resultsData) || resultsData.length === 0) {
      message.error("No valid results available to export.");
      return;
    }

    const header = "AUID,Total Marks";
    const rows = resultsData.map(res => `${res.studentId},${res.totalMarks}`);
    const content = [header, ...rows].join("\n");
    const blob = new Blob([content], { type: "text/csv" });
    saveAs(blob, `${courseCode}_marks.csv`);
    message.success("Marks CSV exported.");
  };

  return (
    <Card>
      <Radio.Group
        onChange={e => setExportFormat(e.target.value)}
        value={exportFormat}
        style={{ marginBottom: 16 }}
      >
        <Radio value="text">Default</Radio>
        <Radio value="json">All Raw Data</Radio>
      </Radio.Group>

      <Checkbox
        checked={includeFeedback}
        disabled={exportFormat === "json"}
        onChange={e => setIncludeFeedback(e.target.checked)}
        style={{ marginBottom: 16 }}
      >
        Include Results Feedback
      </Checkbox>

      <Space>
        <Button type="primary" onClick={handleExportStudentFiles} icon={<DownloadOutlined />}>
          Export Student Results
        </Button>

        <Button type="primary" onClick={handleExportMarksCsv} icon={<DownloadOutlined />}>
          Export Mark Summary (CSV)
        </Button>
      </Space>
    </Card>
  );
};

export default ExportResults;