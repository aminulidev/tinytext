import type { PluginDefinition, PluginContext } from '../core/types';

/**
 * TablePlugin — advanced table editing features:
 * - Right-click context menu for row/column manipulation
 * - Tab key navigation between cells
 * - Keyboard shortcuts for inserting rows/columns
 */
class TablePluginClass {
    readonly name = 'table';
    readonly version = '1.0.0';

    init(ctx: PluginContext): void {
        const editable = ctx.editor.getEditableArea();

        // Tab navigation between cells
        editable.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;

            const cell = this._findCell(sel.getRangeAt(0).startContainer);
            if (!cell) return;

            e.preventDefault();
            const cells = Array.from(cell.closest('table')!.querySelectorAll('td, th'));
            const idx = cells.indexOf(cell);
            const nextCell = e.shiftKey ? cells[idx - 1] : cells[idx + 1];

            if (nextCell) {
                (nextCell as HTMLElement).focus();
                const range = document.createRange();
                range.selectNodeContents(nextCell);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (!e.shiftKey) {
                // Add new row at end
                this._appendRow(cell.closest('table')!);
                const newCells = Array.from(cell.closest('table')!.querySelectorAll('td, th'));
                (newCells[newCells.length - cells.length] as HTMLElement).focus();
            }
        });

        // Context menu
        editable.addEventListener('contextmenu', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const cell = target.closest('td, th') as HTMLElement | null;
            if (!cell) return;
            e.preventDefault();
            this._showContextMenu(e.clientX, e.clientY, cell, ctx);
        });

        // Register shortcut: Alt+Shift+Insert = insert row below
        ctx.editor.addShortcut('alt+shift+insert', () => {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;
            const cell = this._findCell(sel.getRangeAt(0).startContainer);
            if (cell) this._insertRowBelow(cell);
        });
    }

    destroy(): void {
        this._removeContextMenus();
    }

    toolbarItems = {};

    // ── Private helpers ────────────────────────────────────────────

    _findCell(node: Node): HTMLElement | null {
        let current: Node | null = node;
        while (current) {
            if (current.nodeType === Node.ELEMENT_NODE) {
                const tag = (current as Element).tagName.toLowerCase();
                if (tag === 'td' || tag === 'th') return current as HTMLElement;
            }
            current = current.parentNode;
        }
        return null;
    }

    _appendRow(table: HTMLTableElement): void {
        const colCount = table.rows[0]?.cells.length ?? 1;
        const tr = document.createElement('tr');
        for (let i = 0; i < colCount; i++) {
            const td = document.createElement('td');
            td.innerHTML = '&nbsp;';
            tr.appendChild(td);
        }
        table.querySelector('tbody')?.appendChild(tr) ?? table.appendChild(tr);
    }

    _insertRowBelow(cell: HTMLElement): void {
        const row = cell.closest('tr') as HTMLTableRowElement;
        const table = cell.closest('table') as HTMLTableElement;
        const colCount = table.rows[0]?.cells.length ?? 1;
        const newRow = document.createElement('tr');
        for (let i = 0; i < colCount; i++) {
            const td = document.createElement('td');
            td.innerHTML = '&nbsp;';
            newRow.appendChild(td);
        }
        row.insertAdjacentElement('afterend', newRow);
    }

    _showContextMenu(x: number, y: number, cell: HTMLElement, ctx: PluginContext): void {
        this._removeContextMenus();

        const menu = document.createElement('div');
        menu.className = 'tt-context-menu';
        menu.style.cssText = `position:fixed;top:${y}px;left:${x}px;z-index:99999`;

        const actions = [
            { label: '➕ Insert Row Above', action: () => this._insertRowAbove(cell) },
            { label: '➕ Insert Row Below', action: () => this._insertRowBelow(cell) },
            { label: '➕ Insert Column Left', action: () => this._insertColLeft(cell) },
            { label: '➕ Insert Column Right', action: () => this._insertColRight(cell) },
            { label: '🗑 Delete Row', action: () => this._deleteRow(cell) },
            { label: '🗑 Delete Column', action: () => this._deleteCol(cell) },
            { label: '🗑 Delete Table', action: () => cell.closest('table')?.remove() },
        ];

        for (const { label, action } of actions) {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'tt-context-item';
            item.textContent = label;
            item.addEventListener('click', () => {
                action();
                this._removeContextMenus();
                ctx.editor.getEditableArea().dispatchEvent(new Event('input'));
            });
            menu.appendChild(item);
        }

        document.body.appendChild(menu);
        document.addEventListener('click', () => this._removeContextMenus(), { once: true });
    }

    _removeContextMenus(): void {
        document.querySelectorAll('.tt-context-menu').forEach(el => el.remove());
    }

    _insertRowAbove(cell: HTMLElement): void {
        const row = cell.closest('tr') as HTMLTableRowElement;
        const table = cell.closest('table') as HTMLTableElement;
        const colCount = table.rows[0]?.cells.length ?? 1;
        const newRow = document.createElement('tr');
        for (let i = 0; i < colCount; i++) {
            const td = document.createElement('td');
            td.innerHTML = '&nbsp;';
            newRow.appendChild(td);
        }
        row.insertAdjacentElement('beforebegin', newRow);
    }

    _insertColLeft(cell: HTMLElement): void {
        const table = cell.closest('table') as HTMLTableElement;
        const cellIndex = (cell as HTMLTableCellElement).cellIndex;
        for (const row of Array.from(table.rows)) {
            const td = document.createElement('td');
            td.innerHTML = '&nbsp;';
            row.insertBefore(td, row.cells[cellIndex]);
        }
    }

    _insertColRight(cell: HTMLElement): void {
        const table = cell.closest('table') as HTMLTableElement;
        const cellIndex = (cell as HTMLTableCellElement).cellIndex;
        for (const row of Array.from(table.rows)) {
            const td = document.createElement('td');
            td.innerHTML = '&nbsp;';
            const next = row.cells[cellIndex + 1];
            if (next) row.insertBefore(td, next);
            else row.appendChild(td);
        }
    }

    _deleteRow(cell: HTMLElement): void {
        const row = cell.closest('tr');
        const table = cell.closest('table') as HTMLTableElement;
        if (table.rows.length <= 1) {
            table.remove();
        } else {
            row?.remove();
        }
    }

    _deleteCol(cell: HTMLElement): void {
        const table = cell.closest('table') as HTMLTableElement;
        const cellIndex = (cell as HTMLTableCellElement).cellIndex;
        for (const row of Array.from(table.rows)) {
            if (row.cells.length <= 1) {
                table.remove();
                return;
            }
            row.deleteCell(cellIndex);
        }
    }
}

export const TablePlugin: PluginDefinition = new TablePluginClass();
