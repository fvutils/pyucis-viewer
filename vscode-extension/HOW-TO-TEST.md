# Testing the PyUCIS VSCode Extension

## Method 1: Debug/Test from Source (Recommended for Development)

### Quick Start:

1. **Open the extension folder in VS Code:**
   ```bash
   cd vscode-extension
   code .
   ```

2. **Press F5** (or Run → Start Debugging)
   - This launches a new "Extension Development Host" window
   - The extension will be active in that window
   - You can set breakpoints and debug

3. **In the Extension Development Host window:**
   - Open a folder/workspace: `File → Open Folder`
   - Navigate to `../examples/` (contains sample.ucisdb)
   - The extension should auto-activate and discover the database

### Detailed Steps:

1. **From the `vscode-extension` directory:**
   ```bash
   # Make sure dependencies are installed
   npm install
   
   # Compile TypeScript to JavaScript
   npm run compile
   
   # Open in VS Code
   code .
   ```

2. **In VS Code:**
   - Go to **Run and Debug** panel (Ctrl+Shift+D)
   - Select "Run Extension" from dropdown
   - Click green play button (or press F5)

3. **A new window opens** - This is the Extension Development Host
   - Your extension runs here
   - Original window shows debug console/logs

4. **Open the examples folder:**
   - In the Extension Development Host window
   - `File → Open Folder...`
   - Navigate to the `examples/` directory (one level up)
   - Click "Select Folder"

5. **Verify extension is working:**
   - Check activity bar for PyUCIS icon (if added) or check View menu
   - Open Command Palette (Ctrl+Shift+P)
   - Type "PyUCIS" - you should see 19 commands
   - Look for "PYUCIS DATABASES" and "COVERAGE" views in Explorer sidebar

---

## Method 2: Install as VSIX (End-User Experience)

### Quick Start:

```bash
cd vscode-extension

# Package the extension
npx @vscode/vsce package

# Install it
code --install-extension pyucis-coverage-explorer-0.1.0.vsix
```

Then open any workspace with `.ucisdb` files and the extension activates automatically.

### Detailed Steps:

1. **Package the extension:**
   ```bash
   cd vscode-extension
   npx @vscode/vsce package
   # Creates: pyucis-coverage-explorer-0.1.0.vsix
   ```

2. **Install the VSIX:**
   
   **Option A - Command Line:**
   ```bash
   code --install-extension pyucis-coverage-explorer-0.1.0.vsix
   ```
   
   **Option B - VS Code UI:**
   - Open VS Code
   - Press Ctrl+Shift+P
   - Type "Install from VSIX"
   - Select `pyucis-coverage-explorer-0.1.0.vsix`

3. **Reload VS Code** (if needed)

4. **Open the examples folder:**
   ```bash
   code ../examples/
   ```

5. **Extension should auto-activate** when it detects `sample.ucisdb`

---

## Method 3: Watch Mode (Continuous Development)

For active development with auto-recompile:

```bash
cd vscode-extension

# Terminal 1: Watch for changes and recompile
npm run watch

# Then press F5 in VS Code to launch
# Changes will auto-recompile
# Reload Extension Development Host (Ctrl+R) to see changes
```

---

## What You Should See

Once the extension is running and you open a folder with `.ucisdb` files:

### 1. Explorer Sidebar
- **PYUCIS DATABASES** tree view
  - Shows discovered databases
  - Click to open database

- **COVERAGE** tree view
  - Hierarchical coverage items
  - Color-coded by status
  - Expandable tree

### 2. Commands (Ctrl+Shift+P)
Type "PyUCIS" to see:
- Open Database
- Show Dashboard
- Search Scopes
- Toggle Source Decorations
- Filter options
- And 14 more...

### 3. Detail Panels
- Click any item in coverage tree
- Opens webview with:
  - Coverage percentages
  - Bin details
  - Test contributions
  - Progress bars

### 4. Dashboard
- Command: `PyUCIS: Show Dashboard`
- Shows overall statistics
- Top uncovered items
- Test history

---

## Troubleshooting

### Extension doesn't activate
**Solution:** Make sure workspace contains `.ucisdb` files, or manually run:
```
PyUCIS: Rescan Workspace for Databases
```

### Tree views don't appear
**Check:**
1. Look in Explorer sidebar (Activity Bar)
2. Views might be collapsed - click to expand
3. Check Output panel: "PyUCIS Coverage" for errors

### "Cannot find module" errors
**Solution:**
```bash
cd vscode-extension
npm install
npm run compile
```

### Changes not appearing
**Solution:** In Extension Development Host:
- Press Ctrl+R (or Cmd+R on Mac) to reload
- Or close and press F5 again

### VSIX installation fails
**Check:**
1. Path to VSIX file is correct
2. VS Code has write permissions
3. Try with sudo (Linux/Mac) if needed
4. Check for conflicting extension IDs

---

## Current File Structure

```
vscode-extension/
├── src/               # TypeScript source (edit here)
├── dist/              # Compiled JavaScript (auto-generated)
├── package.json       # Extension manifest
├── .vscode/
│   └── launch.json    # Debug configuration (F5)
└── *.vsix             # Packaged extension

examples/
└── sample.ucisdb      # Test database
```

---

## Debug Tips

### View Extension Logs:
- In Extension Development Host
- View → Output
- Select "PyUCIS Coverage" from dropdown

### Set Breakpoints:
- In original VS Code window (not Extension Host)
- Click left of line numbers in `.ts` files
- Breakpoints hit when extension runs

### Reload Extension:
- In Extension Development Host: Ctrl+R
- Faster than closing and restarting

### View Console Errors:
- Help → Toggle Developer Tools
- Check Console tab

---

## Quick Test Checklist

Once launched with examples folder:

- [ ] See "PYUCIS DATABASES" tree with `sample.ucisdb`
- [ ] Click database → opens in "COVERAGE" tree
- [ ] Expand `top` → `uart_tx_inst` → `uart_tx_cg`
- [ ] See green/red/yellow color coding
- [ ] Click a coverpoint → detail panel opens
- [ ] Run `PyUCIS: Show Dashboard` → webview appears
- [ ] Run `PyUCIS: Search Scopes` → search works
- [ ] Run `PyUCIS: Filter to Uncovered Only` → tree filters
- [ ] Toggle source decorations (won't show without matching source files)

---

## Recommended Workflow

**For testing:**
```bash
cd vscode-extension
code .
# Press F5
# In Extension Host: Open ../examples/
```

**For packaging:**
```bash
cd vscode-extension
npx @vscode/vsce package
code --install-extension pyucis-coverage-explorer-0.1.0.vsix
```

The Extension Development Host (F5) is best for testing because:
- See console logs immediately
- Set breakpoints
- Hot reload with Ctrl+R
- Debug panel shows variables
- No installation needed
