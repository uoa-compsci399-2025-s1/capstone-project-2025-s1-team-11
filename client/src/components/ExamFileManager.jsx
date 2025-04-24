import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { importExamFromJSON } from "../store/exam/examSlice";
import { openExamFile, saveExamToFile } from "../services/fileSystemAccess.js";
import { importExamFromXMLtoJSON } from "../services/xmlToJsonExamImporter.js";
import { Button, Alert, Space, Collapse, Typography, Modal, Input, message } from "antd";

const { Panel } = Collapse;

const ExamFileManager = ({ onExamLoaded }) => {
  console.log(" ExamFileManager rendered");
  const dispatch = useDispatch();
  const [fileHandle, setFileHandle] = useState(null);
  const [error, setError] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

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

  // Open a JSON exam file
  const handleOpenExam = async () => {
    try {
      const result = await openExamFile();
      if (result) {
        dispatch(importExamFromJSON(result.exam));
        console.log("Dispatching importExamFromJSON with:", result.exam);
        setFileHandle(result.fileHandle);
        if (onExamLoaded) {
          onExamLoaded(result.exam, result.fileHandle?.name || "Unnamed file");
        }
      }
    } catch (err) {
      setError("Error opening exam: " + err.message);
    }
  };

  // Import an exam from an XML file
  const handleImportExam = async (event) => {
    const file = event.target.files[0];
    if (file) {
      importExamFromXMLtoJSON(file, (err, importedExam) => {
        if (err) {
          setError("Error importing exam: " + err.message);
        } else {
          setError("");
          dispatch(importExamFromJSON(importedExam));
          setFileHandle(null); // since this exam was imported and not loaded from a JSON file
          if (onExamLoaded) {
            onExamLoaded(importedExam, file.name);
          }
        }
      });
    }
  };

  // Use Redux state for examData
  const examData = useSelector((state) => state.exam.examData);

  // Example: Normalize questions from examData (sectioned or not)
  // This block can be reused or adapted wherever question items need to be processed
  function getFlatQuestionListFromExam(examData) {
    const items = [];
    if (!examData) return items;
    // Suppose examData.examBody is an array of entries (sections or questions)
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

  const handleSaveExam = async () => {
    if (!examData) {
      setError("Cannot save: Missing exam data.");
      return;
    }

    try {
      let updatedHandle = fileHandle;

      if (!fileHandle && window.showSaveFilePicker) {
        const options = {
          suggestedName: `${examData.examTitle || 'Untitled_Exam'}.json`,
          types: [{ description: "JSON Files", accept: { "application/json": [".json"] } }]
        };
        updatedHandle = await window.showSaveFilePicker(options);
      }

      if (!updatedHandle) {
        setError("No file handle available for saving.");
        return;
      }

      updatedHandle = await saveExamToFile(examData, updatedHandle);
      setFileHandle(updatedHandle);
      setShowSuccessAlert(true);
      console.log(" File saved successfully to", updatedHandle.name);
    } catch (err) {
      setError("Error saving exam: " + err.message);
      console.error(err);
    }
  };

  return (
    <div>
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
      <Collapse style={{ marginTop: "16px" }}>
        <Panel header="File Options" key="1">
          <Space wrap>
            <Button onClick={handleOpenExam}>Open Exam (JSON)</Button>
            <Button>
              <label style={{ cursor: "pointer", marginBottom: 0 }}>
                Import Exam (XML)
                <input
                  type="file"
                  accept=".xml"
                  onChange={handleImportExam}
                  style={{ display: "none" }}
                />
              </label>
            </Button>
          </Space>
        </Panel>
      </Collapse>
      <div style={{ padding: "12px 0", borderTop: "1px solid #f0f0f0", marginTop: "12px" }}>
        <Button type="primary" onClick={() => setShowCreateModal(true)}>
          Create New Exam
        </Button>
      </div>
      {/* Modal for creating a new exam */}
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
            const options = {
              suggestedName: `${exam.examTitle || 'Untitled_Exam'}.json`,
              types: [{ description: "JSON Files", accept: { "application/json": [".json"] } }]
            };

            const handle = await window.showSaveFilePicker(options);
            await saveExamToFile(exam, handle);
            setFileHandle(handle);
            dispatch(importExamFromJSON(exam));
            if (onExamLoaded) {
              onExamLoaded(exam, handle.name);
            }
            setShowCreateModal(false);
            message.success('New exam created and saved');
          } catch (err) {
            setError("Error saving new exam: " + err.message);
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
          //value={newExamData.year}
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
        <Typography.Title level={5}>Metadata</Typography.Title>
        <Typography.Text strong>Key</Typography.Text>
        <Input
          value={newExamData.metadataKey}
          onChange={e => setNewExamData({ ...newExamData, metadataKey: e.target.value })}
          placeholder="Metadata Key (optional)"
          style={{ marginBottom: 16 }}
        />
        <Typography.Text strong>Value</Typography.Text>
        <Input
          value={newExamData.metadataValue}
          onChange={e => setNewExamData({ ...newExamData, metadataValue: e.target.value })}
          placeholder="Metadata Value (optional)"
          style={{ marginBottom: 16 }}
        />
      </Modal>
    </div>
  );
};

export default ExamFileManager;
