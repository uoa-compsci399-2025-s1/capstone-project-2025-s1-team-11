//used in the static context menu

import React, { useState } from 'react';
import { Modal, Input, Form, Divider, Radio, Checkbox } from 'antd';

const CreateExamModal = ({
  open,
  onOk,
  onCancel,
  newExamData,
  setNewExamData,
  versionCount,
  setVersionCount
}) => {
  const [customVersionsEnabled, setCustomVersionsEnabled] = useState(false);

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
        <Form.Item>
          <Checkbox
            checked={customVersionsEnabled}
            onChange={(e) => setCustomVersionsEnabled(e.target.checked)}
          >
            Enable Custom Versions
          </Checkbox>
        </Form.Item>
        {customVersionsEnabled && (
          <Form.Item label="Number of Versions">
            <Radio.Group
              value={versionCount}
              onChange={(e) => {
                const count = e.target.value;
                setVersionCount(count);
                const generated = Array.from({ length: count }, (_, i) =>
                  String(i + 1).padStart(8, '0')
                );
                setNewExamData(prev => ({ ...prev, versions: generated.join(', ') }));
              }}
            >
              <Radio value={4}>4 Versions (00000001 - 00000004)</Radio>
              <Radio value={5}>5 Versions (00000001 - 00000005)</Radio>
            </Radio.Group>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default CreateExamModal;