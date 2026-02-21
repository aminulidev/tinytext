import type { PluginDefinition, PluginContext } from '../core/types';
import { markdownToHtml, htmlToMarkdown } from '../utils/markdown';

/**
 * MarkdownPlugin — toggle Markdown mode.
 * When enabled the editor parses pasted/input markdown into HTML.
 */
export const MarkdownPlugin: PluginDefinition = {
    name: 'markdown',
    version: '1.0.0',

    init(ctx: PluginContext): void {
        const editable = ctx.editor.getEditableArea();

        editable.addEventListener('keyup', (e: KeyboardEvent) => {
            // Convert markdown shortcuts on Enter key
            if (e.key !== 'Enter') return;

            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;

            const range = sel.getRangeAt(0);
            let block: Node | null = range.startContainer;
            if (block.nodeType === Node.TEXT_NODE) block = block.parentElement;

            const blockEl = block as HTMLElement;
            const text = blockEl.textContent ?? '';

            // Heading shortcuts: ## text
            const headingMatch = text.match(/^(#{1,6})\s+(.+)/);
            if (headingMatch) {
                const level = headingMatch[1].length;
                const content = headingMatch[2];
                const heading = document.createElement(`h${level}`);
                heading.textContent = content;
                blockEl.replaceWith(heading);
                // Move caret to end of heading
                const newRange = document.createRange();
                newRange.setStart(heading, heading.childNodes.length);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
                return;
            }

            // blockquote: > text
            if (text.startsWith('> ')) {
                const bq = document.createElement('blockquote');
                bq.textContent = text.slice(2);
                blockEl.replaceWith(bq);
                return;
            }

            // Code block: ``` 
            if (text.startsWith('```')) {
                const pre = document.createElement('pre');
                const code = document.createElement('code');
                code.textContent = text.slice(3);
                pre.appendChild(code);
                blockEl.replaceWith(pre);
                return;
            }

            // Horizontal rule: ---
            if (/^-{3,}$/.test(text.trim())) {
                blockEl.replaceWith(document.createElement('hr'));
                return;
            }
        });

        // Toolbar buttons for Markdown export
        ctx.toolbar.addButton('md-export', {
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
            label: 'Export as Markdown',
            action: () => {
                const md = htmlToMarkdown(ctx.editor.getHTML());
                const blob = new Blob([md], { type: 'text/markdown' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'document.md';
                a.click();
            },
            isEnabled: () => true,
        });

        ctx.toolbar.addButton('md-import', {
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="12" x2="12" y2="18"/><polyline points="9 15 12 12 15 15"/></svg>`,
            label: 'Import Markdown',
            action: () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.md,.txt';
                input.addEventListener('change', () => {
                    const file = input.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const md = e.target?.result as string;
                        ctx.editor.setHTML(markdownToHtml(md));
                    };
                    reader.readAsText(file);
                });
                input.click();
            },
            isEnabled: () => true,
        });
    },

    destroy(): void {
        // cleanup handled by editor destroy
    },
};
