// src/utilities/textUtils.js

/**
 * Converts HTML content to plain text
 * @param {string} html HTML content to convert
 * @returns {string} Plain text
 */
export const htmlToText = (html) => {
  if (!html) return '';

  // First, simplify math placeholders for display
  let processedHtml = html.replace(/\[math:[^\]]+\]/g, '[math]');

  // Create a temporary DOM element
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = processedHtml;

  // Preserve line breaks and list items with proper formatting
  const preserveFormatting = (node) => {
    if (!node) return '';

    // If it's a text node, just return its content
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    let result = '';

    // Handle specific elements for better formatting
    if (node.nodeName === 'BR') {
      return '\n';
    } else if (node.nodeName === 'P' || node.nodeName === 'DIV') {
      // Add a double newline after paragraphs or divs
      result = Array.from(node.childNodes)
          .map(child => preserveFormatting(child))
          .join('');

      // Don't add extra newlines for empty paragraphs
      if (result.trim()) {
        result += '\n\n';
      }
    } else if (node.nodeName.match(/^H[1-6]$/)) {
      // Format headings
      result = Array.from(node.childNodes)
          .map(child => preserveFormatting(child))
          .join('');
      result += '\n\n';
    } else if (node.nodeName === 'LI') {
      // Format list items with a bullet or number
      result = '• ' + Array.from(node.childNodes)
          .map(child => preserveFormatting(child))
          .join('');
      result += '\n';
    } else if (node.nodeName === 'UL' || node.nodeName === 'OL') {
      // Process lists
      result = Array.from(node.childNodes)
          .map(child => preserveFormatting(child))
          .join('');
      // Add an extra newline after the list
      result += '\n';
    } else if (node.nodeName === 'IMG') {
      // Replace images with [Image] placeholder
      result = '[Image]';
    } else {
      // For other elements, just process their children
      result = Array.from(node.childNodes)
          .map(child => preserveFormatting(child))
          .join('');
    }

    return result;
  };

  // Get text content with preserved formatting
  const text = preserveFormatting(tempDiv);

  // Clean up excessive newlines
  return text
      .replace(/\n\n\n+/g, '\n\n') // Replace 3+ consecutive newlines with 2
      .trim();
};

export const normaliseVersionId = (str) => {
  return str.replace(/^0+/, '') || '0';
};