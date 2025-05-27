import React from "react";
import { Input, Typography, Button, Space, Upload, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { readTeleform } from "../../utilities/marker/teleformReader.js";
import TeleformTable from "./TeleformTable";
import { UploadOutlined, ClearOutlined } from "@ant-design/icons";
import { setTeleformData, clearTeleformData } from "../../store/exam/teleformSlice";
import { selectTeleformData } from "../../store/exam/selectors";

const { TextArea } = Input;
const { Title } = Typography;

// Convert to named function component with PascalCase naming convention
const TeleformReader = ({ markingKey }) => {
  const dispatch = useDispatch();
  const teleformData = useSelector(selectTeleformData);
  
  let parsedData = [];
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

  return (
    <div>
      <Title level={4}>Teleform Data</Title>
      
      <Space style={{ marginBottom: 16 }}>
        <Upload
          beforeUpload={handleFileUpload}
          accept=".txt"
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>Load from file</Button>
        </Upload>
        
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
      <TeleformTable data={parsedData} answerKey={markingKey}/>
    </div>
  );
};

// Export the component directly
export default TeleformReader;