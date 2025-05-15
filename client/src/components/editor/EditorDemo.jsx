import React, { useState } from 'react';
import { Card, Divider, Typography, Space, Row, Col, Button } from 'antd';
import CompactRichTextEditor from './CompactRichTextEditor';
import SimplifiedContent from './SimplifiedContent';
import './EditorDemo.css';

const { Title, Text } = Typography;

const EditorDemo = () => {
  const [sectionTitle, setSectionTitle] = useState('<p>Section <strong>Title</strong></p>');
  const [questionContent, setQuestionContent] = useState('<p>What is the capital of <em>France</em>?</p>');
  const [answerA, setAnswerA] = useState('<p>Paris</p>');
  const [answerB, setAnswerB] = useState('<p>London</p>');
  const [answerC, setAnswerC] = useState('<p>Berlin</p>');
  const [answerD, setAnswerD] = useState('<p>Madrid</p>');
  const [formattingDemo, setFormattingDemo] = useState(`
    <h2 style="text-align: center;">Formatting Features Demo</h2>
    <p style="text-align: left; font-family: serif;">This paragraph uses <strong>Times New Roman</strong> font and is aligned left.</p>
    <p style="text-align: center; font-family: sans-serif;">This paragraph uses <strong>Arial</strong> font and is <em>centered</em>.</p>
    <p style="text-align: right; font-family: monospace;">This paragraph uses <strong>Courier New</strong> font and is aligned right.</p>
    <ul>
      <li>First bullet point</li>
      <li>Second bullet point
        <ul>
          <li>Nested bullet point (indented)</li>
        </ul>
      </li>
    </ul>
    <p>Here's how a line break looks like.<br>This is on a new line but the same paragraph.</p>
    <p>Below is an image that can be resized:</p>
    <p><img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzFiOTBmZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UmVzaXphYmxlIEltYWdlPC90ZXh0Pjwvc3ZnPg==" width="200"/></p>
  `);

  return (
    <div className="editor-demo-container">
      <Title level={2}>Rich Text Editor Demo</Title>
      <Text type="secondary">
        This demo showcases the compact rich text editor for exam content. You can edit the content below and see both the rich text and simplified text views.
      </Text>
      
      <Divider />

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="New Features Demo" className="demo-card">
            <div className="demo-field">
              <Title level={5}>Try All Features</Title>
              <Text type="secondary">This demo includes all the new features: bold (fixed), underline, text alignment, indentation, soft returns, font selection, and image resizing.</Text>
              <CompactRichTextEditor 
                content={formattingDemo} 
                onChange={setFormattingDemo}
                placeholder="Try the new features here..."
              />
            </div>
            <div className="demo-field">
              <Title level={5}>Preview (Rich HTML)</Title>
              <div className="html-preview" dangerouslySetInnerHTML={{ __html: formattingDemo }} />
            </div>
            <div className="demo-field">
              <Title level={5}>Preview (Simplified Text)</Title>
              <div className="text-preview">
                <SimplifiedContent html={formattingDemo} />
              </div>
            </div>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card title="Section Title" className="demo-card">
            <div className="demo-field">
              <Title level={5}>Edit (Rich Text)</Title>
              <CompactRichTextEditor 
                content={sectionTitle} 
                onChange={setSectionTitle}
                placeholder="Enter section title..."
              />
            </div>
            <div className="demo-field">
              <Title level={5}>Preview (Simplified Text)</Title>
              <div className="text-preview">
                <SimplifiedContent html={sectionTitle} />
              </div>
            </div>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card title="Question" className="demo-card">
            <div className="demo-field">
              <Title level={5}>Edit (Rich Text)</Title>
              <CompactRichTextEditor 
                content={questionContent} 
                onChange={setQuestionContent}
                placeholder="Enter question..."
              />
            </div>
            <div className="demo-field">
              <Title level={5}>Preview (Simplified Text)</Title>
              <div className="text-preview">
                <SimplifiedContent html={questionContent} />
              </div>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="Answer A" className="demo-card">
            <div className="demo-field">
              <CompactRichTextEditor 
                content={answerA} 
                onChange={setAnswerA}
                placeholder="Enter answer A..."
              />
            </div>
            <div className="demo-field">
              <Title level={5}>Simplified:</Title>
              <SimplifiedContent html={answerA} />
            </div>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="Answer B" className="demo-card">
            <div className="demo-field">
              <CompactRichTextEditor 
                content={answerB} 
                onChange={setAnswerB}
                placeholder="Enter answer B..."
              />
            </div>
            <div className="demo-field">
              <Title level={5}>Simplified:</Title>
              <SimplifiedContent html={answerB} />
            </div>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="Answer C" className="demo-card">
            <div className="demo-field">
              <CompactRichTextEditor 
                content={answerC} 
                onChange={setAnswerC}
                placeholder="Enter answer C..."
              />
            </div>
            <div className="demo-field">
              <Title level={5}>Simplified:</Title>
              <SimplifiedContent html={answerC} />
            </div>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="Answer D" className="demo-card">
            <div className="demo-field">
              <CompactRichTextEditor 
                content={answerD} 
                onChange={setAnswerD}
                placeholder="Enter answer D..."
              />
            </div>
            <div className="demo-field">
              <Title level={5}>Simplified:</Title>
              <SimplifiedContent html={answerD} />
            </div>
          </Card>
        </Col>
      </Row>
      
      <Divider />
      
      <div className="demo-notes">
        <Title level={4}>Implementation Notes</Title>
        <ul>
          <li>The editor supports text formatting: <strong>bold</strong>, <em>italic</em>, <u>underline</u></li>
          <li>Text alignment: left, center, right</li>
          <li>Lists with indentation support</li>
          <li>Font selection: Times New Roman, Courier New, Arial</li>
          <li>Soft return/line breaks within paragraphs</li>
          <li>Images can be uploaded and resized (drag the handle in the bottom-right)</li>
          <li>All content is stored as HTML in a single source of truth</li>
          <li>Simplified text view is generated on-demand from the HTML</li>
        </ul>
      </div>
    </div>
  );
};

export default EditorDemo; 