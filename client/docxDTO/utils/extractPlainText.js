export const extractPlainText = (runs, relationships = {}) => {
  if (!Array.isArray(runs)) return '';

  let result = '';
  let lastRunEndedWithSpace = false;

  for (const r of runs) {
    if (!r) continue;

    // Check for text formatting
    let isBold = false;
    let isItalic = false;
    let isUnderline = false;
    let isSubscript = false;
    let isSuperscript = false;

    if (r['w:rPr']) {
      // Check for bold formatting
      if (r['w:rPr']['w:b'] !== undefined) {
        isBold = true;
      }

      // Check for italic formatting
      if (r['w:rPr']['w:i'] !== undefined) {
        isItalic = true;
      }

      // Check for underline formatting
      if (r['w:rPr']['w:u'] !== undefined) {
        isUnderline = true;
      }

      // Check for subscript or superscript formatting
      if (r['w:rPr']['w:vertAlign']) {
        const vertAlign = r['w:rPr']['w:vertAlign'];
        // Try different ways to access the value attribute based on XML parser
        const val = vertAlign['@_w:val'] ||
            (vertAlign['$'] && vertAlign['$']['w:val']) ||
            vertAlign['w:val'];

        if (val === 'subscript') {
          isSubscript = true;
        } else if (val === 'superscript') {
          isSuperscript = true;
        }
      }
    }

    // Handle line breaks
    if (r['w:br'] !== undefined) {
      result += '<br>';
      lastRunEndedWithSpace = false;
    }

    // Handle images
    if (r['w:drawing']) {
      const blip = r['w:drawing']?.['wp:inline']?.['a:graphic']?.['a:graphicData']?.['pic:pic']?.['pic:blipFill']?.['a:blip'];
      const embedId = blip?.['@_r:embed'];
      const imagePath = relationships[embedId];
      if (imagePath) {
        const filename = imagePath.split('/').pop();
        const publicPath = `/assets/images/${filename}`;
        result += `<img src='${publicPath}' alt=''>`;
        lastRunEndedWithSpace = false;
      }
    }

    // Extract text content
    let textContent = '';
    const t = r['w:t'];
    if (typeof t === 'string') {
      textContent = t;
    } else if (typeof t === 'object' && t['#text']) {
      textContent = t['#text'];
    }

    // Apply formatting based on XML properties
    if (textContent) {
      // Check if we need to add a space between runs
      const punctuationStart = /^[.,:;!?)]/.test(textContent);

      if (!lastRunEndedWithSpace && result.length > 0 && !result.endsWith(' ') &&
          !result.endsWith('<br>') && !result.endsWith('>') &&
          textContent.length > 0 && !textContent.startsWith(' ') && !punctuationStart) {
        result += ' ';
      }

      // Apply all formatting in the correct order (innermost to outermost)
      if (isSubscript) {
        textContent = `<sub>${textContent}</sub>`;
      } else if (isSuperscript) {
        textContent = `<sup>${textContent}</sup>`;
      }

      if (isBold) {
        textContent = `<strong>${textContent}</strong>`;
      }

      if (isItalic) {
        textContent = `<em>${textContent}</em>`;
      }

      if (isUnderline) {
        textContent = `<u>${textContent}</u>`;
      }

      result += textContent;
      lastRunEndedWithSpace = textContent.endsWith(' ');
    }
  }

  // Handle subscript notation with tilde ~xx~ (This is a WIP, not really there yet)
  result = result.replace(/(\w+)~(\d+)~/g, '$1<sub>$2</sub>');

  // Handle superscript notation with caret ^xx^ (This is a WIP, not really there yet)
  result = result.replace(/(\w+)\^(\d+)\^/g, '$1<sup>$2</sup>');

  // Handle hex numbers (probably need to drop this as it is basically hardcoding)
  // This handles when a number has subscript immediately after without special notation
  result = result.replace(/(\b[A-F0-9]+)(\d{1,2})\.(?=\s|<br>|$)/g, '$1<sub>$2</sub>.');

  return result.trim();
};