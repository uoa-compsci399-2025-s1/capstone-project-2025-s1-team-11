export const extractPlainText = (runs, options = {}) => {
  if (!Array.isArray(runs)) return '';

  const { imageData = {}, drawingInstances = [], paragraphIndex = 0 } = options;

  let result = '';
  let lastRunEndedWithSpace = false;
  let lastRunWasLineBreak = false; // Track if the last run was a line break
  let lastRunWasSingleChar = false; // Track if the last run was a single character

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
      lastRunWasLineBreak = true; // Set the flag

      // Check if this run also has text (uncommon but possible)
      if (r['w:t'] === undefined) {
        continue; // Only skip if there's no text in this run
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

      lastRunWasLineBreak = false; // Reset the flag
      lastRunWasSingleChar = false; // Reset single char flag
      continue;
    }

    // Extract text content - IMPROVED to handle more cases
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
      // Only try fallback if t wasn't found or is null/undefined
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

    // Apply formatting
    if (isSubscript) textContent = `<sub>${textContent}</sub>`;
    else if (isSuperscript) textContent = `<sup>${textContent}</sup>`;
    if (isBold) textContent = `<strong>${textContent}</strong>`;
    if (isItalic) textContent = `<em>${textContent}</em>`;
    if (isUnderline) textContent = `<u>${textContent}</u>`;
    if (isMonospace) textContent = `<code>${textContent}</code>`;

    result += textContent;

    lastRunEndedWithSpace = textContent.endsWith(' ');
    lastRunWasLineBreak = false; // Reset the flag for non-linebreak runs
    lastRunWasSingleChar = currentIsSingleWordChar; // Track if this run was a single character
  }

  // Post-cleaning - Enhanced to handle more notation formats
  result = result.replace(/(\w+)~(\d+)~/g, '$1<sub>$2</sub>');
  result = result.replace(/(\w+)\^(\d+)\^/g, '$1<sup>$2</sup>');
  result = result.replace(/(\b[A-F0-9]+)(\d{1,2})\.(?=\s|<br>|$)/g, '$1<sub>$2</sub>.');

  // Keep subscripts and superscripts together with their base text
  result = result.replace(/(\w+)\s+<(sub|sup)>(\w+)<\/(sub|sup)>/g, '$1<$2>$3</$4>');

  return result.trim();
};