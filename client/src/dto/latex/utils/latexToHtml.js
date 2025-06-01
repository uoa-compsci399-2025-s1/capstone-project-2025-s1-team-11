/**
 * Convert LaTeX content to HTML format
 * @param {string} latex - LaTeX content to convert
 * @returns {string} - HTML representation of the LaTeX content
 */
export function latexToHtml(latex) {
  if (!latex) return '';
  
  // Process the LaTeX content in stages
  let html = latex;
  
  // Clean input: normalize spaces and line breaks
  html = html.replace(/\\\\(?!\n)/g, '<br>'); // Replace double backslashes with line breaks
  html = html.replace(/\s+/g, ' '); // Normalize spaces
  
  // Remove commented lines in LaTeX (lines starting with %)
  html = html.replace(/^%.*$|([^\\])%.*$/gm, '$1'); // Keep escaped % but remove comment lines
  
  // Handle LaTeX commands for spacing 
  html = html.replace(/\\,/g, '&thinsp;');
  html = html.replace(/\\;/g, '&emsp;');
  html = html.replace(/\\:/g, '&ensp;');
  html = html.replace(/~\\;/g, '&nbsp;');
  html = html.replace(/\\\\/g, '<br>');
  
  // Handle special LaTeX characters
  html = html.replace(/\\textbackslash/g, '\\');
  html = html.replace(/\\&/g, '&amp;');
  html = html.replace(/\\#/g, '#');
  html = html.replace(/\\_/g, '_');
  // Handle escaped dollar signs (currency): replace \\$ with a literal dollar sign
  html = html.replace(/\\\$/g, '$');
  // Handle escaped percent signs (for percentages): replace \\% with %
  html = html.replace(/\\%/g, '%');
  
  // Remove LaTeX label commands
  html = html.replace(/\\label\{[^}]*\}/g, '');
  html = html.replace(/\\ref\{[^}]*\}/g, '');
  
  // Process display styles in math
  html = html.replace(/\\displaystyle\s+/g, '');
  
  // Replace LaTeX math with MathML or similar (using $ delimiters for math)
  html = replaceMathExpressions(html);
  
  // Handle environments: begin/end pairs
  html = replaceEnvironments(html);
  
  // Handle formatting commands
  html = replaceFormatting(html);
  
  // Handle special symbols
  html = replaceSpecialSymbols(html);
  
  // Cleanup: remove remaining % signs that might be part of LaTeX comments
  html = html.replace(/\s*%[^\n]*(\n|$)/g, '');
  
  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<p>')) {
    html = `<p>${html}</p>`;
  }
  
  return html;
}

/**
 * Replace math expressions with suitable HTML representation
 * @param {string} text - Text containing LaTeX math
 * @returns {string} - Text with math expressions replaced
 */
function replaceMathExpressions(text) {
  // First, let's protect any $ inside math environments to prevent double processing
  let result = text;
  
  // Remove any LaTeX comments within math expressions
  result = result.replace(/(\$.*?)%[^\n$]*?(\$)/g, '$1$2');
  
  // Handle display math ($$...$$)
  result = result.replace(/\$\$(.*?)\$\$/gs, (match, formula) => {
    // Check if this is a display math block (multiple lines or contains display math commands)
    const isDisplayMath = formula.includes('\n') || 
                         formula.includes('\\begin{align}') || 
                         formula.includes('\\begin{equation}') ||
                         formula.includes('\\sum') ||
                         formula.includes('\\int') ||
                         formula.includes('\\prod');
    
    if (isDisplayMath) {
      return `<div class="math-display">$$${cleanMathFormula(formula)}$$</div>`;
    } else {
      return `<span class="math-inline">$$${cleanMathFormula(formula)}$$</span>`;
    }
  });
  
  // Handle inline math ($...$)
  result = result.replace(/\$([^$]+?)\$/g, (match, formula) => {
    return `<span class="math-inline">$$${cleanMathFormula(formula)}$$</span>`;
  });
  
  // Handle specific problems with fractions in math
  result = result.replace(/\\dfrac/g, '\\frac');
  
  // Handle specific display style commands
  result = result.replace(/\\displaystyle/g, '');
  
  // Ensure proper log rendering for bases
  result = result.replace(/\\log_([0-9]+)/g, '\\log_{$1}');
  
  // Replace \[ \] display math
  result = result.replace(/\\\[(.*?)\\\]/g, (match, formula) => {
    return `<div class="math-display">$$${cleanMathFormula(formula)}$$</div>`;
  });
  
  // Replace \( \) inline math
  result = result.replace(/\\\((.*?)\\\)/g, (match, formula) => {
    return `<span class="math-inline">$$${cleanMathFormula(formula)}$$</span>`;
  });
  
  // Process math-related commands like \frac, \sqrt, etc.
  result = processMathCommands(result);
  
  return result;
}

/**
 * Clean up a math formula for better rendering
 * @param {string} formula - The math formula to clean
 * @returns {string} - The cleaned formula
 */
function cleanMathFormula(formula) {
  // Basic cleanup for math formulas
  let cleaned = formula.trim();
  
  // Remove LaTeX comments within math
  cleaned = cleaned.replace(/%[^\n]*(\n|$)/g, '');
  
  // Handle escaped percent signs in math
  cleaned = cleaned.replace(/\\%/g, '%');
  
  // Remove unnecessary spaces in math
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Fix common issues with math notation
  // Fix \log_2 notation to ensure proper rendering
  cleaned = cleaned.replace(/\\log_([0-9]+)/g, '\\log_{$1}');
  
  // Fix \dfrac to use \frac for better rendering
  cleaned = cleaned.replace(/\\dfrac/g, '\\frac');
  
  // Remove \displaystyle that might interfere with rendering
  cleaned = cleaned.replace(/\\displaystyle/g, '');
  
  return cleaned;
}

/**
 * Process math commands that might appear outside of math delimiters
 * @param {string} text - Text containing LaTeX math commands
 * @returns {string} - Text with processed math commands
 */
function processMathCommands(text) {
  // Handle common math commands
  let result = text;
  
  // Process common LaTeX math commands
  const mathCommands = [
    { pattern: /\\frac\{([^{}]*)\}\{([^{}]*)\}/g, replacement: '$1/$2' },
    { pattern: /\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, replacement: '$1/$2' },
    { pattern: /\\sqrt\{([^{}]*)\}/g, replacement: '√($1)' },
    // Handle logarithms with bases correctly
    { pattern: /\\log_([0-9]+)\(([^)]*)\)/g, replacement: 'log_$1($2)' },
    { pattern: /\\log_([0-9]+)([^(])/g, replacement: 'log_$1$2' },
    { pattern: /\\log_\{([^}]*)\}/g, replacement: 'log_$1' },
    { pattern: /\\log/g, replacement: 'log' },
    // Double-struck letters for number sets
    { pattern: /\\mathbb\{R\}/g, replacement: 'ℝ' }, // Double-struck R for reals
    { pattern: /\\mathbb\{N\}/g, replacement: 'ℕ' }, // Double-struck N for naturals
    { pattern: /\\mathbb\{Z\}/g, replacement: 'ℤ' }, // Double-struck Z for integers
    { pattern: /\\mathbb\{Q\}/g, replacement: 'ℚ' }, // Double-struck Q for rationals
    { pattern: /\\mathbb\{C\}/g, replacement: 'ℂ' }, // Double-struck C for complex
    { pattern: /\\mathbb\{([A-Z])\}/g, replacement: '𝔻' }, // Other double-struck letters
    // Infinity and operators
    { pattern: /\\infty/g, replacement: '∞' },
    { pattern: /\\in/g, replacement: '∈' },
    { pattern: /\\subset/g, replacement: '⊂' },
    { pattern: /\\subseteq/g, replacement: '⊆' },
    { pattern: /\\to/g, replacement: '→' },
    { pattern: /\\rightarrow/g, replacement: '→' },
    { pattern: /\\leftarrow/g, replacement: '←' },
    { pattern: /\\Rightarrow/g, replacement: '⇒' },
    { pattern: /\\Leftarrow/g, replacement: '⇐' },
    { pattern: /\\leq/g, replacement: '≤' },
    { pattern: /\\geq/g, replacement: '≥' },
    { pattern: /\\neq/g, replacement: '≠' },
    { pattern: /\\approx/g, replacement: '≈' },
    // Ellipses and other symbols
    { pattern: /\\dots/g, replacement: '…' },
    { pattern: /\\ldots/g, replacement: '…' },
    { pattern: /\\cdots/g, replacement: '⋯' },
    { pattern: /\\partial/g, replacement: '∂' },
    { pattern: /\\forall/g, replacement: '∀' },
    { pattern: /\\exists/g, replacement: '∃' },
    // Function notation
    { pattern: /\\lim/g, replacement: 'lim' },
    { pattern: /\\sum/g, replacement: '∑' },
    { pattern: /\\prod/g, replacement: '∏' },
    { pattern: /\\int/g, replacement: '∫' },
    // Operations
    { pattern: /\\times/g, replacement: '×' },
    { pattern: /\\cdot/g, replacement: '·' },
    { pattern: /\\% /g, replacement: '% ' }, // Handle escaped percent signs
    // Handle LaTeX display style
    { pattern: /\\displaystyle/g, replacement: '' }
  ];
  
  // Apply each math command replacement
  mathCommands.forEach(cmd => {
    result = result.replace(cmd.pattern, cmd.replacement);
  });
  
  return result;
}

/**
 * Replace special symbols in LaTeX
 * @param {string} text - Text containing LaTeX symbols
 * @returns {string} - Text with symbols replaced
 */
function replaceSpecialSymbols(text) {
  const symbols = [
    { pattern: /\\alpha/g, replacement: 'α' },
    { pattern: /\\beta/g, replacement: 'β' },
    { pattern: /\\gamma/g, replacement: 'γ' },
    { pattern: /\\delta/g, replacement: 'δ' },
    { pattern: /\\epsilon/g, replacement: 'ε' },
    { pattern: /\\zeta/g, replacement: 'ζ' },
    { pattern: /\\eta/g, replacement: 'η' },
    { pattern: /\\theta/g, replacement: 'θ' },
    { pattern: /\\iota/g, replacement: 'ι' },
    { pattern: /\\kappa/g, replacement: 'κ' },
    { pattern: /\\lambda/g, replacement: 'λ' },
    { pattern: /\\mu/g, replacement: 'μ' },
    { pattern: /\\nu/g, replacement: 'ν' },
    { pattern: /\\xi/g, replacement: 'ξ' },
    { pattern: /\\pi/g, replacement: 'π' },
    { pattern: /\\rho/g, replacement: 'ρ' },
    { pattern: /\\sigma/g, replacement: 'σ' },
    { pattern: /\\tau/g, replacement: 'τ' },
    { pattern: /\\upsilon/g, replacement: 'υ' },
    { pattern: /\\phi/g, replacement: 'φ' },
    { pattern: /\\chi/g, replacement: 'χ' },
    { pattern: /\\psi/g, replacement: 'ψ' },
    { pattern: /\\omega/g, replacement: 'ω' },
    // Capitalized Greek letters
    { pattern: /\\Alpha/g, replacement: 'Α' },
    { pattern: /\\Beta/g, replacement: 'Β' },
    { pattern: /\\Gamma/g, replacement: 'Γ' },
    { pattern: /\\Delta/g, replacement: 'Δ' },
    { pattern: /\\Epsilon/g, replacement: 'Ε' },
    { pattern: /\\Zeta/g, replacement: 'Ζ' },
    { pattern: /\\Eta/g, replacement: 'Η' },
    { pattern: /\\Theta/g, replacement: 'Θ' },
    { pattern: /\\Iota/g, replacement: 'Ι' },
    { pattern: /\\Kappa/g, replacement: 'Κ' },
    { pattern: /\\Lambda/g, replacement: 'Λ' },
    { pattern: /\\Mu/g, replacement: 'Μ' },
    { pattern: /\\Nu/g, replacement: 'Ν' },
    { pattern: /\\Xi/g, replacement: 'Ξ' },
    { pattern: /\\Pi/g, replacement: 'Π' },
    { pattern: /\\Rho/g, replacement: 'Ρ' },
    { pattern: /\\Sigma/g, replacement: 'Σ' },
    { pattern: /\\Tau/g, replacement: 'Τ' },
    { pattern: /\\Upsilon/g, replacement: 'Υ' },
    { pattern: /\\Phi/g, replacement: 'Φ' },
    { pattern: /\\Chi/g, replacement: 'Χ' },
    { pattern: /\\Psi/g, replacement: 'Ψ' },
    { pattern: /\\Omega/g, replacement: 'Ω' }
  ];
  
  let result = text;
  symbols.forEach(symbol => {
    result = result.replace(symbol.pattern, symbol.replacement);
  });
  
  return result;
}

/**
 * Replace LaTeX environments with HTML equivalents
 * @param {string} text - Text containing LaTeX environments
 * @returns {string} - Text with environments replaced with HTML
 */
function replaceEnvironments(text) {
  // Handle choices environment
  let result = text.replace(/\\begin\{choices\}([\s\S]*?)\\end\{choices\}/g, 
    '<div class="choices">$1</div>');
  
  // Handle oneparchoices environment
  result = result.replace(/\\begin\{oneparchoices\}([\s\S]*?)\\end\{oneparchoices\}/g, 
    '<div class="choices oneparchoices">$1</div>');
  
  // Handle parts environment
  result = result.replace(/\\begin\{parts\}([\s\S]*?)\\end\{parts\}/g, 
    '<div class="parts">$1</div>');
  
  // Handle itemize environment
  result = result.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, 
    '<ul>$1</ul>');
  
  // Handle enumerate environment
  result = result.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, 
    '<ol>$1</ol>');
  
  // Handle center environment
  result = result.replace(/\\begin\{center\}([\s\S]*?)\\end\{center\}/g, 
    '<div style="text-align: center;">$1</div>');
  
  // Handle tabular environment (simple version)
  result = result.replace(/\\begin\{tabular\}(\{[^}]*\})([\s\S]*?)\\end\{tabular\}/g, 
    '<table class="latex-table">$2</table>');
  
  // Handle align environment
  result = result.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g,
    '<div class="math-align">$$$1$$</div>');
  
  // Handle solution environment - completely remove these from the HTML output
  result = result.replace(/\\begin\{solution\}([\s\S]*?)\\end\{solution\}/g, '');
  
  return result;
}

/**
 * Replace LaTeX formatting commands with HTML equivalents
 * @param {string} text - Text containing LaTeX formatting commands
 * @returns {string} - Text with commands replaced with HTML
 */
function replaceFormatting(text) {
  let result = text;
  
  // Handle text style commands
  result = result.replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>'); // Bold
  result = result.replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>'); // Italic
  result = result.replace(/\\underline\{([^}]*)\}/g, '<u>$1</u>'); // Underline
  result = result.replace(/\\emph\{([^}]*)\}/g, '<em>$1</em>'); // Emphasis
  result = result.replace(/\\texttt\{([^}]*)\}/g, '<code>$1</code>'); // Monospace
  result = result.replace(/\\textsc\{([^}]*)\}/g, '<span style="font-variant: small-caps;">$1</span>'); // Small caps
  
  // Handle list items
  result = result.replace(/\\item\s+/g, '<li>');
  
  // Handle fillin command
  result = result.replace(/\\fillin/g, '<span class="fillin">_____</span>');
  
  // Completely remove choice environments from the question content
  // This ensures they don't appear in both question text and as separate options
  const choicePatterns = [
    /\\begin\{choices\}[\s\S]*?\\end\{choices\}/g,
    /\\begin\{oneparchoices\}[\s\S]*?\\end\{oneparchoices\}/g
  ];
  
  choicePatterns.forEach(pattern => {
    result = result.replace(pattern, '');
  });
  
  // Handle custom LaTeX macros for explanations and marking criteria
  result = result.replace(/\\Exp\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, '');
  result = result.replace(/\\MC\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, '');
  
  // Handle choice and mycorrectchoice
  // These are cleaned up separately in the parser, but ensure they don't show up in HTML
  result = result.replace(/\\choice\s+[^\n\\]*/g, '');
  result = result.replace(/\\mycorrectchoice\{[^}]*\}/g, '');
  result = result.replace(/\\mycorrectchoice\s+[^\n\\]*/g, '');
  result = result.replace(/\\CorrectChoice\s+[^\n\\]*/g, '');
  
  // Handle section headings
  result = result.replace(/\\section\{([^}]*)\}/g, '<h2>$1</h2>');
  result = result.replace(/\\subsection\{([^}]*)\}/g, '<h3>$1</h3>');
  
  // Handle fontsize commands - remove them but preserve content
  result = result.replace(/\\fontsize\{[^}]*\}\{[^}]*\}/g, '');
  result = result.replace(/\\(tiny|scriptsize|footnotesize|small|normalsize|large|Large|LARGE|huge|Huge)/g, '');
  
  // Handle selectfont command - remove it
  result = result.replace(/\\selectfont/g, '');
  
  // Replace newlines with breaks
  result = result.replace(/\n\n/g, '</p><p>');
  
  // Clean up any remaining LaTeX commands
  result = result.replace(/\\\w+(\[.*?\])?(\{.*?\})?/g, '$2');
  
  // Clean any double empty paragraphs
  result = result.replace(/<p>\s*<\/p>/g, '');
  
  return result;
} 