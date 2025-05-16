import React from 'react';
import { Card, Typography } from 'antd';
import ContentEditor from './ContentEditor';

const { Title } = Typography;

const EditorDemo = () => {
  return (
    <div className="editor-demo-container">
      <Title level={2}>Content Editor Demo: Uses whatever's at examBody[0]</Title>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Card title="Section Editor" className="demo-card">
          <ContentEditor 
            type="section"
            examBodyIndex={0}
          />
        </Card>

        <Card title="Question Editor" className="demo-card">
          <ContentEditor 
            type="question"
            examBodyIndex={0}
            questionIndex={0}
          />
        </Card>

        <Card title="Answer Editor" className="demo-card">
          <ContentEditor 
            type="answer"
            examBodyIndex={0}
            questionIndex={0}
            answerIndex={0}
          />
        </Card>
      </div>

      <div className="demo-notes" style={{ marginTop: '24px' }}>
        <Title level={4}>Editor Features</Title>
        <ul>
          <li>Each editor demonstrates editing different parts of an exam</li>
          <li>Changes are stored in Redux state</li>
          <li>Rich text formatting is preserved</li>
          <li>Live preview shows formatted content</li>
        </ul>
      </div>
    </div>
  );
};

export default EditorDemo; 