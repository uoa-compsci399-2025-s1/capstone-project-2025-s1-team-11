import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearExamBody } from "../../store/exam/examSlice.js";
import { useFileSystem } from "../../hooks/useFileSystem.js";
import { Button, Alert, Space, Typography, Modal, Card } from "antd";
import { addQuestion, addSection } from "../../store/exam/examSlice.js";
import useMessage from "../../hooks/useMessage.js";

const { Paragraph, Text } = Typography;

const ExamContentManager = () => {
  const [error, setError] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const { importExam, fileHandle } = useFileSystem();
  const message = useMessage();

  const dispatch = useDispatch();
  const examData = useSelector((state) => state.exam.examData);

  const [isClearModalVisible, setIsClearModalVisible] = useState(false);

  // Enable buttons if we either have a file handle or exam data
  const isEnabled = fileHandle || examData;
  // Only enable clear button if we have content to clear
  const canClear = isEnabled && examData?.examBody?.length > 0;

  const handleImportExam = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    const success = await importExam(selectedFile);
    if (success) {
      setShowSuccessAlert(true);
      setError("");
      // Reset the file input value so the same file can be selected again
      event.target.value = '';
    }
  };

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
          <Button 
            onClick={() => dispatch(addQuestion({ examBodyIndex: null, questionData: { contentFormatted: '' } }))}
            disabled={!isEnabled}
          >
            Add Question
          </Button>
          <Button 
            onClick={() => dispatch(addSection({ sectionTitle: '', contentFormatted: '' }))}
            disabled={!isEnabled}
          >
            Add Section
          </Button>
        </Space>
        <Space wrap>
          <Button disabled={!isEnabled}>
            <label style={{ cursor: isEnabled ? "pointer" : "not-allowed", marginBottom: 0 }}>
              Import Exam
              <input
                type="file"
                accept=".xml,.docx,.tex"
                onChange={handleImportExam}
                style={{ display: "none" }}
                disabled={!isEnabled}
              />
            </label>
          </Button>
          <Button 
            danger 
            onClick={() => setIsClearModalVisible(true)} 
            type="primary"
            disabled={!canClear}
          >
            Clear Exam Content
          </Button>
        </Space>
      </Space>

      <Modal
        open={isClearModalVisible}
        title="Are you sure you want to clear the exam content?"
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
