import {Alert, Button, Card, Empty, Radio, Typography} from "antd";
import React from "react";
import {ExamDisplay} from "../shared/examDisplay.jsx";


export const upload = ({ examData, setMarkingKeyType, markingKeyType, handleExportMarkingKey, markingKeys} ) => {
  return (
    <>
      <Typography.Title level={3}>Review Exam</Typography.Title>
      {examData ? (
        <div>
          <ExamDisplay exam={examData} />
          <Card>
            <Typography.Title level={3}>Export marking scheme to another tool</Typography.Title>
              <Alert message="These options will be moving to the static context menu..." type="info" showIcon/>
              <Radio.Group
                onChange={(e) => setMarkingKeyType(e.target.value)}
                value={markingKeyType}
                style={{ marginBottom: 16 }}
              >
                <Radio value="enhanced">Enhanced JSON Key</Radio>
                <Radio value="legacy">Legacy Format Key</Radio>
              </Radio.Group>
              <div style={{ marginBottom: 16 }}>
                <Button type="primary" onClick={handleExportMarkingKey} disabled={!markingKeys}>
                  Export Marking Key
                </Button>
              </div>
          </Card>
        </div>


      ) : (
        <Empty description="Please upload an exam in the Exam Builder page to begin..."/>
      )}
    </>
  );
};