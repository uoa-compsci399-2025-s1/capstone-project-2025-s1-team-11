//used in the static context menu

import React from 'react';
import { Modal, Input, Form, Divider } from 'antd';

const CreateExamModal = ({
  open,
  onOk,
  onCancel,
  newExamData,
  setNewExamData
}) => {

  return (
    <Modal
      title="Create New Exam"
      open={open}
      onOk={() => {
        console.log("Creating exam with data:", newExamData);
        onOk();
      }}
      onCancel={onCancel}
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
        <Form.Item label="Versions (comma-separated, optional)">
          <Input
            placeholder="e.g., 00000001, 00000002, 00000003"
            value={newExamData.versions || ''}
            onChange={(e) =>
              setNewExamData(prev => ({
                ...prev,
                versions: e.target.value
              }))
            }
          />
        </Form.Item>
        <Form.Item label="Teleform Options (comma-separated, optional)">
          <Input
            placeholder="e.g., A, B, C, D, E"
            value={newExamData.teleformOptions || ''}
            onChange={(e) =>
              setNewExamData(prev => ({
                ...prev,
                teleformOptions: e.target.value
              }))
            }
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateExamModal;