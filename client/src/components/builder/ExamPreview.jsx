import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Spin, Typography } from 'antd';
import { generateExamHtmlPreview } from '../../services/examPreview/examHtmlPreview';
import { renderLatexInContainer } from '../../dto/latex/utils/katexRenderer';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const { Title, Paragraph, Text } = Typography;

const ExamPreview = ({ tabId }) => {
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
        setIsLoading(false);
        setPreviewHtml(html);


        // Rendering moved to separate useEffect
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setPreviewHtml('');
      setIsLoading(false);
    }
  }, [examData]);

  useEffect(() => {
    if (tabId === "preview") {
      const container = document.getElementById("preview-container");
      if (container) {
        renderLatexInContainer(container);
      }
    }
  }, [previewHtml, tabId]);

  if (!examData) {
    return (
      <div className="exam-preview-empty">
        No exam data available. Please open or create an exam first.
      </div>
    );
  }

  return (
    <div>      
      {isLoading ? (
        <Spin size="large">
          <div style={{ textAlign: 'center', padding: '40px 0', minHeight: '200px' }}>
            Generating preview...
          </div>
        </Spin>
      ) : (
        <div 
          className="preview-container" 
          id="preview-container"
          style={{
            backgroundColor: '#fff',
            color: '#000',
            borderRadius: '8px',
            padding: '0',
            minHeight: '200px'
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
      )}
    </div>
  );
};

export default ExamPreview; 