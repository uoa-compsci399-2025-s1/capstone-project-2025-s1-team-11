import React from "react";
import { Input, Typography } from "antd";
import { readTeleform } from "../../utilities/marker/teleformReader.js"; // Update this path as needed
import TeleformTable from "./TeleformTable";

const { TextArea } = Input;
const { Title } = Typography;

export const teleformReader = ({
  teleformData,
  markingKey,
  handleTeleformDataChange,
}) => {
  let parsedData = [];
  try {
    parsedData = readTeleform(teleformData);
  } catch {
    parsedData = [];
  }

  return (
    <div>
      <Title level={4}>Teleform Data</Title>
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