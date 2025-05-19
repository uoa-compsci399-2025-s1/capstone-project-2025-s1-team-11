import React from "react";
import { Card, Typography, Space } from "antd";
import AnswerGrid from "./AnswerGrid";

const { Title } = Typography;

/**
 * Displays multiple AnswerGrids — one per version
 * @param {{
 *   versionMap?: { [versionId: string]: string },
 *   title?: string
 * }} props
 */
const AnswerKeyPreview = ({ versionMap, title = "Answer Keys" }) => {
  if (!versionMap || typeof versionMap !== 'object') {
    return null; // or render a fallback message if you prefer
  }

  return (
    <div>
      <Title level={4}>{title}</Title>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {Object.entries(versionMap).map(([versionId, encodedStr]) => (
          <Card key={versionId} size="small" title={`Version ${versionId}`}>
            <AnswerGrid
              answerString=""
              answerKeyString={encodedStr}
            />
          </Card>
        ))}
      </Space>
    </div>
  );
};

export default AnswerKeyPreview;