import {Alert, Button, Card, Empty, Radio, Space, Typography} from "antd";
import React from "react";
import {ExamDisplay} from "../shared/examDisplay.jsx";
import AnswerGrid from "./AnswerGrid";

export const upload = ({ examData, setMarkingKeyType, markingKeyType, handleExportMarkingKey, markingKey} ) => {
  return (
    <>
      <Typography.Title level={3}>Review Exam</Typography.Title>
      {examData ? (
        <div>
          <ExamDisplay exam={examData} />
          {/*
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
                <Button type="primary" onClick={handleExportMarkingKey} disabled={!markingKey}>
                  Export Marking Key
                </Button>
              </div>
          </Card>
          */}


          { /**
           * Displays one or more versions of answer keys using AnswerGrid
           * @param {{
           *   versions: Array<{ bitmasks: number[] }>,
           *   title?: string
           * }} props
           */ }

          {/*}
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {markingKey.versions.map((v, index) => (
              <Card key={index} size="small" title={`Version ${index + 1}`}>
                <AnswerGrid answerString={''} answerKey={v.bitmasks} />
              </Card>
            ))}
          </Space>
          */}
        </div>




      ) : (
        <Empty description="Please open an exam in the Exam Builder page to begin..."/>
      )}
    </>
  );
};