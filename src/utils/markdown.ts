/**
 * Markdown ↔ HTML converter utility.
 * Converts a subset of Markdown to HTML for the editor,
 * and HTML back to Markdown for export.
 */

// ── Markdown → HTML ──────────────────────────────────────────────

const MD_RULES: Array<[RegExp, string | ((...args: string[]) => string)]> = [
    // Headings
    [/^#{6}\s+(.+)$/gm, '<h6>$1</h6>'],
    [/^#{5}\s+(.+)$/gm, '<h5>$1</h5>'],
    [/^#{4}\s+(.+)$/gm, '<h4>$1</h4>'],
    [/^#{3}\s+(.+)$/gm, '<h3>$1</h3>'],
    [/^#{2}\s+(.+)$/gm, '<h2>$1</h2>'],
    [/^#{1}\s+(.+)$/gm, '<h1>$1</h1>'],

    // Horizontal rule
    [/^(-{3,}|\*{3,}|_{3,})$/gm, '<hr>'],

    // Blockquote
    [/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>'],

    // Code block (fenced)
    [/```(\w*)\n([\s\S]*?)```/g, (_m: string, _lang: string, code: string) =>
        `<pre><code>${escapeHtml(code.trim())}</code></pre>`],

    // Inline code
    [/`([^`]+)`/g, '<code>$1</code>'],

    // Bold + italic
    [/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>'],
    [/___(.+?)___/g, '<strong><em>$1</em></strong>'],

    // Bold
    [/\*\*(.+?)\*\*/g, '<strong>$1</strong>'],
    [/__(.+?)__/g, '<strong>$1</strong>'],

    // Italic
    [/\*(.+?)\*/g, '<em>$1</em>'],
    [/_(.+?)_/g, '<em>$1</em>'],

    // Strikethrough
    [/~~(.+?)~~/g, '<s>$1</s>'],

    // Images before links
    [/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">'],

    // Links
    [/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>'],

    // Unordered list
    [/(^[-*+]\s.+\n?)+/gm, (match: string) => {
        const items = match.trim().split('\n')
            .map((l: string) => `<li>${l.replace(/^[-*+]\s/, '')}</li>`)
            .join('');
        return `<ul>${items}</ul>`;
    }],

    // Ordered list
    [/(^\d+\.\s.+\n?)+/gm, (match: string) => {
        const items = match.trim().split('\n')
            .map((l: string) => `<li>${l.replace(/^\d+\.\s/, '')}</li>`)
            .join('');
        return `<ol>${items}</ol>`;
    }],

    // Paragraphs (double newlines)
    [/\n\n(.+?)\n\n/gs, '\n\n<p>$1</p>\n\n'],

    // Line breaks
    [/  \n/g, '<br>'],
];

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function markdownToHtml(md: string): string {
    let result = md;
    for (const [pattern, replacement] of MD_RULES) {
        if (typeof replacement === 'function') {
            result = result.replace(pattern, replacement as (...args: string[]) => string);
        } else {
            result = result.replace(pattern, replacement);
        }
    }
    return result.trim();
}

// ── HTML → Markdown ──────────────────────────────────────────────

export function htmlToMarkdown(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return nodeToMarkdown(div).trim();
}

function nodeToMarkdown(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent ?? '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const inner = Array.from(el.childNodes).map(nodeToMarkdown).join('');

    switch (tag) {
        case 'h1': return `# ${inner}\n\n`;
        case 'h2': return `## ${inner}\n\n`;
        case 'h3': return `### ${inner}\n\n`;
        case 'h4': return `#### ${inner}\n\n`;
        case 'h5': return `##### ${inner}\n\n`;
        case 'h6': return `###### ${inner}\n\n`;
        case 'p': return `${inner}\n\n`;
        case 'br': return '\n';
        case 'hr': return '---\n\n';
        case 'strong':
        case 'b': return `**${inner}**`;
        case 'em':
        case 'i': return `*${inner}*`;
        case 'u': return `__${inner}__`;
        case 's':
        case 'strike':
        case 'del': return `~~${inner}~~`;
        case 'code': return el.parentElement?.tagName.toLowerCase() === 'pre'
            ? inner
            : `\`${inner}\``;
        case 'pre': {
            const code = el.querySelector('code');
            const content = code ? (code.textContent ?? '') : inner;
            return `\`\`\`\n${content}\n\`\`\`\n\n`;
        }
        case 'blockquote': return inner.split('\n').map(l => `> ${l}`).join('\n') + '\n\n';
        case 'ul': {
            const items = Array.from(el.querySelectorAll(':scope > li'))
                .map(li => `- ${(li as HTMLElement).innerText.trim()}`)
                .join('\n');
            return `${items}\n\n`;
        }
        case 'ol': {
            const items = Array.from(el.querySelectorAll(':scope > li'))
                .map((li, i) => `${i + 1}. ${(li as HTMLElement).innerText.trim()}`)
                .join('\n');
            return `${items}\n\n`;
        }
        case 'li': return inner;
        case 'a': return `[${inner}](${el.getAttribute('href') ?? ''})`;
        case 'img': return `![${el.getAttribute('alt') ?? ''}](${el.getAttribute('src') ?? ''})`;
        case 'div':
        case 'section':
        case 'article': return `${inner}\n`;
        default: return inner;
    }
}
