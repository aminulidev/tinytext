import type { CommandManager } from './CommandManager';
import type { SelectionManager } from './SelectionManager';
import type { HistoryManager } from './HistoryManager';
import type { TinyTextEditor } from './Editor';

/**
 * Registers all built-in editor commands.
 */
export function registerBuiltinCommands(
    commands: CommandManager,
    selection: SelectionManager,
    history: HistoryManager,
    editor: TinyTextEditor,
): void {

    // ── Format commands ─────────────────────────────────────────────
    const formatCmd = (cmd: string) => ({
        execute: () => document.execCommand(cmd, false),
        isActive: () => document.queryCommandState(cmd),
        isEnabled: () => !editor.isReadOnly(),
    });

    commands.register({ id: 'bold', ...formatCmd('bold') });
    commands.register({ id: 'italic', ...formatCmd('italic') });
    commands.register({ id: 'underline', ...formatCmd('underline') });
    commands.register({ id: 'strikethrough', ...formatCmd('strikeThrough') });
    commands.register({ id: 'subscript', ...formatCmd('subscript') });
    commands.register({ id: 'superscript', ...formatCmd('superscript') });
    commands.register({ id: 'removeFormat', ...formatCmd('removeFormat') });

    // ── Block format ────────────────────────────────────────────────
    const blockCmd = (tag: string) => ({
        execute: () => document.execCommand('formatBlock', false, tag),
        isActive: () => document.queryCommandValue('formatBlock').toLowerCase() === tag.toLowerCase(),
        isEnabled: () => !editor.isReadOnly(),
    });

    commands.register({ id: 'h1', ...blockCmd('H1') });
    commands.register({ id: 'h2', ...blockCmd('H2') });
    commands.register({ id: 'h3', ...blockCmd('H3') });
    commands.register({ id: 'h4', ...blockCmd('H4') });
    commands.register({ id: 'h5', ...blockCmd('H5') });
    commands.register({ id: 'h6', ...blockCmd('H6') });
    commands.register({ id: 'paragraph', ...blockCmd('P') });
    commands.register({ id: 'blockquote', ...blockCmd('BLOCKQUOTE') });
    commands.register({ id: 'pre', ...blockCmd('PRE') });

    // ── Code block ─────────────────────────────────────────────────
    commands.register({
        id: 'code-block',
        execute() {
            const editable = editor.getEditableArea();
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;

            const alreadyInPre = !!selection.getClosestAncestor('pre');
            if (alreadyInPre) {
                document.execCommand('formatBlock', false, 'P');
                return;
            }

            const range = sel.getRangeAt(0);
            const selectedText = range.toString() || '\u200B';
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.textContent = selectedText;
            pre.appendChild(code);

            range.deleteContents();
            range.insertNode(pre);

            // Move caret inside code
            const newRange = document.createRange();
            newRange.setStart(code, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            void editable;
        },
        isActive: () => !!selection.getClosestAncestor('pre'),
        isEnabled: () => !editor.isReadOnly(),
    });

    // ── Alignment ───────────────────────────────────────────────────
    commands.register({ id: 'align-left', execute: () => document.execCommand('justifyLeft', false), isActive: () => document.queryCommandState('justifyLeft'), isEnabled: () => !editor.isReadOnly() });
    commands.register({ id: 'align-center', execute: () => document.execCommand('justifyCenter', false), isActive: () => document.queryCommandState('justifyCenter'), isEnabled: () => !editor.isReadOnly() });
    commands.register({ id: 'align-right', execute: () => document.execCommand('justifyRight', false), isActive: () => document.queryCommandState('justifyRight'), isEnabled: () => !editor.isReadOnly() });
    commands.register({ id: 'align-justify', execute: () => document.execCommand('justifyFull', false), isActive: () => document.queryCommandState('justifyFull'), isEnabled: () => !editor.isReadOnly() });

    // ── Lists ───────────────────────────────────────────────────────
    commands.register({ id: 'ordered-list', execute: () => document.execCommand('insertOrderedList', false), isActive: () => document.queryCommandState('insertOrderedList'), isEnabled: () => !editor.isReadOnly() });
    commands.register({ id: 'unordered-list', execute: () => document.execCommand('insertUnorderedList', false), isActive: () => document.queryCommandState('insertUnorderedList'), isEnabled: () => !editor.isReadOnly() });

    // ── Indent ──────────────────────────────────────────────────────
    commands.register({ id: 'indent', execute: () => document.execCommand('indent', false), isEnabled: () => !editor.isReadOnly() });
    commands.register({ id: 'outdent', execute: () => document.execCommand('outdent', false), isEnabled: () => !editor.isReadOnly() });

    // ── Color ───────────────────────────────────────────────────────
    commands.register({
        id: 'forecolor',
        execute: (color: unknown) => document.execCommand('foreColor', false, String(color ?? '#000000')),
        isEnabled: () => !editor.isReadOnly(),
    });
    commands.register({
        id: 'hilitecolor',
        execute: (color: unknown) => document.execCommand('hiliteColor', false, String(color ?? '#ffff00')),
        isEnabled: () => !editor.isReadOnly(),
    });

    // ── Font ────────────────────────────────────────────────────────
    commands.register({
        id: 'fontname',
        execute: (font: unknown) => document.execCommand('fontName', false, String(font ?? 'Inter')),
        isActive: () => document.queryCommandValue('fontName') !== '',
        isEnabled: () => !editor.isReadOnly(),
    });

    commands.register({
        id: 'fontsize',
        execute: (size: unknown) => document.execCommand('fontSize', false, String(size ?? '3')),
        isEnabled: () => !editor.isReadOnly(),
    });

    // ── Misc ────────────────────────────────────────────────────────
    commands.register({
        id: 'print',
        execute: () => window.print(),
        isEnabled: () => true,
    });

    // ── Undo / Redo ─────────────────────────────────────────────────
    commands.register({
        id: 'undo',
        execute() {
            const snapshot = history.undo(
                editor.getEditableArea().innerHTML,
                selection.serialize(),
            );
            if (!snapshot) return;
            history.lock();
            editor.getEditableArea().innerHTML = snapshot.html;
            if (snapshot.selection) selection.deserialize(snapshot.selection);
            history.unlock();
            editor.emit('history:undo', {});
        },
        isEnabled: () => history.canUndo(),
    });

    commands.register({
        id: 'redo',
        execute() {
            const snapshot = history.redo(
                editor.getEditableArea().innerHTML,
                selection.serialize(),
            );
            if (!snapshot) return;
            history.lock();
            editor.getEditableArea().innerHTML = snapshot.html;
            if (snapshot.selection) selection.deserialize(snapshot.selection);
            history.unlock();
            editor.emit('history:redo', {});
        },
        isEnabled: () => history.canRedo(),
    });

    // ── Select all ─────────────────────────────────────────────────
    commands.register({
        id: 'selectAll',
        execute: () => selection.selectAll(),
        isEnabled: () => !editor.isReadOnly(),
    });

    // ── Clear ───────────────────────────────────────────────────────
    commands.register({
        id: 'clear',
        execute() {
            editor.getEditableArea().innerHTML = '';
        },
        isEnabled: () => !editor.isReadOnly(),
    });

    // ── Register default keyboard shortcuts ─────────────────────────
    const shortcuts: Record<string, string> = {
        'ctrl+b': 'bold',
        'ctrl+i': 'italic',
        'ctrl+u': 'underline',
        'ctrl+shift+s': 'strikethrough',
        'ctrl+z': 'undo',
        'ctrl+y': 'redo',
        'ctrl+shift+z': 'redo',
        'ctrl+shift+l': 'align-left',
        'ctrl+shift+e': 'align-center',
        'ctrl+shift+r': 'align-right',
        'ctrl+shift+j': 'align-justify',
        'ctrl+shift+7': 'ordered-list',
        'ctrl+shift+8': 'unordered-list',
        'ctrl+shift+.': 'blockquote',
        'ctrl+`': 'code-block',
        'ctrl+a': 'selectAll',
    };

    for (const [shortcut, commandId] of Object.entries(shortcuts)) {
        editor.addShortcut(shortcut, () => editor.execCommand(commandId));
    }
}
