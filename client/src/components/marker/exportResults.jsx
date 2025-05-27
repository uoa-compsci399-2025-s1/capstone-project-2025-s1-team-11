import React, { useState } from "react";
import { Button, Card, Checkbox, message, Radio } from "antd";
import { generateResultOutput } from "../../utilities/marker/outputFormatter.js";

const ExportResults = ({ resultsData, currentExamData }) => {
  const [exportFormat, setExportFormat] = useState("text");
  const [includeFeedback, setIncludeFeedback] = useState(true);

  const handleExportResults = () => {
    if (!Array.isArray(resultsData) || resultsData.length === 0) {
      message.error("No valid results available to export.");
      return;
    }

    const courseCode = currentExamData?.courseCode || "exam";

    function createFile(filename, content, type){
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }

    if (exportFormat === "json") {
      const filename = `${courseCode}_results.json`;
      const content = JSON.stringify(resultsData, null, 2);
      const type = "application/json";

      createFile(filename, content, type);

      message.success("Results exported successfully.");
    } else {
      // Export each student's results as a separate .txt file using student ID as filename
      resultsData.forEach(res => {
        const content = generateResultOutput(res, currentExamData, includeFeedback);
        const type = "text/plain";
        const filename = `${courseCode}_${res.studentId || "student"}.txt`;

        createFile(filename, content, type);
      });

      message.success("Individual student results exported.");
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