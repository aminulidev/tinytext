import { createElement } from '../../utils/dom';

/**
 * BaseModal — lightweight, accessible modal dialog base class.
 */
export class BaseModal {
    protected readonly overlay: HTMLElement;
    protected readonly dialog: HTMLElement;
    private readonly onClose?: () => void;

    constructor(title: string, onClose?: () => void) {
        this.onClose = onClose;

        this.overlay = createElement('div', { class: 'tt-modal-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': title });
        this.dialog = createElement('div', { class: 'tt-modal' });

        const header = createElement('div', { class: 'tt-modal-header' });
        const titleEl = createElement('h3', { class: 'tt-modal-title' }, title);
        const closeBtn = createElement('button', { class: 'tt-modal-close', type: 'button', 'aria-label': 'Close' }, '×');

        closeBtn.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        document.addEventListener('keydown', this._handleKeyDown);

        header.appendChild(titleEl);
        header.appendChild(closeBtn);
        this.dialog.appendChild(header);
        this.overlay.appendChild(this.dialog);
    }

    protected buildBody(): HTMLElement {
        const body = createElement('div', { class: 'tt-modal-body' });
        this.dialog.appendChild(body);
        return body;
    }

    protected buildFooter(primaryLabel: string, onPrimary: () => void, secondaryLabel = 'Cancel'): HTMLElement {
        const footer = createElement('div', { class: 'tt-modal-footer' });
        const cancel = createElement('button', { class: 'tt-btn-secondary', type: 'button' }, secondaryLabel);
        const primary = createElement('button', { class: 'tt-btn-primary', type: 'button' }, primaryLabel);

        cancel.addEventListener('click', () => this.close());
        primary.addEventListener('click', onPrimary);

        footer.appendChild(cancel);
        footer.appendChild(primary);
        this.dialog.appendChild(footer);
        return footer;
    }

    open(): void {
        document.body.appendChild(this.overlay);
        requestAnimationFrame(() => this.overlay.classList.add('tt-modal-overlay--visible'));
        // Focus first input
        const first = this.dialog.querySelector<HTMLElement>('input, select, textarea, button');
        first?.focus();
    }

    close(): void {
        this.overlay.classList.remove('tt-modal-overlay--visible');
        setTimeout(() => {
            this.overlay.remove();
            document.removeEventListener('keydown', this._handleKeyDown);
        }, 200);
        this.onClose?.();
    }

    private readonly _handleKeyDown = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') this.close();
    };

    protected buildField(label: string, inputEl: HTMLElement): HTMLElement {
        const group = createElement('div', { class: 'tt-form-group' });
        const labelEl = createElement('label', { class: 'tt-label' }, label);
        group.appendChild(labelEl);
        group.appendChild(inputEl);
        return group;
    }

    protected buildInput(
        type: string,
        placeholder = '',
        value = '',
    ): HTMLInputElement {
        const input = createElement('input', {
            type,
            class: 'tt-input',
            placeholder,
            value,
        });
        return input as HTMLInputElement;
    }
}
