import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearExamBody } from "../../store/exam/examSlice.js";
import { useFileSystem } from "../../hooks/useFileSystem.js";
import { Button, Alert, Space, Typography, Modal, Card, Spin } from "antd";
import { addQuestion, addSection } from "../../store/exam/examSlice.js";
import useMessage from "../../hooks/useMessage.js";
import { selectExamIsLoading } from "../../store/exam/selectors.js";

const { Paragraph, Text } = Typography;

const ExamContentManager = () => {
  const [error, setError] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { importExam, fileHandle } = useFileSystem();
  const message = useMessage();

  const dispatch = useDispatch();
  const examData = useSelector((state) => state.exam.examData);
  const isLoading = useSelector(selectExamIsLoading);

  const [isClearModalVisible, setIsClearModalVisible] = useState(false);

  // Enable buttons if we either have a file handle or exam data
  const isEnabled = fileHandle || examData;
  // Only enable clear button if we have content to clear
  const canClear = isEnabled && examData?.examBody?.length > 0;

  const handleImportExam = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setIsImporting(true);
    setError("");
    
    try {
      const success = await importExam(selectedFile);
      if (success) {
        setShowSuccessAlert(true);
        setError("");
        // Reset the file input value so the same file can be selected again
        event.target.value = '';
      }
    } catch (error) {
      setError(`Import failed: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddQuestion = () => {
    dispatch(addQuestion({ examBodyIndex: null, questionData: { contentFormatted: '' } }))
    message.success('New question added to the end of the exam.');
  };

  const handleAddSection = () => {
    dispatch(addSection({ sectionTitle: '', contentFormatted: '' }))
    message.success('New section added to the end of the exam.');
  };

  return (
    <Card>
      {/* Show loading state prominently */}
      {(isLoading || isImporting) && (
        <Alert
          message={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Spin size="small" />
              <span>Importing exam... Please wait.</span>
            </div>
          }
          type="info"
          showIcon={false}
          style={{ marginBottom: '16px' }}
        />
      )}
      
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
            onClick={() => handleAddQuestion()}
            disabled={!isEnabled || isLoading || isImporting}
          >
            Add Question
          </Button>
          <Button 
            onClick={() => handleAddSection()}
            disabled={!isEnabled || isLoading || isImporting}
          >
            Add Section
          </Button>
        </Space>
        <Space wrap>
          <Button disabled={!isEnabled || isLoading || isImporting}>
            <label style={{ cursor: (isEnabled && !isLoading && !isImporting) ? "pointer" : "not-allowed", marginBottom: 0 }}>
              {(isLoading || isImporting) ? 'Importing...' : 'Import Exam'}
              <input
                type="file"
                accept=".xml,.docx,.tex"
                onChange={handleImportExam}
                style={{ display: "none" }}
                disabled={!isEnabled || isLoading || isImporting}
              />
            </label>
          </Button>
          <Button 
            danger 
            onClick={() => setIsClearModalVisible(true)} 
            type="primary"
            disabled={!canClear || isLoading || isImporting}
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
