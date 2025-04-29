// src/pages/ExamFileManager.jsx
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { importExamFromJSON, clearExam } from "../store/exam/examSlice";
import { openExamFile, saveExamToFile } from "../services/fileSystemAccess.js";
import { importExamFromXMLtoJSON } from "../services/xmlToJsonExamImporter.js";
import { Button, Alert, Space, Typography, Modal, Input, message, Card, Divider } from "antd";

const ExamFileManager = ({ onExamLoaded }) => {
  console.log(" ExamFileManager rendered");
  const dispatch = useDispatch();
  const [fileHandle, setFileHandle] = useState(null);
import { useDispatch } from 'react-redux';
import { Button, Alert, Space, Select } from "antd";
import { useFileSystem } from "../hooks/useFileSystem.js";

const ExamFileManager = () => {
  const { exam, fileHandle, openExam, saveExam, importExam } = useFileSystem();
  const [error, setError] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('all'); // Default is 'all'

  const [fileOptionsOpen, setFileOptionsOpen] = useState(true);

  // State for create new exam modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newExamData, setNewExamData] = useState({
    examTitle: '',
    courseCode: '',
    courseName: '',
    semester: '',
    year: new Date().getFullYear(),
    versions: '1,2,3,4',
    teleformOptions: 'a,b,c,d,e',
    metadataKey: '',
    metadataValue: ''
  });

  const [isClearModalVisible, setIsClearModalVisible] = useState(false);

  // Open a JSON exam file
  const handleOpenExam = async () => {
    try {
      const result = await openExamFile();
      if (result) {
        dispatch(importExamFromJSON(result.exam));
        console.log("Dispatching importExamFromJSON with:", result.exam);
        setFileHandle(result.fileHandle);
        if (onExamLoaded) {
          onExamLoaded(result.exam, result.fileHandle?.name || "Unnamed file");
        }
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
    if (!examData) {
      setError("Cannot save: Missing exam data.");
      return;
    }

    try {
      let updatedHandle = fileHandle;

      if (!fileHandle && window.showSaveFilePicker) {
        const options = {
          suggestedName: `${examData.examTitle || 'Untitled_Exam'}.json`,
          types: [{ description: "JSON Files", accept: { "application/json": [".json"] } }]
        };
        updatedHandle = await window.showSaveFilePicker(options);
      }

      if (!updatedHandle) {
        setError("No file handle available for saving.");
        return;
      }

      updatedHandle = await saveExamToFile(examData, updatedHandle);
      setFileHandle(updatedHandle);
      setShowSuccessAlert(true);
      console.log(" File saved successfully to", updatedHandle.name);
    } catch (err) {
      setError("Error saving exam: " + err.message);
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "24px", background: "#fff" }}>
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
      {examData && (
        <Space style={{ marginTop: "16px", justifyContent: "space-between", width: "100%", display: "flex" }}>
          <span /> {/* Placeholder for left alignment */}
          <Button type="primary" onClick={handleSaveExam}>
            Save Exam
          </Button>
        </Space>
      )}
      <Card style={{ marginTop: 24 }}>
        <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
        <Space wrap>
          <Button type="primary" onClick={() => setShowCreateModal(true)}>
            Create New Exam
          </Button>
          <Button onClick={async () => {
            await handleOpenExam();
            setFileOptionsOpen(false);
          }}>
            Open Exam (JSON)
          </Button>
          <Button>
            Import from XML
            <input
              type="file"
              accept=".xml"
              onChange={async (e) => {
                await handleImportExam(e);
                setFileOptionsOpen(false);
              }}
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0,
                cursor: "pointer",
              }}
            />
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
        </Space>
          <Button danger onClick={() => setIsClearModalVisible(true)} type="primary">
            Clear Exam
          </Button>
        </Space>
      </Card>
      {/* Modal for creating a new exam */}
      <Modal
        open={showCreateModal}
        title="Create New Exam"
        onCancel={() => setShowCreateModal(false)}
        width={600}
        okText="Create Exam"
        onOk={async () => {
          const exam = {
            examTitle: newExamData.examTitle,
            courseCode: newExamData.courseCode,
            courseName: newExamData.courseName,
            semester: newExamData.semester,
            year: newExamData.year,
            versions: newExamData.versions.split(',').map(v => v.trim()),
            teleformOptions: newExamData.teleformOptions.split(',').map(opt => opt.trim()),
            coverPage: null,
            examBody: [],
            appendix: null,
            metadata: newExamData.metadataKey && newExamData.metadataValue
              ? [{ key: newExamData.metadataKey, value: newExamData.metadataValue }]
              : []
          };

          try {
            const options = {
              suggestedName: `${exam.examTitle || 'Untitled_Exam'}.json`,
              types: [{ description: "JSON Files", accept: { "application/json": [".json"] } }]
            };

            const handle = await window.showSaveFilePicker(options);
            await saveExamToFile(exam, handle);
            setFileHandle(handle);
            dispatch(importExamFromJSON(exam));
            if (onExamLoaded) {
              onExamLoaded(exam, handle.name);
            }
            setShowCreateModal(false);
            setFileOptionsOpen(false);
            message.success('New exam created and saved');
          } catch (err) {
            setError("Error saving new exam: " + err.message);
          }
        }}
      >
        <Typography.Title level={5}>Exam Details</Typography.Title>
        <Typography.Text strong>
          Exam Title <span style={{ color: 'red' }}>*</span>
        </Typography.Text>
        <Input
          value={newExamData.examTitle}
          onChange={e => setNewExamData({ ...newExamData, examTitle: e.target.value })}
          placeholder="Principals of Programming"
          style={{ marginBottom: 16 }}
        />
        <Typography.Text strong>
          Course Code <span style={{ color: 'red' }}>*</span>
        </Typography.Text>
        <Input
          value={newExamData.courseCode}
          onChange={e => setNewExamData({ ...newExamData, courseCode: e.target.value })}
          placeholder="101"
          style={{ marginBottom: 16 }}
        />
        <Typography.Text strong>
          Course Name <span style={{ color: 'red' }}>*</span>
        </Typography.Text>
        <Input
          value={newExamData.courseName}
          onChange={e => setNewExamData({ ...newExamData, courseName: e.target.value })}
          placeholder="Computer Science"
          style={{ marginBottom: 16 }}
        />
        <Typography.Text strong>
          Semester <span style={{ color: 'red' }}>*</span>
        </Typography.Text>
        <Input
          value={newExamData.semester}
          onChange={e => setNewExamData({ ...newExamData, semester: e.target.value })}
          placeholder="Two"
          style={{ marginBottom: 16 }}
        />
        <Typography.Text strong>
          Year <span style={{ color: 'red' }}>*</span>
        </Typography.Text>
        <Input
          //value={newExamData.year}
          onChange={e => setNewExamData({ ...newExamData, year: e.target.value })}
          placeholder="2010"
          style={{ marginBottom: 16 }}
        />
        <Typography.Text strong>
          Versions <span style={{ color: 'red' }}>*</span>
        </Typography.Text>
        <Input
          value={newExamData.versions}
          onChange={e => setNewExamData({ ...newExamData, versions: e.target.value })}
          placeholder="Versions (comma-separated)"
          style={{ marginBottom: 16 }}
        />
        <Typography.Text strong>
          Teleform Options <span style={{ color: 'red' }}>*</span>
        </Typography.Text>
        <Input
          value={newExamData.teleformOptions}
          onChange={e => setNewExamData({ ...newExamData, teleformOptions: e.target.value })}
          placeholder="Teleform Options (comma-separated)"
          style={{ marginBottom: 16 }}
        />
        {/** 
        <Typography.Title level={5}>Metadata</Typography.Title>
        <Typography.Text strong>Key</Typography.Text>
        <Input
          value={newExamData.metadataKey}
          onChange={e => setNewExamData({ ...newExamData, metadataKey: e.target.value })}
          placeholder="Metadata Key (optional)"
          style={{ marginBottom: 16 }}
        />
        <Typography.Text strong>Value</Typography.Text>
        <Input
          value={newExamData.metadataValue}
          onChange={e => setNewExamData({ ...newExamData, metadataValue: e.target.value })}
          placeholder="Metadata Value (optional)"
          style={{ marginBottom: 16 }}
        />
*/}
      </Modal>
      <Modal
        open={isClearModalVisible}
        title="Are you sure you want to clear the exam?"
        onOk={() => {
          dispatch(clearExam());
          setIsClearModalVisible(false);
          message.success("Exam cleared");
        }}
        onCancel={() => setIsClearModalVisible(false)}
        okText="Yes, clear it"
        cancelText="Cancel"
      >
        <p>This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default ExamFileManager;
