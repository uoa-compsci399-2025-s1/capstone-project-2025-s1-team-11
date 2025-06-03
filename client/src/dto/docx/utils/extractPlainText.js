export const extractPlainText = (runs, options = {}) => {
  if (!Array.isArray(runs)) return '';

  const { imageData = {}, drawingInstances = [], paragraphIndex = 0 } = options;

  let result = '';
  let lastRunEndedWithSpace = false;
  let lastRunWasLineBreak = false;
  let lastRunWasSingleChar = false;

  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    if (!r) continue;

    // Check for text formatting
    let isBold = false;
    let isItalic = false;
    let isUnderline = false;
    let isSubscript = false;
    let isSuperscript = false;
    let isMonospace = false;

    if (r['w:rPr']) {
      if (r['w:rPr']['w:b'] !== undefined) isBold = true;
      if (r['w:rPr']['w:i'] !== undefined) isItalic = true;
      if (r['w:rPr']['w:u'] !== undefined) isUnderline = true;

      if (r['w:rPr']['w:vertAlign']) {
        const vertAlign = r['w:rPr']['w:vertAlign'];
        const val = vertAlign['@_w:val'] || vertAlign['w:val'] || vertAlign?.['$']?.['w:val'];
        if (val === 'subscript') isSubscript = true;
        else if (val === 'superscript') isSuperscript = true;
      }

      if (r['w:rPr']['w:rFonts']) {
        const fontInfo = r['w:rPr']['w:rFonts'];
        const fontAscii = fontInfo['@_w:ascii'] || fontInfo?.['$']?.['w:ascii'];
        const fontHAnsi = fontInfo['@_w:hAnsi'] || fontInfo?.['$']?.['w:hAnsi'];
        const monospaceFonts = ['consolas', 'courier', 'courier new', 'lucida console', 'monaco', 'monospace', 'fixedsys', 'terminal'];
        const asciiLower = fontAscii?.toLowerCase() || '';
        const hAnsiLower = fontHAnsi?.toLowerCase() || '';
        if (monospaceFonts.some(f => asciiLower.includes(f) || hAnsiLower.includes(f))) {
          isMonospace = true;
        }
      }
    }

    // Handle line breaks - but check if there's also text in this run
    if (r['w:br'] !== undefined) {
      result += '<br>';
      lastRunEndedWithSpace = false;
      lastRunWasLineBreak = true;

      // Check if this run also has text (uncommon but possible)
      if (r['w:t'] === undefined) {
        continue;
      }
      // If there is text, fall through to process it
    }

    // Handle images
    if (r['w:drawing']) {
      // Extract the image embed ID from the drawing element
      const inline = r['w:drawing']['wp:inline'];
      const anchor = r['w:drawing']['wp:anchor'];

      let embedId = null;

      // Check inline images
      if (inline) {
        const blip = inline?.['a:graphic']?.['a:graphicData']?.['pic:pic']?.['pic:blipFill']?.['a:blip'];
        embedId = blip?.['@_r:embed'];
      }

      // Check floating images
      if (!embedId && anchor) {
        const blip = anchor?.['a:graphic']?.['a:graphicData']?.['pic:pic']?.['pic:blipFill']?.['a:blip'];
        embedId = blip?.['@_r:embed'];
      }

      // If we found an embed ID and have image data, use the actual image
      if (embedId && imageData[embedId]) {
        // NEW: Find the correct dimensions by matching position
        let imgData = imageData[embedId]; // Default fallback
        
        // Look for specific instance dimensions based on position
        const matchingInstance = drawingInstances.find(instance => 
          instance.embedId === embedId && 
          instance.paragraphIndex === paragraphIndex && 
          instance.runIndex === i
        );
        
        if (matchingInstance) {
          // Use the instance-specific dimensions
          imgData = {
            ...imgData,
            width: matchingInstance.width,
            height: matchingInstance.height
          };
        }
        
        const width = imgData.width ? ` width="${Math.round(imgData.width)}"` : '';
        const height = imgData.height ? ` height="${Math.round(imgData.height)}"` : '';
        const alt = imgData.filename || 'Image';
        result += `<img alt="${alt}" src="${imgData.dataUrl}"${width}${height}>`;
      } else {
        // Fallback to placeholder if we can't find the image data
        const alt = "Image";
        result += `<img alt="${alt}" src="[Image Placeholder]">`;
      }

      lastRunWasLineBreak = false;
      lastRunWasSingleChar = false;
      continue;
    }

    // Extract text content - IMPROVED to handle more cases INCLUDING SPECIAL CHARACTERS
    let textContent = '';
    const t = r['w:t'];

    if (typeof t === 'string') {
      textContent = t;
    } else if (typeof t === 'number') {
      // Handle numeric content
      textContent = String(t);
    } else if (typeof t === 'object' && t) {
      if (t['#text']) {
        textContent = t['#text'];
      } else if (Object.keys(t).length === 0) {
        textContent = ''; // Empty object - treat as empty text
      } else {
        textContent = ''; // Avoid undefined text
      }
    } else {
      // Check for special character elements when w:t is missing
      if (r['w:sym']) {
        // Symbol character
        const symChar = r['w:sym']['@_w:char'];

        if (symChar) {
          // Convert hex code to character if needed
          if (symChar.startsWith('F0')) {
            // Common symbol font mappings for arrows
            const symbolMap = {
              'F0E0': '←', // Left arrow in some symbol fonts
              'F0E1': '→', // Right arrow in some symbol fonts
              'F0E2': '↑', // Up arrow in some symbol fonts
              'F0E3': '↓', // Down arrow in some symbol fonts
            };
            textContent = symbolMap[symChar] || symChar;
          } else {
            // Try to parse as Unicode hex
            const charCode = parseInt(symChar, 16);
            if (!isNaN(charCode)) {
              textContent = String.fromCharCode(charCode);
            }
          }
        }
      } else if (r['w:cr']) {
        // Carriage return
        textContent = '\n';
      } else if (r['w:tab']) {
        // Tab character
        textContent = '\t';
      } else {
        // Only try fallback if no special elements found
        try {
          // More careful fallback approach
          const fallbackKeys = Object.keys(r).filter(k => typeof r[k] === 'string' && k.startsWith('w:'));
          if (fallbackKeys.length > 0) {
            textContent = fallbackKeys.map(k => r[k].trim()).filter(s => s).join(' ');
          } else {
            // If all else fails, skip this run
            continue;
          }
        } catch {
          continue;
        }
      }
    }

    // Skip empty text content
    if (textContent === undefined || textContent === null) {
      continue;
    }

    // Handle spacing - Modified to account for line breaks and split words
    const punctuationStart = /^[.,:;!?)]/.test(textContent);
    const currentIsSingleWordChar = textContent.length === 1 && /\w/.test(textContent);

    if (!lastRunWasLineBreak && !lastRunEndedWithSpace && result.length > 0 &&
        !result.endsWith(' ') && !result.endsWith('<br>') &&
        !textContent.startsWith(' ') && !punctuationStart) {

      // Check if we might be dealing with a split word
      const lastChar = result[result.length - 1];
      const isLastCharWordChar = /\w/.test(lastChar);
      const isFirstCharWordChar = /^\w/.test(textContent);

      // If the last run was a single word character and this run starts with a word character,
      // this is likely a split word
      if (!(lastRunWasSingleChar && isLastCharWordChar && isFirstCharWordChar)) {
        result += ' ';
      }
    }

    // Handle font-specific character mappings BEFORE applying formatting
    if (isMonospace && textContent) {
      // Fira Mono and other monospace fonts often use en dash (–) for left arrows
      // Map common monospace font characters to their intended symbols
      textContent = textContent
          .replace(/–/g, '←')  // En dash to left arrow (common in Fira Mono)
          .replace(/—/g, '→'); // Em dash to right arrow (if used)
    }

    // Apply formatting
    if (isSubscript) textContent = `<sub>${textContent}</sub>`;
    else if (isSuperscript) textContent = `<sup>${textContent}</sup>`;
    if (isBold) textContent = `<strong>${textContent}</strong>`;
    if (isItalic) textContent = `<em>${textContent}</em>`;
    if (isUnderline) textContent = `<u>${textContent}</u>`;
    if (isMonospace) textContent = `<code>${textContent}</code>`;

    result += textContent;

    lastRunEndedWithSpace = textContent.endsWith(' ');
    lastRunWasLineBreak = false;
    lastRunWasSingleChar = currentIsSingleWordChar;
  }

  // Post-cleaning - Only handle explicit notation patterns
  result = result.replace(/(\w+)~(\d+)~/g, '$1<sub>$2</sub>');
  result = result.replace(/(\w+)\^(\d+)\^/g, '$1<sup>$2</sup>');

  // Keep subscripts and superscripts together with their base text
  result = result.replace(/(\w+)\s+<(sub|sup)>(\w+)<\/(sub|sup)>/g, '$1<$2>$3</$4>');

  return result.trim();
};