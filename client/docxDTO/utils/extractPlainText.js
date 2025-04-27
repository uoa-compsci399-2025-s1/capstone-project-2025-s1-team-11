export const extractPlainText = (runs, relationships = {}) => {
  if (!Array.isArray(runs)) return '';

  let result = '';

  for (const r of runs) {
    if (!r) continue;

    // Check for subscript or superscript formatting
    let isSubscript = false;
    let isSuperscript = false;

    if (r['w:rPr'] && r['w:rPr']['w:vertAlign']) {
      const vertAlign = r['w:rPr']['w:vertAlign'];
      // Try different ways to access the value attribute based on XML parser
      const val = vertAlign['@_w:val'] ||
          (vertAlign['$'] && vertAlign['$']['w:val']) ||
          vertAlign['w:val'];

      if (val === 'subscript') {
        isSubscript = true;
        console.log('Found subscript formatting');
      } else if (val === 'superscript') {
        isSuperscript = true;
        console.log('Found superscript formatting');
      }
    }

    // Handle line breaks
    if (r['w:br'] !== undefined) {
      result += '<br>';
    }

    // Handle images
    if (r['w:drawing']) {
      const blip = r['w:drawing']?.['wp:inline']?.['a:graphic']?.['a:graphicData']?.['pic:pic']?.['pic:blipFill']?.['a:blip'];
      const embedId = blip?.['@_r:embed'];
      const imagePath = relationships[embedId];
      if (imagePath) {
        const filename = imagePath.split('/').pop();
        const publicPath = `/assets/images/${filename}`;
        console.log(`📸 Found image: ${publicPath}`);
        result += `<img src='${publicPath}' alt=''>`;
      } else {
        console.warn(`⚠️ Warning: No relationship found for image embed ID: ${embedId}`);
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
      if (isSubscript) {
        textContent = `<sub>${textContent}</sub>`;
      } else if (isSuperscript) {
        textContent = `<sup>${textContent}</sup>`;
      }
      result += textContent;
    }
  }

  // Post-process text for special notation patterns

  // Handle subscript notation with tilde ~xx~
  result = result.replace(/(\w+)~(\d+)~/g, '$1<sub>$2</sub>');

  // Handle superscript notation with caret ^xx^
  result = result.replace(/(\w+)\^(\d+)\^/g, '$1<sup>$2</sup>');

  // Handle hex numbers (common pattern in CS questions)
  // This handles when a number has subscript immediately after without special notation
  result = result.replace(/(\b[A-F0-9]+)(\d{1,2})\.(?=\s|<br>|$)/g, '$1<sub>$2</sub>.');

  return result.trim();
};
