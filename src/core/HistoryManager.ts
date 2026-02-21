import type { HistorySnapshot, SerializedSelection } from './types';

const DEFAULT_MAX_SIZE = 200;
const DEBOUNCE_MS = 300;

/**
 * HistoryManager — undo/redo stack with snapshot-based history.
 * Snapshots store full innerHTML + serialized selection.
 * Debounced push prevents flooding the stack on rapid keystrokes.
 */
export class HistoryManager {
    private readonly undoStack: HistorySnapshot[] = [];
    private readonly redoStack: HistorySnapshot[] = [];
    private readonly maxSize: number;
    private debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private locked = false;

    constructor(maxSize = DEFAULT_MAX_SIZE) {
        this.maxSize = maxSize;
    }

    /**
     * Push a snapshot to the undo stack.
     * Calls are debounced so rapid keystrokes don't flood the stack.
     */
    push(html: string, selection: SerializedSelection | null = null, immediate = false): void {
        if (this.locked) return;

        const doPush = () => {
            // Don't push duplicate states
            const last = this.undoStack[this.undoStack.length - 1];
            if (last && last.html === html) return;

            this.undoStack.push({ html, selection, timestamp: Date.now() });
            // Clear redo stack on new action
            this.redoStack.length = 0;

            // Trim if over limit
            if (this.undoStack.length > this.maxSize) {
                this.undoStack.shift();
            }
        };

        if (immediate) {
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = null;
            }
            doPush();
            return;
        }

        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(doPush, DEBOUNCE_MS);
    }

    /**
     * Undo: pop from undoStack, push current to redoStack, return previous snapshot.
     */
    undo(currentHtml: string, currentSelection: SerializedSelection | null): HistorySnapshot | null {
        if (this.undoStack.length === 0) return null;

        // Save current state to redo stack
        this.redoStack.push({ html: currentHtml, selection: currentSelection, timestamp: Date.now() });

        const snapshot = this.undoStack.pop()!;
        return snapshot;
    }

    /**
     * Redo: pop from redoStack, push current to undoStack, return next snapshot.
     */
    redo(currentHtml: string, currentSelection: SerializedSelection | null): HistorySnapshot | null {
        if (this.redoStack.length === 0) return null;

        // Save current state to undo stack
        this.undoStack.push({ html: currentHtml, selection: currentSelection, timestamp: Date.now() });

        const snapshot = this.redoStack.pop()!;
        return snapshot;
    }

    canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    clear(): void {
        this.undoStack.length = 0;
        this.redoStack.length = 0;
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
    }

    /** Lock the history temporarily (e.g. during undo/redo restoration) */
    lock(): void {
        this.locked = true;
    }

    unlock(): void {
        this.locked = false;
    }

    getUndoCount(): number {
        return this.undoStack.length;
    }

    getRedoCount(): number {
        return this.redoStack.length;
    }
}
