// client/docxDTO/utils/ommlToMathML.js

// WIP, this likely needs to be integrated with a rendering library on the frontend

/**
 * Converts Office Math Markup Language (OMML) to MathML
 * @param {Object} ommlElement - The OMML element from Word document XML
 * @returns {String} MathML representation
 */
export const convertOmmlToMathML = (ommlElement) => {
    if (!ommlElement) return '';

    // Main math wrapper
    let result = '<math xmlns="http://www.w3.org/1998/Math/MathML">';

    // Process the OMML structure recursively
    result += processOmmlStructure(ommlElement);

    result += '</math>';
    return result;
};

/**
 * Process an OMML structure and convert to MathML
 */
const processOmmlStructure = (element) => {
    if (!element) return '';

    // Handle different types of math elements
    if (element['m:oMathPara']) {
        return processMathPara(element['m:oMathPara']);
    } else if (element['m:oMath']) {
        return processMath(element['m:oMath']);
    } else if (Array.isArray(element)) {
        return element.map(processOmmlStructure).join('');
    } else if (typeof element === 'object') {
        // Process specific OMML elements
        if (element['m:f']) return processFraction(element['m:f']);
        if (element['m:rad']) return processRadical(element['m:rad']);
        if (element['m:sSup']) return processSuperscript(element['m:sSup']);
        if (element['m:sSub']) return processSubscript(element['m:sSub']);
        if (element['m:sSubSup']) return processSubSuperscript(element['m:sSubSup']);
        if (element['m:d']) return processDelimiter(element['m:d']);
        if (element['m:e']) return processElement(element['m:e']);
        if (element['m:r']) return processRun(element['m:r']);
        if (element['m:t']) return `<mtext>${element['m:t']}</mtext>`;

        // If no specific handler found, try to process children
        return Object.values(element).map(child => {
            if (Array.isArray(child)) {
                return child.map(processOmmlStructure).join('');
            } else if (typeof child === 'object') {
                return processOmmlStructure(child);
            }
            return '';
        }).join('');
    }

    return '';
};

// Process math paragraph
const processMathPara = (mathPara) => {
    if (mathPara['m:oMath']) {
        return processMath(mathPara['m:oMath']);
    }
    return '';
};

// Process math element
const processMath = (math) => {
    if (Array.isArray(math)) {
        return `<mrow>${math.map(processOmmlStructure).join('')}</mrow>`;
    }
    return `<mrow>${processOmmlStructure(math)}</mrow>`;
};

// Process fraction
const processFraction = (fraction) => {
    const num = processElement(fraction['m:num']);
    const den = processElement(fraction['m:den']);
    return `<mfrac>${num}${den}</mfrac>`;
};

// Process radical (square root, nth root)
const processRadical = (radical) => {
    const radicand = processElement(radical['m:e']);

    if (radical['m:degHide']) {
        // Square root
        return `<msqrt>${radicand}</msqrt>`;
    } else {
        // nth root
        const degree = processElement(radical['m:deg']);
        return `<mroot>${radicand}${degree}</mroot>`;
    }
};

// Process superscript
const processSuperscript = (superscript) => {
    const base = processElement(superscript['m:e']);
    const sup = processElement(superscript['m:sup']);
    return `<msup>${base}${sup}</msup>`;
};

// Process subscript
const processSubscript = (subscript) => {
    const base = processElement(subscript['m:e']);
    const sub = processElement(subscript['m:sub']);
    return `<msub>${base}${sub}</msub>`;
};

// Process combined subscript and superscript
const processSubSuperscript = (subSup) => {
    const base = processElement(subSup['m:e']);
    const sub = processElement(subSup['m:sub']);
    const sup = processElement(subSup['m:sup']);
    return `<msubsup>${base}${sub}${sup}</msubsup>`;
};

// Process delimiters (parentheses, brackets, etc.)
const processDelimiter = (delimiter) => {
    const content = processElement(delimiter['m:e']);

    // Get opening and closing delimiter characters
    let opening = '(';
    let closing = ')';

    if (delimiter['m:begChr']) {
        opening = delimiter['m:begChr'];
    }

    if (delimiter['m:endChr']) {
        closing = delimiter['m:endChr'];
    }

    return `<mrow><mo>${opening}</mo>${content}<mo>${closing}</mo></mrow>`;
};

// Process a generic element
const processElement = (element) => {
    if (!element) return '';

    if (Array.isArray(element)) {
        return `<mrow>${element.map(processOmmlStructure).join('')}</mrow>`;
    }

    return processOmmlStructure(element);
};

// Process text run
const processRun = (run) => {
    if (run['m:t']) {
        // Handle different types of content based on text and properties
        const text = run['m:t'];
        const rPr = run['m:rPr'];

        // Check if this is an operator
        if (/^[+\-*/=<>()[\]{}]$/.test(text)) {
            return `<mo>${text}</mo>`;
        }

        // Check if this is a number
        if (/^\d+(\.\d+)?$/.test(text)) {
            return `<mn>${text}</mn>`;
        }

        // Handle italic (generally for variables)
        if (rPr && rPr['m:sty'] && rPr['m:sty']['@_m:val'] === 'i') {
            return `<mi>${text}</mi>`;
        }

        // Default to text
        return `<mtext>${text}</mtext>`;
    }

    return '';
};
