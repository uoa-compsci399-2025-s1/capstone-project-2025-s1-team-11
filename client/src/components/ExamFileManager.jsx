import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { importExamFromJSON } from "../store/exam/examSlice";
import { openExamFile, saveExamToFile } from "../services/fileSystemAccess.js";
import { importExamFromXMLtoJSON } from "../services/xmlToJsonExamImporter.js";
import { Button, Alert, Space, Collapse, Typography } from "antd";

const { Panel } = Collapse;

const ExamFileManager = ({ onExamLoaded }) => {
  console.log(" ExamFileManager rendered");
  const dispatch = useDispatch();
  const [fileHandle, setFileHandle] = useState(null);
  const [error, setError] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

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

  const handleSaveExam = async () => {
    if (!fileHandle || !examData) {
      setError("Cannot save: Missing file handle or exam data.");
      return;
    }
    try {
      const updatedHandle = await saveExamToFile(examData, fileHandle);
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
      {fileHandle ? (
        <>
          {(exam.courseCode || exam.courseName || exam.semester || exam.year) && (
  <Typography.Text type="secondary">
    {[exam.courseCode, exam.courseName].filter(Boolean).join(" - ")}{" "}
    {exam.semester} {exam.year}
  </Typography.Text>
)}

          <Space style={{ marginTop: "16px", justifyContent: "space-between", width: "100%", display: "flex" }}>
            <span /> {/* Placeholder for left alignment */}
            <Button type="primary" onClick={handleSaveExam}>
              Save Exam
            </Button>
          </Space>
          <Collapse style={{ marginTop: "16px" }}>
            <Panel header="Upload or Import a Different File" key="1">
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
        </>
      ) : (
        <>
          <Space wrap style={{ marginTop: "12px" }}>
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
        </>
      )}
    </div>
  );
};

export default ExamFileManager;
