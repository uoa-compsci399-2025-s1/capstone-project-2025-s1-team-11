import React from "react";
import { Button, Input, Typography } from "antd";
import { readTeleform } from "../../utilities/marker/teleformReader.js"; // Update this path as needed
import TeleformTable from "./TeleformTable";

const { TextArea } = Input;
const { Title } = Typography;

export const teleformReader = ({
                                 teleformData,
                                 markingKey,
                                 handleTeleformDataChange,
                                 handleMarkExams
                               }) => {
  let parsedData = [];
  try {
    parsedData = readTeleform(teleformData);
  } catch (err) {
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
      <Button type="primary" onClick={handleMarkExams} style={{ marginBottom: 24 }}>
        Mark Exams
      </Button>
      <TeleformTable data={parsedData} answerKey={markingKey}/>
    </div>
  );
};