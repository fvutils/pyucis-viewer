# PyUCIS Coverage Explorer

A Visual Studio Code extension for navigating and understanding functional and code coverage data stored in pyucis SQLite databases (`.ucisdb`).

## Features

- **Database Discovery**: Automatically detect `.ucisdb` files in your workspace
- **Coverage Hierarchy Navigation**: Browse coverage scopes, covergroups, coverpoints, crosses, and bins
- **Coverage Metrics**: View hit counts, goals, and coverage percentages at every level
- **Search & Filter**: Quickly find uncovered items and filter by coverage status
- **Coverage Dashboard**: Visual summary with charts and statistics
- **No Python Required**: Direct SQLite access - works without pyucis installation

## Getting Started

1. Open a workspace containing `.ucisdb` files
2. The extension will automatically discover databases
3. Navigate coverage data in the "Coverage Databases" view
4. Click items to see detailed coverage information

## Commands

- `PyUCIS: Open Coverage Database` - Browse for and open a database file
- `PyUCIS: Refresh Database` - Reload the active database
- `PyUCIS: Show Coverage Dashboard` - Open the summary dashboard
- `PyUCIS: Show Uncovered Items` - Filter to uncovered items only

## Configuration

See extension settings for options to customize behavior, thresholds, and path mappings.

## Requirements

- VS Code 1.75.0 or later

## Development Status

This extension is under active development. See the [implementation plan](../doc/vscode-extension-implementation-plan.md) for roadmap details.

## Related Projects

- [pyucis](https://github.com/fvutils/pyucis) - Python library for UCIS database access
- [pyucis-viewer](../python) - Qt5-based desktop viewer

## License

Apache 2.0
