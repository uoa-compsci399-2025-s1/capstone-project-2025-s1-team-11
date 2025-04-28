// src/pages/ExamFileManager.jsx
import React, { useState } from "react";
import { useDispatch } from 'react-redux';
import { Button, Alert, Space, Select } from "antd";
import { useFileSystem } from "../hooks/useFileSystem.js";

const ExamFileManager = () => {
  const { exam, fileHandle, openExam, saveExam, importExam } = useFileSystem();
  const [error, setError] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  //const [isLoading, setIsLoading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('all'); // Default is 'all'

  //const dispatch = useDispatch();

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

  const handleFormatChange = (value) => {
    setSelectedFormat(value);
  };

  // Determine the acceptable file extensions based on selected format
  const getAcceptExtension = () => {
    switch (selectedFormat) {
      case 'moodle':
        return '.xml';
      case 'docx':
        return '.docx';
      case 'all':
      default:
        return '.xml,.docx'; // Show both for "All Files"
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
          <Space wrap style={{ marginLeft: 30, marginRight: 30 }}>
          <Button>
            <label style={{ cursor: "pointer", marginBottom: 0 }}>
              Import Exam
              <input
                type="file"
                accept={getAcceptExtension()} // Dynamically set based on selected format
                onChange={handleImportExam}
                style={{ display: "none" }}
              />
            </label>
          </Button>
          <Select defaultValue="all" onChange={handleFormatChange} style={{ marginRight: 0 }}>
            <Select.Option value="all">All Files</Select.Option>
            <Select.Option value="moodle">Moodle XML</Select.Option>
            <Select.Option value="docx">DOCX</Select.Option>
          </Select>
          </Space>
          <Button type="primary" onClick={handleSaveExam}>
            Save Exam
          </Button>
        </Space>
      </div>
  );
};

export default ExamFileManager;