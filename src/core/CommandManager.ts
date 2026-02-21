import type { CommandDefinition } from './types';

/**
 * CommandManager — central registry for all editor commands.
 * Executes document.execCommand() or custom actions and tracks active state.
 */
export class CommandManager {
    private readonly registry = new Map<string, CommandDefinition>();

    register(def: CommandDefinition): void {
        if (this.registry.has(def.id)) {
            console.warn(`[TinyText] Command "${def.id}" is already registered. Overwriting.`);
        }
        this.registry.set(def.id, def);
    }

    unregister(id: string): void {
        this.registry.delete(id);
    }

    exec(id: string, ...args: unknown[]): void {
        const cmd = this.registry.get(id);
        if (!cmd) {
            console.warn(`[TinyText] Unknown command: "${id}"`);
            return;
        }
        if (cmd.isEnabled && !cmd.isEnabled()) return;
        try {
            cmd.execute(...args);
        } catch (err) {
            console.error(`[TinyText] Error executing command "${id}":`, err);
        }
    }

    isActive(id: string): boolean {
        const cmd = this.registry.get(id);
        return cmd?.isActive?.() ?? false;
    }

    isEnabled(id: string): boolean {
        const cmd = this.registry.get(id);
        return cmd?.isEnabled?.() ?? true;
    }

    has(id: string): boolean {
        return this.registry.has(id);
    }

    getAll(): CommandDefinition[] {
        return [...this.registry.values()];
    }
}
