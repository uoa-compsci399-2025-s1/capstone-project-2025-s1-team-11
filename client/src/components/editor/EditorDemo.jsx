import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, Divider, Typography, Space, Row, Col, Button, Slider } from 'antd';
import CompactRichTextEditor from './CompactRichTextEditor';
import SimplifiedContent from './SimplifiedContent';
import './EditorDemo.css';

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
  
  // For Tiptap, it's often better to return the direct content of what was parsed if it was a fragment.
  // If the original HTML is a full document, doc.documentElement.outerHTML might be needed.
  // If it's a fragment that Tiptap provides, doc.body.innerHTML is usually correct.
  return doc.body.innerHTML; 
};

const EditorDemo = () => {
  const [sectionTitle, setSectionTitle] = useState('<p>Section <strong>Title</strong></p>');
  const [questionContent, setQuestionContent] = useState('<p>What is the capital of <em>France</em>?</p>');
  const [answerA, setAnswerA] = useState('<p>Paris</p>');
  const [answerB, setAnswerB] = useState('<p>London</p>');
  const [answerC, setAnswerC] = useState('<p>Berlin</p>');
  const [answerD, setAnswerD] = useState('<p>Madrid</p>');
  const [formattingDemo, setFormattingDemo] = useState(`
    <p style="text-align: left; font-family: serif;">This paragraph uses <strong>Times New Roman</strong> font and is aligned left.</p> 
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
        
        <Col span={24}>
          <Card title="Section Title" className="demo-card">
            <div className="demo-field">
              <Title level={5}>Edit (Rich Text)</Title>
              <CompactRichTextEditor 
                content={sectionTitle} 
                onChange={setSectionTitle} // Note: Image scaling slider won't affect this editor yet
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
                onChange={setQuestionContent} // Note: Image scaling slider won't affect this editor yet
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
                onChange={setAnswerA} // Note: Image scaling slider won't affect this editor yet
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
                onChange={setAnswerB} // Note: Image scaling slider won't affect this editor yet
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
                onChange={setAnswerC} // Note: Image scaling slider won't affect this editor yet
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
                onChange={setAnswerD} // Note: Image scaling slider won't affect this editor yet
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