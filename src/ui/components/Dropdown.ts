import type { ToolbarButtonConfig } from '../../core/types';

export class Dropdown {
    private readonly el: HTMLElement;
    private readonly config: ToolbarButtonConfig;
    private readonly onChange: (value: string) => void;
    private isOpen = false;

    constructor(config: ToolbarButtonConfig, onChange: (value: string) => void) {
        this.config = config;
        this.onChange = onChange;
        this.el = this._build();
        this._attachListeners();
    }

    getElement(): HTMLElement {
        return this.el;
    }

    private _build(): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.className = 'tt-dropdown';
        if (this.config.className) wrapper.classList.add(this.config.className);

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'tt-dropdown-trigger';
        trigger.innerHTML = `<span class="tt-dropdown-label">${this.config.label}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;
        wrapper.appendChild(trigger);

        const list = document.createElement('div');
        list.className = 'tt-dropdown-list';

        if (this.config.options) {
            for (const opt of this.config.options) {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'tt-dropdown-item';
                item.textContent = opt.label;
                item.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.onChange(opt.value);
                    this.close();
                });
                list.appendChild(item);
            }
        }

        wrapper.appendChild(list);
        return wrapper;
    }

    private _attachListeners(): void {
        const trigger = this.el.querySelector('.tt-dropdown-trigger') as HTMLElement;
        trigger.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.toggle();
        });

        document.addEventListener('mousedown', (e) => {
            if (!this.el.contains(e.target as Node)) {
                this.close();
            }
        });
    }

    toggle(): void {
        if (this.isOpen) this.close();
        else this.open();
    }

    open(): void {
        this.isOpen = true;
        this.el.classList.add('tt-dropdown--open');
        // Close other dropdowns
        document.querySelectorAll('.tt-dropdown--open').forEach(d => {
            if (d !== this.el) d.classList.remove('tt-dropdown--open');
        });
    }

    close(): void {
        this.isOpen = false;
        this.el.classList.remove('tt-dropdown--open');
    }

    setLabel(label: string): void {
        const labelEl = this.el.querySelector('.tt-dropdown-label');
        if (labelEl) labelEl.textContent = label;
    }
}
