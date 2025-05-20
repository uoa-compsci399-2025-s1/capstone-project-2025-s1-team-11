/**
 * Convert LaTeX math to OMML (Office Math Markup Language)
 * This is a simplified conversion for common math expressions
 * @param {string} latex - LaTeX math expression
 * @param {boolean} isDisplay - Whether this is display math
 * @returns {string} OMML markup
 */
export function convertLatexToOmml(latex) {
    // Basic implementation - this would need to be expanded for complex equations
    let omml = '';

    // // Handle common LaTeX commands and symbols
    // const latinSymbols = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta',
    //                      'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron',
    //                      'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'];

    // Handle fractions
    if (latex.includes('\\frac')) {
        // Extract numerator and denominator
        const fracRegex = /\\frac\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
        latex = latex.replace(fracRegex, (match, num, denom) => {
            return `<m:f>
                      <m:fPr>
                        <m:type m:val="bar"/>
                      </m:fPr>
                      <m:num>
                        <m:r>
                          <m:t>${convertSimpleLatexToText(num)}</m:t>
                        </m:r>
                      </m:num>
                      <m:den>
                        <m:r>
                          <m:t>${convertSimpleLatexToText(denom)}</m:t>
                        </m:r>
                      </m:den>
                    </m:f>`;
        });
    }

    // Handle superscripts
    if (latex.includes('^')) {
        const supRegex = /([^_^{}]+|\{[^{}]*\})\^(\{[^{}]*\}|[^_^{}])/g;
        latex = latex.replace(supRegex, (match, base, sup) => {
            // Remove braces if present
            base = base.replace(/^\{|\}$/g, '');
            sup = sup.replace(/^\{|\}$/g, '');

            return `<m:sSup>
                      <m:e>
                        <m:r>
                          <m:t>${convertSimpleLatexToText(base)}</m:t>
                        </m:r>
                      </m:e>
                      <m:sup>
                        <m:r>
                          <m:t>${convertSimpleLatexToText(sup)}</m:t>
                        </m:r>
                      </m:sup>
                    </m:sSup>`;
        });
    }

    // Handle subscripts
    if (latex.includes('_')) {
        const subRegex = /([^_^{}]+|\{[^{}]*\})_(\{[^{}]*\}|[^_^{}])/g;
        latex = latex.replace(subRegex, (match, base, sub) => {
            // Remove braces if present
            base = base.replace(/^\{|\}$/g, '');
            sub = sub.replace(/^\{|\}$/g, '');

            return `<m:sSub>
                      <m:e>
                        <m:r>
                          <m:t>${convertSimpleLatexToText(base)}</m:t>
                        </m:r>
                      </m:e>
                      <m:sub>
                        <m:r>
                          <m:t>${convertSimpleLatexToText(sub)}</m:t>
                        </m:r>
                      </m:sub>
                    </m:sSub>`;
        });
    }

    // If no special formatting was applied, wrap in simple runs
    if (!latex.includes('<m:')) {
        omml = `<m:r><m:t>${convertSimpleLatexToText(latex)}</m:t></m:r>`;
    } else {
        omml = latex; // The conversion was already done by the replacements
    }

    return omml;
}

/**
 * Convert simple LaTeX text to plain text for OMML
 * @param {string} latex - Simple LaTeX text
 * @returns {string} Plain text with symbols converted
 */
function convertSimpleLatexToText(latex) {
    // Replace common LaTeX commands with their Unicode equivalents
    const replacements = {
        '\\alpha': 'α',
        '\\beta': 'β',
        '\\gamma': 'γ',
        '\\delta': 'δ',
        '\\epsilon': 'ε',
        '\\varepsilon': 'ε',
        '\\zeta': 'ζ',
        '\\eta': 'η',
        '\\theta': 'θ',
        '\\iota': 'ι',
        '\\kappa': 'κ',
        '\\lambda': 'λ',
        '\\mu': 'μ',
        '\\nu': 'ν',
        '\\xi': 'ξ',
        '\\pi': 'π',
        '\\rho': 'ρ',
        '\\sigma': 'σ',
        '\\tau': 'τ',
        '\\upsilon': 'υ',
        '\\phi': 'φ',
        '\\chi': 'χ',
        '\\psi': 'ψ',
        '\\omega': 'ω',
        '\\Gamma': 'Γ',
        '\\Delta': 'Δ',
        '\\Theta': 'Θ',
        '\\Lambda': 'Λ',
        '\\Xi': 'Ξ',
        '\\Pi': 'Π',
        '\\Sigma': 'Σ',
        '\\Phi': 'Φ',
        '\\Psi': 'Ψ',
        '\\Omega': 'Ω',
        '\\times': '×',
        '\\div': '÷',
        '\\pm': '±',
        '\\mp': '∓',
        '\\leq': '≤',
        '\\geq': '≥',
        '\\neq': '≠',
        '\\approx': '≈',
        '\\infty': '∞',
        '\\partial': '∂',
        '\\nabla': '∇',
        '\\sum': '∑',
        '\\prod': '∏',
        '\\int': '∫',
        '\\rightarrow': '→',
        '\\leftarrow': '←',
        '\\Rightarrow': '⇒',
        '\\Leftarrow': '⇐',
        '\\forall': '∀',
        '\\exists': '∃',
        '\\in': '∈',
        '\\subset': '⊂',
        '\\cup': '∪',
        '\\cap': '∩',
        '\\emptyset': '∅'
    };

    let result = latex;
    for (const [cmd, symbol] of Object.entries(replacements)) {
        result = result.replace(new RegExp(cmd.replace(/\\/g, '\\\\'), 'g'), symbol);
    }

    return result;
}