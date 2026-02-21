import type { PluginDefinition, PluginContext } from './types';

/**
 * PluginManager — registers, initializes, and destroys editor plugins.
 */
export class PluginManager {
    private readonly plugins = new Map<string, PluginDefinition>();
    private context!: PluginContext;

    setContext(ctx: PluginContext): void {
        this.context = ctx;
    }

    register(plugin: PluginDefinition): void {
        if (this.plugins.has(plugin.name)) {
            console.warn(`[TinyText] Plugin "${plugin.name}" already registered. Skipping.`);
            return;
        }
        this.plugins.set(plugin.name, plugin);

        // Initialize immediately if context is ready
        if (this.context) {
            this._init(plugin);
        }
    }

    initAll(): void {
        for (const plugin of this.plugins.values()) {
            this._init(plugin);
        }
    }

    destroy(name: string): void {
        const plugin = this.plugins.get(name);
        if (plugin?.destroy) {
            try {
                plugin.destroy();
            } catch (err) {
                console.error(`[TinyText] Error destroying plugin "${name}":`, err);
            }
        }
        this.plugins.delete(name);
    }

    destroyAll(): void {
        for (const name of this.plugins.keys()) {
            this.destroy(name);
        }
    }

    has(name: string): boolean {
        return this.plugins.has(name);
    }

    get(name: string): PluginDefinition | undefined {
        return this.plugins.get(name);
    }

    getAll(): PluginDefinition[] {
        return [...this.plugins.values()];
    }

    /**
     * Collect all custom toolbar items contributed by plugins.
     */
    getToolbarContributions(): Map<string, import('./types').ToolbarButtonConfig> {
        const merged = new Map<string, import('./types').ToolbarButtonConfig>();
        for (const plugin of this.plugins.values()) {
            if (plugin.toolbarItems) {
                for (const [id, config] of Object.entries(plugin.toolbarItems)) {
                    merged.set(id, config);
                }
            }
        }
        return merged;
    }

    /**
     * Collect all shortcuts contributed by plugins.
     */
    getShortcutContributions(): Map<string, () => void> {
        const merged = new Map<string, () => void>();
        for (const plugin of this.plugins.values()) {
            if (plugin.shortcuts) {
                for (const [key, handler] of Object.entries(plugin.shortcuts)) {
                    merged.set(key, handler);
                }
            }
        }
        return merged;
    }

    private _init(plugin: PluginDefinition): void {
        try {
            plugin.init(this.context);
        } catch (err) {
            console.error(`[TinyText] Error initializing plugin "${plugin.name}":`, err);
        }
    }
}
