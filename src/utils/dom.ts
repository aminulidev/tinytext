/**
 * DOM utility helpers used by the editor core and plugins.
 */

/** Insert a node at the current caret position. */
export function insertNodeAtCaret(node: Node): void {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(node);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
}

/** Insert HTML at the caret position. */
export function insertHtmlAtCaret(html: string): void {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    range.deleteContents();

    const frag = document.createRange().createContextualFragment(html);
    const lastChild = frag.lastChild;
    range.insertNode(frag);

    if (lastChild) {
        const newRange = document.createRange();
        newRange.setStartAfter(lastChild);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
    }
}

/** Get the closest block-level ancestor from a node. */
export function getClosestBlock(node: Node | null, root?: HTMLElement): HTMLElement | null {
    let current = node;
    while (current && current !== root) {
        if (current.nodeType === Node.ELEMENT_NODE) {
            const el = current as HTMLElement;
            const display = window.getComputedStyle(el).display;
            if (['block', 'list-item', 'table', 'table-row', 'table-cell', 'flex', 'grid'].includes(display)) {
                return el;
            }
        }
        current = current.parentNode;
    }
    return null;
}

/** Find the closest element matching a CSS selector, stopping at root. */
export function closest(node: Node | null, selector: string, root: HTMLElement): HTMLElement | null {
    let current = node instanceof Element ? node : node?.parentElement;
    while (current && current !== root) {
        if (current.matches(selector)) return current as HTMLElement;
        current = current.parentElement;
    }
    return null;
}

/** Create element with optional attributes and children. */
export function createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attrs: Record<string, string> = {},
    ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
        el.setAttribute(key, value);
    }
    for (const child of children) {
        if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
        } else {
            el.appendChild(child);
        }
    }
    return el;
}

/** Move focus to a given element and put caret at the end. */
export function focusAtEnd(el: HTMLElement): void {
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
    }
}

/** Detect if the selection is inside a given tag. */
export function isInsideTag(tag: string, root: HTMLElement): boolean {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    let node: Node | null = sel.getRangeAt(0).startContainer;
    if (node?.nodeType === Node.TEXT_NODE) node = node.parentElement;
    while (node && node !== root) {
        if ((node as HTMLElement).tagName?.toLowerCase() === tag.toLowerCase()) return true;
        node = (node as Element).parentElement;
    }
    return false;
}

/** Safely parse HTML and return a DocumentFragment. */
export function parseHTML(html: string): DocumentFragment {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    return tpl.content;
}

/** Escape HTML special chars. */
export function escapeHTML(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Generate a short unique ID. */
export function uid(prefix = 'tt'): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Debounce a function. */
export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
    let timer: ReturnType<typeof setTimeout>;
    return function (this: unknown, ...args: unknown[]) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), ms);
    } as T;
}

/** Throttle a function. */
export function throttle<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
    let lastCall = 0;
    return function (this: unknown, ...args: unknown[]) {
        const now = Date.now();
        if (now - lastCall >= ms) {
            lastCall = now;
            fn.apply(this, args);
        }
    } as T;
}

/** Check if a value is a plain object. */
export function isPlainObject(val: unknown): val is Record<string, unknown> {
    return typeof val === 'object' && val !== null && Object.getPrototypeOf(val) === Object.prototype;
}

/** Deep merge utility. */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
    const result = { ...target };
    for (const key of Object.keys(source) as (keyof T)[]) {
        const sv = source[key];
        const tv = target[key];
        if (isPlainObject(sv) && isPlainObject(tv)) {
            result[key] = deepMerge(tv as Record<string, unknown>, sv as Record<string, unknown>) as T[keyof T];
        } else if (sv !== undefined) {
            result[key] = sv as T[keyof T];
        }
    }
    return result;
}
