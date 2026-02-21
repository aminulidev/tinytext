import { BaseModal } from './BaseModal';
import type { TinyTextEditor } from '../../core/Editor';
import { insertHtmlAtCaret } from '../../utils/dom';

export class LinkModal extends BaseModal {
    private readonly editor: TinyTextEditor;
    private urlInput!: HTMLInputElement;
    private textInput!: HTMLInputElement;
    private targetSelect!: HTMLSelectElement;
    private readonly selectedText: string;
    private existingLink: HTMLAnchorElement | null = null;

    constructor(editor: TinyTextEditor) {
        super('Insert / Edit Link');
        this.editor = editor;
        this.selectedText = editor.selection.getSelectedText();
        this.existingLink = editor.selection.getClosestAncestor('a') as HTMLAnchorElement | null;
        this._buildContent();
    }

    private _buildContent(): void {
        const body = this.buildBody();

        this.urlInput = this.buildInput('url', 'https://example.com', this.existingLink?.href ?? '');
        this.textInput = this.buildInput('text', 'Link text', this.selectedText || this.existingLink?.innerText || '');
        this.targetSelect = document.createElement('select');
        this.targetSelect.className = 'tt-input';
        [
            { value: '_self', label: 'Same window' },
            { value: '_blank', label: 'New window' },
        ].forEach(({ value, label }) => {
            const opt = document.createElement('option');
            opt.value = value;
            opt.textContent = label;
            if (this.existingLink?.target === value) opt.selected = true;
            this.targetSelect.appendChild(opt);
        });

        body.appendChild(this.buildField('URL', this.urlInput));
        body.appendChild(this.buildField('Display Text', this.textInput));
        body.appendChild(this.buildField('Open in', this.targetSelect));

        // Remove link option
        if (this.existingLink) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'tt-btn-danger';
            removeBtn.type = 'button';
            removeBtn.textContent = 'Remove Link';
            removeBtn.addEventListener('click', () => {
                this.editor.execCommand('unlink');
                this.close();
            });
            body.appendChild(removeBtn);
        }

        this.buildFooter('Insert Link', () => this._insert());
        setTimeout(() => this.urlInput.focus(), 50);
    }

    private _insert(): void {
        const url = this.urlInput.value.trim();
        const text = this.textInput.value.trim() || url;
        const target = this.targetSelect.value;

        if (!url) return;

        this.editor.selection.restoreRange();
        this.editor.getEditableArea().focus();

        const html = `<a href="${url}" target="${target}" rel="${target === '_blank' ? 'noopener noreferrer' : ''}">${text}</a>`;
        insertHtmlAtCaret(html);

        this.editor.execCommand('selectAll'); // trigger change
        this.close();
    }
}
