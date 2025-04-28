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

    // Handle equations (OMML)
    if (r['m:oMath'] || r['m:oMathPara']) {
      const equationXml = extractEquationXml(r);
      if (equationXml) {
        // Wrap the equation XML in MathML tags that will be rendered with MathJax
        result += `<span class="math-equation">${equationXml}</span>`;
        lastRunEndedWithSpace = false;
        continue;
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

// Helper function to extract equation XML from OMML format
const extractEquationXml = (run) => {
  try {
    // Try to find the equation in either oMath or oMathPara
    const math = run['m:oMath'] || (run['m:oMathPara'] && run['m:oMathPara']['m:oMath']);

    if (!math) return null;

    // Basic conversion from OMML to MathML-like syntax
    // This is simplified and would need a more complete implementation
    let mathML = convertOmmlToMathML(math);

    return mathML ? `<math>${mathML}</math>` : '';
  } catch (error) {
    console.error('Error extracting equation:', error);
    return '';
  }
};

// Helper function to convert OMML to MathML
// This is a simplified conversion and would need to be expanded for complex equations
const convertOmmlToMathML = (omml) => {
  try {
    // Basic structure detection
    let mathML = '';

    // Handle fractions
    if (omml['m:f']) {
      const num = processOmmlElement(omml['m:f']['m:num']);
      const den = processOmmlElement(omml['m:f']['m:den']);
      mathML = `<mfrac><mrow>${num}</mrow><mrow>${den}</mrow></mfrac>`;
    }
    // Handle radical expressions (square roots, etc.)
    else if (omml['m:rad']) {
      const deg = omml['m:rad']['m:degHide'] ? '2' : processOmmlElement(omml['m:rad']['m:deg']);
      const radicand = processOmmlElement(omml['m:rad']['m:e']);

      if (deg === '2') {
        mathML = `<msqrt>${radicand}</msqrt>`;
      } else {
        mathML = `<mroot><mrow>${radicand}</mrow><mn>${deg}</mn></mroot>`;
      }
    }
    // Handle basic text and runs
    else if (omml['m:r']) {
      mathML = processOmmlElement(omml['m:r']);
    }
    // Handle equations with multiple parts
    else if (omml['m:e']) {
      mathML = processOmmlElement(omml['m:e']);
    }

    return mathML || processOmmlStructure(omml);
  } catch (error) {
    console.error('Error converting OMML to MathML:', error);
    return '';
  }
};

// Process specific OMML elements
const processOmmlElement = (element) => {
  if (!element) return '';

  if (typeof element === 'string') return element;

  // Handle text content
  if (element['m:t']) {
    return `<mtext>${element['m:t']}</mtext>`;
  }

  // More complex structures like matrices, scripts would need additional handling
  return processOmmlStructure(element);
};

// Fallback processor for more complex OMML structures
const processOmmlStructure = (structure) => {
  // For more complex equations, you'd need to implement a complete OMML to MathML converter
  // This is just a placeholder
  return '<mtext>[equation]</mtext>';
};
