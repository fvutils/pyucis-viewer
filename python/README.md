# PyUCIS Viewer

A Qt5-based graphical viewer for coverage data stored in UCIS (Unified Coverage Interoperability Standard) databases.

## Overview

PyUCIS Viewer is a simple, lightweight desktop application for exploring and analyzing functional and code coverage data. It reads coverage information from `.ucisdb` SQLite databases and presents it in an intuitive tree-based interface.

## Features

- Browse coverage hierarchy (instances, covergroups, coverpoints, bins)
- View coverage statistics and metrics
- Explore coverage data organized by design hierarchy
- Inspect individual coverage items and their hit counts

## Installation

### From PyPI

```bash
pip install pyucis-viewer
```

### From Source

```bash
cd python
pip install -e .
```

## Usage

Launch the viewer from the command line:

```bash
pyucis-viewer
```

Then use the GUI to open a `.ucisdb` file and navigate the coverage data.

## Requirements

- Python 3.7+
- PyQt5
- pyucis >= 0.0.6

## Related Projects

- [pyucis](https://github.com/fvutils/pyucis) - Python library for UCIS database access
- [VSCode PyUCIS Extension](../vscode-extension) - VSCode extension for coverage exploration (in development)

## License

Apache 2.0

## Author

Matthew Ballance (matt.ballance@gmail.com)
