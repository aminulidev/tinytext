import type { PluginDefinition, PluginContext } from '../src/core/types';

/**
 * WordCountPlugin — Example custom plugin.
 * Adds a floating word count badge and a toolbar button
 * to show a word count popup.
 */
export const WordCountPlugin: PluginDefinition = {
    name: 'word-count',
    version: '1.0.0',

    init(ctx: PluginContext): void {
        // Register toolbar button
        ctx.toolbar.addButton('word-count-btn', {
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 6h16M4 10h8M4 14h12M4 18h6"/>
      </svg>`,
            label: 'Word Count',
            action: () => {
                const html = ctx.editor.getHTML();
                const text = ctx.editor.getText().trim();
                const words = text === '' ? 0 : text.split(/\s+/).length;
                const chars = text.replace(/\s/g, '').length;
                const charsWithSpaces = text.length;
                const paragraphs = html.split('</p>').length - 1;
                const readTime = Math.ceil(words / 200); // avg 200 wpm

                alert(
                    `📄 Document Statistics\n\n` +
                    `Words:             ${words.toLocaleString()}\n` +
                    `Characters:        ${chars.toLocaleString()}\n` +
                    `With spaces:       ${charsWithSpaces.toLocaleString()}\n` +
                    `Paragraphs:        ${paragraphs}\n` +
                    `Est. read time:    ${readTime} min`,
                );
            },
            isEnabled: () => true,
        });

        // Listen to changes and update the count in the status bar
        ctx.events.on('change', ({ text }) => {
            const count = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
            const badge = ctx.editor.getContainer().querySelector('.tt-wordcount');
            if (badge) badge.textContent = `${count} words`;
        });
    },

    destroy(): void {
        // Nothing to clean up
    },

    toolbarItems: {},
};

export default WordCountPlugin;
