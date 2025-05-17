import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Divider, Switch, Select } from 'antd';

const EditExamModal = ({
  open,
  onCancel,
  onOk,
  editDetailsData,
  setEditDetailsData
}) => {
  const [useCustomVersions, setUseCustomVersions] = useState(false);
  const [versionScheme, setVersionScheme] = useState('letters'); // options: 'letters', 'numbers', 'roman'
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
        <Form.Item label="Use Custom Versions">
          <Switch checked={useCustomVersions} onChange={setUseCustomVersions} />
        </Form.Item>
        {useCustomVersions ? (
          <Form.Item label="Custom Versions (comma-separated)">
            <Input
              placeholder="e.g. I, II, III"
              value={editDetailsData.versions}
              onChange={(e) =>
                setEditDetailsData(prev => ({ ...prev, versions: e.target.value }))
              }
            />
          </Form.Item>
        ) : (
          <>
            <Form.Item label="Version Scheme">
              <Select value={versionScheme} onChange={setVersionScheme}>
                <Select.Option value="letters">A, B, C...</Select.Option>
                <Select.Option value="numbers">1, 2, 3...</Select.Option>
                <Select.Option value="roman">I, II, III...</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Number of Versions">
              <Input
                type="number"
                min={2}
                max={10}
                value={versionCount}
                onChange={(e) => {
                  const count = parseInt(e.target.value || 4);
                  setVersionCount(count);
                  const generated = Array.from({ length: count }, (_, i) => {
                    if (versionScheme === 'letters') return String.fromCharCode(65 + i);
                    if (versionScheme === 'numbers') return String(i + 1);
                    if (versionScheme === 'roman') return ['I','II','III','IV','V','VI','VII','VIII','IX','X'][i];
                    return '';
                  });
                  setEditDetailsData(prev => ({ ...prev, versions: generated.join(', ') }));
                }}
              />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default EditExamModal;