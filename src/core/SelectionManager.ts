import type { SerializedSelection } from './types';

export interface RangeInfo {
    collapsed: boolean;
    startContainer: Node;
    startOffset: number;
    endContainer: Node;
    endOffset: number;
    commonAncestorContainer: Node;
}

/**
 * SelectionManager wraps the native Selection API, providing
 * save/restore, serialization, and formatting-state queries.
 */
export class SelectionManager {
    private savedRange: Range | null = null;
    private readonly root: HTMLElement;

    constructor(rootElement: HTMLElement) {
        this.root = rootElement;
    }

    // ── Getters ────────────────────────────────────────────────────
    getSelection(): Selection | null {
        return window.getSelection();
    }

    getRange(): Range | null {
        const sel = this.getSelection();
        if (!sel || sel.rangeCount === 0) return null;
        return sel.getRangeAt(0);
    }

    getRangeInfo(): RangeInfo | null {
        const range = this.getRange();
        if (!range) return null;
        return {
            collapsed: range.collapsed,
            startContainer: range.startContainer,
            startOffset: range.startOffset,
            endContainer: range.endContainer,
            endOffset: range.endOffset,
            commonAncestorContainer: range.commonAncestorContainer,
        };
    }

    isInsideEditor(): boolean {
        const sel = this.getSelection();
        if (!sel || sel.rangeCount === 0) return false;
        const node = sel.getRangeAt(0).commonAncestorContainer;
        return this.root.contains(node);
    }

    // ── Save / Restore ─────────────────────────────────────────────
    saveRange(): void {
        const range = this.getRange();
        this.savedRange = range ? range.cloneRange() : null;
    }

    restoreRange(): void {
        if (!this.savedRange) return;
        const sel = this.getSelection();
        if (!sel) return;
        sel.removeAllRanges();
        sel.addRange(this.savedRange);
    }

    clearSavedRange(): void {
        this.savedRange = null;
    }

    // ── Serialization ──────────────────────────────────────────────
    serialize(): SerializedSelection | null {
        const sel = this.getSelection();
        if (!sel || sel.rangeCount === 0) return null;
        const range = sel.getRangeAt(0);

        const anchorPath = this.getNodePath(range.startContainer);
        const focusPath = this.getNodePath(range.endContainer);

        if (!anchorPath || !focusPath) return null;

        return {
            anchorPath,
            anchorOffset: range.startOffset,
            focusPath,
            focusOffset: range.endOffset,
        };
    }

    deserialize(serialized: SerializedSelection): void {
        const anchorNode = this.getNodeFromPath(serialized.anchorPath);
        const focusNode = this.getNodeFromPath(serialized.focusPath);

        if (!anchorNode || !focusNode) return;

        const range = document.createRange();
        try {
            range.setStart(anchorNode, serialized.anchorOffset);
            range.setEnd(focusNode, serialized.focusOffset);
            const sel = this.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(range);
            }
        } catch {
            // Silently fail for invalid paths (happens after DOM changes)
        }
    }

    // ── Utilities ──────────────────────────────────────────────────
    getSelectedText(): string {
        return this.getSelection()?.toString() ?? '';
    }

    getParentBlock(): HTMLElement | null {
        const range = this.getRange();
        if (!range) return null;

        let node: Node | null = range.commonAncestorContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;

        while (node && node !== this.root) {
            const el = node as HTMLElement;
            const display = window.getComputedStyle(el).display;
            if (display === 'block' || display === 'list-item' || display === 'table-cell') {
                return el;
            }
            node = node.parentElement;
        }
        return null;
    }

    getClosestAncestor(tagName: string): HTMLElement | null {
        const range = this.getRange();
        if (!range) return null;

        let node: Node | null = range.startContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;

        while (node && node !== this.root) {
            if ((node as HTMLElement).tagName?.toLowerCase() === tagName.toLowerCase()) {
                return node as HTMLElement;
            }
            node = (node as HTMLElement).parentElement;
        }
        return null;
    }

    isFormatActive(format: string): boolean {
        return document.queryCommandState(format);
    }

    wrapSelectionInElement(tagName: string): HTMLElement {
        const el = document.createElement(tagName);
        const range = this.getRange();
        if (range && !range.collapsed) {
            range.surroundContents(el);
        }
        return el;
    }

    collapseToEnd(): void {
        const sel = this.getSelection();
        if (sel && sel.rangeCount > 0) {
            sel.collapseToEnd();
        }
    }

    selectAll(): void {
        const range = document.createRange();
        range.selectNodeContents(this.root);
        const sel = this.getSelection();
        if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

    // ── Path helpers ───────────────────────────────────────────────
    private getNodePath(node: Node): number[] | null {
        const path: number[] = [];
        let current: Node | null = node;
        while (current && current !== this.root) {
            const parentNode: ParentNode | null = current.parentNode;
            if (!parentNode) return null;
            const index = Array.from(parentNode.childNodes).indexOf(current as ChildNode);
            path.unshift(index);
            current = parentNode;
        }
        return path;
    }

    private getNodeFromPath(path: number[]): Node | null {
        let node: Node = this.root;
        for (const index of path) {
            if (!node.childNodes[index]) return null;
            node = node.childNodes[index];
        }
        return node;
    }
}
