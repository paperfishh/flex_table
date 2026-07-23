# Flex Table for MicroStrategy

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MicroStrategy](https://img.shields.io/badge/MicroStrategy-10.x%20%7C%202021%20%7C%20ONE-red.svg)](https://www.microstrategy.com)
[![Dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen.svg)](#architecture--design)
[![Scope](https://img.shields.io/badge/Scope-Dossier%20%26%20Document-orange.svg)](#installation)

**FlexTable** is a high-performance, dependency-free custom HTML5 visualization plug-in for **MicroStrategy**. It renders report and dossier data into an interactive, highly customizable table equipped with advanced client-side search, multi-metric threshold formatting, repetitive cell merging, summary totals, freeze options, and instant CSV export.

---

## 🌟 Key Features

- 🔍 **Real-Time Client-Side Search**: Instant filtering across all attribute and metric columns directly in the browser without re-querying the server.
- ⚡ **Interactive Column Sorting**: Click headers to toggle ascending/descending order. Smart sorting utilizes raw numeric metric values when available.
- 🎨 **Multi-Metric Threshold Formatting**: Independent threshold rules for every metric. Supports:
  - **Continuous Gradients**: Smooth color transitions based on auto or custom min/max bounds.
  - **3-Stage Categorical**: Low/Medium/High color coding based on percentiles or fixed cutoffs.
  - Target cell backgrounds or metric text colors.
- 📊 **Dynamic Summary Totals**: Compute `Sum`, `Average`, `Minimum`, or `Maximum` total rows calculated dynamically across all currently filtered rows. Place total rows at the top or bottom of the table.
- 🔗 **Parent-Child Repetitive Cell Merging**: Merge consecutive identical attribute cells while respecting strict parent hierarchy integrity.
- 📥 **Filtered CSV Export**: Export active table results—including applied filters, sorting, and summary totals—directly to a clean CSV file.
- 📄 **Pagination & Size Controls**: Configurable page size (5, 10, 25, 50, 100, or All) with quick first/previous/next/last and direct page jump navigation.
- 🎛️ **Native MicroStrategy Format Panel Integration**: Configure headers, body text, colors, borders, banding, freeze panes, search toggles, and metric thresholds natively within MicroStrategy.
- ⚡ **Zero Third-Party Dependencies**: Written entirely in pure Vanilla JavaScript (Mojo framework) and CSS to guarantee immunity against library conflicts across MicroStrategy releases.

---

## 📁 Repository Structure

```text
flex_table/
├── FlexTable/                            # Core Deployable Plug-in Folder
│   ├── javascript/mojo/js/source/
│   │   ├── FlexTable.js                  # Core visualization renderer & logic
│   │   └── FlexTableEditorModel.js       # MicroStrategy Format Panel integration
│   ├── style/
│   │   ├── Html5ViPage.css               # Plug-in layout styling
│   │   ├── global.css                    # Main visual styles, freeze panes, & themes
│   │   └── images/                       # Gallery icons (icon.png, defaultImage_RWD.png)
│   └── WEB-INF/
│       ├── xml/styleCatalog.xml          # MicroStrategy style catalog definition
│       └── xml/config/visualizations.xml # Visualization registration (scope 18)
├── resources/
│   └── FlexTable_Sample_Data.csv         # Sample dataset for testing
├── dist/                                 # Generated deployment packages (.zip)
├── build-plugin.ps1                      # Windows PowerShell build script
├── build-plugin.sh                       # Unix / Linux / macOS bash build script
├── CONTRIBUTING.md                       # Open-source contribution guidelines
├── LICENSE                               # MIT License
└── README.md                             # Project documentation
```

---

## 🛠️ Building the Package

To build the plug-in zip file ready for deployment:

### On Windows (PowerShell):
```powershell
.\build-plugin.ps1
```

### On macOS / Linux (Bash):
```bash
chmod +x build-plugin.sh
./build-plugin.sh
```

Both scripts compile the plug-in into `dist/FlexTable.zip`.

---

## 🚀 Installation & Deployment

### Method 1: Deploy to MicroStrategy Web Server
1. Copy the `FlexTable` directory from this repository (or extract `dist/FlexTable.zip`) into the `plugins/` directory of your MicroStrategy Web server installation:
   - **Windows**: `C:\Program Files (x86)\MicroStrategy\Web ASPx\plugins\` (or `Web Server\plugins\`)
   - **Linux**: `/opt/MicroStrategy/WebUniversal/plugins/`
2. Restart your Web Server application (IIS, Tomcat, WebSphere, etc.).

### Method 2: Import via MicroStrategy Workstation / Library
1. Open **MicroStrategy Workstation**.
2. Navigate to **Visualizations** in the sidebar.
3. Click **Add New Visualization** (`+`) and select **Import Visualization**.
4. Choose the `dist/FlexTable.zip` file.

---

## 📖 Usage & Setup

1. Open a **Dossier** or **Document** in MicroStrategy.
2. In the Visualization Gallery, expand the **Custom** section and select **Flex Table**.
3. Drag attributes and metrics into the visualization Drop Zones:
   - **Attributes**: Placed as left-hand hierarchy columns.
   - **Metrics**: Placed as data columns to the right.
4. If no attributes or metrics are present, Flex Table renders a helpful empty state guiding the user.

---

## 🎛️ Format Panel Configuration

Navigate to **Format > Flex Table** in MicroStrategy to customize your visualization:

| Category | Option | Description |
| :--- | :--- | :--- |
| **Controls** | Show Search Bar | Toggle real-time search input box |
| | Show CSV Export | Toggle the instant CSV download button |
| **Pagination** | Enable Pagination | Turn pagination on/off |
| | Rows per Page | Select default page size (5, 10, 25, 50, 100, All) |
| **Table Style** | Banding | Enable alternating row background colors |
| | Cell Merging | Enable parent-aware repetitive cell merging |
| | Total Row | Enable dynamic totals (`None`, `Sum`, `Average`, `Min`, `Max`) at `Top` or `Bottom` |
| **Thresholds** | Metric Selection | Configure per-metric Continuous or 3-Stage thresholds |

---

## 🧪 Testing with Sample Data

A ready-to-use sample dataset is included in [`resources/FlexTable_Sample_Data.csv`](resources/FlexTable_Sample_Data.csv).

**Sample Columns**:
- `Region`, `Category`, `Subcategory` (Attributes)
- `Revenue`, `Cost`, `Profit`, `Margin %` (Metrics)

Import this CSV into MicroStrategy as an In-Memory dataset to instantly test sorting, merging, totals, and threshold color rules.

---

## ⚡ Future-Proof Design Principles

- **Framework Independence**: Built using vanilla Web standards (`HTML5`, `CSS3`, standard DOM APIs, ES5/Mojo) to guarantee stability across future MicroStrategy upgrades.
- **Zero Global Scope Pollution**: Styles and JS functions are encapsulated under `.flex-table-container` to prevent interference with other custom visualizations or MicroStrategy core styles.
- **Isolated Metric Threshold Storage**: Threshold configurations are keyed to unique MicroStrategy Metric Object IDs (`objectID`), ensuring threshold rules remain pinned to the correct metric even when columns are reordered or removed.

---

## 🤝 Contributing

Contributions, feature ideas, and bug reports are warmly welcome! Please check out [CONTRIBUTING.md](CONTRIBUTING.md) before submitting Pull Requests.

---

## 📜 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.
