import React, { useState } from "react";
import { openExamFile, saveExamToFile } from "../services/fileSystemAccess.js";
import { importExamFromXMLtoJSON } from "../services/xmlToJsonExamImporter.js";
import { Button, Alert, Space, Collapse, Typography } from "antd";

const { Panel } = Collapse;

const ExamFileManager = ({ onExamLoaded }) => {
  const [exam, setExam] = useState(null);
  const [fileHandle, setFileHandle] = useState(null);
  const [error, setError] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Open a JSON exam file
  const handleOpenExam = async () => {
    try {
      const result = await openExamFile();
      if (result) {
        setExam(result.exam);
        setFileHandle(result.fileHandle);
        // Pass the exam back to the parent
        onExamLoaded(result.exam, result.fileHandle?.name);
      }
    } catch (err) {
      setError("Error opening exam: " + err.message);
    }
  };

  // Import an exam from an XML file
  const handleImportExam = async (event) => {
    const file = event.target.files[0];
    if (file) {
      importExamFromXMLtoJSON(file, (err, importedExam) => {
        if (err) {
          setError("Error importing exam: " + err.message);
        } else {
          setError("");
          setExam(importedExam);
          setFileHandle(null); // since this exam was imported and not loaded from a JSON file
          // Pass the imported exam back to the parent
          onExamLoaded(importedExam, null); // no file name for XML imports
        }
      });
    }
  };

  // Inside your ExamFileManager.jsx component
  const handleSaveExam = async () => {
    if (!exam) return;
    try {
      // This will either update the existing file or prompt for a save location.
      const updatedHandle = await saveExamToFile(exam, fileHandle);
      setFileHandle(updatedHandle); // Save the handle for future use.
      setShowSuccessAlert(true);
      console.log("File saved successfully to " + fileHandle.name); // Debug log
    } catch (err) {
      setError("Error saving exam: " + err.message);
    }
  };

  return (
    <div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {showSuccessAlert && (
        <Alert
          message="Success"
          description="File saved successfully!"
          type="success"
          showIcon
          closable
          onClose={() => setShowSuccessAlert(false)}
        />
      )}
      {exam ? (
        <>
          {/*<Typography.Text style={{ display: "block", marginTop: "16px" }}>
            Currently editing: {fileHandle ? fileHandle.name : "Imported (unsaved) file"}
          </Typography.Text>*/}
          <Space style={{ marginTop: "16px", justifyContent: "space-between", width: "100%", display: "flex" }}>
            <span /> {/* Placeholder for left alignment */}
            <Button type="primary" onClick={handleSaveExam}>
              Save Exam
            </Button>
          </Space>
          <Collapse style={{ marginTop: "16px" }}>
            <Panel header="Upload or Import a Different File" key="1">
              <Space wrap>
                <Button onClick={handleOpenExam}>Open Exam (JSON)</Button>
                <Button>
                  <label style={{ cursor: "pointer", marginBottom: 0 }}>
                    Import Exam (XML)
                    <input
                      type="file"
                      accept=".xml"
                      onChange={handleImportExam}
                      style={{ display: "none" }}
                    />
                  </label>
                </Button>
              </Space>
            </Panel>
          </Collapse>
        </>
      ) : (
        <>
          <Space wrap style={{ marginTop: "12px" }}>
            <Button onClick={handleOpenExam}>Open Exam (JSON)</Button>
            <Button>
              <label style={{ cursor: "pointer", marginBottom: 0 }}>
                Import Exam (XML)
                <input
                  type="file"
                  accept=".xml"
                  onChange={handleImportExam}
                  style={{ display: "none" }}
                />
              </label>
            </Button>
          </Space>
        </>
      )}
    </div>
  );
};

export default ExamFileManager;
