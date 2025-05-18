// client/docxDTO/utils/sanitizeContentFormatted.js

export function sanitizeContentFormatted(html) {
    if (!html || typeof html !== 'string') return html;

    let sanitized = html;

    sanitized = preserveLatexMath(sanitized);
    sanitized = fixSubpoints(sanitized);
    sanitized = replaceCodeBlocks(sanitized);
    // sanitized = normalizeWhitespace(sanitized);

    return sanitized;
}

// Preserve LaTeX math expressions (wrapped in $ or $$)
function preserveLatexMath(html) {
    // First, temporarily protect any LaTeX expressions from other processing
    const mathExpressions = [];

    // Replace display math ($$...$$) with placeholders
    html = html.replace(/\$\$(.*?)\$\$/gs, (match, p1) => {
        const placeholder = `__MATH_DISPLAY_${mathExpressions.length}__`;
        mathExpressions.push({ type: 'display', content: p1 });
        return placeholder;
    });

    // Replace inline math ($...$) with placeholders
    html = html.replace(/\$(.*?)\$/g, (match, p1) => {
        const placeholder = `__MATH_INLINE_${mathExpressions.length}__`;
        mathExpressions.push({ type: 'inline', content: p1 });
        return placeholder;
    });

    // Let other processing happen here

    // After other processing is done, restore the LaTeX expressions
    mathExpressions.forEach((expr, index) => {
        if (expr.type === 'display') {
            html = html.replace(`__MATH_DISPLAY_${index}__`, `$$${expr.content}$$`);
        } else {
            html = html.replace(`__MATH_INLINE_${index}__`, `$${expr.content}$`);
        }
    });

    return html;
}

// Convert lines like "= 60" into "ii. 60" if preceded by an "i." line
function fixSubpoints(html) {
    const lines = html.split(/<br\s*\/?>|\n/);
    const subpoints = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii'];
    let subpointIndex = 0;
    const fixedLines = [];

    for (let line of lines) {
        const trimmed = line.trim();

        // Skip if this is a math placeholder line
        if (trimmed.includes('__MATH_') || /\$.*\$/.test(trimmed)) {
            fixedLines.push(trimmed);
            continue;
        }

        // Detect existing roman numeral labels
        if (/^(i{1,3}|iv|v|vi{0,3})\.\s*/i.test(trimmed)) {
            // Find which subpoint this is
            const match = trimmed.match(/^(i{1,3}|iv|v|vi{0,3})\.\s*/i);
            const label = match[1].toLowerCase();
            subpointIndex = subpoints.indexOf(label) + 1;
            fixedLines.push(trimmed);
            continue;
        }

        // If the line starts with just "= text" or possibly nothing but looks like a continuation
        if (/^=|^\d+|^[A-Za-z0-9 \-().]+$/.test(trimmed) && subpointIndex > 0) {
            const label = subpoints[subpointIndex] || `${subpointIndex + 1}.`;
            const content = trimmed.replace(/^=\s*/, '').trim();
            fixedLines.push(`${label}. ${content}`);
            subpointIndex++;
            continue;
        }

        // Fall back to just include line
        fixedLines.push(trimmed);
    }

    return fixedLines.join('<br>');
}

// Replace §CODE§...§/CODE§ with <pre><code>...</code></pre>
function replaceCodeBlocks(html) {
    return html.replace(/§CODE§(.*?)§\/CODE§/gs, (_, code) => {
        const escaped = escapeHtml(code);
        return `<pre><code>${escaped}</code></pre>`;
    });
}

// Optional: trim extra spaces while preserving math
// function normalizeWhitespace(html) {
//     // Replace multiple spaces with a single space, but be careful with math expressions
//     const parts = [];
//     let lastIndex = 0;
//     let inMath = false;
//
//     // Find all math expressions and split the string around them
//     const regex = /(\$\$.*?\$\$|\$.*?\$)/gs;
//     let match;
//
//     while (match = regex.exec(html)) {
//         // Get the text before this math expression and normalize its whitespace
//         const beforeMath = html.substring(lastIndex, match.index).replace(/\s{2,}/g, ' ');
//         parts.push(beforeMath);
//
//         // Add the math expression unchanged
//         parts.push(match[0]);
//
//         lastIndex = match.index + match[0].length;
//     }
//
//     // Add any remaining text after the last math expression
//     if (lastIndex < html.length) {
//         parts.push(html.substring(lastIndex).replace(/\s{2,}/g, ' '));
//     }
//
//     return parts.join('');
// }

// Escape HTML to prevent broken tags in <code>
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}