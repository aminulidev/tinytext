# TinyText Editor

<div align="center">
  <h3>A modern, lightweight, feature-rich WYSIWYG rich text editor</h3>
  <p>TypeScript · Vanilla JS · ContentEditable · Plugin Architecture · Zero Dependencies</p>

  [![npm version](https://img.shields.io/npm/v/@aminulidev/tinytext.svg)](https://www.npmjs.com/package/@aminulidev/tinytext)
  [![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
</div>

---

## ✨ Features

### Core Formatting
- **Bold**, *Italic*, Underline, ~~Strikethrough~~
- Headings H1–H6
- Text alignment (left, center, right, justify)
- Lists (ordered & unordered)
- Blockquote
- Code block with syntax styling
- Text & highlight color pickers

### Rich Content
- 🔗 Link insert/edit with target options
- 🖼 Image upload (URL or base64/file upload with drag & drop)
- 📊 Table support with context menu (insert rows/cols, delete)

### Editor Capabilities
- ↩ Undo / ↪ Redo with debounced history
- ⌨️ Full keyboard shortcuts
- 📝 Placeholder support
- 🔢 Character & word counter
- 💾 Auto-save to localStorage
- 🧹 HTML sanitization
- 📖 Markdown import/export (via plugin)
- 🔒 Read-only mode
- 📱 Mobile responsive

### Developer Experience
- 🧩 Plugin system (`registerPlugin` API)
- 🎨 Custom toolbar configuration
- 🌙 Dark mode (manual or `'auto'`)
- 🎭 CSS variable theming
- 📦 ESM + CJS + TypeScript types
- 🌲 Tree-shakable

---

## 📦 Installation

```bash
npm install @aminulidev/tinytext
```

---

## 🚀 Quick Start

### HTML

```html
<link rel="stylesheet" href="node_modules/@aminulidev/tinytext/dist/tinytext.css">
<div id="editor"></div>
```

### JavaScript / TypeScript

```ts
import { TinyTextEditor } from '@aminulidev/tinytext';
import '@aminulidev/tinytext/dist/tinytext.css';

const editor = new TinyTextEditor({
  selector: '#editor',
  toolbar: 'full',
  placeholder: 'Start writing...',
});

// Get HTML output
const html = editor.getHTML();

// Set HTML content
editor.setHTML('<p>Hello, <strong>world</strong>!</p>');
```

### Or use the factory function

```ts
import { createEditor } from '@aminulidev/tinytext';

const editor = createEditor({ selector: '#editor' });
```

---

## ⚙️ Configuration

```ts
const editor = new TinyTextEditor({
  // Required
  selector: '#editor',           // CSS selector or HTMLElement

  // Toolbar
  toolbar: 'full',               // 'full' | 'minimal' | 'none' | ToolbarItem[]

  // Content
  content: '<p>Initial content</p>',
  placeholder: 'Start writing...',

  // Behavior
  readOnly: false,
  sanitize: true,                // Sanitize HTML input/output
  markdownMode: false,

  // Appearance
  darkMode: 'auto',              // true | false | 'auto'
  theme: 'default',
  minHeight: '200px',
  maxHeight: '600px',

  // Features
  charCounter: true,             // Show word/char count
  maxLength: 0,                  // 0 = unlimited
  autoSave: {
    interval: 30000,             // ms
    key: 'my_editor_save',       // localStorage key
  },

  // Plugins
  plugins: [TablePlugin, MarkdownPlugin],

  // Events
  onChange: (html, text) => console.log('Changed:', html),
  onFocus: (e) => console.log('Focused'),
  onBlur: (e) => console.log('Blurred'),
  onReady: (editor) => console.log('Ready!', editor),
});
```

---

## 🛠 Custom Toolbar

```ts
import { TinyTextEditor } from '@aminulidev/tinytext';

const editor = new TinyTextEditor({
  selector: '#editor',
  toolbar: [
    'bold', 'italic', 'underline', 'strikethrough', 'separator',
    'h1', 'h2', 'h3', 'separator',
    'align-left', 'align-center', 'align-right', 'separator',
    'unordered-list', 'ordered-list', 'blockquote', 'separator',
    'link', 'image', 'table', 'separator',
    'undo', 'redo',
  ],
});
```

**All available toolbar items:**  
`bold` `italic` `underline` `strikethrough` `h1`–`h6` `paragraph`  
`align-left` `align-center` `align-right` `align-justify`  
`ordered-list` `unordered-list` `blockquote` `code-block`  
`link` `image` `table` `undo` `redo` `forecolor` `hilitecolor` `separator`

---

## 🧩 Plugin System

```ts
import type { PluginDefinition } from '@aminulidev/tinytext';

const MyPlugin: PluginDefinition = {
  name: 'my-plugin',
  version: '1.0.0',

  init(ctx) {
    // ctx.editor   — Editor instance
    // ctx.toolbar  — Toolbar API
    // ctx.events   — EventBus API
    // ctx.commands — Command API

    // Register a custom command
    ctx.commands.register({
      id: 'my-command',
      execute: () => console.log('Executed!'),
      isActive: () => false,
      isEnabled: () => true,
    });

    // Add a toolbar button
    ctx.toolbar.addButton('my-btn', {
      icon: '<svg>...</svg>',
      label: 'My Button',
      command: 'my-command',
    });

    // Listen to events
    ctx.events.on('change', ({ html, text }) => {
      console.log('Content changed:', text.length, 'chars');
    });

    // Register a keyboard shortcut
    ctx.editor.addShortcut('ctrl+shift+m', () => {
      ctx.editor.execCommand('my-command');
    });
  },

  destroy() {
    // Cleanup
  },
};

// Use it
const editor = new TinyTextEditor({
  selector: '#editor',
  plugins: [MyPlugin],
});
```

---

## 📡 Event System

```ts
editor.on('change', ({ html, text }) => {
  console.log('New content:', html);
});

editor.on('focus', ({ event }) => {});
editor.on('blur',  ({ event }) => {});
editor.on('selection-change', ({ selection }) => {});
editor.on('history:undo', () => {});
editor.on('history:redo', () => {});
editor.on('autosave', ({ html }) => {});
editor.on('ready', ({ editor }) => {});
editor.on('plugin:registered', ({ name }) => {});

// Remove listener
editor.off('change', myHandler);
```

---

## 🔌 Built-in Plugins

### TablePlugin
Adds right-click context menu to tables:  
Insert/delete rows and columns, Tab navigation, keyboard shortcuts.

```ts
import { TinyTextEditor, TablePlugin } from '@aminulidev/tinytext';

const editor = new TinyTextEditor({
  selector: '#editor',
  plugins: [TablePlugin],
});
```

### MarkdownPlugin
- Live Markdown shortcut conversion (type `## ` for headings, `` ``` `` for code blocks, etc.)
- Export HTML as `.md` file
- Import `.md` files

```ts
import { TinyTextEditor, MarkdownPlugin } from '@aminulidev/tinytext';

const editor = new TinyTextEditor({
  selector: '#editor',
  plugins: [MarkdownPlugin],
});
```

---

## 🎨 Theming

TinyText uses CSS custom properties — override any token:

```css
#my-editor .tt-editor {
  --tt-accent: #10b981;           /* Green theme */
  --tt-border-focus: #10b981;
  --tt-btn-active-bg: #10b981;
  --tt-blockquote-border: #10b981;
  --tt-font: 'Georgia', serif;
  --tt-radius: 4px;               /* Sharper corners */
}
```

**Dark mode** is applied by adding `data-theme="dark"` to the container:

```ts
editor.enableDarkMode();   // Enable
editor.disableDarkMode();  // Disable
editor.toggleDarkMode();   // Toggle
// Or: darkMode: 'auto' — respects prefers-color-scheme
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut             | Action              |
|----------------------|---------------------|
| `Ctrl+B`             | Bold                |
| `Ctrl+I`             | Italic              |
| `Ctrl+U`             | Underline           |
| `Ctrl+Shift+S`       | Strikethrough       |
| `Ctrl+Z`             | Undo                |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo         |
| `Ctrl+Shift+L`       | Align Left          |
| `Ctrl+Shift+E`       | Align Center        |
| `Ctrl+Shift+R`       | Align Right         |
| `Ctrl+Shift+J`       | Justify             |
| `` Ctrl+` ``         | Code Block          |
| `Ctrl+Shift+.`       | Blockquote          |
| `Ctrl+Shift+7`       | Ordered List        |
| `Ctrl+Shift+8`       | Unordered List      |
| `Ctrl+A`             | Select All          |

---

## 📐 Project Structure

```
tinytext/
├── src/
│   ├── core/
│   │   ├── types.ts             # All TypeScript types
│   │   ├── Editor.ts            # Core Editor class
│   │   ├── EventBus.ts          # Type-safe event system
│   │   ├── SelectionManager.ts  # Selection API wrapper
│   │   ├── CommandManager.ts    # Command registry
│   │   ├── HistoryManager.ts    # Undo/redo stack
│   │   ├── PluginManager.ts     # Plugin lifecycle
│   │   ├── SchemaValidator.ts   # HTML sanitizer
│   │   └── commands.ts          # Built-in command registrations
│   ├── ui/
│   │   ├── Toolbar.ts           # Toolbar renderer + icons
│   │   └── modals/
│   │       ├── BaseModal.ts     # Modal base class
│   │       ├── LinkModal.ts     # Link insert/edit modal
│   │       ├── ImageModal.ts    # Image modal (URL + upload)
│   │       └── TableModal.ts    # Table insert modal
│   ├── plugins/
│   │   ├── TablePlugin.ts       # Table context menu + tab nav
│   │   └── MarkdownPlugin.ts    # Markdown mode + import/export
│   ├── themes/
│   │   └── tinytext.css         # Complete editor stylesheet
│   ├── utils/
│   │   ├── dom.ts               # DOM helpers
│   │   └── markdown.ts          # MD ↔ HTML converter
│   └── index.ts                 # Package entry point
├── examples/
│   └── WordCountPlugin.ts       # Example custom plugin
├── demo/
│   └── index.html               # Interactive demo page
├── rollup.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🔨 Building from Source

```bash
# Install dependencies
npm install

# Development (watch mode)
npm run dev

# Production build
npm run build

# Generate type declarations only
npm run build:types
```

---

## 📤 Publishing to npm

```bash
# 1. Build the package
npm run build

# 2. Check what will be published
npm pack --dry-run

# 3. Login to npm
npm login

# 4. Publish
npm publish --access public
```

---

## 📄 License

MIT © [aminulidev](https://www.npmjs.com/~aminulidev)
