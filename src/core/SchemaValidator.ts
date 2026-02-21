/**
 * SchemaValidator — sanitizes and validates HTML content.
 * Strips disallowed tags, dangerous attributes, and javascript: protocols.
 */

const ALLOWED_TAGS = new Set([
    'p', 'br', 'hr',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del',
    'sup', 'sub', 'mark', 'code', 'pre', 'kbd', 'samp',
    'blockquote', 'q', 'cite',
    'ul', 'ol', 'li',
    'a', 'img',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
    'div', 'span', 'section', 'article', 'aside', 'header', 'footer', 'main', 'nav',
    'figure', 'figcaption',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
    '*': new Set(['class', 'id', 'style', 'dir', 'lang', 'title']),
    'a': new Set(['href', 'target', 'rel', 'title']),
    'img': new Set(['src', 'alt', 'width', 'height', 'loading', 'decoding']),
    'td': new Set(['colspan', 'rowspan', 'align', 'valign']),
    'th': new Set(['colspan', 'rowspan', 'scope', 'align', 'valign']),
    'col': new Set(['span', 'width']),
    'colgroup': new Set(['span']),
    'ol': new Set(['type', 'start']),
    'li': new Set(['value']),
};

const DANGEROUS_PROTOCOLS = /^(javascript|vbscript|data:text\/html)/i;

export class SchemaValidator {
    private readonly allowedTags: Set<string>;
    private readonly strict: boolean;

    constructor(allowedTags: Set<string> = ALLOWED_TAGS, strict = true) {
        this.allowedTags = allowedTags;
        this.strict = strict;
    }

    /**
     * Sanitize an HTML string by parsing and rebuilding it with allowed content only.
     */
    sanitize(html: string): string {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        this.sanitizeNode(wrapper);
        return wrapper.innerHTML;
    }

    /**
     * Validate that an HTML string can be safely inserted.
     */
    validate(html: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;

        const check = (node: Element) => {
            const tag = node.tagName.toLowerCase();
            if (!this.allowedTags.has(tag)) {
                errors.push(`Tag <${tag}> is not allowed.`);
            }
            for (const attr of Array.from(node.attributes)) {
                if (!this.isAttrAllowed(tag, attr.name)) {
                    errors.push(`Attribute "${attr.name}" on <${tag}> is not allowed.`);
                }
            }
            for (const child of Array.from(node.children)) {
                check(child);
            }
        };

        for (const child of Array.from(wrapper.children)) {
            check(child);
        }

        return { valid: errors.length === 0, errors };
    }

    private sanitizeNode(node: Element): void {
        const children = Array.from(node.childNodes);
        for (const child of children) {
            if (child.nodeType === Node.ELEMENT_NODE) {
                const el = child as Element;
                const tag = el.tagName.toLowerCase();

                if (!this.allowedTags.has(tag)) {
                    // Unwrap: keep text content, remove element
                    if (this.strict) {
                        node.removeChild(el);
                    } else {
                        // Unwrap children into parent
                        while (el.firstChild) {
                            node.insertBefore(el.firstChild, el);
                        }
                        node.removeChild(el);
                    }
                    continue;
                }

                // Clean attributes
                this.sanitizeAttributes(el, tag);

                // Recurse
                this.sanitizeNode(el);
            }
        }
    }

    private sanitizeAttributes(el: Element, tag: string): void {
        const attrs = Array.from(el.attributes);
        for (const attr of attrs) {
            if (!this.isAttrAllowed(tag, attr.name)) {
                el.removeAttribute(attr.name);
                continue;
            }

            // Check for dangerous href/src values
            if ((attr.name === 'href' || attr.name === 'src') && DANGEROUS_PROTOCOLS.test(attr.value)) {
                el.removeAttribute(attr.name);
                continue;
            }

            // Neutralize on* event handlers in style attr
            if (attr.name === 'style' && /expression\s*\(/i.test(attr.value)) {
                el.removeAttribute('style');
            }
        }

        // Force external links to be safe
        if (tag === 'a') {
            const href = el.getAttribute('href') ?? '';
            if (href.startsWith('http')) {
                el.setAttribute('rel', 'noopener noreferrer');
            }
        }
    }

    private isAttrAllowed(tag: string, attrName: string): boolean {
        const lower = attrName.toLowerCase();
        // Block all on* event attrs
        if (lower.startsWith('on')) return false;

        const global = ALLOWED_ATTRS['*'];
        const tagSpecific = ALLOWED_ATTRS[tag];

        return global.has(lower) || (tagSpecific?.has(lower) ?? false);
    }
}
