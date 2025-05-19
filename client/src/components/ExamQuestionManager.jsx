import React, { useState, useRef } from "react";
import { useFileSystem } from "../hooks/useFileSystem.js";
import { Button, Card, Space, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { addQuestion, addSection } from "../store/exam/examSlice.js";
import { selectExamData } from "../store/exam/selectors.js";

const ExamQuestionManager = () => {
  const { importExam, closeExam } = useFileSystem();
  const dispatch = useDispatch();
  const exam = useSelector(selectExamData);

  const docxInputRef = useRef(null);
  const xmlInputRef = useRef(null);
  const latexInputRef = useRef(null);

  const handleImport = async (event, format) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    const proceedWithImport = async () => {
      const success = await importExam(selectedFile, format);
      if (success) {
        message.success(`Questions imported from ${format.toUpperCase()} file and replaced existing questions.`);
      }
      event.target.value = null; // Reset the input so same file can be selected again if needed
    };

    if (exam?.examBody?.length > 0) {
      Modal.confirm({
        title: "Importing questions will replace your current questions.",
        content: "Are you sure you want to continue?",
        okText: "Yes, replace",
        cancelText: "Cancel",
        onOk: proceedWithImport,
      });
    } else {
      await proceedWithImport();
    }
  };

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
        <Space>
          <Button onClick={() => dispatch(addQuestion({ examBodyIndex: null, questionData: {} }))}>
            Add Question
          </Button>
          <Button onClick={() => dispatch(addSection({}))}>
            Add Section
          </Button>
        </Space>
        <Button danger onClick={closeExam} type="primary">
          Clear Exam
        </Button>
      </div>
      <p style={{ color: 'red', fontWeight: 'bold', fontSize: 'small', marginBottom: 8 }}>
        Warning: Adding questions from a file will replace your current questions.
      </p>
      <Space wrap style={{ marginBottom: "16px" }}>
        <Button onClick={() => docxInputRef.current.click()} style={{ backgroundColor: "#1890ff", color: "#fff", borderColor: "#1890ff" }}>
          Add Questions from DOCX
        </Button>
        <input
          type="file"
          accept=".docx"
          style={{ display: "none" }}
          ref={docxInputRef}
          onChange={(e) => handleImport(e, 'docx')}
        />
        <Button onClick={() => xmlInputRef.current.click()} style={{ backgroundColor: "#52c41a", color: "#fff", borderColor: "#52c41a" }}>
          Add Questions from XML (Moodle)
        </Button>
        <input
          type="file"
          accept=".xml"
          style={{ display: "none" }}
          ref={xmlInputRef}
          onChange={(e) => handleImport(e, 'moodle')}
        />
        <Button onClick={() => latexInputRef.current.click()} style={{ backgroundColor: "#fa8c16", color: "#fff", borderColor: "#fa8c16" }}>
          Add Questions from LaTeX
        </Button>
        <input
          type="file"
          accept=".tex"
          style={{ display: "none" }}
          ref={latexInputRef}
          onChange={(e) => handleImport(e, 'latex')}
        />
      </Space>
    </Card>
  );
};

export default ExamQuestionManager;
