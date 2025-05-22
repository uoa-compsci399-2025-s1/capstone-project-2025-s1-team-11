import { DEFAULT_OPTIONS } from '../../constants/answerOptions';
/**
 * Converts the exam data structure into HTML for preview
 * @param {Object} examData - The exam data from Redux store
 * @returns {string} HTML representation of the exam
 */
export function generateExamHtmlPreview(examData) {
  if (!examData) {
    return '<div class="exam-preview-empty">No exam data available</div>';
  }

  let html = `
    <div class="exam-preview">
      <div class="exam-body">
  `;

  // Process exam body
  if (examData.examBody && examData.examBody.length > 0) {
    examData.examBody.forEach((item) => {
      if (item.type === 'section') {
        html += processSectionToHtml(item, examData.teleformOptions);
      } else if (item.type === 'question') {
        html += processQuestionToHtml(item, examData.teleformOptions);
      }
    });
  } else {
    html += '<div class="exam-empty-body">No content available</div>';
  }

  // Close the body and exam container
  html += `
      </div>
    </div>
  `;

  return html;
}

/**
 * Process a section into HTML
 * @param {Object} section - The section data
 * @param {Array} teleformOptions - Array of answer option labels
 * @returns {string} HTML representation of the section
 */
function processSectionToHtml(section, teleformOptions) {
  let html = `
    <div class="exam-section">
      ${section.contentFormatted ? 
        `<div class="section-content">${safeHtmlContent(section.contentFormatted)}</div>` : ''}
      <div class="section-questions">
  `;

  // Process questions in this section
  if (section.questions && section.questions.length > 0) {
    section.questions.forEach((question) => {
      html += processQuestionToHtml(question, teleformOptions);
    });
  }

  html += `
      </div>
    </div>
  `;

  return html;
}

/**
 * Process a question into HTML
 * @param {Object} question - The question data
 * @param {Array} teleformOptions - Array of answer option labels
 * @returns {string} HTML representation of the question
 */
function processQuestionToHtml(question, teleformOptions = DEFAULT_OPTIONS) {
  let html = `
    <div class="exam-question">
      <div class="question-header">
        <span class="question-number"><strong>Question ${question.questionNumber || ''}.</strong></span></br>
        ${question.marks ? 
          `<span class="question-marks">[${question.marks} mark${question.marks !== 1 ? 's' : ''}]</span>` : ''}
          <span class="question-content">${safeHtmlContent(question.contentFormatted || '')}</span>
      </div>
  `;

  // Process answers with version-specific shuffling
  if (question.answers && question.answers.length > 0) {
    html += '<div class="question-answers" style="margin-left: 30px;">';

    // Now render the answers in their original order
    question.answers.forEach((answer, index) => {
      if (answer) {
        // Use teleformOptions for answer labels
        const labelIndex = index < teleformOptions.length ? index : index % teleformOptions.length;
        const label = teleformOptions[labelIndex];
        
        html += `
          <div class="answer-option">
            <span class="answer-label">${label})</span>&nbsp;&nbsp;
            <span class="answer-content">${safeHtmlContent(answer.contentFormatted || '')}</span>
            ${answer.correct ? '<span style="color:green;"> ✓</span>' : ''}
          </div>
        `;
      }
    });
    
    html += '</br></div>'; // Close question-answers
  }

  html += '</div>'; // Close exam-question
  
  // Add page break indicator if needed
  if (question.pageBreakAfter) {
    html += `
      <div style="border-bottom: 1px dashed #999; margin: 20px 0; position: relative;">
        <span style="position: absolute; right: 0; top: -10px; background: white; color: #999; font-size: 12px; padding: 0 5px;">
          Page Break
        </span>
      </div>
    `;
  }
  
  return html;
}

/**
 * Safely process HTML content to preserve code blocks and prevent unwanted HTML parsing
 * @param {string} html - HTML content from contentFormatted
 * @returns {string} Safely processed HTML
 */
function safeHtmlContent(html) {
  if (!html) return '';
  
  // Process <code> blocks specially to display HTML tags properly
  return html.replace(/<code>([\s\S]*?)<\/code>/g, function(match, codeContent) {
    // Escape HTML tags inside code blocks to display them as text
    const escapedContent = codeContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    return `<code style="font-family: monospace; padding: 1px 3px;">${escapedContent}</code>`;
  });
} 