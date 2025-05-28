import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearExamBody } from "../../store/exam/examSlice.js";
import { useFileSystem } from "../../hooks/useFileSystem.js";
import { Button, Alert, Space, Typography, Modal, Input, Card, Select } from "antd";
import { addQuestion, addSection } from "../../store/exam/examSlice.js";
import useMessage from "../../hooks/useMessage.js";

const { Paragraph, Text } = Typography;

const ExamContentManager = () => {
  const [error, setError] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const { importExam } = useFileSystem();
  const [selectedFormat, setSelectedFormat] = useState('all'); // Default is 'all'
  const message = useMessage();

  const dispatch = useDispatch();

  const [isClearModalVisible, setIsClearModalVisible] = useState(false);

  const handleImportExam = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    const success = await importExam(selectedFile, selectedFormat);
    if (success) {
      setShowSuccessAlert(true);
      setError("");
      // Reset the file input value so the same file can be selected again
      event.target.value = '';
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

  return (
    <Card>
      {/* <Typography.Title level={3}>File Manager</Typography.Title> */}
      {/* <Alert message="Some of this is moved/moving to the static context menu..." type="info" showIcon/> */}
        {error && <Text type="danger">{error}</Text>}
        {showSuccessAlert && (
          <Alert
            message="Success"
            type="success"
            showIcon
            closable
            onClose={() => setShowSuccessAlert(false)}
          />
        )}
        {examData && (
          <Space style={{ marginTop: "16px", justifyContent: "space-between", width: "100%", display: "flex" }}>
            <span /> {/* Placeholder for left alignment */}
          </Space>
        )}

          <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
          <Space wrap>
            <Button onClick={() => dispatch(addQuestion({ examBodyIndex: null, questionData: { contentFormatted: '' } }))}>
              Add Question
            </Button>
            <Button onClick={() => dispatch(addSection({ sectionTitle: '', contentFormatted: '' }))}>
              Add Section
            </Button>
          </Space>
          <Space wrap>
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
            <Button danger onClick={() => setIsClearModalVisible(true)} type="primary">
              Clear Exam Content
            </Button>
          </Space>
          </Space>

      <Modal
        open={isClearModalVisible}
        title="Are you sure you want to clear the exam?"
        onOk={() => {
          dispatch(clearExamBody());
          setIsClearModalVisible(false);
          message.success("Exam cleared");
        }}
        onCancel={() => setIsClearModalVisible(false)}
        okText="Yes, clear it"
        cancelText="Cancel"
      >
        <Paragraph>This action cannot be undone.</Paragraph>
      </Modal>
    </Card>
  );
};

export default ExamContentManager;
