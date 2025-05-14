import React, { useState, useRef, useEffect } from 'react';
import { Menu, Dropdown, Button, Space, Typography, Tag, message, Modal, Input, Form, Tooltip, Alert, Divider, Radio } from 'antd';
import { FileOutlined, ExportOutlined, SaveOutlined } from '@ant-design/icons';
import { updateExamField } from "../store/exam/examSlice";
import { useDispatch, useSelector } from "react-redux";
import { useFileSystem } from "../hooks/useFileSystem.js";
import { selectExamData } from '../store/exam/selectors.js';
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
  const exam = useSelector(selectExamData);
  const { fileHandle, openExam, saveExam } = useFileSystem();
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
  // For auto-save debounce and state
  const [saveState, setSaveState] = useState('saved'); // 'saved', 'saving', 'unsaved'
  const saveTimeoutRef = useRef(null);
  const [versionCount, setVersionCount] = useState(4);
  const [isHovered, setIsHovered] = useState(false);
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [editDetailsData, setEditDetailsData] = useState({
    examTitle: '',
    courseCode: '',
    courseName: '',
    semester: '',
    year: ''
  });

  const fileDropdownRef = useRef(null);
  const exportDropdownRef = useRef(null);

  const statusColours = {
    saved: "green",
    saving: "gold",
    unsaved: "red",
  };

  const isDarkMode = document.documentElement.getAttribute("data-theme") === "dark";

  // Handlers

  const handleOpenExam = async () => {
    const result = await openExam();
    if (result) {
      message.success("Exam opened successfully.");
    }
  };

  const handleSaveExam = async () => {
    if (!exam) {
      message.error("No exam data to save.");
      return;
    }
    try {
      const updatedHandle = await saveExam();
      if (!updatedHandle) {
        message.error("Save cancelled or no file handle available.");
        return;
      }
      message.success("Exam saved successfully.");
    } catch (error) {
      message.error("Failed to save exam: " + error.message);
    }
  };

  const handleCloseExam = () => {
    message.info("Clearing exam...");
    window.location.reload(); // or dispatch(clearExam()) if you want to retain the Redux method
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
    setVersionCount(4);
  };

  const handleCreateModalOk = () => {
    const exam = {
      examTitle: newExamData.examTitle || "Untitled Exam",
      courseCode: newExamData.courseCode || "",
      courseName: newExamData.courseName || "",
      semester: newExamData.semester || "",
      year: newExamData.year || "",
      versions: versionCount === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'],
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
    message.success("New exam created successfully.");
  };

  const handleCreateModalCancel = () => {
    setShowCreateModal(false);
    message.info("Exam creation cancelled.");
  };

  const confirmExport = (type) => {
    if (["demo", "exemplar"].includes(type)) {
      if (!window.confirm("Are you sure you want to export this? It may be incomplete.")) return;
    }
    if (onExport) onExport(type);
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const openEditDetailsModal = () => {
    if (!exam) return;
    setEditDetailsData({
      examTitle: exam.examTitle || '',
      courseCode: exam.courseCode || '',
      courseName: exam.courseName || '',
      semester: exam.semester || '',
      year: exam.year || ''
    });
    setShowEditDetailsModal(true);
  };

  const handleEditDetailsSave = () => {
    dispatch(updateExamField({ field: 'examTitle', value: editDetailsData.examTitle }));
    dispatch(updateExamField({ field: 'courseCode', value: editDetailsData.courseCode }));
    dispatch(updateExamField({ field: 'courseName', value: editDetailsData.courseName }));
    dispatch(updateExamField({ field: 'semester', value: editDetailsData.semester }));
    dispatch(updateExamField({ field: 'year', value: editDetailsData.year }));
    setShowEditDetailsModal(false);
    message.success("Exam details updated.");
  };

  useEffect(() => {
    const enter = () => setIsHovered(true);
    const leave = () => setIsHovered(false);

    const file = fileDropdownRef.current;
    const exp = exportDropdownRef.current;

    if (file) {
      file.addEventListener("mouseenter", enter);
      file.addEventListener("mouseleave", leave);
    }
    if (exp) {
      exp.addEventListener("mouseenter", enter);
      exp.addEventListener("mouseleave", leave);
    }

    return () => {
      if (file) {
        file.removeEventListener("mouseenter", enter);
        file.removeEventListener("mouseleave", leave);
      }
      if (exp) {
        exp.removeEventListener("mouseenter", enter);
        exp.removeEventListener("mouseleave", leave);
      }
    };
  }, []);

  // Effect to prepopulate editDetailsData when exam changes
  useEffect(() => {
    if (exam) {
      setEditDetailsData({
        examTitle: exam.examTitle || '',
        courseCode: exam.courseCode || '',
        courseName: exam.courseName || '',
        semester: exam.semester || '',
        year: exam.year || ''
      });
    }
  }, [exam]);
  // Auto-save effect: save after 2 seconds of inactivity when exam changes.
  useEffect(() => {
    if (!exam) return;
    // Mark as unsaved when exam changes
    setSaveState('unsaved');
    // Clear any previous debounce
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    // Debounce: save after 2 seconds
    saveTimeoutRef.current = setTimeout(async () => {
      setSaveState('saving');
      try {
        await saveExam();
        setSaveState('saved');
        setLastSavedTime(new Date());
      } catch (err) {
        console.error("Auto-save failed:", err);
        setSaveState('unsaved');
      }
    }, 2000);
    // Cleanup
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam]);

  return (
    <div className="floating-context-bar">
      <div
        className="context-bar-wrapper"
        onMouseOver={handleMouseEnter}
        onMouseOut={handleMouseLeave}
      >
        {/* Context Bar Main */}
        <div className="context-bar-main">
          {/* Left side: File menu and status */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="context-button">
              <Dropdown menu={{ items: [
                {
                  key: 'new',
                  label: 'New Exam',
                  onClick: () => {
                    message.info("Creating new exam...");
                    handleCreateNewExam();
                  }
                },
                {
                  key: 'open',
                  label: 'Open Exam',
                  onClick: () => {
                    message.info("Opening exam...");
                    handleOpenExam();
                  }
                },
                {
                  key: 'close',
                  label: 'Close Exam',
                  onClick: () => {
                    message.info("Closing exam...");
                    handleCloseExam();
                  }
                }
              ]}} trigger={['click']}>
                <div ref={fileDropdownRef}>
                  <Tooltip title="File Menu">
                    <Button icon={<FileOutlined />} type="text">
                      <span className="context-button-label"> Menu</span>
                    </Button>
                  </Tooltip>
                </div>
              </Dropdown>
            </div>
            {exam && (
              <>
                <Tooltip title={`File: ${examTitle}`}>
                  <Tag color={statusColours[saveState] || "default"} style={{ marginLeft: 8 }}>
                    {saveState === 'saved'
                      ? (
                          lastSavedTime
                            ? `Saved (${lastSavedTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })})`
                            : 'Saved'
                        )
                      : (saveState === 'saving' ? 'Saving...' : 'Unsaved')}
                  </Tag>
                </Tooltip>
                {fileHandle && fileHandle.name && (
                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                    File: {fileHandle.name}
                  </Text>
                )}
              </>
            )}
          </div>
          {/* Exam title and file name */}
          <div className="editable-title-wrapper" style={{ marginLeft: "12" }}>
            {exam ? (
              <Text strong style={{ marginRight: 8 }}>
                {`${exam?.courseName || "Unknown Course"} ${exam?.courseCode || ""}: ${exam?.examTitle || "Untitled Exam"}`}
              </Text>
            ) : (
              <Text type="danger" strong>No exam uploaded</Text>
            )}
          </div>
          {/* Right side: Save and Export buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="context-button">
              <Tooltip title="Save Exam">
                <Button
                  onClick={handleSaveExam}
                  disabled={!exam}
                  icon={<SaveOutlined />}
                  type="text"
                >
                  <span className="context-button-label">Save</span>
                </Button>
              </Tooltip>
            </div>
            <div className="context-button">
              <Dropdown menu={{ items: [
                {
                  key: 'demo',
                  label: 'Demo Answer Scripts',
                  disabled: !canExportDemo,
                  onClick: () => {
                    message.info("Exporting demo scripts...");
                    confirmExport("demo");
                  }
                },
                {
                  key: 'randomised',
                  label: 'Randomised Answer Scripts',
                  disabled: !canExportRandomised,
                  onClick: () => {
                    message.info("Exporting randomised scripts...");
                    confirmExport("randomised");
                  }
                },
                {
                  key: 'exemplar',
                  label: 'Exemplar Answer Scripts',
                  disabled: !canExportExemplar,
                  onClick: () => {
                    message.info("Exporting exemplar scripts...");
                    confirmExport("exemplar");
                  }
                },
                {
                  key: 'marking',
                  label: 'Marking Scheme',
                  disabled: !canExportMarking,
                  onClick: () => {
                    message.info("Exporting marking scheme...");
                    confirmExport("marking");
                  }
                }
              ]}} trigger={['click']}>
                <div ref={exportDropdownRef}>
                  <Tooltip title="Export Options">
                    <Button icon={<ExportOutlined />} type="text">
                      <span className="context-button-label">Export</span>
                    </Button>
                  </Tooltip>
                </div>
              </Dropdown>
            </div>
          </div>
        </div>

        {/* Context Bar Expanded (shown on hover) */}
        <div className={`context-bar-expanded ${isHovered ? 'show' : ''}`}>
          <div style={{ padding: '24px 0px' }}>
            {exam ? (
              <>
                <Divider orientation="left" style={{ marginBottom: 16 }}>Exam Details</Divider>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "32px", alignItems: "flex-end" }}>
                  <div>
                    <div style={{ marginBottom: 4 }}><strong>Course Code:</strong></div>
                    <div>{exam?.courseCode || "N/A"}</div>
                  </div>
                  <div>
                    <div style={{ marginBottom: 4 }}><strong>Course Name:</strong></div>
                    <div>{exam?.courseName || "N/A"}</div>
                  </div>
                  <div>
                    <div style={{ marginBottom: 4 }}><strong>Semester:</strong></div>
                    <div>{exam?.semester || "N/A"}</div>
                  </div>
                  <div>
                    <div style={{ marginBottom: 4 }}><strong>Year:</strong></div>
                    <div>{exam?.year || "N/A"}</div>
                  </div>
                  <div>
                    <div style={{ marginBottom: 4 }}><strong>Versions:</strong></div>
                    <div>{(exam?.versions || []).join(', ') || "N/A"}</div>
                  </div>
                  <div>
                    <Button
                      type="primary"
                      onClick={() => {
                        message.info("Editing exam details...");
                        openEditDetailsModal();
                      }}
                      style={{ marginLeft: 16 }}
                    >
                      Edit Exam Details
                    </Button>
                  </div>
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
            <Divider orientation="left">Basic Details</Divider>
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

            <Divider orientation="left">Exam Info</Divider>
            <Form.Item label="Semester">
              <Input
                placeholder="One"
                value={newExamData.semester}
                onChange={(e) => setNewExamData({ ...newExamData, semester: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Year">
              <Input
                placeholder="2025"
                value={newExamData.year}
                onChange={(e) => setNewExamData({ ...newExamData, year: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Number of Versions">
              <Radio.Group
                value={versionCount}
                onChange={(e) => setVersionCount(e.target.value)}
              >
                <Radio value={4}>4 Versions (A, B, C, D)</Radio>
                <Radio value={5}>5 Versions (A, B, C, D, E)</Radio>
              </Radio.Group>
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit Exam Details Modal */}
        <Modal
          title="Edit Exam Details"
          open={showEditDetailsModal}
          onOk={handleEditDetailsSave}
          onCancel={() => setShowEditDetailsModal(false)}
          okText="Save"
        >
          <Form layout="vertical">
            <Divider orientation="left">Basic Details</Divider>
            <Form.Item label="Exam Title">
              <Input
                placeholder="Exam Title"
                value={editDetailsData.examTitle}
                onChange={(e) => setEditDetailsData({ ...editDetailsData, examTitle: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Course Code">
              <Input
                placeholder="Course Code"
                value={editDetailsData.courseCode}
                onChange={(e) => setEditDetailsData({ ...editDetailsData, courseCode: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Course Name">
              <Input
                placeholder="Course Name"
                value={editDetailsData.courseName}
                onChange={(e) => setEditDetailsData({ ...editDetailsData, courseName: e.target.value })}
              />
            </Form.Item>
            <Divider orientation="left">Exam Info</Divider>
            <Form.Item label="Semester">
              <Input
                placeholder="One"
                value={editDetailsData.semester}
                onChange={(e) => setEditDetailsData({ ...editDetailsData, semester: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Year">
              <Input
                placeholder="2025"
                value={editDetailsData.year}
                onChange={(e) => setEditDetailsData({ ...editDetailsData, year: e.target.value })}
              />
            </Form.Item>
          </Form>
        </Modal>

      </div>
    </div>
  );
};

export default StaticContextBar;