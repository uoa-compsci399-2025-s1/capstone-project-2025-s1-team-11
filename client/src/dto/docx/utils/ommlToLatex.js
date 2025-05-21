// client/docxDTO/utils/ommlToLatex.js

/**
 * Converts Office Math Markup Language (OMML) to LaTeX
 * @param {Object} ommlElement - The OMML element from Word document XML
 * @returns {String} LaTeX representation
 */
export const convertOmmlToLatex = (ommlElement) => {
    if (!ommlElement) return '';

    //console.log('Converting OMML to LaTeX. Element keys:', Object.keys(ommlElement));

    try {
        // First try recursive extraction with formatting
        const formattedText = extractFormattedTextFromOMML(ommlElement);
        if (formattedText) {
            //console.log('Extracted formatted text:', formattedText);
            return formattedText;
        }

        // Fallback to simple extraction
        const textContent = extractTextFromOMML(ommlElement);
        if (textContent) {
            //console.log('Extracted simple text:', textContent);
            return textContent;
        }

        // Last resort - check for any direct text
        if (ommlElement['m:t']) {
            return ommlElement['m:t'];
        }

        // As a final fallback, return a placeholder
        return "\\text{math}";
    } catch (error) {
        console.error('Error in convertOmmlToLatex:', error);
        return "\\text{math}";
    }
};

/**
 * Extracts text from OMML with formatting preserved
 * @param {Object} element - OMML element
 * @returns {String} - Extracted text with formatting
 */
const extractFormattedTextFromOMML = (element) => {
    if (!element) return '';

    // Handle special notation
    if (element['m:r']) {
        // Process run elements which can contain text and formatting
        if (Array.isArray(element['m:r'])) {
            const texts = element['m:r'].map(run => {
                const text = run['m:t'] || '';
                const props = run['m:rPr'] || {};

                // Apply formatting based on properties
                return formatRunText(text, props);
            }).filter(Boolean);

            return texts.join(' ');
        } else if (element['m:r']['m:t']) {
            const text = element['m:r']['m:t'];
            const props = element['m:r']['m:rPr'] || {};
            return formatRunText(text, props);
        }
    }

    // Handle underbar notation (used for NOT operation in Boolean algebra)
    if (element['m:bar']) {
        const base = extractFormattedTextFromOMML(element['m:e']);
        return `\\overline{${base}}`;
    }

    // Handle dot operation (AND in Boolean algebra)
    if (element['m:acc'] && element['m:acc']['m:accPr'] &&
        element['m:acc']['m:accPr']['m:chr'] &&
        element['m:acc']['m:accPr']['m:chr']['@_m:val'] === '·') {
        return '\\bullet';
    }

    // Generic object handling with recursion
    if (typeof element === 'object') {
        let result = '';

        // Process known structures
        if (element['m:e']) {
            return extractFormattedTextFromOMML(element['m:e']);
        }

        // Process all properties recursively
        for (const key in element) {
            if (Object.prototype.hasOwnProperty.call(element, key)) {
                // Skip properties that aren't relevant for text content
                if (key.startsWith('@_') || key === '$') continue;

                const extracted = extractFormattedTextFromOMML(element[key]);
                if (extracted) {
                    if (result && !result.endsWith(' ') && !extracted.startsWith(' ')) {
                        result += ' ';
                    }
                    result += extracted;
                }
            }
        }
        return result;
    }

    // If it's a string, return it directly
    if (typeof element === 'string') return element;

    return '';
};

/**
 * Format text with appropriate LaTeX notation based on properties
 * @param {String} text - The text content
 * @param {Object} props - The run properties
 * @returns {String} - Formatted text
 */
const formatRunText = (text, props) => {
    if (!text) return '';

    let formatted = text;

    // Custom mappings for common symbols
    const symbolMap = {
        '·': '\\bullet',  // Dot operator (AND)
        '+': '+',         // Plus operator (OR)
        '¯': '\\overline{}'  // Overbar (NOT)
    };

    // Check if this is a symbol and map it
    if (text.length === 1 && symbolMap[text]) {
        return symbolMap[text];
    }

    // Apply special formats based on properties
    if (props) {
        // Handle underlines (for NOT operation in Boolean algebra)
        if (props['m:uni'] && props['m:uni']['@_m:val'] === '1') {
            formatted = `\\overline{${formatted}}`;
        }
    }

    return formatted;
};

/**
 * Simple function to extract text content from OMML
 * @param {Object} element - OMML element
 * @returns {String} - Extracted text
 */
const extractTextFromOMML = (element) => {
    if (!element) return '';

    // If it's directly a string
    if (typeof element === 'string') return element;

    // If it has text property
    if (element['m:t']) return element['m:t'];

    // If it's an array, process each element
    if (Array.isArray(element)) {
        return element.map(extractTextFromOMML).join(' ');
    }

    // If it's an object, look for text in all properties
    if (typeof element === 'object') {
        let result = '';

        // Find text in runs first
        if (element['m:r']) {
            if (Array.isArray(element['m:r'])) {
                result = element['m:r']
                    .map(r => r['m:t'] || '')
                    .filter(Boolean)
                    .join(' ');
                if (result) return result;
            } else if (element['m:r']['m:t']) {
                return element['m:r']['m:t'];
            }
        }

        // Recursively extract from all properties
        for (const key in element) {
            if (Object.prototype.hasOwnProperty.call(element, key)) {
                const extracted = extractTextFromOMML(element[key]);
                if (extracted) {
                    result += (result ? ' ' : '') + extracted;
                }
            }
        }
        return result;
    }

    return '';
};
/**
 * Process an OMML structure and convert to LaTeX
 */
const processOmmlStructure = (element) => {
    if (!element) return '';

    // Handle different types of math elements
    if (element['m:oMathPara']) {
        //console.log('Found m:oMathPara');
        return processMathPara(element['m:oMathPara']);
    } else if (element['m:oMath']) {
        //console.log('Found m:oMath');
        return processMath(element['m:oMath']);
    } else if (Array.isArray(element)) {
        //console.log('Found array element with length:', element.length);
        return element.map(processOmmlStructure).join('');
    } else if (typeof element === 'object') {
        //console.log('Processing object element with keys:', Object.keys(element));

        // Process specific OMML elements
        if (element['m:f']) {
            //console.log('Found fraction');
            return processFraction(element['m:f']);
        }
        if (element['m:rad']) {
            //console.log('Found radical');
            return processRadical(element['m:rad']);
        }
        if (element['m:sSup']) {
            //console.log('Found superscript');
            return processSuperscript(element['m:sSup']);
        }
        if (element['m:sSub']) {
            //console.log('Found subscript');
            return processSubscript(element['m:sSub']);
        }
        if (element['m:sSubSup']) {
            //console.log('Found subsuperscript');
            return processSubSuperscript(element['m:sSubSup']);
        }
        if (element['m:d']) {
            //console.log('Found delimiter');
            return processDelimiter(element['m:d']);
        }
        if (element['m:e']) {
            //console.log('Found element m:e');
            return processElement(element['m:e']);
        }
        if (element['m:r']) {
            //console.log('Found run');
            return processRun(element['m:r']);
        }
        if (element['m:t']) {
            //console.log('Found text:', element['m:t']);
            return element['m:t'] || '';
        }
        if (element['m:acc']) {
            //console.log('Found accent');
            return processAccent(element['m:acc']);
        }
        if (element['m:eqArr']) {
            //console.log('Found equation array');
            return processEquationArray(element['m:eqArr']);
        }
        if (element['m:func']) {
            //console.log('Found function');
            return processFunction(element['m:func']);
        }
        if (element['m:limLow']) {
            //console.log('Found lower limit');
            return processLowerLimit(element['m:limLow']);
        }
        if (element['m:limUpp']) {
            //console.log('Found upper limit');
            return processUpperLimit(element['m:limUpp']);
        }
        if (element['m:m']) {
            //console.log('Found matrix');
            return processMatrix(element['m:m']);
        }
        if (element['m:nary']) {
            //console.log('Found nary operator');
            return processNary(element['m:nary']);
        }
        if (element['m:groupChr']) {
            //console.log('Found group char');
            return processGroupChar(element['m:groupChr']);
        }

        // If no specific handler found, try to process children
        //console.log('No specific handler, processing children');
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
        return `\\begin{equation*}${processMath(mathPara['m:oMath'])}\\end{equation*}`;
    }
    return '';
};

// Process math element
const processMath = (math) => {
    if (Array.isArray(math)) {
        return math.map(processOmmlStructure).join('');
    }
    return processOmmlStructure(math);
};

// Process fraction
const processFraction = (fraction) => {
    const num = processElement(fraction['m:num']);
    const den = processElement(fraction['m:den']);
    return `\\frac{${num}}{${den}}`;
};

// Process radical (square root, nth root)
const processRadical = (radical) => {
    const radicand = processElement(radical['m:e']);

    if (radical['m:degHide']) {
        // Square root
        return `\\sqrt{${radicand}}`;
    } else {
        // nth root
        const degree = processElement(radical['m:deg']);
        return `\\sqrt[${degree}]{${radicand}}`;
    }
};

// Process superscript
const processSuperscript = (superscript) => {
    const base = processElement(superscript['m:e']);
    const sup = processElement(superscript['m:sup']);

    // If base is a single character, we don't need brackets
    if (base.length === 1 || base.startsWith('\\') || base.match(/^[a-zA-Z0-9]$/)) {
        return `${base}^{${sup}}`;
    }

    return `{${base}}^{${sup}}`;
};

// Process subscript
const processSubscript = (subscript) => {
    const base = processElement(subscript['m:e']);
    const sub = processElement(subscript['m:sub']);

    // If base is a single character, we don't need brackets
    if (base.length === 1 || base.startsWith('\\') || base.match(/^[a-zA-Z0-9]$/)) {
        return `${base}_{${sub}}`;
    }

    return `{${base}}_{${sub}}`;
};

// Process combined subscript and superscript
const processSubSuperscript = (subSup) => {
    const base = processElement(subSup['m:e']);
    const sub = processElement(subSup['m:sub']);
    const sup = processElement(subSup['m:sup']);

    // If base is a single character, we don't need brackets
    if (base.length === 1 || base.startsWith('\\') || base.match(/^[a-zA-Z0-9]$/)) {
        return `${base}_{${sub}}^{${sup}}`;
    }

    return `{${base}}_{${sub}}^{${sup}}`;
};

// Process delimiters (parentheses, brackets, etc.)
const processDelimiter = (delimiter) => {
    const content = processElement(delimiter['m:e']);

    // Get opening and closing delimiter characters
    let opening = '(';
    let closing = ')';

    if (delimiter['m:begChr']) {
        opening = mapDelimiter(delimiter['m:begChr']);
    }

    if (delimiter['m:endChr']) {
        closing = mapDelimiter(delimiter['m:endChr']);
    }

    // For proper LaTeX delimiter sizing
    return `\\left${opening}${content}\\right${closing}`;
};

// Map delimiter characters to LaTeX
const mapDelimiter = (char) => {
    const delimiterMap = {
        '(': '(',
        ')': ')',
        '[': '[',
        ']': ']',
        '{': '\\{',
        '}': '\\}',
        '|': '|',
        '‖': '\\|',
        '⟨': '\\langle',
        '⟩': '\\rangle',
        '⌊': '\\lfloor',
        '⌋': '\\rfloor',
        '⌈': '\\lceil',
        '⌉': '\\rceil'
    };

    return delimiterMap[char] || char;
};

// Process a generic element
const processElement = (element) => {
    if (!element) return '';

    if (Array.isArray(element)) {
        return element.map(processOmmlStructure).join('');
    }

    return processOmmlStructure(element);
};

// Process text run
const processRun = (run) => {
    if (run['m:t']) {
        // Handle different types of content based on text and properties
        const text = run['m:t'];
        const rPr = run['m:rPr'];

        // Convert common math symbols
        const convertedText = convertMathSymbols(text);

        // Handle italic (generally for variables)
        if (rPr && rPr['m:sty'] && rPr['m:sty']['@_m:val'] === 'i') {
            // Already italicized in LaTeX math mode
            return convertedText;
        }

        // Default
        return convertedText;
    }

    return '';
};

// Convert common math symbols to LaTeX equivalents
const convertMathSymbols = (text) => {
    if (!text) return '';

    // Replace common symbols with LaTeX commands
    const replacements = {
        '×': '\\times',
        '÷': '\\div',
        '±': '\\pm',
        '∓': '\\mp',
        '∞': '\\infty',
        '≠': '\\neq',
        '≤': '\\leq',
        '≥': '\\geq',
        '≈': '\\approx',
        '∼': '\\sim',
        '∝': '\\propto',
        '≡': '\\equiv',
        '→': '\\rightarrow',
        '←': '\\leftarrow',
        '↔': '\\leftrightarrow',
        '⇒': '\\Rightarrow',
        '⇐': '\\Leftarrow',
        '⇔': '\\Leftrightarrow',
        '∈': '\\in',
        '∉': '\\notin',
        '⊂': '\\subset',
        '⊆': '\\subseteq',
        '⊃': '\\supset',
        '⊇': '\\supseteq',
        '∪': '\\cup',
        '∩': '\\cap',
        '∅': '\\emptyset',
        '∀': '\\forall',
        '∃': '\\exists',
        '¬': '\\neg',
        '∧': '\\wedge',
        '∨': '\\vee',
        'π': '\\pi',
        'θ': '\\theta',
        'α': '\\alpha',
        'β': '\\beta',
        'γ': '\\gamma',
        'δ': '\\delta',
        'ε': '\\varepsilon',
        'ζ': '\\zeta',
        'η': '\\eta',
        'λ': '\\lambda',
        'μ': '\\mu',
        'ρ': '\\rho',
        'σ': '\\sigma',
        'τ': '\\tau',
        'φ': '\\phi',
        'χ': '\\chi',
        'ψ': '\\psi',
        'ω': '\\omega',
        '∂': '\\partial',
        '∇': '\\nabla',
        '∫': '\\int',
        '∑': '\\sum',
        '∏': '\\prod'
    };

    let result = text;
    for (const [symbol, latex] of Object.entries(replacements)) {
        result = result.replace(new RegExp(symbol, 'g'), latex);
    }

    return result;
};

// Process accent (e.g., hat, bar, etc.)
const processAccent = (accent) => {
    const accentValue = accent['m:accPr']?.['m:chr']?.['@_m:val'] || '';
    const element = processElement(accent['m:e']);

    const accentMap = {
        '^': '\\hat',
        '¯': '\\bar',
        '˜': '\\tilde',
        '→': '\\vec',
        '̇': '\\dot',
        '̈': '\\ddot',
        '…': '\\ldots'
    };

    const accentCommand = accentMap[accentValue] || '\\accent';
    return `${accentCommand}{${element}}`;
};

// Process equation array (aligned equations)
const processEquationArray = (eqArr) => {
    let rows = eqArr['m:e'] || [];
    if (!Array.isArray(rows)) rows = [rows];

    const processedRows = rows.map(row => processElement(row));
    return `\\begin{align*}${processedRows.join(' \\\\ ')}\\end{align*}`;
};

// Process function (like sin, cos, etc.)
const processFunction = (func) => {
    const funcName = processElement(func['m:fName']);
    const argument = processElement(func['m:e']);

    // Check if it's a standard function name
    const stdFunctions = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot',
        'arcsin', 'arccos', 'arctan',
        'sinh', 'cosh', 'tanh',
        'log', 'ln'];

    const funcNameClean = funcName.replace(/[^a-zA-Z]/g, '');

    if (stdFunctions.includes(funcNameClean.toLowerCase())) {
        return `\\${funcNameClean.toLowerCase()}${argument}`;
    }

    return `\\mathrm{${funcName}}\\left(${argument}\\right)`;
};

// Process lower limit (like in sum or integral)
const processLowerLimit = (limLow) => {
    const base = processElement(limLow['m:e']);
    const limit = processElement(limLow['m:lim']);

    return `${base}_{${limit}}`;
};

// Process upper limit
const processUpperLimit = (limUpp) => {
    const base = processElement(limUpp['m:e']);
    const limit = processElement(limUpp['m:lim']);

    return `${base}^{${limit}}`;
};

// Process matrix
const processMatrix = (matrix) => {
    let rows = matrix['m:mr'] || [];
    if (!Array.isArray(rows)) rows = [rows];

    const processedRows = rows.map(row => {
        let cells = row['m:e'] || [];
        if (!Array.isArray(cells)) cells = [cells];

        return cells.map(cell => processElement(cell)).join(' & ');
    });

    return `\\begin{pmatrix}${processedRows.join(' \\\\ ')}\\end{pmatrix}`;
};

// Process n-ary operator (sum, integral, etc.)
const processNary = (nary) => {
    const operator = nary['m:naryPr']?.['m:chr']?.['@_m:val'] || '∑';
    const sub = nary['m:sub'] ? processElement(nary['m:sub']) : '';
    const sup = nary['m:sup'] ? processElement(nary['m:sup']) : '';
    const element = processElement(nary['m:e']);

    const operatorMap = {
        '∑': '\\sum',
        '∏': '\\prod',
        '∐': '\\coprod',
        '∫': '\\int',
        '∬': '\\iint',
        '∭': '\\iiint',
        '∮': '\\oint',
        '⋂': '\\bigcap',
        '⋃': '\\bigcup',
        '⋁': '\\bigvee',
        '⋀': '\\bigwedge'
    };

    const latexOperator = operatorMap[operator] || '\\sum';

    if (sub && sup) {
        return `${latexOperator}_{${sub}}^{${sup}} ${element}`;
    } else if (sub) {
        return `${latexOperator}_{${sub}} ${element}`;
    } else if (sup) {
        return `${latexOperator}^{${sup}} ${element}`;
    }

    return `${latexOperator} ${element}`;
};

// Process group character (like overbrace, underbrace, etc.)
const processGroupChar = (groupChr) => {
    const chr = groupChr['m:groupChrPr']?.['m:chr']?.['@_m:val'] || '';
    const position = groupChr['m:groupChrPr']?.['m:pos']?.['@_m:val'] || 'top';
    const element = processElement(groupChr['m:e']);

    if (chr === '⏞' || chr === '⏟') {
        if (position === 'top' || position === 'bot') {
            const command = position === 'top' ? '\\overbrace' : '\\underbrace';
            return `${command}{${element}}`;
        }
    }

    // Default handling
    if (position === 'top') {
        return `\\overset{${chr}}{${element}}`;
    } else {
        return `\\underset{${chr}}{${element}}`;
    }
};
