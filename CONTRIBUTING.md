# Contributing to Flex Table

Thank you for your interest in contributing to **Flex Table**! We welcome bug reports, feature suggestions, documentation improvements, and pull requests from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Submitting Pull Requests](#submitting-pull-requests)
- [Development Workflow](#development-workflow)
  - [Prerequisites](#prerequisites)
  - [Repository Setup](#repository-setup)
  - [Packaging the Plugin](#packaging-the-plugin)
- [Coding & Architecture Guidelines](#coding--architecture-guidelines)
- [License](#license)

---

## Code of Conduct

Please help maintain a welcoming, respectful, and professional environment. Treat all contributors and community members with courtesy and respect regardless of background or experience level.

---

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report, please check existing issues to avoid duplicates.

When filing a bug report via GitHub Issues, please include:
1. **Summary**: A clear and concise description of the bug.
2. **Environment**: MicroStrategy/Strategy version, Web browser version, and OS.
3. **Steps to Reproduce**: Detailed steps to reproduce the issue.
4. **Expected vs Actual Behavior**: What you expected to happen vs what actually occurred.
5. **Console Logs / Error Messages**: Browser Developer Console logs or stack trace if applicable.

### Suggesting Enhancements

Feature requests and enhancement ideas are tracked through GitHub Issues.

When suggesting an enhancement, please include:
- **Use Case**: Why is this feature needed? What problem does it solve?
- **Proposed Behavior**: How should the visualization or properties panel behave?
- **Mockups / Screenshots**: Visual diagrams or sketches if applicable.

### Submitting Pull Requests

1. **Fork the Repository**: Create your own fork of the repository on GitHub.
2. **Create a Feature Branch**: `git checkout -b feature/my-amazing-feature`
3. **Keep Changes Focused**: Implement clean, focused commits that address a single logical change or bug fix.
4. **Submit PR**: Open a Pull Request against the `main` branch with a clear summary of your changes.

---

## Development Workflow

### Prerequisites

- **Node.js**: v16.x or higher (optional, for build tasks).
- **Git**: For version control.

### Repository Setup

Clone your fork locally:

```bash
git clone https://github.com/your-username/flex_table.git
cd flex_table
```

### Packaging the Plugin

Package the deployment archive (`dist/FlexTable.zip`):

Using PowerShell (Windows native):
```powershell
powershell -ExecutionPolicy Bypass -File build-plugin.ps1
```

Using Bash (Linux/macOS):
```bash
./build-plugin.sh
```

---

## Coding & Architecture Guidelines

1. **MicroStrategy Mojo SDK Compliance**:
   - Maintain compatibility with the MicroStrategy Custom Visualization API (`mstrmojo`).
   - Zero external heavy JS library dependencies (pure Vanilla JS and CSS) to guarantee immunity against scope conflicts inside MicroStrategy Web/Library/Workstation.
2. **Modular Code Structure**:
   - `FlexTable/javascript/mojo/js/source/FlexTable.js`: Core visualization renderer, sorting, filtering, and threshold logic.
   - `FlexTable/javascript/mojo/js/source/FlexTableEditorModel.js`: MicroStrategy Format Panel integration.
   - `FlexTable/style/global.css`: CSS styling for table components, freeze panes, thresholds, and controls.
3. **Code Style**:
   - Use 4 spaces for indentation.
   - Use clear, descriptive variable names.

---

## License

By contributing to Flex Table, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
