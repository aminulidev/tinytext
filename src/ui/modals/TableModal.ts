import { BaseModal } from './BaseModal';
import type { TinyTextEditor } from '../../core/Editor';
import { insertHtmlAtCaret } from '../../utils/dom';

export class TableModal extends BaseModal {
    private readonly editor: TinyTextEditor;
    private rowsInput!: HTMLInputElement;
    private colsInput!: HTMLInputElement;
    private headerCheckbox!: HTMLInputElement;
    private previewGrid!: HTMLElement;

    constructor(editor: TinyTextEditor) {
        super('Insert Table');
        this.editor = editor;
        this._buildContent();
    }

    private _buildContent(): void {
        const body = this.buildBody();

        this.rowsInput = this.buildInput('number', 'Rows', '3');
        this.rowsInput.min = '1';
        this.rowsInput.max = '20';
        this.colsInput = this.buildInput('number', 'Columns', '3');
        this.colsInput.min = '1';
        this.colsInput.max = '10';

        this.headerCheckbox = document.createElement('input');
        this.headerCheckbox.type = 'checkbox';
        this.headerCheckbox.checked = true;
        this.headerCheckbox.id = 'tt-table-header';
        this.headerCheckbox.className = 'tt-checkbox';
        const checkLabel = document.createElement('label');
        checkLabel.htmlFor = 'tt-table-header';
        checkLabel.className = 'tt-label-inline';
        checkLabel.appendChild(this.headerCheckbox);
        checkLabel.appendChild(document.createTextNode(' Include header row'));

        // Grid preview
        this.previewGrid = document.createElement('div');
        this.previewGrid.className = 'tt-table-preview';

        const onChange = () => this._renderPreview();
        this.rowsInput.addEventListener('input', onChange);
        this.colsInput.addEventListener('input', onChange);
        this.headerCheckbox.addEventListener('change', onChange);

        body.appendChild(this.buildField('Rows', this.rowsInput));
        body.appendChild(this.buildField('Columns', this.colsInput));
        body.appendChild(checkLabel);
        body.appendChild(this.previewGrid);

        this._renderPreview();
        this.buildFooter('Insert Table', () => this._insert());
    }

    private _renderPreview(): void {
        const rows = Math.min(parseInt(this.rowsInput.value, 10) || 3, 20);
        const cols = Math.min(parseInt(this.colsInput.value, 10) || 3, 10);
        const hasHeader = this.headerCheckbox.checked;

        this.previewGrid.innerHTML = '';
        const table = document.createElement('table');
        table.className = 'tt-preview-table';

        for (let r = 0; r < Math.min(rows, 6); r++) {
            const tr = document.createElement('tr');
            for (let c = 0; c < Math.min(cols, 8); c++) {
                const cell = document.createElement(r === 0 && hasHeader ? 'th' : 'td');
                cell.textContent = r === 0 && hasHeader ? `H${c + 1}` : '';
                tr.appendChild(cell);
            }
            table.appendChild(tr);
        }

        this.previewGrid.appendChild(table);
    }

    private _insert(): void {
        const rows = Math.min(parseInt(this.rowsInput.value, 10) || 3, 20);
        const cols = Math.min(parseInt(this.colsInput.value, 10) || 3, 10);
        const hasHeader = this.headerCheckbox.checked;

        let html = '<table class="tt-table"><tbody>';

        for (let r = 0; r < rows; r++) {
            html += '<tr>';
            for (let c = 0; c < cols; c++) {
                if (r === 0 && hasHeader) {
                    html += '<th>&nbsp;</th>';
                } else {
                    html += '<td>&nbsp;</td>';
                }
            }
            html += '</tr>';
        }

        html += '</tbody></table><p></p>';

        this.editor.selection.restoreRange();
        this.editor.getEditableArea().focus();
        insertHtmlAtCaret(html);
        this.close();
    }
}
