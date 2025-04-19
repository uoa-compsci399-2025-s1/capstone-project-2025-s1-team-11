// src/pages/Marker.jsx

import React, { useState } from "react";
import { Typography, Upload, message, Table } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import MarkerProgressWrapper from "../components/MarkerProgressWrapper";

const { Dragger } = Upload;

const Marker = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const uploadProps = {
    name: "file",
    multiple: true,
    action: "https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload",
    onChange(info) {
      const { status } = info.file;
      if (status !== "uploading") {
        console.log(info.file, info.fileList);
        setUploadedFiles(info.fileList);
      }
      if (status === "done") {
        message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  const sampleData = [
    {
      key: "1",
      upi: "dwen293",
      firstName: "Danny",
      surname: "Weng",
      answers: "00000000",
    },
    {
      key: "2",
      upi: "abc234",
      firstName: "John",
      surname: "Doe",
      answers: "00000000",
    },
  ];

  const sampleColumns = [
    {
      title: "UPI",
      dataIndex: "upi",
      key: "upi",
    },
    {
      title: "First Name",
      dataIndex: "firstName",
      key: "firstName",
    },
    {
      title: "Surname",
      dataIndex: "surname",
      key: "surname",
    },
    {
      title: "MCQ Answers",
      dataIndex: "answers",
      key: "answers",
    },
  ];

  const renderStageContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <Typography.Title level={3}>Upload Exam Sheet</Typography.Title>
            <p>
              Please start by uploading scanned teleform data for MCQ examinations below. Only valid formats are accepted.
            </p>
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag file to this area to upload
              </p>
              <p className="ant-upload-hint">
                Please upload scanned teleform data here.
              </p>
            </Dragger>
          </>
        );
      case 1:
        return (
          <>
            <Typography.Title level={3}>Validation & Processing</Typography.Title>
            <p>
              Once your file is uploaded, the system will validate and mark the data against the provided rubric.
              This stage handles detecting answer patterns and matching them against answer keys.
            </p>
            <Table dataSource={sampleData} columns={sampleColumns} />
          </>
        );
      case 2:
        return (
          <>
            <Typography.Title level={3}>Results & Analytics</Typography.Title>
            <p>
              This is the results dashboard. It summarises overall performance statistics and provides detailed insights regarding student responses,
              question-level performance and analysis. You can also export your results for further review.
            </p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Typography.Title>Auto-Marker</Typography.Title>
      <MarkerProgressWrapper>
        {(step) => renderStageContent(step)}
      </MarkerProgressWrapper>
    </>
  );
};

export default Marker;
