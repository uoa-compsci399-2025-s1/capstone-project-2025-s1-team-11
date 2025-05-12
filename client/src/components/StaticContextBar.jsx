import React, { useState } from 'react';
import { Menu, Dropdown, Button, Space, Typography, Tag, message, Modal, Input, Form, Tooltip, Alert } from 'antd';
import { FileOutlined, ExportOutlined, SaveOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { importExamFromJSON, clearExam } from "../store/exam/examSlice";
import { openExamFile, saveExamToFile } from "../services/fileSystemAccess.js";
import '../index.css';

const { Text } = Typography;

const StaticContextBar = ({
  examTitle = "Untitled Exam",
  status = "saved",
  onExport,
  canExportDemo = false,
  canExportRandomised = false,
  canExportExemplar = false,
  canExportMarking = false
}) => {
  const dispatch = useDispatch();
  const examData = useSelector((state) => state.exam.examData);
  const [fileHandle, setFileHandle] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newExamData, setNewExamData] = useState({
    examTitle: '',
    courseCode: '',
    courseName: '',
    semester: '',
    year: '',
    versions: '',
    teleformOptions: '',
    metadataKey: '',
    metadataValue: ''
  });
  const [lastSavedTime, setLastSavedTime] = useState(null);

  const statusColours = {
    saved: "green",
    saving: "gold",
    unsaved: "red",
  };

  const isDarkMode = document.documentElement.getAttribute("data-theme") === "dark";

  // Handlers

  const handleOpenExam = async () => {
    const result = await openExamFile();
    if (result) {
      dispatch(importExamFromJSON(result.exam));
      setFileHandle(result.fileHandle);
      if (result.fileHandle && result.fileHandle.name) {
        setFileName(result.fileHandle.name);
      } else {
        setFileName(null);
      }
    }
  };

  const handleSaveExam = async () => {
    if (!examData) {
      message.error("No exam data to save.");
      return;
    }
    try {
      let updatedHandle = fileHandle;
      if (!updatedHandle && window.showSaveFilePicker) {
        const options = {
          suggestedName: `${examData.examTitle || 'Untitled_Exam'}.json`,
          types: [{ description: "JSON Files", accept: { "application/json": [".json"] } }]
        };
        updatedHandle = await window.showSaveFilePicker(options);
      }
      if (!updatedHandle) {
        message.error("Save cancelled or no file handle available.");
        return;
      }
      await saveExamToFile(examData, updatedHandle);
      setFileHandle(updatedHandle);
      if (updatedHandle && updatedHandle.name) {
        setFileName(updatedHandle.name);
      } else {
        setFileName(null);
      }
      setLastSavedTime(new Date());
      message.success("Exam saved successfully.");
    } catch (error) {
      message.error("Failed to save exam: " + error.message);
    }
  };

  const handleCloseExam = () => {
    dispatch(clearExam());
  };

  const handleCreateNewExam = () => {
    setShowCreateModal(true);
    setNewExamData({
      examTitle: '',
      courseCode: '',
      courseName: '',
      semester: '',
      year: '',
      versions: '',
      teleformOptions: '',
      metadataKey: '',
      metadataValue: ''
    });
  };

  const handleCreateModalOk = () => {
    const versionsArray = newExamData.versions
      ? newExamData.versions.split(',').map(v => v.trim()).filter(Boolean)
      : [];
    const exam = {
      examTitle: newExamData.examTitle || "Untitled Exam",
      courseCode: newExamData.courseCode || "",
      courseName: newExamData.courseName || "",
      semester: newExamData.semester || "",
      year: newExamData.year || "",
      versions: versionsArray,
      teleformOptions: newExamData.teleformOptions || "",
      examBody: [],
      appendix: {},
      metadata:
        newExamData.metadataKey && newExamData.metadataValue
          ? [{ key: newExamData.metadataKey, value: newExamData.metadataValue }]
          : []
    };
    dispatch(importExamFromJSON(exam));
    setShowCreateModal(false);
  };

  const handleCreateModalCancel = () => {
    setShowCreateModal(false);
  };

  const confirmExport = (type) => {
    if (["demo", "exemplar"].includes(type)) {
      if (!window.confirm("Are you sure you want to export this? It may be incomplete.")) return;
    }
    if (onExport) onExport(type);
  };

  // Menus

  return (
    <div className="floating-context-bar">
      <div className="context-bar-wrapper">
        {/* Context Bar Main */}
        <div className="context-bar-main">
          {/* Left side: File menu and status */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="context-button">
              <Dropdown menu={{ items: [
                { key: 'new', label: 'New Exam', onClick: handleCreateNewExam },
                { key: 'open', label: 'Open Exam', onClick: handleOpenExam },
                { key: 'close', label: 'Close Exam', onClick: handleCloseExam }
              ]}} trigger={['click']}>
                <Tooltip title="File Menu">
                  <Button icon={<FileOutlined />} type="text">
                    <span className="context-button-label">File</span>
                  </Button>
                </Tooltip>
              </Dropdown>
            </div>
            {examData ? (
              <Tooltip title={`File: ${examTitle}`}>
                <Tag color={statusColours[status] || "default"}>
                  {status}
                </Tag>
              </Tooltip>
            ) : (
              <Text type="danger" strong>
                Warning: No file uploaded
              </Text>
            )}
          </div>
          {/* Exam title and file name */}
          <Text strong style={{ marginLeft: 16 }}>
            {examTitle} {fileName ? `| ${fileName}` : ''}
          </Text>
          {/* Right side: Save and Export buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="context-button">
              <Tooltip title="Save Exam">
                <Button
                  onClick={handleSaveExam}
                  disabled={!examData}
                  icon={<SaveOutlined />}
                  type="text"
                >
                  <span className="context-button-label">Save</span>
                </Button>
              </Tooltip>
            </div>
            <div className="context-button">
              <Dropdown menu={{ items: [
                { key: 'demo', label: 'Demo Answer Scripts', disabled: !canExportDemo, onClick: () => confirmExport("demo") },
                { key: 'randomised', label: 'Randomised Answer Scripts', disabled: !canExportRandomised, onClick: () => confirmExport("randomised") },
                { key: 'exemplar', label: 'Exemplar Answer Scripts', disabled: !canExportExemplar, onClick: () => confirmExport("exemplar") },
                { key: 'marking', label: 'Marking Scheme', disabled: !canExportMarking, onClick: () => confirmExport("marking") }
              ]}} trigger={['click']}>
                <Tooltip title="Export Options">
                  <Button icon={<ExportOutlined />} type="text">
                    <span className="context-button-label">Export</span>
                  </Button>
                </Tooltip>
              </Dropdown>
            </div>
          </div>
        </div>

        {/* Context Bar Expanded (shown on hover) */}
        <div className="context-bar-expanded">
          <div style={{ padding: '4px 24px' }}>
            {examData ? (
              <>
                <div>Questions Loaded: {examData?.examBody?.length || 0}</div>
                <div>
                  Last Saved: <strong>{lastSavedTime ? lastSavedTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) : "Never"}</strong>
                </div>
              </>
            ) : (
              <Alert
                message="No exam is currently loaded"
                description="Create a new exam or open an existing one to begin editing."
                type="error"
                showIcon              
              />
            )}
          </div>
        </div>

        {/* Create New Exam Modal */}
        <Modal
          title="Create New Exam"
          open={showCreateModal}
          onOk={handleCreateModalOk}
          onCancel={handleCreateModalCancel}
          okText="Create"
        >
          <Form layout="vertical">
            <Form.Item label="Exam Title">
              <Input
                placeholder="Exam Title"
                value={newExamData.examTitle}
                onChange={(e) => setNewExamData({ ...newExamData, examTitle: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Course Code">
              <Input
                placeholder="Course Code"
                value={newExamData.courseCode}
                onChange={(e) => setNewExamData({ ...newExamData, courseCode: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Course Name">
              <Input
                placeholder="Course Name"
                value={newExamData.courseName}
                onChange={(e) => setNewExamData({ ...newExamData, courseName: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Semester">
              <Input
                placeholder="Semester"
                value={newExamData.semester}
                onChange={(e) => setNewExamData({ ...newExamData, semester: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Year">
              <Input
                placeholder="Year"
                value={newExamData.year}
                onChange={(e) => setNewExamData({ ...newExamData, year: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Versions (comma separated)">
              <Input
                placeholder="e.g. A, B, C"
                value={newExamData.versions}
                onChange={(e) => setNewExamData({ ...newExamData, versions: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Teleform Options">
              <Input
                placeholder="Teleform Options"
                value={newExamData.teleformOptions}
                onChange={(e) => setNewExamData({ ...newExamData, teleformOptions: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Metadata Key">
              <Input
                placeholder="Metadata Key"
                value={newExamData.metadataKey}
                onChange={(e) => setNewExamData({ ...newExamData, metadataKey: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Metadata Value">
              <Input
                placeholder="Metadata Value"
                value={newExamData.metadataValue}
                onChange={(e) => setNewExamData({ ...newExamData, metadataValue: e.target.value })}
              />
            </Form.Item>
          </Form>
        </Modal>

      </div>
    </div>
  );
};

export default StaticContextBar;