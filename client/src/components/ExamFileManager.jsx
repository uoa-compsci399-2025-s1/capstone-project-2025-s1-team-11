import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useFileSystem } from "../hooks/useFileSystem.js";
import { Button, Alert, Space, Typography, Modal, Input, message, Card, Select } from "antd";

const ExamFileManager = () => {
  const [error, setError] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const { openExam, createExam, saveExam, closeExam, importExam } = useFileSystem();
  const [selectedFormat, setSelectedFormat] = useState('all'); // Default is 'all'
  const { message } = AntApp.useApp();

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
      const result = await openExam();
      if (result) {
        setShowSuccessAlert(true);
        setError("");
      }
    } catch (err) {
      setError("Error opening exam: " + err.message);
    }
  };

  const handleImportExam = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    const success = await importExam(selectedFile, selectedFormat);
    if (success) {
      setShowSuccessAlert(true);
      setError("");
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
      case 'latex':
        return '.tex';
      case 'all':
      default:
        return '.xml,.docx,.tex'; // Show all supported formats
    }
  };

  const examData = useSelector((state) => state.exam.examData);
  /*
  function getFlatQuestionListFromExam(examData) {
    const items = [];
    if (!examData) return items;
    (examData.examBody || []).forEach((entry) => {
      if (entry.type === "section") {
        (entry.questions || []).forEach((q) => {
          items.push({
            ...q,
            type: "question",
            section: entry.sectionTitle,
            questionText: q.questionText || q.contentText,
            options: q.options || (q.answers || []).map(a => a.contentText),
            correctIndex: q.correctIndex ?? (q.answers || []).findIndex(a => a.correct),
          });
        });
      } else if (entry.type === "question") {
        items.push({
          ...entry,
          type: "question",
          questionText: entry.questionText || entry.contentText,
          options: entry.options || (entry.answers || []).map(a => a.contentText),
          correctIndex: entry.correctIndex ?? (entry.answers || []).findIndex(a => a.correct),
        });
      } else {
        console.warn(" Unknown item type:", entry);
      }
    });
    return items;
  }
   */

  const handleSaveExam = async () => {
    try {
      const result = await saveExam();
      if (result) {
        setShowSuccessAlert(true);
        console.log("File saved successfully");
      }
    } catch (err) {
      setError("Error saving exam: " + err.message);
      console.error(err);
    }
  };

  return (
    <Card>
      <Typography.Title level={3}>File Manager</Typography.Title>
      <Alert message="These options will be moving to the static context menu..." type="info" showIcon/>
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

          <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
          <Space wrap>
            <Button type="primary" onClick={() => setShowCreateModal(true)}>
              Create New Exam
            </Button>
            <Button onClick={async () => {
              await handleOpenExam();
            }}>
              Open Exam (JSON)
            </Button>
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
              <Select.Option value="latex">LaTeX</Select.Option>
            </Select>
          </Space>
            <Button danger onClick={() => setIsClearModalVisible(true)} type="primary">
              Clear Exam
            </Button>
          </Space>

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
            // First dispatch to create the exam in Redux
            await createExam(exam);

            // Then try to save it to a file
            const result = await saveExam();
            if (result) {
              setShowSuccessAlert(true);
              setError("");
            }

            setShowCreateModal(false);
            message.success('New exam created and saved successfully');
          } catch (err) {
            setError("Error creating exam: " + err.message);
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
      </Modal>
      <Modal
        open={isClearModalVisible}
        title="Are you sure you want to clear the exam?"
        onOk={() => {
          closeExam();
          setIsClearModalVisible(false);
          message.success("Exam cleared");
        }}
        onCancel={() => setIsClearModalVisible(false)}
        okText="Yes, clear it"
        cancelText="Cancel"
      >
        <p>This action cannot be undone.</p>
      </Modal>
    </Card>
  );
};

export default ExamFileManager;
