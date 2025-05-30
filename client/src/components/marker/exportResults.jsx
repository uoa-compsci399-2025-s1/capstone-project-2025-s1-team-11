import React, { useState } from "react";
import { Button, Card, Checkbox, message, Radio } from "antd";
import { generateResultOutput } from "../../utilities/marker/outputFormatter.js";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const ExportResults = ({ resultsData, currentExamData }) => {
  const [exportFormat, setExportFormat] = useState("text");
  const [includeFeedback, setIncludeFeedback] = useState(true);

  const handleExportResults = async () => {
    if (!Array.isArray(resultsData) || resultsData.length === 0) {
      message.error("No valid results available to export.");
      return;
    }

    const courseCode = currentExamData?.courseCode || "exam";

    if (exportFormat === "json") {
      const filename = `${courseCode}_student_results.json`;
      const content = JSON.stringify(resultsData, null, 2);
      const blob = new Blob([content], { type: "application/json" });
      saveAs(blob, filename);
      message.success("Results exported successfully.");
    } else {
      // Create a zip of all individual .txt files
      const zip = new JSZip();

      let missingIdCount = 0;
      resultsData.forEach(res => {
        const content = generateResultOutput(res, currentExamData, includeFeedback);
        const filename = `${res.studentId || "MissingID" + ++missingIdCount}.txt`;
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

      <Button type="primary" onClick={handleExportResults}>
        Export Student Results
      </Button>
    </Card>
  );
};

export default ExportResults;