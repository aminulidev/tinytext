import type { ToolbarItem, ToolbarButtonConfig } from '../core/types';
import type { CommandManager } from '../core/CommandManager';
import type { TinyTextEditor } from '../core/Editor';
import { LinkModal } from './modals/LinkModal';
import { ImageModal } from './modals/ImageModal';
import { TableModal } from './modals/TableModal';

// ── Icon SVG library ─────────────────────────────────────────────
export const ICONS: Record<string, string> = {
    bold: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 4h8a4 4 0 010 8H6z"/><path d="M6 12h9a4 4 0 010 8H6z"/></svg>`,
    italic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>`,
    underline: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 4v6a6 6 0 0012 0V4"/><line x1="4" y1="20" x2="20" y2="20"/></svg>`,
    strikethrough: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="4" y1="12" x2="20" y2="12"/><path d="M16 6c0-1.1-1.8-2-4-2s-5 .9-5 3c0 1.5 1.3 2.5 3 3"/><path d="M8.5 18c.5 1.2 2 2 3.5 2 2.5 0 5-1 5-3 0-1.5-1-2.5-2.5-3"/></svg>`,
    h1: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h8M4 6v12M12 6v12"/><text x="15" y="17" font-size="9" fill="currentColor" stroke="none" font-weight="bold">1</text></svg>`,
    h2: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h8M4 6v12M12 6v12"/><text x="15" y="17" font-size="9" fill="currentColor" stroke="none" font-weight="bold">2</text></svg>`,
    h3: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h8M4 6v12M12 6v12"/><text x="15" y="17" font-size="9" fill="currentColor" stroke="none" font-weight="bold">3</text></svg>`,
    h4: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h8M4 6v12M12 6v12"/><text x="15" y="17" font-size="9" fill="currentColor" stroke="none" font-weight="bold">4</text></svg>`,
    h5: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h8M4 6v12M12 6v12"/><text x="15" y="17" font-size="9" fill="currentColor" stroke="none" font-weight="bold">5</text></svg>`,
    h6: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h8M4 6v12M12 6v12"/><text x="15" y="17" font-size="9" fill="currentColor" stroke="none" font-weight="bold">6</text></svg>`,
    paragraph: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 4H7a5 5 0 000 10h4v6M17 4v16"/><line x1="13" y1="4" x2="17" y2="4"/></svg>`,
    'align-left': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>`,
    'align-center': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>`,
    'align-right': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>`,
    'align-justify': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
    'ordered-list': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>`,
    'unordered-list': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>`,
    blockquote: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>`,
    'code-block': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>`,
    image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    table: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`,
    undo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 101.85-4.92L1 10"/></svg>`,
    redo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-1.85-4.92L23 10"/></svg>`,
    forecolor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h4l10.5-10.5a2.121 2.121 0 00-3-3L5 17v3z"/><line x1="14" y1="5" x2="19" y2="10"/></svg>`,
    hilitecolor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 12.764L11.236 6 4 13.236V18h4.764L18 12.764z"/><line x1="20" y1="20" x2="4" y2="20"/></svg>`,
};

// ── Button configs ────────────────────────────────────────────────
function buildDefaultButtons(
    commands: CommandManager,
    editor: TinyTextEditor,
): Map<string, ToolbarButtonConfig> {
    const map = new Map<string, ToolbarButtonConfig>();

    const btn = (
        id: ToolbarItem,
        label: string,
        command = id as string,
        extra: Partial<ToolbarButtonConfig> = {},
    ): void => {
        map.set(id, {
            icon: ICONS[id] ?? '',
            label,
            command,
            isActive: () => commands.isActive(command),
            isEnabled: () => commands.isEnabled(command),
            ...extra,
        });
    };

    btn('bold', 'Bold (Ctrl+B)');
    btn('italic', 'Italic (Ctrl+I)');
    btn('underline', 'Underline (Ctrl+U)');
    btn('strikethrough', 'Strikethrough');
    btn('h1', 'Heading 1');
    btn('h2', 'Heading 2');
    btn('h3', 'Heading 3');
    btn('h4', 'Heading 4');
    btn('h5', 'Heading 5');
    btn('h6', 'Heading 6');
    btn('paragraph', 'Paragraph');
    btn('align-left', 'Align Left');
    btn('align-center', 'Align Center');
    btn('align-right', 'Align Right');
    btn('align-justify', 'Justify');
    btn('ordered-list', 'Ordered List');
    btn('unordered-list', 'Unordered List');
    btn('blockquote', 'Blockquote');
    btn('code-block', 'Code Block');
    btn('undo', 'Undo (Ctrl+Z)');
    btn('redo', 'Redo (Ctrl+Y)');

    // Link — opens modal
    map.set('link', {
        icon: ICONS['link'],
        label: 'Insert Link',
        action: () => {
            editor.selection.saveRange();
            const modal = new LinkModal(editor);
            modal.open();
        },
        isEnabled: () => !editor.isReadOnly(),
    });

    // Image — opens modal
    map.set('image', {
        icon: ICONS['image'],
        label: 'Insert Image',
        action: () => {
            editor.selection.saveRange();
            const modal = new ImageModal(editor);
            modal.open();
        },
        isEnabled: () => !editor.isReadOnly(),
    });

    // Table — opens modal
    map.set('table', {
        icon: ICONS['table'],
        label: 'Insert Table',
        action: () => {
            editor.selection.saveRange();
            const modal = new TableModal(editor);
            modal.open();
        },
        isEnabled: () => !editor.isReadOnly(),
    });

    // Foreground color picker
    map.set('forecolor', {
        icon: ICONS['forecolor'],
        label: 'Text Color',
        type: 'color',
        command: 'forecolor',
        isEnabled: () => !editor.isReadOnly(),
    });

    // Highlight color picker
    map.set('hilitecolor', {
        icon: ICONS['hilitecolor'],
        label: 'Highlight Color',
        type: 'color',
        command: 'hilitecolor',
        isEnabled: () => !editor.isReadOnly(),
    });

    return map;
}

// ── Toolbar class ─────────────────────────────────────────────────
export class Toolbar {
    private readonly el: HTMLElement;
    private readonly items: ToolbarItem[];
    private readonly commands: CommandManager;
    private readonly editor: TinyTextEditor;
    private readonly buttonMap = new Map<string, HTMLElement>();
    private readonly defaultButtons: Map<string, ToolbarButtonConfig>;
    private readonly customButtons = new Map<string, ToolbarButtonConfig>();

    constructor(
        el: HTMLElement,
        items: ToolbarItem[],
        commands: CommandManager,
        editor: TinyTextEditor,
    ) {
        this.el = el;
        this.items = items;
        this.commands = commands;
        this.editor = editor;
        this.defaultButtons = buildDefaultButtons(commands, editor);
    }

    render(): void {
        this.el.innerHTML = '';
        this.buttonMap.clear();

        for (const item of this.items) {
            if (item === 'separator') {
                const sep = document.createElement('div');
                sep.className = 'tt-toolbar-sep';
                this.el.appendChild(sep);
                continue;
            }

            const config = this.customButtons.get(item) ?? this.defaultButtons.get(item);
            if (!config) continue;

            const btn = this._buildButton(item, config);
            this.el.appendChild(btn);
            this.buttonMap.set(item, btn);
        }
    }

    private _buildButton(id: string, config: ToolbarButtonConfig): HTMLElement {
        if (config.type === 'color') {
            return this._buildColorPicker(id, config);
        }

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `tt-btn tt-btn--${id}`;
        btn.setAttribute('title', config.label);
        btn.setAttribute('aria-label', config.label);
        btn.setAttribute('data-command', id);
        btn.innerHTML = config.icon;

        btn.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Don't lose editor focus
            if (config.action) {
                config.action();
            } else if (config.command) {
                this.editor.execCommand(config.command, ...(config.commandArgs ?? []));
            }
        });

        return btn;
    }

    private _buildColorPicker(id: string, config: ToolbarButtonConfig): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.className = `tt-color-picker tt-btn--${id}`;
        wrapper.setAttribute('title', config.label);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tt-btn';
        btn.innerHTML = config.icon;
        btn.setAttribute('aria-label', config.label);

        const input = document.createElement('input');
        input.type = 'color';
        input.className = 'tt-color-input';
        input.value = id === 'forecolor' ? '#000000' : '#ffff00';
        input.setAttribute('aria-label', `${config.label} - color picker`);

        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            input.click();
        });

        input.addEventListener('input', () => {
            this.editor.execCommand(config.command!, input.value);
        });

        wrapper.appendChild(btn);
        wrapper.appendChild(input);
        return wrapper;
    }

    refresh(): void {
        for (const [id, btn] of this.buttonMap) {
            const config = this.customButtons.get(id) ?? this.defaultButtons.get(id);
            if (!config) continue;

            const active = config.isActive ? config.isActive() : this.commands.isActive(id);
            const enabled = config.isEnabled ? config.isEnabled() : this.commands.isEnabled(id);

            btn.classList.toggle('tt-btn--active', active);
            btn.classList.toggle('tt-btn--disabled', !enabled);
            (btn as HTMLButtonElement).disabled = !enabled;
        }
    }

    addCustomButton(id: string, config: ToolbarButtonConfig): void {
        this.customButtons.set(id, config);
        if (!this.items.includes(id)) {
            this.items.push(id);
        }
        const btn = this._buildButton(id, config);
        this.el.appendChild(btn);
        this.buttonMap.set(id, btn);
    }

    removeButton(id: string): void {
        const btn = this.buttonMap.get(id);
        if (btn) {
            btn.remove();
            this.buttonMap.delete(id);
        }
        this.customButtons.delete(id);
        const idx = this.items.indexOf(id);
        if (idx !== -1) this.items.splice(idx, 1);
    }
}
