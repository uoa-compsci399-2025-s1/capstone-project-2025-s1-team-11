export function sanitizeContentFormatted(html) {
    if (!html || typeof html !== 'string') return html;

    let sanitized = html;

    sanitized = fixSubpoints(sanitized);
    sanitized = replaceMathPlaceholders(sanitized);
    sanitized = replaceCodeBlocks(sanitized);
    sanitized = normalizeWhitespace(sanitized);

    return sanitized;
}

// Convert lines like "= 60" into "ii. 60" if preceded by an "i." line
function fixSubpoints(html) {
    const lines = html.split(/<br\s*\/?>|\n/);
    const subpoints = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii'];
    let subpointIndex = 0;
    const fixedLines = [];

    for (let line of lines) {
        const trimmed = line.trim();

        // Detect "i. something" to reset
        if (/^i\.\s*/i.test(trimmed)) {
            subpointIndex = 1;
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

// Replace math placeholders like {{math_0}} with a tag or fallback
function replaceMathPlaceholders(html) {
    return html.replace(/{{math_\d+}}/g, '<span class="math-placeholder">[math]</span>');
}

// Replace §CODE§...§/CODE§ with <pre><code>...</code></pre>
function replaceCodeBlocks(html) {
    return html.replace(/§CODE§(.*?)§\/CODE§/gs, (_, code) => {
        const escaped = escapeHtml(code);
        return `<pre><code>${escaped}</code></pre>`;
    });
}

// Optional: trim extra spaces
function normalizeWhitespace(html) {
    return html.replace(/\s{2,}/g, ' ');
}

// Escape HTML to prevent broken tags in <code>
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
