import React, { useState, useEffect } from "react";
import { Button, Alert, Input, Table, Typography, Modal, Select } from "antd";
const { TextArea } = Input;

const { Option } = Select;

const ExamDisplay = ({ exam, onAddQuestion, fileName }) => {
  // state to manage selected rows in the table
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  // state to control the visibility of the edit question modal
  const [isBlankModalVisible, setIsBlankModalVisible] = useState(false);
  // state to hold the edited question text
  const [editedQuestionText, setEditedQuestionText] = useState("");
  // state to manage the section of the question being edited
  const [editedSection, setEditedSection] = useState("");
  // state to track which answer option is selected for editing
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(0);
  // state to hold the edited answer text
  const [editedAnswerText, setEditedAnswerText] = useState("");

  // function to handle editing a question
  const handleEdit = (question) => {
    setEditedQuestionText(question.questionText);
    setEditedSection(question.section);
    setSelectedAnswerIndex(0);
    setEditedAnswerText((question.options && question.options[0]) || "");
    setIsBlankModalVisible(true);
  };

  // function to handle deleting selected questions
  const handleDeleteSelected = () => {
    if (selectedRowKeys.length === 0) {
      Modal.warning({
        title: 'No Questions Selected',
        content: 'Please select at least one question to delete.',
      });
      return;
    }
    Modal.confirm({
      title: 'Are you sure you want to delete the selected questions?',
      content: 'This action cannot be undone.',
      onOk: () => {
        // TODO: implement backend integration for deleting selected questions
      },
    });
  };

  // configuration for row selection in the table
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => {
      setSelectedRowKeys(selectedKeys);
    },
  };

  // effect to update the modal with the selected question's details
  useEffect(() => {
    if (isBlankModalVisible && selectedRowKeys.length > 0) {
      const selectedQuestion = exam.questions.find(q => q.id === selectedRowKeys[0]);
      if (selectedQuestion) {
        setEditedQuestionText(selectedQuestion.questionText);
        setEditedSection(selectedQuestion.section);
        setEditedAnswerText(selectedQuestion.options[selectedAnswerIndex] || "");
      }
    }
  }, [isBlankModalVisible, selectedRowKeys, selectedAnswerIndex, exam]);

  // return early if no exam is loaded
  if (!exam) {
    return <div>No exam loaded.</div>;
  }
  return (
    <div>
      {exam && (
        <div style={{ marginTop: 24 }}>
          {/* header displaying exam title and file name */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <Typography.Text strong>Currently editing:</Typography.Text>{' '}
              <Typography.Text>{exam.title}</Typography.Text>
              <br />
              <Typography.Text type="secondary">File: {fileName || "Unknown file"}</Typography.Text>
            </div>
            <span style={{ fontWeight: 500 }}>Date: {exam.date}</span>
          </div>
          {/* table displaying questions */}
          <Table
            dataSource={exam.questions.map((q, index) => ({
              key: q.id,
              number: index + 1,
              questionText: q.questionText,
              answer: q.answer,
              optionA: q.options?.[0] || "",
              optionB: q.options?.[1] || "",
              optionC: q.options?.[2] || "",
              optionD: q.options?.[3] || "",
            }))}
            columns={[
              { title: "#", dataIndex: "number", key: "number" },
              { title: "Section", dataIndex: "section", key: "section" },
              {
                title: "Question",
                dataIndex: "questionText",
                key: "questionText",
              },
              { title: "Option A", dataIndex: "optionA", key: "optionA" },
              { title: "Option B", dataIndex: "optionB", key: "optionB" },
              { title: "Option C", dataIndex: "optionC", key: "optionC" },
              { title: "Option D", dataIndex: "optionD", key: "optionD" },
              {
                title: "Edit",
                key: "edit",
                render: (text, record) => (
                  <Button onClick={() => handleEdit(record)}>Edit</Button>
                ),
              },
            ]}
            rowSelection={rowSelection}
            pagination={false}
          />
          {/* buttons for adding and deleting questions */}
          <div style={{display: "flex", justifyContent: "space-between", width: "100%", marginTop: 16}}>
            <Button type="dashed" onClick={onAddQuestion}>
              Add Question
            </Button>
            <Button
              type="default"
              danger
              onClick={handleDeleteSelected}
              disabled={selectedRowKeys.length === 0}
            >
              Delete Question
            </Button>
          </div>
        </div>
      )}
      {/* modal for editing a question */}
      <Modal
        title="Edit Question"
        open={isBlankModalVisible}
        onCancel={() => setIsBlankModalVisible(false)}
        okText="Update"
        onOk={() => {
          // TODO: implement backend integration for saving edited question
          setIsBlankModalVisible(false);
        }}
      >
        <TextArea 
          value={editedQuestionText} 
          onChange={(e) => setEditedQuestionText(e.target.value)} 
          placeholder="Edit question text"
        />
        <Select 
          value={editedSection} 
          onChange={setEditedSection} 
          placeholder="Select section"
          style={{ width: '100%', marginTop: 16 }}
        >
          {/* add options for sections here */}
        </Select>
        <Select 
          value={selectedAnswerIndex} 
          onChange={setSelectedAnswerIndex} 
          placeholder="Select answer to edit"
          style={{ width: '100%', marginTop: 16 }}
        >
          <Option value={0}>Option A</Option>
          <Option value={1}>Option B</Option>
          <Option value={2}>Option C</Option>
          <Option value={3}>Option D</Option>
        </Select>
        <Input 
          value={editedAnswerText} 
          onChange={(e) => setEditedAnswerText(e.target.value)} 
          placeholder="Edit answer text" 
          style={{ marginTop: 16 }} 
        />
      </Modal>
    </div>
  );
};

export default ExamDisplay;
