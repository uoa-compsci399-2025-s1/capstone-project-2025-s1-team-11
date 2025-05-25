import React, { useEffect } from 'react';
import { Modal, Form, Input, Divider } from 'antd';

const EditExamModal = ({
  open,
  onCancel,
  onOk,
  editDetailsData,
  setEditDetailsData
}) => {
  useEffect(() => {
    //console.log("EditExamModal rendered, open =", open);
    if (open) {
      //console.log("did it even workkk???");
    }
  }, [open]);

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
        <Form.Item label="Course Name">
          <Input
            placeholder="Course Name"
            value={editDetailsData.courseName}
            onChange={(e) =>
              setEditDetailsData(prev => ({ ...prev, courseName: e.target.value }))
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
        <Form.Item label="Versions (comma-separated, optional)">
          <Input
            placeholder="e.g., 00000001, 00000002, 00000003"
            value={editDetailsData.versions || ''}
            onChange={(e) =>
              setEditDetailsData(prev => ({
                ...prev,
                versions: e.target.value
              }))
            }
          />
        </Form.Item>
        <Form.Item label="Teleform Options (comma-separated, optional)">
          <Input
            placeholder="e.g., a,b,c"
            value={editDetailsData.teleformOptions || ''}
            onChange={(e) =>
              setEditDetailsData(prev => ({
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

export default EditExamModal;