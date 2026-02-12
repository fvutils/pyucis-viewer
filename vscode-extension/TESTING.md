# PyUCIS Coverage Explorer - Testing Guide

## Installation

1. **Install the extension:**
   ```bash
   code --install-extension pyucis-coverage-explorer-0.1.0.vsix
   ```

2. **Or install from VS Code:**
   - Open VS Code
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Install from VSIX"
   - Select `pyucis-coverage-explorer-0.1.0.vsix`

## Testing the Extension

### Step 1: Open a Workspace with UCIS Files

The extension activates when it finds `*.ucisdb` files in your workspace.

### Step 2: Verify Database Discovery

1. Open the **PyUCIS Explorer** view in the sidebar
2. You should see "PYUCIS DATABASES" tree view
3. It will auto-discover `.ucisdb` files in your workspace

### Step 3: Open a Database

1. Click on a database in the tree
2. Select "Open Database" from the context menu
3. Or use command: `PyUCIS: Open Database`

### Step 4: Navigate Coverage

1. In the **COVERAGE** tree view, you'll see:
   - 📦 Instances (top level)
   - 📊 Covergroups
   - 🎯 Coverpoints  
   - 📌 Bins

2. **Color coding:**
   - 🟢 Green: Fully covered
   - 🔴 Red: Uncovered
   - 🟡 Yellow: Partially covered

### Step 5: View Details

1. Click any scope or bin in the tree
2. A detail panel opens with:
   - Coverage percentage
   - Bin counts
   - Test history
   - Source references

### Step 6: Try Commands

Open command palette (`Ctrl+Shift+P`) and try:

- `PyUCIS: Show Dashboard` - Overall statistics
- `PyUCIS: Search Scopes` - Find coverage items
- `PyUCIS: Filter to Uncovered Only` - Show gaps
- `PyUCIS: Toggle Source Decorations` - Show coverage in code

### Step 7: Source Decorations

1. Enable: `PyUCIS: Enable Source Decorations`
2. Open a source file referenced in the database
3. You'll see:
   - 🟢 Green highlighting for covered lines
   - 🔴 Red highlighting for uncovered lines
   - Hover over decorated lines for details

## Configuration

Open settings and search for "pyucis":

```json
{
  "pyucis.showDecorations": true,
  "pyucis.filterIgnoredBins": true,
  "pyucis.filterIllegalBins": true,
  "pyucis.pathMappings": {
    "/build/path": "${workspaceFolder}/rtl"
  }
}
```

### Path Mappings

If source paths in the database don't match your workspace:

```json
"pyucis.pathMappings": {
  "/old/build/path": "/new/workspace/path",
  "/remote/sim": "${workspaceFolder}/sim"
}
```

## Creating Test Databases

If you don't have `.ucisdb` files, you can create them using:

- **Questa/ModelSim**: Use `-coverage` option
- **VCS**: Use `-cm` option  
- **Python script**: Use `pyucis` package

Example with pyucis:
```python
import pyucis

# Create database
db = pyucis.UCIS()
# ... add coverage data ...
db.write("test.ucisdb")
```

## Troubleshooting

### Extension doesn't activate
- Make sure you have `.ucisdb` files in workspace
- Or manually activate: `PyUCIS: Rescan Workspace for Databases`

### Can't open database
- Check console output (View → Output → PyUCIS Coverage)
- Verify file is valid SQLite database
- Try: `sqlite3 file.ucisdb ".schema"` to check structure

### Source decorations not showing
- Check path mappings in settings
- Verify source files exist in workspace
- Enable decorations: `PyUCIS: Enable Source Decorations`

### Performance issues
- Large databases may take time to load
- Tree uses lazy loading (expands on demand)
- Consider filtering to uncovered items only

## Known Limitations

- Only supports UCIS v1.0+ SQLite format
- Path mapping is best-effort (may need manual config)
- Very large databases (>1GB) may be slow
- Source decorations require matching file paths

## Feedback

Report issues or suggestions at:
https://github.com/fvutils/pyucis-viewer-vscode/issues
