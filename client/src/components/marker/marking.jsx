import {Typography, Button, Radio, Input, Card} from "antd";
import React from "react";

export const marking = ({setMarkingKeyType,markingKeyType,handleExportMarkingKey,markingKeys,teleformData,handleTeleformDataChange,handleMarkExams}) => {
  return (
    <>
      <Typography.Title level={3}>Exam Marking Utility</Typography.Title>
      <Input.TextArea
        rows={6}
        placeholder="Enter teleform scan data here"
        value={teleformData}
        onChange={handleTeleformDataChange}
        style={{ marginBottom: 16 }}
      />
      <div>
        <Button type="primary" onClick={handleMarkExams}>
          Mark Exams
        </Button>
      </div>
    </>
  );
};