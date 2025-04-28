// src/pages/ExamFileManager.jsx
import React, { useState } from "react";
import { useDispatch } from 'react-redux';
import { Button, Alert, Space } from "antd";
import { useFileSystem } from "../hooks/useFileSystem.js";

const ExamFileManager = () => {
  const { exam, fileHandle, openExam, saveExam, importExam } = useFileSystem();
  const [error, setError] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [format, setFormat] = useState('docx'); // Default format

  const dispatch = useDispatch();

  const handleOpenExam = async () => {
    try {
      const result = await openExam();
      if (!result) {
        setError("No exam loaded.");
      }
    } catch (err) {
      setError("Error opening exam: " + err.message);
    }
  };

  // Determine format and import exam
  const handleImportExam = async (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop();
      let format = '';

      if (fileExtension === 'xml') {
        format = 'moodle'; // Assuming XML is Moodle format
      } else if (fileExtension === 'docx') {
        format = 'docx';
      } else {
        setError("Unsupported file format");
        return;
      }

      try {
        const result = await importExam(selectedFile, format);
        if (result) {
          setShowSuccessAlert(true);
          setError("");
          console.log("File imported and saved successfully");
        }
      } catch (err) {
        setError("Error importing exam: " + err.message);
        console.error("Import error:", err);
      }
    }
  };

  const handleSaveExam = async () => {
    if (!exam) return;
    try {
      const updatedHandle = await saveExam();
      setShowSuccessAlert(true);
      console.log("File saved successfully to " + (updatedHandle?.name || "unknown file"));
    } catch (err) {
      setError("Error saving exam: " + err.message);
    }
  };

  return (
      <div>
        <h2>Exam File Manager</h2>
        {error && <Alert message="Error" description={error} type="error" showIcon />}
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
        <p>
          Currently Editing:{" "}
          {fileHandle ? fileHandle.name : "No file loaded (unsaved exam)"}
        </p>
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
          <Button type="primary" onClick={handleSaveExam}>
            Save Exam
          </Button>
        </Space>
      </div>
  );
};

export default ExamFileManager;