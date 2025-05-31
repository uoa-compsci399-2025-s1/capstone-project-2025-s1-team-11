import React from "react";
import { Input, Typography, Button, Space, Upload, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { readTeleform } from "../../utilities/marker/teleformReader.js";
import TeleformTable from "./TeleformTable";
import { UploadOutlined, ClearOutlined, SaveOutlined } from "@ant-design/icons";
import { setTeleformData, clearTeleformData } from "../../store/exam/teleformSlice";
import { selectTeleformData } from "../../store/exam/selectors";
import { selectExamData } from "../../store/exam/selectors";
import TeleformWarnings from "../../utilities/marker/teleformWarnings.jsx";


const { TextArea } = Input;
const { Title } = Typography;

// Convert to named function component with PascalCase naming convention
const TeleformReader = ({ markingKey, navigationButtons }) => {
  const dispatch = useDispatch();
  const teleformData = useSelector(selectTeleformData);
  const examData = useSelector(selectExamData);

  let parsedData;
  try {
    parsedData = readTeleform(teleformData);
  } catch {
    parsedData = [];
  }

  const handleTeleformDataChange = (e) => {
    dispatch(setTeleformData(e.target.value));
  };

  const handleClearData = () => {
    dispatch(clearTeleformData());
  };

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      dispatch(setTeleformData(content));
    };
    reader.onerror = () => {
      message.error("Failed to read file");
    };
    reader.readAsText(file);
    return false; // Prevent default upload behavior
  };

  const handleSaveToFile = () => {
    if (!teleformData) {
      message.error("No teleform data to save");
      return;
    }

    const blob = new Blob([teleformData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${examData?.courseCode || 'exam'}_teleform_data.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success("Teleform data saved successfully");
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Teleform Data</Title>
        {navigationButtons}
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Upload
          beforeUpload={handleFileUpload}
          accept=".txt"
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>Load from file</Button>
        </Upload>

        <Button
          icon={<SaveOutlined />}
          onClick={handleSaveToFile}
          disabled={!teleformData}
        >
          Save to file
        </Button>

        <Button
          icon={<ClearOutlined />}
          onClick={handleClearData}
          disabled={!teleformData}
        >
          Clear
        </Button>
      </Space>

      <TextArea
        rows={6}
        placeholder="Enter teleform scan data here"
        value={teleformData}
        onChange={handleTeleformDataChange}
        style={{ marginBottom: 16 }}
      />
      <TeleformWarnings parsedData={parsedData} />
      <TeleformTable data={parsedData} answerKey={markingKey}/>
    </div>
  );
};

// Export the component directly
export default TeleformReader;