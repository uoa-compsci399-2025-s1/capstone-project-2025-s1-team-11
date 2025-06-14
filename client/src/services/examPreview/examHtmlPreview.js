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
    <div class="exam-preview" style="font-family: 'Times New Roman', Times, serif; padding: 40px; max-width: 800px; margin-left: 0; background-color: #fff;">
      <div class="exam-body" style="display: flex; flex-direction: column; gap: 32px;">
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
    <section class="exam-section" style="display: flex; flex-direction: column;">
      ${section.contentFormatted ? 
        `<div class="section-content" style="font-size: 32x; line-height: 1.6; padding-bottom: 32px;">${safeHtmlContent(section.contentFormatted)}</div>
         <div style="border-bottom: 1px solid #eee;"></div>` : ''}
      <div class="section-questions" style="display: flex; flex-direction: column; gap: 32px; margin-top: ${section.contentFormatted ? '32px' : '0'};">
  `;

  // Process questions in this section
  if (section.questions && section.questions.length > 0) {
    section.questions.forEach((question) => {
      html += processQuestionToHtml(question, teleformOptions);
    });
  }

  html += `
      </div>
    </section>
    <div style="border-bottom: 1px solid #eee;"></div>
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
    <article class="exam-question" style="display: flex; flex-direction: column; gap: 12px;">
      <div class="question-header" style="font-size: 20px; font-weight: 600;">
        Question ${question.questionNumber || ''}${question.marks ? ` <span style="color: #888; font-size: 16px;">[${question.marks} mark${question.marks !== 1 ? 's' : ''}]</span>` : ''}
      </div>
      <div class="question-text" style="font-size: 16px; line-height: 1.6; color: #333; padding-bottom: 16px;">${safeHtmlContent(question.contentFormatted || '')}</div>
  `;

  // Process answers with version-specific shuffling
  if (question.answers && question.answers.length > 0) {
    html += '<div class="question-answers" style="display: flex; flex-direction: column; gap: 8px; padding-left: 24px;">';

    // Now render the answers in their original order
    question.answers.forEach((answer, index) => {
      if (answer) {
        // Use teleformOptions for answer labels
        const labelIndex = index < teleformOptions.length ? index : index % teleformOptions.length;
        const label = teleformOptions[labelIndex];
        
        html += `
          <div class="answer-option" style="display: flex; gap: 8px; align-items: flex-start; font-size: 15px;">
            <strong style="white-space: nowrap;">${label})</strong>
            <span style="${answer.correct ? 'color: green;' : ''}">${safeHtmlContent(answer.contentFormatted || '')}</span>
          </div>
        `;
      }
    });
    
    html += '</div>'; // Close question-answers
  }

  html += '</article>'; // Close exam-question

  // Subtle divider after each question
  html += `
    <div style="border-bottom: 1px solid #eee;"></div>
  `;

  // Add page break indicator if needed
  if (question.pageBreakAfter) {
    html += `
      <div style="border-bottom: 1px dashed #ccc; margin: 40px 0; position: relative;">
        <span style="position: absolute; right: 0; top: -12px; background: #fff; color: #999; font-size: 12px; padding: 0 6px;">
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

  html = html.trim();

  // Convert to display math ($$...$$)
  html = html.replace(/43554(.*?)43554/g, (_, inner) => `$$${inner}$$`);

  // Remove empty <p> and <div> tags
  html = html.replace(/<(p|div)>\s*<\/\1>/g, '');

  // Strip only empty <strong> tags, preserve non-empty ones
  html = html.replace(/<strong>\s*<\/strong>/g, '');

  // Escape <code> blocks
  return html.replace(/<code>([\s\S]*?)<\/code>/g, function(match, codeContent) {
    const escapedContent = codeContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    return `<code style="font-family: monospace; padding: 1px 3px;">${escapedContent}</code>`;
  });
}