import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, Divider, Typography, Space, Row, Col, Button, Slider } from 'antd';
import CompactRichTextEditor from './CompactRichTextEditor';
import SimplifiedContent from './SimplifiedContent';
//import './EditorDemo.css';

const { Title, Text } = Typography;

const DEBOUNCE_DELAY = 300; // milliseconds

const updateImageStylesInHtml = (html, scale) => {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  doc.querySelectorAll('img').forEach(img => {
    img.style.width = `${scale}%`;
    img.style.height = 'auto';
    // Remove explicit width/height attributes if they exist to avoid conflicts
    img.removeAttribute('width');
    img.removeAttribute('height');
  });
  
  return doc.body.innerHTML; 
};

const EditorDemo = () => {
  const [formattingDemo, setFormattingDemo] = useState(`
    <p style="text-align: left; font-family: 'Times New Roman', serif;">This paragraph uses Times New Roman font and is aligned left.</p> 
    <p style="text-align: center; font-family: 'Courier New', serif;">This paragraph uses Courier New font and is aligned center.</p> 
    <p style="text-align: right; font-family: 'Arial', serif;">This paragraph uses Arial font and is aligned right.</p> 
    <p style="text-align: left; font-family: 'Times New Roman', serif;"><strong>Bold</strong>, <em>italic</em>, <u>underlined</u>, <strong>
    <em>bold italic</em></strong>, <strong><u>bold underlined</u></strong>, <em><u>italic underlined</u></em>, <strong><em><u>bold italic underlined</u></em></strong>.</p> 
  `);
  const [imageScale, _setImageScale] = useState(100); 

  const formattingDemoDebounceTimerRef = useRef(null);

  const handleFormattingDemoChange = useCallback((newContent) => {
    if (formattingDemoDebounceTimerRef.current) {
      clearTimeout(formattingDemoDebounceTimerRef.current);
    }
    formattingDemoDebounceTimerRef.current = setTimeout(() => {
      // When editor content changes, we might want to re-apply the current scale
      // or assume images inserted already have a scale or will be scaled by slider.
      // For now, just set content. If images are inserted without style, slider will fix them.
      setFormattingDemo(newContent);
    }, DEBOUNCE_DELAY);
  }, []); 

  const handleImageScaleChange = useCallback((newScale) => {
    _setImageScale(newScale);
    setFormattingDemo(currentHtml => {
      const newHtml = updateImageStylesInHtml(currentHtml, newScale);
      console.log("Updated HTML for preview (after scale change DOM):", newHtml); 
      return newHtml;
    });
  }, []); 

  useEffect(() => {
    return () => {
      if (formattingDemoDebounceTimerRef.current) {
        clearTimeout(formattingDemoDebounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="editor-demo-container">
      <Title level={2}>Rich Text Editor Demo</Title>
      <Divider />
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="New Features Demo" className="demo-card">
            <div className="demo-field">
              <CompactRichTextEditor 
                content={formattingDemo} 
                onChange={handleFormattingDemoChange}
                placeholder="Try the new features here..."
                imageScale={imageScale} 
                onImageScaleChange={handleImageScaleChange}
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