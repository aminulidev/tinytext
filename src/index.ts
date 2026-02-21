/**
 * TinyText — Main Entry Point
 * Exports the editor class, plugins, and type definitions.
 */

// Styles (imported once, processed by bundler)
import './themes/tinytext.css';

// ── Core ──────────────────────────────────────────────────────
export { TinyTextEditor } from './core/Editor';
export { EventBus } from './core/EventBus';
export { SelectionManager } from './core/SelectionManager';
export { CommandManager } from './core/CommandManager';
export { HistoryManager } from './core/HistoryManager';
export { PluginManager } from './core/PluginManager';
export { SchemaValidator } from './core/SchemaValidator';

// ── UI ────────────────────────────────────────────────────────
export { Toolbar, ICONS } from './ui/Toolbar';
export { BaseModal } from './ui/modals/BaseModal';
export { LinkModal } from './ui/modals/LinkModal';
export { ImageModal } from './ui/modals/ImageModal';
export { TableModal } from './ui/modals/TableModal';

// ── Plugins ───────────────────────────────────────────────────
export { TablePlugin } from './plugins/TablePlugin';
export { MarkdownPlugin } from './plugins/MarkdownPlugin';

// ── Utilities ─────────────────────────────────────────────────
export * from './utils/dom';
export { markdownToHtml, htmlToMarkdown } from './utils/markdown';

// ── Types ─────────────────────────────────────────────────────
export type {
    EditorOptions,
    EditorInstance,
    EditorEventType,
    EditorEventMap,
    EventHandler,
    PluginDefinition,
    PluginContext,
    ToolbarItem,
    ToolbarButtonConfig,
    ToolbarAPI,
    EventBusAPI,
    CommandAPI,
    CommandDefinition,
    HistorySnapshot,
    SerializedSelection,
} from './core/types';

// ── Factory function (convenience) ────────────────────────────
import { TinyTextEditor } from './core/Editor';
import type { EditorOptions } from './core/types';

/**
 * Create a new TinyText editor instance.
 *
 * @example
 * ```ts
 * const editor = createEditor({
 *   selector: '#editor',
 *   toolbar: ['bold', 'italic', 'underline', 'link', 'image'],
 *   placeholder: 'Start writing...',
 * });
 * ```
 */
export function createEditor(options: EditorOptions): TinyTextEditor {
    return new TinyTextEditor(options);
}

// Default export for UMD/CDN usage
export default TinyTextEditor;
