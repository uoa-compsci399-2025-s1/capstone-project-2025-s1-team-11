import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Button, Space, Divider, Spin } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { generateExamHtmlPreview } from '../../services/examPreview/examHtmlPreview';
//import '../../styles/examPreview.css';

const ExamPreview = () => {
  const examData = useSelector((state) => state.exam.examData);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Generate preview HTML when exam data changes
  useEffect(() => {
    if (examData) {
      setIsLoading(true);
      
      // Small delay to allow UI to update
      const timer = setTimeout(() => {
        const html = generateExamHtmlPreview(examData);
        setPreviewHtml(html);
        setIsLoading(false);
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setPreviewHtml('');
      setIsLoading(false);
    }
  }, [examData]);

  const handlePrint = () => {
    window.print();
  };

  if (!examData) {
    return (
      <div className="exam-preview-empty">
        No exam data available. Please open or create an exam first.
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          icon={<PrinterOutlined />} 
          onClick={handlePrint}
          title="Print Preview"
        >
          Print
        </Button>
      </div>

      <Divider style={{ margin: '8px 0' }} />
      
      {isLoading ? (
        <Spin size="large">
          <div style={{ textAlign: 'center', padding: '40px 0', minHeight: '200px' }}>
            Generating preview...
          </div>
        </Spin>
      ) : (
        <div
          className="preview-container"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      )}
    </div>
  );
};

export default ExamPreview; 