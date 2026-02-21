import type { EditorEventType, EditorEventMap, EventHandler } from './types';

type WildcardHandler = (event: string, payload: unknown) => void;

interface ListenerEntry<T = unknown> {
    handler: EventHandler<T>;
    once: boolean;
}

export class EventBus {
    private readonly listeners = new Map<string, ListenerEntry[]>();
    private readonly wildcardListeners: Array<{ handler: WildcardHandler; once: boolean }> = [];

    on<K extends EditorEventType>(event: K, handler: EventHandler<EditorEventMap[K]>): this {
        return this._addListener(event, handler as EventHandler, false);
    }

    once<K extends EditorEventType>(event: K, handler: EventHandler<EditorEventMap[K]>): this {
        return this._addListener(event, handler as EventHandler, true);
    }

    onAny(handler: WildcardHandler): this {
        this.wildcardListeners.push({ handler, once: false });
        return this;
    }

    off<K extends EditorEventType>(event: K, handler: EventHandler<EditorEventMap[K]>): this {
        const entries = this.listeners.get(event);
        if (!entries) return this;
        const idx = entries.findIndex((e) => e.handler === handler);
        if (idx !== -1) entries.splice(idx, 1);
        if (entries.length === 0) this.listeners.delete(event);
        return this;
    }

    offAll(event?: EditorEventType): this {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
            this.wildcardListeners.length = 0;
        }
        return this;
    }

    emit<K extends EditorEventType>(event: K, payload: EditorEventMap[K]): this {
        const entries = this.listeners.get(event);
        if (entries) {
            const snapshot = [...entries];
            for (const entry of snapshot) {
                try {
                    entry.handler(payload);
                } catch (err) {
                    console.error(`[TinyText] EventBus handler error for event "${event}":`, err);
                }
                if (entry.once) {
                    const idx = entries.indexOf(entry);
                    if (idx !== -1) entries.splice(idx, 1);
                }
            }
        }

        // Wildcard listeners
        for (const wc of [...this.wildcardListeners]) {
            try {
                wc.handler(event, payload);
            } catch (err) {
                console.error(`[TinyText] Wildcard listener error:`, err);
            }
        }

        return this;
    }

    listenerCount(event: EditorEventType): number {
        return this.listeners.get(event)?.length ?? 0;
    }

    private _addListener(event: string, handler: EventHandler, once: boolean): this {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push({ handler, once });
        return this;
    }
}
