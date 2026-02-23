// ─────────────────────────────────────────────
// Core Type Definitions for TinyText Editor
// ─────────────────────────────────────────────

export type EditorEventType =
    | 'change'
    | 'focus'
    | 'blur'
    | 'selection-change'
    | 'ready'
    | 'destroy'
    | 'plugin:registered'
    | 'history:undo'
    | 'history:redo'
    | 'autosave';

export interface EditorEventMap {
    change: { html: string; text: string };
    focus: { event: FocusEvent };
    blur: { event: FocusEvent };
    'selection-change': { selection: Selection | null };
    ready: { editor: unknown };
    destroy: Record<string, never>;
    'plugin:registered': { name: string };
    'history:undo': Record<string, never>;
    'history:redo': Record<string, never>;
    autosave: { html: string };
}

export type EventHandler<T = unknown> = (payload: T) => void;

// ── Toolbar ─────────────────────────────────
export type ToolbarItem =
    | 'bold' | 'italic' | 'underline' | 'strikethrough'
    | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    | 'paragraph'
    | 'align-left' | 'align-center' | 'align-right' | 'align-justify'
    | 'ordered-list' | 'unordered-list'
    | 'blockquote'
    | 'code-block'
    | 'link'
    | 'image'
    | 'table'
    | 'undo' | 'redo'
    | 'separator'
    | 'forecolor' | 'hilitecolor'
    | string; // for custom plugin buttons

export interface ToolbarGroup {
    items: ToolbarItem[];
    label?: string;
}

// ── Plugin ───────────────────────────────────
export interface PluginContext {
    editor: EditorInstance;
    toolbar: ToolbarAPI;
    events: EventBusAPI;
    commands: CommandAPI;
}

export interface PluginDefinition {
    name: string;
    version?: string;
    init(ctx: PluginContext): void;
    destroy?(): void;
    toolbarItems?: Record<string, ToolbarButtonConfig>;
    shortcuts?: Record<string, () => void>;
}

// ── Commands ─────────────────────────────────
export interface CommandDefinition {
    id: string;
    execute(...args: unknown[]): void;
    undo?(): void;
    isActive?(): boolean;
    isEnabled?(): boolean;
}

// ── History ──────────────────────────────────
export interface HistorySnapshot {
    html: string;
    selection: SerializedSelection | null;
    timestamp: number;
}

export interface SerializedSelection {
    anchorPath: number[];
    anchorOffset: number;
    focusPath: number[];
    focusOffset: number;
}

// ── Editor Options ───────────────────────────
export interface EditorOptions {
    selector: string | HTMLElement;
    toolbar?: ToolbarItem[] | 'full' | 'minimal' | 'none';
    plugins?: (string | PluginDefinition)[];
    placeholder?: string;
    content?: string;
    readOnly?: boolean;
    darkMode?: boolean | 'auto';
    theme?: string;
    autoSave?: boolean | { interval: number; key: string };
    charCounter?: boolean;
    maxLength?: number;
    sanitize?: boolean;
    markdownMode?: boolean;
    minHeight?: string;
    maxHeight?: string;
    height?: string;
    onChange?: (html: string, text: string) => void;
    onFocus?: (e: FocusEvent) => void;
    onBlur?: (e: FocusEvent) => void;
    onReady?: (editor: EditorInstance) => void;
}

// ── Public API ───────────────────────────────
export interface EditorInstance {
    getHTML(): string;
    setHTML(html: string): void;
    getText(): string;
    setText(text: string): void;
    focus(): void;
    blur(): void;
    destroy(): void;
    isReadOnly(): boolean;
    setReadOnly(val: boolean): void;
    enableDarkMode(): void;
    disableDarkMode(): void;
    toggleDarkMode(): void;
    on<K extends EditorEventType>(event: K, handler: EventHandler<EditorEventMap[K]>): void;
    off<K extends EditorEventType>(event: K, handler: EventHandler<EditorEventMap[K]>): void;
    emit<K extends EditorEventType>(event: K, payload: EditorEventMap[K]): void;
    registerPlugin(plugin: PluginDefinition): void;
    execCommand(id: string, ...args: unknown[]): void;
    isCommandActive(id: string): boolean;
    undo(): void;
    redo(): void;
    getWordCount(): number;
    getCharCount(): number;
    getContainer(): HTMLElement;
    getEditableArea(): HTMLElement;
    addShortcut(shortcut: string, handler: () => void): void;
}

// ── Toolbar API ──────────────────────────────
export interface ToolbarButtonConfig {
    icon: string;
    label: string;
    command?: string;
    commandArgs?: unknown[];
    action?: () => void;
    isActive?: () => boolean;
    isEnabled?: () => boolean;
    type?: 'button' | 'dropdown' | 'select' | 'color';
    options?: Array<{ label: string; value: string; action: () => void }>;
    className?: string;
}

export interface ToolbarAPI {
    addButton(id: string, config: ToolbarButtonConfig): void;
    removeButton(id: string): void;
    refresh(): void;
}

// ── EventBus API ─────────────────────────────
export interface EventBusAPI {
    on<K extends EditorEventType>(event: K, handler: EventHandler<EditorEventMap[K]>): void;
    off<K extends EditorEventType>(event: K, handler: EventHandler<EditorEventMap[K]>): void;
    emit<K extends EditorEventType>(event: K, payload: EditorEventMap[K]): void;
}

// ── Command API ──────────────────────────────
export interface CommandAPI {
    register(def: CommandDefinition): void;
    exec(id: string, ...args: unknown[]): void;
    isActive(id: string): boolean;
    isEnabled(id: string): boolean;
}
