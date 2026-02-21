import { BaseModal } from './BaseModal';
import type { TinyTextEditor } from '../../core/Editor';
import { insertHtmlAtCaret, createElement } from '../../utils/dom';

export class ImageModal extends BaseModal {
    private readonly editor: TinyTextEditor;
    private urlInput!: HTMLInputElement;
    private altInput!: HTMLInputElement;
    private widthInput!: HTMLInputElement;
    private fileInput!: HTMLInputElement;
    private previewEl!: HTMLImageElement;
    private mode: 'url' | 'upload' = 'url';

    constructor(editor: TinyTextEditor) {
        super('Insert Image');
        this.editor = editor;
        this._buildContent();
    }

    private _buildContent(): void {
        const body = this.buildBody();

        // Tab switcher
        const tabs = createElement('div', { class: 'tt-tabs' });
        const urlTab = createElement('button', { class: 'tt-tab tt-tab--active', type: 'button' }, 'URL');
        const uploadTab = createElement('button', { class: 'tt-tab', type: 'button' }, 'Upload');

        urlTab.addEventListener('click', () => {
            this.mode = 'url';
            urlTab.classList.add('tt-tab--active');
            uploadTab.classList.remove('tt-tab--active');
            urlSection.style.display = '';
            uploadSection.style.display = 'none';
        });
        uploadTab.addEventListener('click', () => {
            this.mode = 'upload';
            uploadTab.classList.add('tt-tab--active');
            urlTab.classList.remove('tt-tab--active');
            urlSection.style.display = 'none';
            uploadSection.style.display = '';
        });
        tabs.appendChild(urlTab);
        tabs.appendChild(uploadTab);
        body.appendChild(tabs);

        // URL section
        const urlSection = createElement('div', { class: 'tt-tab-content' });
        this.urlInput = this.buildInput('url', 'https://example.com/image.png');
        this.urlInput.addEventListener('input', () => this._updatePreview(this.urlInput.value));
        urlSection.appendChild(this.buildField('Image URL', this.urlInput));

        // Upload section
        const uploadSection = createElement('div', { class: 'tt-tab-content', style: 'display:none' });
        this.fileInput = createElement('input', { type: 'file', accept: 'image/*', class: 'tt-input' }) as HTMLInputElement;
        this.fileInput.addEventListener('change', () => this._handleFileUpload());
        const dropZone = createElement('div', { class: 'tt-dropzone' }, 'Drop image here or click to browse');
        dropZone.appendChild(this.fileInput);
        dropZone.addEventListener('dragover', (e) => { (e as DragEvent).preventDefault(); dropZone.classList.add('tt-dropzone--active'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('tt-dropzone--active'));
        dropZone.addEventListener('drop', (e) => {
            (e as DragEvent).preventDefault();
            dropZone.classList.remove('tt-dropzone--active');
            const file = (e as DragEvent).dataTransfer?.files[0];
            if (file && file.type.startsWith('image/')) {
                this._readFileAsBase64(file);
            }
        });
        uploadSection.appendChild(this.buildField('Upload Image', dropZone));

        // Common fields
        this.altInput = this.buildInput('text', 'Alt text');
        this.widthInput = this.buildInput('text', 'e.g. 100% or 400px');

        // Preview
        this.previewEl = createElement('img', { class: 'tt-img-preview', alt: 'Preview', style: 'display:none;max-width:100%;max-height:200px;border-radius:6px;margin-top:8px' }) as HTMLImageElement;

        body.appendChild(urlSection);
        body.appendChild(uploadSection);
        body.appendChild(this.buildField('Alt Text', this.altInput));
        body.appendChild(this.buildField('Width (optional)', this.widthInput));
        body.appendChild(this.previewEl);

        this.buildFooter('Insert Image', () => this._insert());
    }

    private _updatePreview(src: string): void {
        if (src) {
            this.previewEl.src = src;
            this.previewEl.style.display = '';
        } else {
            this.previewEl.style.display = 'none';
        }
    }

    private _handleFileUpload(): void {
        const file = this.fileInput.files?.[0];
        if (!file) return;
        this._readFileAsBase64(file);
    }

    private _readFileAsBase64(file: File): void {
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            this._updatePreview(base64);
            this.urlInput.value = base64;
        };
        reader.readAsDataURL(file);
    }

    private _insert(): void {
        const src = this.urlInput.value.trim();
        const alt = this.altInput.value.trim();
        const width = this.widthInput.value.trim();
        if (!src) return;

        this.editor.selection.restoreRange();
        this.editor.getEditableArea().focus();

        const attrs = [`src="${src}"`, `alt="${alt}"`, 'loading="lazy"'];
        if (width) attrs.push(`style="width:${width}"`);

        insertHtmlAtCaret(`<img ${attrs.join(' ')}>`);
        this.close();
    }
}
