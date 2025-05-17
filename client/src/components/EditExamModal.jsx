import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Divider, Radio } from 'antd';

const EditExamModal = ({
  open,
  onCancel,
  onOk,
  editDetailsData,
  setEditDetailsData
}) => {
  const [versionCount, setVersionCount] = useState(4);

  useEffect(() => {
    console.log("EditExamModal rendered, open =", open);
    if (open) {
      console.log("did it even workkk???");
    }
  }, [open]);

  useEffect(() => {
    if (Array.isArray(editDetailsData.versions)) {
      setVersionCount(editDetailsData.versions.length);
    } else if (typeof editDetailsData.versions === 'string') {
      // Try to parse string to array by splitting on comma
      const arr = editDetailsData.versions.split(',').map(v => v.trim()).filter(v => v.length > 0);
      if (arr.length > 0) {
        setVersionCount(arr.length);
      }
    }
  }, [editDetailsData.versions]);

  return (
    <Modal
      title="Edit Exam Details"
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="Save"
    >
      <Form layout="vertical">
        <Divider orientation="left">Basic Details</Divider>
        <Form.Item label="Exam Title">
          <Input
            placeholder="Exam Title"
            value={editDetailsData.examTitle}
            onChange={(e) =>
              setEditDetailsData(prev => ({ ...prev, examTitle: e.target.value }))
            }
          />
        </Form.Item>
        <Form.Item label="Course Code">
          <Input
            placeholder="Course Code"
            value={editDetailsData.courseCode}
            onChange={(e) =>
              setEditDetailsData(prev => ({ ...prev, courseCode: e.target.value }))
            }
          />
        </Form.Item>
        <Form.Item label="Course Name">
          <Input
            placeholder="Course Name"
            value={editDetailsData.courseName}
            onChange={(e) =>
              setEditDetailsData(prev => ({ ...prev, courseName: e.target.value }))
            }
          />
        </Form.Item>
        <Divider orientation="left">Exam Info</Divider>
        <Form.Item label="Semester">
          <Input
            placeholder="One"
            value={editDetailsData.semester}
            onChange={(e) =>
              setEditDetailsData(prev => ({ ...prev, semester: e.target.value }))
            }
          />
        </Form.Item>
        <Form.Item label="Year">
          <Input
            placeholder="2025"
            value={editDetailsData.year}
            onChange={(e) =>
              setEditDetailsData(prev => ({ ...prev, year: e.target.value }))
            }
          />
        </Form.Item>
        <Form.Item label="Number of Versions">
          <Radio.Group
            value={versionCount}
            onChange={(e) => {
              const count = e.target.value;
              setVersionCount(count);
              const generated = Array.from({ length: count }, (_, i) =>
                String(i + 1).padStart(8, '0')
              );
              setEditDetailsData(prev => ({ ...prev, versions: generated.join(', ') }));
            }}
          >
            <Radio value={4}>4 Versions (00000001 - 00000004)</Radio>
            <Radio value={5}>5 Versions (00000001 - 00000005)</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditExamModal;