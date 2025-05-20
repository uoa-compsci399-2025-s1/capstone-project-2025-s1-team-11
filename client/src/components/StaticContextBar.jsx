import React, { useState, useRef, useEffect } from 'react';
import { Dropdown, Button, Typography, Tag, Tooltip, Alert, Divider, Switch, Spin, Modal } from 'antd';
import { App as AntApp } from 'antd';
import { FileOutlined, ExportOutlined, SaveOutlined, UndoOutlined, RedoOutlined } from '@ant-design/icons';
import { updateExamField } from "../store/exam/examSlice";
import { setExamVersions } from "../store/exam/examSlice";
import { useDispatch, useSelector } from "react-redux";
import { useFileSystem } from "../hooks/useFileSystem.js";
import { selectExamData } from '../store/exam/selectors.js';
import { useHistory } from '../hooks/useHistory';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import CreateExamModal from './CreateExamModal';
import EditExamModal from './EditExamModal';
//import { exportExamToPdf } from "../services/exportPdf";
import { handleExportDocx } from '../utilities/UIUtils';
import '../index.css';
import useMessage from "../hooks/useMessage.js";

const { Text } = Typography;

const StaticContextBar = ({
                            examTitle = "Untitled Exam",
                            canExportDemo = false,
                            canExportRandomised = false,
                            canExportExemplar = false,
                            canExportMarking = false
                          }) => {
  const dispatch = useDispatch();
  const exam = useSelector(selectExamData);
  const coverPage = useSelector(state => state.exam.coverPage);
  const { fileHandle, createExam, openExam, saveExam } = useFileSystem();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newExamData, setNewExamData] = useState({
    examTitle: '',
    courseCode: '',
    courseName: '',
    semester: '',
    year: '',
    answerOptions: 4,
  });
  const [customVersionMode, setCustomVersionMode] = useState('generate');
  const [lastSavedTime, setLastSavedTime] = useState(null);
  // For auto-save debounce and state
  const [saveState, setSaveState] = useState('saved'); // 'saved', 'saving', 'unsaved'
  const saveTimeoutRef = useRef(null);
  const [versionCount, setVersionCount] = useState(4);
  const [isHovered, setIsHovered] = useState(false);
  const [fileDropdownOpen, setFileDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const contextBarRef = useRef(null);
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [editDetailsData, setEditDetailsData] = useState({
    examTitle: '',
    courseCode: '',
    courseName: '',
    semester: '',
    year: ''
  });
  // Manual auto-save toggle
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const { canUndo, canRedo, undo, redo } = useHistory();

  // Exam progress

  const message = useMessage();

  const fileDropdownRef = useRef(null);
  const exportDropdownRef = useRef(null);

  const statusColours = {
    saved: "green",
    saving: "gold",
    unsaved: "red",
  };

  // Handlers
  const handleOpenExam = async () => {
    const result = await openExam();
    if (result) {
      setTimeout(() => message.success("Exam opened successfully."), 0);
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
    window.location.reload();
  };

  const handleCreateNewExam = () => {
    setShowCreateModal(true);
    setNewExamData({
      examTitle: '',
      courseCode: '',
      courseName: '',
      semester: '',
      year: '',
      answerOptions: 4
    });
    setVersionCount(4);
  };

  const handleCreateModalOk = () => {
    const exam = {
      answerOptions: parseInt(newExamData.answerOptions) || 4,
      examTitle: newExamData.examTitle || "Untitled Exam",
      courseCode: newExamData.courseCode || "",
      courseName: newExamData.courseName || "",
      semester: newExamData.semester || "",
      year: newExamData.year || "",
      examBody: [],
      appendix: {},
      metadata:
          newExamData.metadataKey && newExamData.metadataValue
              ? [{ key: newExamData.metadataKey, value: newExamData.metadataValue }]
              : []
    };

    // Parse versions if defined and non-empty
    if (newExamData.versions?.trim()) {
      exam.versions = newExamData.versions
          .split(',')
          .map(v => v.trim())
          .filter(Boolean);
    }

    // Parse teleformOptions if defined and non-empty
    if (newExamData.teleformOptions?.trim()) {
      const cleaned = newExamData.teleformOptions.replace(/["']/g, '');
      exam.teleformOptions = cleaned
          .split(',')
          .map(o => o.trim())
          .filter(Boolean);
    }

    createExam(exam);
    setShowCreateModal(false);
    setTimeout(() => message.success("New exam created successfully."), 0);
  };

  const handleCreateModalCancel = () => {
    setShowCreateModal(false);
    setTimeout(() => message.info("Exam creation cancelled."), 0);
  };

  const confirmExport = (type) => {
    if (!exam) {
      message.error("No exam available to export.");
      return;
    }

    if (["demo", "exemplar"].includes(type)) {
      if (!window.confirm("Are you sure you want to export this? It may be incomplete.")) return;
    }
    // For now, call exportExamToPdf. In future, branch by type.
    if (exam) {
      // Stub branching for future formats
      message.info(`PDF export (${type}) functionality is currently a Work In Progress!`);
      // if (type === 'demo' || type === 'randomised' || type === 'exemplar' || type === 'marking') {
      //   exportExamToPdf(exam, type);
      // } else {
      //   //console.log('Unknown export type:', type);
      // }
    }
  };

  // Hover intent delay for bar expansion
  const hoverTimeout = useRef(null);
  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => setIsHovered(true), 150);
  };
  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout.current);
    setTimeout(() => {
      if (!fileDropdownOpen && !exportDropdownOpen) {
        setIsHovered(false);
      }
    }, 150);
  };

  // Expanded context bar should show if hovered or dropdowns are open
  const shouldShowContextBar = isHovered || fileDropdownOpen || exportDropdownOpen;

  const openEditDetailsModal = () => {
    if (!exam) return;
    setEditDetailsData({
      examTitle: exam.examTitle || '',
      courseCode: exam.courseCode || '',
      courseName: exam.courseName || '',
      semester: exam.semester || '',
      year: exam.year || '',
      versions: exam.versions || []
    });
    setShowEditDetailsModal(true);
  };

  const handleEditDetailsSave = () => {
    dispatch(updateExamField({ field: 'examTitle', value: editDetailsData.examTitle }));
    dispatch(updateExamField({ field: 'courseCode', value: editDetailsData.courseCode }));
    dispatch(updateExamField({ field: 'courseName', value: editDetailsData.courseName }));
    dispatch(updateExamField({ field: 'semester', value: editDetailsData.semester }));
    dispatch(updateExamField({ field: 'year', value: editDetailsData.year }));
    // Set exam versions from editDetailsData.versions if available
    const versionsArray = typeof editDetailsData.versions === 'string'
        ? editDetailsData.versions.split(',').map(v => v.trim())
        : editDetailsData.versions;
    //console.log("Setting versions to:", versionsArray);
    dispatch(setExamVersions(versionsArray));
    setShowEditDetailsModal(false);
    setTimeout(() => message.success("Exam details updated."), 0);
  };

  // Removed DOM event listeners for mouseenter/mouseleave on dropdown refs.

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
    if (!autoSaveEnabled) return;
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
        message.error("Auto-save failed. Check your connection or file permissions.");
      }
    }, 2000);
    // Cleanup
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, autoSaveEnabled, message]);

  // Add keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: () => {
      if (canUndo) {
        undo();
        message.info('Undo');
      }
    },
    onRedo: () => {
      if (canRedo) {
        redo();
        message.info('Redo');
      }
    }
  });

  return (
      <div className="floating-context-bar">
        <div
            className="context-bar-wrapper"
            ref={contextBarRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
          {/* Context Bar Main */}
          <div className="context-bar-main">
            {/* Left side: File menu and status */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="context-button">
                <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'new',
                          label: 'New Exam',
                          onClick: () => {
                            setTimeout(() => message.info("Creating new exam..."), 0);
                            handleCreateNewExam();
                            setFileDropdownOpen(false);
                          }
                        },
                        {
                          key: 'open',
                          label: 'Open Exam',
                          onClick: () => {
                            setTimeout(() => message.info("Opening exam..."), 0);
                            handleOpenExam();
                            setFileDropdownOpen(false);
                          }
                        },
                        {
                          key: 'close',
                          label: 'Close Exam',
                          onClick: () => {
                            setTimeout(() => message.info("Closing exam..."), 0);
                            handleCloseExam();
                            setFileDropdownOpen(false);
                          }
                        }
                      ]
                    }}
                    trigger={['click']}
                    onOpenChange={(visible) => {
                      setFileDropdownOpen(visible);
                      setIsHovered(visible);
                    }}
                    open={fileDropdownOpen}
                    getPopupContainer={() => contextBarRef.current}
                >
                  <div ref={fileDropdownRef}>
                    <Tooltip title="File Menu">
                      <Button icon={<FileOutlined />} type="text">
                        <span className="context-button-label"> Menu</span>
                      </Button>
                    </Tooltip>
                  </div>
                </Dropdown>
              </div>
              {/* Add Undo/Redo buttons */}
              <div className="context-button" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Tooltip title="Undo (Ctrl+Z)">
                  <Button
                      icon={<UndoOutlined />}
                      onClick={undo}
                      disabled={!canUndo}
                      type="text"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: '4px',
                        color: !canUndo ? 'rgba(0, 0, 0, 0.25)' : 'inherit'
                      }}
                  >
                    <span className="context-button-label">Undo</span>
                  </Button>
                </Tooltip>
                <Tooltip title="Redo (Ctrl+Y)">
                  <Button
                      icon={<RedoOutlined />}
                      onClick={redo}
                      disabled={!canRedo}
                      type="text"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: '4px',
                        color: !canRedo ? 'rgba(0, 0, 0, 0.25)' : 'inherit'
                      }}
                  >
                    <span className="context-button-label">Redo</span>
                  </Button>
                </Tooltip>
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
                        {saveState === 'saving' && (
                            <Spin size="small" style={{ marginLeft: 6 }} />
                        )}
                      </Tag>
                    </Tooltip>
                    {fileHandle && (
                        <Tooltip title="Full file path not available due to browser privacy restrictions.">
                          <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                            File: {fileHandle.name || '[unsaved file]'}{fileHandle.kind ? `` : ""}
                          </Text>
                        </Tooltip>
                    )}
                  </>
              )}
            </div>
            {/* Exam title and file name */}
            <div className="editable-title-wrapper" style={{ marginLeft: "12", display: "flex", alignItems: "center" }}>
              {exam ? (
                  <>
                    <Text strong style={{ marginRight: 8 }}>
                      {`${exam?.courseName || "Unknown Course"} ${exam?.courseCode || ""}: ${exam?.examTitle || "Untitled Exam"}`}
                    </Text>
                    {/* Inline warning if key fields are missing */}
                    {(!exam?.examTitle || !exam?.courseCode) && (
                        <Text className="context-warning" type="warning" style={{ marginLeft: 12 }}>
                          Missing required exam details
                        </Text>
                    )}
                  </>
              ) : (
                  <Text type="danger" strong>No exam uploaded</Text>
              )}
            </div>
            {/* Right side: Save and Export buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="context-button" style={{ display: "flex", alignItems: "center" }}>
                <Tooltip title="Save Exam">
                  <Button
                      icon={<SaveOutlined />}
                      onClick={handleSaveExam}
                      disabled={!exam}
                      type="text"
                  >
                    <span className="context-button-label">Save</span>
                  </Button>
                </Tooltip>
              </div>
              <div className="context-button">
                <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'docx',
                          label: 'Download as DOCX',
                          onClick: async () => {
                            await handleExportDocx(exam, coverPage);
                            setExportDropdownOpen(false);
                          }
                        },
                        {
                          key: 'demo',
                          label: 'Demo Answer Scripts',
                          disabled: !canExportDemo,
                          onClick: () => {
                            setTimeout(() => message.info("Exporting demo scripts..."), 0);
                            confirmExport("demo");
                            setExportDropdownOpen(false);
                          }
                        },
                        {
                          key: 'randomised',
                          label: 'Randomised Answer Scripts',
                          disabled: !canExportRandomised,
                          onClick: () => {
                            message.info("Exporting randomised scripts...");
                            confirmExport("randomised");
                            setExportDropdownOpen(false);
                          }
                        },
                        {
                          key: 'exemplar',
                          label: 'Exemplar Answer Scripts',
                          disabled: !canExportExemplar,
                          onClick: () => {
                            message.info("Exporting exemplar scripts...");
                            confirmExport("exemplar");
                            setExportDropdownOpen(false);
                          }
                        },
                        {
                          key: 'marking',
                          label: 'Marking Scheme',
                          disabled: !canExportMarking,
                          onClick: () => {
                            message.info("Exporting marking scheme...");
                            confirmExport("marking");
                            setExportDropdownOpen(false);
                          }
                        }
                      ]
                    }}
                    trigger={['click']}
                    onOpenChange={(visible) => {
                      setExportDropdownOpen(visible);
                      setIsHovered(visible);
                    }}
                    open={exportDropdownOpen}
                    getPopupContainer={() => contextBarRef.current}
                >
                  <div ref={exportDropdownRef}>
                    <Tooltip title="Export Options">
                      <Button icon={<ExportOutlined />} type="text">
                        <span className="context-button-label">Export</span>
                      </Button>
                    </Tooltip>
                  </div>
                </Dropdown>
              </div>
              {/* Manual Auto-Save Toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
                <Tooltip title="Enable or disable auto-save">
                  <Switch
                      checked={autoSaveEnabled}
                      onChange={setAutoSaveEnabled}
                      size="small"
                      style={{ marginRight: 4 }}
                  />
                </Tooltip>
                <span style={{ fontSize: 12 }}>{autoSaveEnabled ? "Auto-save ON" : "Auto-save OFF"}</span>
              </div>
            </div>
          </div>

          {/* Context Bar Expanded (shown on hover or dropdown open) */}
          <div className={`context-bar-expanded ${shouldShowContextBar ? 'show' : ''}`}>
            <div style={{ padding: '24px 0px' }}>
              {exam ? (
                  <>
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
                      {exam?.versions && exam.versions.length > 0 && (
                          <div>
                            <div style={{ marginBottom: 4 }}><strong>Versions:</strong></div>
                            <div className="version-tags">
                              {exam.versions.map((v, i) => <Tag key={i}>{v}</Tag>)}
                            </div>
                          </div>
                      )}
                      <div>
                        <Button
                            type="primary"
                            onClick={() => {
                              setTimeout(() => message.info("Editing exam details..."), 0);
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
          <CreateExamModal
              open={showCreateModal}
              onOk={handleCreateModalOk}
              onCancel={handleCreateModalCancel}
              newExamData={newExamData}
              setNewExamData={setNewExamData}
              versionCount={versionCount}
              setVersionCount={setVersionCount}
              customVersionMode={customVersionMode}
              setCustomVersionMode={setCustomVersionMode}
          />
          {/* Edit Exam Details Modal */}
          <EditExamModal
              open={showEditDetailsModal}
              onOk={handleEditDetailsSave}
              onCancel={() => setShowEditDetailsModal(false)}
              editDetailsData={editDetailsData}
              setEditDetailsData={setEditDetailsData}
          />

        </div>
      </div>
  );
};

export default StaticContextBar;