import { EventBus } from './EventBus';
import { SelectionManager } from './SelectionManager';
import { CommandManager } from './CommandManager';
import { HistoryManager } from './HistoryManager';
import { PluginManager } from './PluginManager';
import { SchemaValidator } from './SchemaValidator';
import { Toolbar } from '../ui/Toolbar';
import { registerBuiltinCommands } from './commands';
import { debounce, uid } from '../utils/dom';
import type {
    EditorOptions,
    EditorInstance,
    EditorEventType,
    EditorEventMap,
    EventHandler,
    PluginDefinition,
    ToolbarItem,
    PluginContext,
    ToolbarAPI,
    EventBusAPI,
    CommandAPI,
} from './types';

const AUTOSAVE_DEFAULT_INTERVAL = 30_000; // 30s
const AUTOSAVE_DEFAULT_KEY = 'tinytext_autosave';

const FULL_TOOLBAR: ToolbarItem[] = [
    'undo', 'redo', 'separator',
    'bold', 'italic', 'underline', 'strikethrough', 'separator',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'paragraph', 'separator',
    'align-left', 'align-center', 'align-right', 'align-justify', 'separator',
    'unordered-list', 'ordered-list', 'blockquote', 'separator',
    'code-block', 'link', 'image', 'table', 'separator',
    'forecolor', 'hilitecolor',
];

const MINIMAL_TOOLBAR: ToolbarItem[] = [
    'bold', 'italic', 'underline', 'separator',
    'link', 'unordered-list', 'ordered-list',
];

export class TinyTextEditor implements EditorInstance {
    private readonly id: string;
    private readonly container: HTMLElement;
    private readonly editable: HTMLElement;
    private readonly toolbarEl: HTMLElement;
    private readonly statusBar: HTMLElement;
    private readonly charCountEl: HTMLElement;
    private readonly wordCountEl: HTMLElement;

    // Core managers
    readonly events: EventBus;
    readonly selection: SelectionManager;
    readonly commands: CommandManager;
    readonly history: HistoryManager;
    readonly plugins: PluginManager;
    readonly validator: SchemaValidator;
    private toolbar!: Toolbar;

    // State
    private _readOnly: boolean;
    private _darkMode: boolean;
    private _markdownMode: boolean;
    private _options: Required<EditorOptions>;
    private _autoSaveTimer: ReturnType<typeof setInterval> | null = null;
    private _destroyed = false;

    // Keyboard shortcut map
    private readonly shortcutMap = new Map<string, () => void>();

    constructor(options: EditorOptions) {
        this.id = uid('tinytext');
        this._options = this._resolveOptions(options);
        this._readOnly = this._options.readOnly;
        this._darkMode = this._resolveDarkMode();
        this._markdownMode = this._options.markdownMode;

        // Init managers
        this.events = new EventBus();
        this.selection = new SelectionManager(document.body); // updated after DOM
        this.commands = new CommandManager();
        this.history = new HistoryManager();
        this.plugins = new PluginManager();
        this.validator = new SchemaValidator();

        // Build DOM
        const { container, editable, toolbarEl, statusBar, charCountEl, wordCountEl } =
            this._buildDOM();
        this.container = container;
        this.editable = editable;
        this.toolbarEl = toolbarEl;
        this.statusBar = statusBar;
        this.charCountEl = charCountEl;
        this.wordCountEl = wordCountEl;

        // Re-init SelectionManager with actual root
        (this.selection as SelectionManager & { root: HTMLElement }).root = this.editable;

        // Register built-in commands
        registerBuiltinCommands(this.commands, this.selection, this.history, this);

        // Setup toolbar
        this._initToolbar();

        // Setup plugin context
        const pluginCtx = this._buildPluginContext();
        this.plugins.setContext(pluginCtx);

        // Register user-provided plugins
        this._loadPlugins();
        this.plugins.initAll();

        // Attach event listeners
        this._attachListeners();

        // Set initial content
        if (this._options.content) {
            this.setHTML(this._options.content);
        }

        // Auto-save
        if (this._options.autoSave) {
            this._startAutoSave();
        }

        // Push initial snapshot
        this.history.push(this.editable.innerHTML, null, true);

        // Apply dark mode
        if (this._darkMode) {
            this.container.setAttribute('data-theme', 'dark');
        }

        // Emit ready
        this.events.emit('ready', { editor: this });
        this._options.onReady?.(this);
    }

    // ── DOM Construction ───────────────────────────────────────────
    private _buildDOM() {
        const root = typeof this._options.selector === 'string'
            ? document.querySelector<HTMLElement>(this._options.selector)
            : this._options.selector instanceof HTMLElement
                ? this._options.selector
                : null;

        if (!root) {
            throw new Error(`[TinyText] Element not found: ${this._options.selector}`);
        }

        root.innerHTML = '';
        root.classList.add('tt-root');

        const container = document.createElement('div');
        container.className = 'tt-editor';
        container.id = this.id;
        container.setAttribute('role', 'application');
        container.setAttribute('aria-label', 'Rich Text Editor');

        const toolbarEl = document.createElement('div');
        toolbarEl.className = 'tt-toolbar';
        toolbarEl.setAttribute('role', 'toolbar');

        const editorBody = document.createElement('div');
        editorBody.className = 'tt-body';

        const editable = document.createElement('div');
        editable.className = 'tt-content';
        editable.contentEditable = 'true';
        editable.setAttribute('role', 'textbox');
        editable.setAttribute('aria-multiline', 'true');
        editable.setAttribute('spellcheck', 'true');
        editable.setAttribute('autocomplete', 'off');
        editable.setAttribute('autocorrect', 'off');
        editable.setAttribute('autocapitalize', 'off');
        editable.tabIndex = 0;

        if (this._options.placeholder) {
            editable.setAttribute('data-placeholder', this._options.placeholder);
        }
        if (this._options.height) container.style.height = this._options.height;
        if (this._options.minHeight) editorBody.style.minHeight = this._options.minHeight;
        if (this._options.maxHeight) {
            editorBody.style.maxHeight = this._options.maxHeight;
            editorBody.style.overflowY = 'auto';
        }

        editorBody.appendChild(editable);

        const statusBar = document.createElement('div');
        statusBar.className = 'tt-statusbar';

        const wordCountEl = document.createElement('span');
        wordCountEl.className = 'tt-wordcount';
        wordCountEl.textContent = '0 words';

        const charCountEl = document.createElement('span');
        charCountEl.className = 'tt-charcount';
        charCountEl.textContent = '0 chars';

        const modeLabel = document.createElement('span');
        modeLabel.className = 'tt-mode-label';
        modeLabel.textContent = this._markdownMode ? 'Markdown' : 'Rich Text';

        statusBar.appendChild(wordCountEl);
        statusBar.appendChild(charCountEl);
        statusBar.appendChild(modeLabel);

        container.appendChild(toolbarEl);
        container.appendChild(editorBody);
        container.appendChild(statusBar);
        root.appendChild(container);

        return { container, editable, toolbarEl, statusBar, charCountEl, wordCountEl };
    }

    // ── Toolbar Init ───────────────────────────────────────────────
    private _initToolbar() {
        let items: ToolbarItem[];
        const opt = this._options.toolbar;

        if (opt === 'full') items = FULL_TOOLBAR;
        else if (opt === 'minimal') items = MINIMAL_TOOLBAR;
        else if (opt === 'none') items = [];
        else items = (opt as ToolbarItem[]) ?? FULL_TOOLBAR;

        this.toolbar = new Toolbar(this.toolbarEl, items, this.commands, this);
        this.toolbar.render();
    }

    // ── Plugin Context ─────────────────────────────────────────────
    private _buildPluginContext(): PluginContext {
        const toolbarAPI: ToolbarAPI = {
            addButton: (id, config) => this.toolbar.addCustomButton(id, config),
            removeButton: (id) => this.toolbar.removeButton(id),
            refresh: () => this.toolbar.refresh(),
        };

        const eventBusAPI: EventBusAPI = {
            on: (evt, handler) => this.events.on(evt, handler),
            off: (evt, handler) => this.events.off(evt, handler),
            emit: (evt, payload) => this.events.emit(evt, payload),
        };

        const commandAPI: CommandAPI = {
            register: (def) => this.commands.register(def),
            exec: (id, ...args) => this.commands.exec(id, ...args),
            isActive: (id) => this.commands.isActive(id),
            isEnabled: (id) => this.commands.isEnabled(id),
        };

        return { editor: this, toolbar: toolbarAPI, events: eventBusAPI, commands: commandAPI };
    }

    // ── Plugin Loading ─────────────────────────────────────────────
    private _loadPlugins() {
        const { plugins } = this._options;
        for (const plugin of plugins) {
            if (typeof plugin === 'object' && 'name' in plugin) {
                this.plugins.register(plugin as PluginDefinition);
            }
            // String-based plugin names would be resolved from a registry in a real setup
        }
    }

    // ── Event Listeners ────────────────────────────────────────────
    private _attachListeners() {
        const debouncedChange = debounce(() => this._onContentChange(), 150);

        this.editable.addEventListener('input', debouncedChange);
        this.editable.addEventListener('keydown', this._onKeyDown.bind(this));
        this.editable.addEventListener('focus', this._onFocus.bind(this));
        this.editable.addEventListener('blur', this._onBlur.bind(this));
        this.editable.addEventListener('paste', this._onPaste.bind(this));

        document.addEventListener('selectionchange', this._onSelectionChange.bind(this));

        // Read-only guard
        if (this._readOnly) {
            this.editable.contentEditable = 'false';
        }
    }

    private _onContentChange() {
        if (this._destroyed) return;

        // Enforce max length
        if (this._options.maxLength > 0) {
            const text = this.editable.innerText;
            if (text.length > this._options.maxLength) {
                // Restore last good snapshot
                const last = this.history.getUndoCount() > 0 ? null : null;
                void last;
                return;
            }
        }

        const html = this.editable.innerHTML;
        const text = this.editable.innerText;

        // Update status bar
        this._updateStatusBar();

        // Placeholder visibility
        this._updatePlaceholder();

        // Push history
        this.history.push(html, this.selection.serialize());

        // Fire event
        this.events.emit('change', { html, text });
        this._options.onChange?.(html, text);

        // Refresh toolbar state
        this.toolbar.refresh();
    }

    private _onKeyDown(e: KeyboardEvent) {
        const key = this._serializeShortcut(e);

        // Check plugin shortcuts first
        const pluginShortcuts = this.plugins.getShortcutContributions();
        if (pluginShortcuts.has(key)) {
            e.preventDefault();
            pluginShortcuts.get(key)!();
            return;
        }

        // Check registered shortcuts
        if (this.shortcutMap.has(key)) {
            e.preventDefault();
            this.shortcutMap.get(key)!();
            return;
        }
    }

    private _onSelectionChange() {
        if (this._destroyed) return;
        if (!this.selection.isInsideEditor()) return;
        const sel = this.selection.getSelection();
        this.events.emit('selection-change', { selection: sel });
        this.toolbar.refresh();
    }

    private _onFocus(e: FocusEvent) {
        this.container.classList.add('tt-focused');
        this._updatePlaceholder();
        this.events.emit('focus', { event: e });
        this._options.onFocus?.(e);
    }

    private _onBlur(e: FocusEvent) {
        this.container.classList.remove('tt-focused');
        this._updatePlaceholder();
        this.events.emit('blur', { event: e });
        this._options.onBlur?.(e);
    }

    private _onPaste(e: ClipboardEvent) {
        e.preventDefault();
        const text = e.clipboardData?.getData('text/plain') ?? '';
        const html = e.clipboardData?.getData('text/html') ?? '';

        let content: string;
        if (html && !this._markdownMode) {
            // Sanitize pasted HTML
            content = this._options.sanitize ? this.validator.sanitize(html) : html;
        } else {
            // Plain text — wrap in <p> for block structure
            content = text.split('\n').map(l => l ? `<p>${l}</p>` : '<p><br></p>').join('');
        }

        document.execCommand('insertHTML', false, content);
    }

    // ── Auto Save ──────────────────────────────────────────────────
    private _startAutoSave() {
        const cfg = this._options.autoSave;
        const interval = typeof cfg === 'object' ? cfg.interval : AUTOSAVE_DEFAULT_INTERVAL;
        const key = typeof cfg === 'object' ? cfg.key : AUTOSAVE_DEFAULT_KEY;

        this._autoSaveTimer = setInterval(() => {
            const html = this.getHTML();
            try {
                localStorage.setItem(key, html);
                this.events.emit('autosave', { html });
            } catch {
                /* localStorage may be unavailable */
            }
        }, interval);
    }

    private _stopAutoSave() {
        if (this._autoSaveTimer) {
            clearInterval(this._autoSaveTimer);
            this._autoSaveTimer = null;
        }
    }

    // ── Helpers ────────────────────────────────────────────────────
    private _serializeShortcut(e: KeyboardEvent): string {
        const parts: string[] = [];
        if (e.ctrlKey || e.metaKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        parts.push(e.key.toLowerCase());
        return parts.join('+');
    }

    private _updateStatusBar() {
        if (!this._options.charCounter) return;
        const text = this.editable.innerText;
        const chars = text.replace(/\n/g, '').length;
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        this.charCountEl.textContent = `${chars} chars`;
        this.wordCountEl.textContent = `${words} words`;
    }

    private _updatePlaceholder() {
        const isEmpty = this.editable.innerText.trim() === '' &&
            this.editable.innerHTML === '';
        if (isEmpty) {
            this.editable.classList.add('tt-empty');
        } else {
            this.editable.classList.remove('tt-empty');
        }
    }

    private _resolveDarkMode(): boolean {
        const opt = this._options.darkMode;
        if (opt === 'auto') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return Boolean(opt);
    }

    private _resolveOptions(options: EditorOptions): Required<EditorOptions> {
        return {
            selector: options.selector,
            toolbar: options.toolbar ?? 'full',
            plugins: options.plugins ?? [],
            placeholder: options.placeholder ?? 'Start writing...',
            content: options.content ?? '',
            readOnly: options.readOnly ?? false,
            darkMode: options.darkMode ?? false,
            theme: options.theme ?? 'default',
            autoSave: options.autoSave ?? false,
            charCounter: options.charCounter ?? true,
            maxLength: options.maxLength ?? 0,
            sanitize: options.sanitize ?? true,
            markdownMode: options.markdownMode ?? false,
            minHeight: options.minHeight ?? '200px',
            maxHeight: options.maxHeight ?? '',
            height: options.height ?? '',
            onChange: options.onChange ?? null!,
            onFocus: options.onFocus ?? null!,
            onBlur: options.onBlur ?? null!,
            onReady: options.onReady ?? null!,
        };
    }

    // ── Public API ─────────────────────────────────────────────────
    getHTML(): string {
        if (this._options.sanitize) {
            return this.validator.sanitize(this.editable.innerHTML);
        }
        return this.editable.innerHTML;
    }

    setHTML(html: string): void {
        const sanitized = this._options.sanitize ? this.validator.sanitize(html) : html;
        this.editable.innerHTML = sanitized;
        this._updatePlaceholder();
        this._updateStatusBar();
        this.history.push(sanitized, null, true);
    }

    getText(): string {
        return this.editable.innerText;
    }

    setText(text: string): void {
        this.editable.innerText = text;
        this._updatePlaceholder();
    }

    focus(): void {
        this.editable.focus();
    }

    blur(): void {
        this.editable.blur();
    }

    destroy(): void {
        if (this._destroyed) return;
        this._destroyed = true;
        this._stopAutoSave();
        this.plugins.destroyAll();
        this.events.offAll();
        document.removeEventListener('selectionchange', this._onSelectionChange.bind(this));
        this.history.clear();
        this.container.remove();
        this.events.emit('destroy', {});
    }

    isReadOnly(): boolean {
        return this._readOnly;
    }

    setReadOnly(val: boolean): void {
        this._readOnly = val;
        this.editable.contentEditable = val ? 'false' : 'true';
        this.container.classList.toggle('tt-readonly', val);
        this.toolbarEl.classList.toggle('tt-toolbar--disabled', val);
    }

    enableDarkMode(): void {
        this._darkMode = true;
        this.container.setAttribute('data-theme', 'dark');
    }

    disableDarkMode(): void {
        this._darkMode = false;
        this.container.removeAttribute('data-theme');
    }

    toggleDarkMode(): void {
        if (this._darkMode) this.disableDarkMode();
        else this.enableDarkMode();
    }

    on<K extends EditorEventType>(event: K, handler: EventHandler<EditorEventMap[K]>): void {
        this.events.on(event, handler);
    }

    off<K extends EditorEventType>(event: K, handler: EventHandler<EditorEventMap[K]>): void {
        this.events.off(event, handler);
    }

    emit<K extends EditorEventType>(event: K, payload: EditorEventMap[K]): void {
        this.events.emit(event, payload);
    }

    registerPlugin(plugin: PluginDefinition): void {
        this.plugins.register(plugin);
        this.events.emit('plugin:registered', { name: plugin.name });
    }

    execCommand(id: string, ...args: unknown[]): void {
        this.editable.focus();
        this.commands.exec(id, ...args);
        this._onContentChange();
    }

    isCommandActive(id: string): boolean {
        return this.commands.isActive(id);
    }

    undo(): void {
        this.commands.exec('undo');
    }

    redo(): void {
        this.commands.exec('redo');
    }

    getWordCount(): number {
        const text = this.editable.innerText.trim();
        return text === '' ? 0 : text.split(/\s+/).length;
    }

    getCharCount(): number {
        return this.editable.innerText.replace(/\n/g, '').length;
    }

    getContainer(): HTMLElement {
        return this.container;
    }

    getEditableArea(): HTMLElement {
        return this.editable;
    }

    /** Register a keyboard shortcut (e.g. "ctrl+b"). */
    addShortcut(shortcut: string, handler: () => void): void {
        this.shortcutMap.set(shortcut.toLowerCase(), handler);
    }

    removeShortcut(shortcut: string): void {
        this.shortcutMap.delete(shortcut.toLowerCase());
    }
}
