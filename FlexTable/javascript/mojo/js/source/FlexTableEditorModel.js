/**
 * Native-style Mojo Format panel for FlexTable.
 */
(function () {
    'use strict';

    if (!mstrmojo.plugins.FlexTable) {
        mstrmojo.plugins.FlexTable = {};
    }

    mstrmojo.requiresCls('mstrmojo.vi.models.editors.CustomVisEditorModel');

    var $WT = mstrmojo.vi.models.editors.CustomVisEditorModel.WIDGET_TYPE;

    function labelledControl(label, control, labelWidth) {
        control.width = control.width || (labelWidth ? (100 - labelWidth) + '%' : '62%');
        return {
            style: $WT.TWOCOLUMN,
            items: [
                { style: $WT.LABEL, width: (labelWidth || 38) + '%', labelText: label },
                control
            ]
        };
    }

    function pullDown(label, propertyName, items, disabled) {
        var row = labelledControl(label, {
            style: $WT.PULLDOWN,
            propertyName: propertyName,
            items: items
        });
        row.disabled = !!disabled;
        return row;
    }

    function stepper(label, propertyName, min, max, disabled) {
        var row = labelledControl(label, {
            style: $WT.STEPPER,
            propertyName: propertyName,
            min: min,
            max: max
        });
        row.disabled = !!disabled;
        return row;
    }

    function fill(label, propertyName, disabled) {
        var row = labelledControl(label, {
            style: $WT.FILLGROUP,
            propertyName: propertyName
        }, 32);
        row.disabled = !!disabled;
        return row;
    }

    function font(label, propertyName, disabled) {
        var row = labelledControl(label, {
            style: $WT.CHARACTERGROUP,
            propertyName: propertyName,
            showEffects: false,
            showStyle: false,
            showFormat: false,
            showBold: false,
            showItalic: false,
            showUnderline: false,
            showStrikethrough: false,
            effects: false,
            styleButtons: false
        }, 25);
        row.disabled = !!disabled;
        return row;
    }

    function line(label, propertyName, disabled) {
        var row = labelledControl(label, {
            style: $WT.LINEGROUP,
            propertyName: propertyName
        }, 32);
        row.disabled = !!disabled;
        return row;
    }

    function textBox(label, propertyName, disabled) {
        var row = labelledControl(label, {
            style: $WT.TEXTBOX,
            propertyName: propertyName
        });
        row.disabled = !!disabled;
        return row;
    }

    function attributeThresholdGroup(host) {
        var state = host._flexTableState;
        var columns = state && state.columns ? state.columns : [];
        var attrColumns = [];

        columns.forEach(function (column, index) {
            if (!column.isMetric && column.thresholdPrefix) {
                attrColumns.push({ column: column, index: index });
            }
        });

        if (attrColumns.length === 0) {
            return {
                name: 'Attribute Threshold',
                value: [{
                    style: $WT.EDITORGROUP,
                    items: [
                        { style: $WT.LABEL, labelText: 'Add at least one attribute to configure attribute threshold.' }
                    ]
                }]
            };
        }

        var attrPulldownItems = attrColumns.map(function (item) {
            return { name: item.column.name, value: item.column.thresholdPrefix };
        });

        var selectedPrefix = host.getProperty('selectedAttributeCol');
        var selectedItem = attrColumns[0];
        if (selectedPrefix) {
            var found = attrColumns.filter(function (item) {
                return item.column.thresholdPrefix === selectedPrefix;
            })[0];
            if (found) {
                selectedItem = found;
            }
        }

        var column = selectedItem.column;
        var colIndex = selectedItem.index;
        var prefix = column.thresholdPrefix;
        var enabled = host.getProperty(prefix + 'attr_enabled') === 'true';

        // Extract unique values from data for this attribute column
        var uniqueValues = [];
        var valueSet = {};
        if (state && state.rows) {
            state.rows.forEach(function (row) {
                if (row.cells && row.cells[colIndex]) {
                    var val = String(row.cells[colIndex].display || row.cells[colIndex].sortValue || '').trim();
                    if (val && !valueSet[val]) {
                        valueSet[val] = true;
                        uniqueValues.push(val);
                    }
                }
            });
        }

        var valPulldownItems = [{ name: '-- Select Value --', value: '' }];
        uniqueValues.forEach(function (v) {
            valPulldownItems.push({ name: v, value: v });
        });

        var selectedValProp = prefix + 'selected_val';
        var selectedVal = host.getProperty(selectedValProp) || (uniqueValues.length > 0 ? uniqueValues[0] : '');

        var groupItems = [
            pullDown('Select Attribute', 'selectedAttributeCol', attrPulldownItems),
            { style: $WT.CHECKBOXANDLABEL, propertyName: prefix + 'attr_enabled', labelText: 'Enable threshold for ' + column.name },
            pullDown('Threshold Style', prefix + 'attr_target', [
                { name: 'Status Badge / Tag', value: 'badge' },
                { name: 'Cell background', value: 'cell' },
                { name: 'Text color', value: 'text' },
                { name: 'Entire row background', value: 'row' }
            ], !enabled)
        ];

        if (uniqueValues.length > 0) {
            groupItems.push({ style: $WT.LABEL, labelText: 'Value Formatting' });
            groupItems.push(pullDown('Select Value', selectedValProp, valPulldownItems, !enabled));

            if (selectedVal) {
                var safeKey = selectedVal.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
                groupItems.push(fill('Background Color', prefix + 'v_' + safeKey + '_bg', !enabled));
                groupItems.push(fill('Text Color', prefix + 'v_' + safeKey + '_color', !enabled));
            }
        } else {
            groupItems.push({ style: $WT.LABEL, labelText: 'No distinct values found in attribute data.' });
        }

        return {
            name: 'Attribute Threshold',
            value: [{
                style: $WT.EDITORGROUP,
                items: groupItems
            }]
        };
    }

    function metricThresholdGroup(host) {
        var state = host._flexTableState;
        var columns = state && state.columns ? state.columns : [];
        var metricColumns = [];
        var seenPrefix = {};
        var globalDataBarsEnabled = host.getProperty('showDataBars') === 'true';

        columns.forEach(function (column) {
            if (column.isMetric && column.thresholdPrefix && !seenPrefix[column.thresholdPrefix]) {
                seenPrefix[column.thresholdPrefix] = true;
                metricColumns.push(column);
            }
        });

        if (metricColumns.length === 0) {
            return {
                name: 'Metric Threshold',
                value: [{
                    style: $WT.EDITORGROUP,
                    items: [
                        { style: $WT.LABEL, labelText: 'Add at least one metric to configure metric threshold.' }
                    ]
                }]
            };
        }

        var metricPulldownItems = metricColumns.map(function (col) {
            return { name: col.name, value: col.thresholdPrefix };
        });

        var selectedPrefix = host.getProperty('selectedMetricCol');
        var selectedCol = metricColumns[0];
        if (selectedPrefix) {
            var found = metricColumns.filter(function (col) {
                return col.thresholdPrefix === selectedPrefix;
            })[0];
            if (found) {
                selectedCol = found;
            }
        }

        var column = selectedCol;
        var prefix = column.thresholdPrefix;
        var enabled = host.getProperty(prefix + 'enabled') === 'true';
        var showDataBar = host.getProperty(prefix + 'showDataBar') === 'true';
        var mode = host.getProperty(prefix + 'mode') || 'continuous';
        var rangeMode = host.getProperty(prefix + 'rangeMode') || 'auto';
        var continuousDisabled = !enabled || mode !== 'continuous';
        var stagedDisabled = !enabled || mode !== 'staged';
        var continuousCustomDisabled = continuousDisabled || rangeMode !== 'custom';
        var stagedCustomDisabled = stagedDisabled || rangeMode !== 'custom';
        var dataBarDisabled = !showDataBar;
        var dataBarRangeMode = host.getProperty(prefix + 'dataBarRangeMode') || 'auto';
        var dataBarCustomDisabled = dataBarDisabled || dataBarRangeMode !== 'custom';

        return {
            name: 'Metric Threshold',
            value: [{
                style: $WT.EDITORGROUP,
                items: [
                    pullDown('Select Metric', 'selectedMetricCol', metricPulldownItems),
                    { style: $WT.LABEL, labelText: 'Data Bar Options' },
                    { style: $WT.CHECKBOXANDLABEL, propertyName: prefix + 'showDataBar', labelText: 'Show data bar for ' + column.name },
                    pullDown('Data bar style', prefix + 'dataBarMode', [
                        { name: 'Cell Fill (Gradient)', value: 'fill' },
                        { name: 'Floating Capsule Bar', value: 'capsule' },
                        { name: 'Bottom Indicator Line', value: 'bottomPill' }
                    ], dataBarDisabled),
                    fill('Bar primary color', prefix + 'dataBarColor', dataBarDisabled),
                    fill('Bar gradient color', prefix + 'dataBarGradientColor', dataBarDisabled),
                    fill('Negative bar color', prefix + 'dataBarNegativeColor', dataBarDisabled),
                    pullDown('Min / Max range', prefix + 'dataBarRangeMode', [
                        { name: 'Automatic (from data)', value: 'auto' },
                        { name: 'Manual (custom values)', value: 'custom' }
                    ], dataBarDisabled),
                    textBox('Minimum value', prefix + 'dataBarMin', dataBarCustomDisabled),
                    textBox('Maximum value', prefix + 'dataBarMax', dataBarCustomDisabled),

                    { style: $WT.LABEL, labelText: 'Numeric Threshold' },
                    { style: $WT.CHECKBOXANDLABEL, propertyName: prefix + 'enabled', labelText: 'Enable threshold for ' + column.name },
                    pullDown('Mode', prefix + 'mode', [
                        { name: 'Continuous color', value: 'continuous' },
                        { name: 'Staged color', value: 'staged' }
                    ], !enabled),
                    pullDown('Apply color to', prefix + 'target', [
                        { name: 'Cell background', value: 'background' },
                        { name: 'Metric text', value: 'text' }
                    ], !enabled),
                    pullDown(mode === 'staged' ? 'Cutoff values' : 'Value range', prefix + 'rangeMode', [
                        { name: 'Automatic from data', value: 'auto' },
                        { name: 'Custom values', value: 'custom' }
                    ], !enabled),
                    { style: $WT.LABEL, labelText: 'Continuous color' },
                    textBox('Minimum value', prefix + 'min', continuousCustomDisabled),
                    textBox('Maximum value', prefix + 'max', continuousCustomDisabled),
                    fill('Low-value color', prefix + 'lowColor', continuousDisabled),
                    fill('Mid-value color', prefix + 'midColor', continuousDisabled),
                    fill('High-value color', prefix + 'highColor', continuousDisabled),
                    { style: $WT.LABEL, labelText: 'Staged color (3 stages)' },
                    textBox('Stage 1 upper limit', prefix + 'cutoff1', stagedCustomDisabled),
                    textBox('Stage 2 upper limit', prefix + 'cutoff2', stagedCustomDisabled),
                    fill('Stage 1 color', prefix + 'stage1Color', stagedDisabled),
                    fill('Stage 2 color', prefix + 'stage2Color', stagedDisabled),
                    fill('Stage 3 color', prefix + 'stage3Color', stagedDisabled)
                ]
            }]
        };
    }

    var horizontalAlignment = [
        { name: 'Left', value: 'left' },
        { name: 'Center', value: 'center' },
        { name: 'Right', value: 'right' }
    ];
    var verticalAlignment = [
        { name: 'Top', value: 'top' },
        { name: 'Middle', value: 'middle' },
        { name: 'Bottom', value: 'bottom' }
    ];

    var fontFamilies = [
        { name: 'Arial', value: 'Arial' },
        { name: 'Calibri', value: 'Calibri' },
        { name: 'Courier New', value: 'Courier New' },
        { name: 'Georgia', value: 'Georgia' },
        { name: 'Helvetica', value: 'Helvetica' },
        { name: 'Segoe UI', value: 'Segoe UI' },
        { name: 'Tahoma', value: 'Tahoma' },
        { name: 'Times New Roman', value: 'Times New Roman' },
        { name: 'Trebuchet MS', value: 'Trebuchet MS' },
        { name: 'Verdana', value: 'Verdana' }
    ];

    function fill(label, propertyName, disabled) {
        var row = labelledControl(label, {
            style: $WT.FILLGROUP,
            propertyName: propertyName
        }, 32);
        row.disabled = !!disabled;
        return row;
    }

    function line(label, propertyName, disabled) {
        var row = labelledControl(label, {
            style: $WT.LINEGROUP,
            propertyName: propertyName
        }, 32);
        row.disabled = !!disabled;
        return row;
    }

    function textBox(label, propertyName, disabled) {
        var row = labelledControl(label, {
            style: $WT.TEXTBOX,
            propertyName: propertyName
        });
        row.disabled = !!disabled;
        return row;
    }

    function attributeThresholdGroup(host) {
        var state = host._flexTableState;
        var columns = state && state.columns ? state.columns : [];
        var attrColumns = [];

        columns.forEach(function (column, index) {
            if (!column.isMetric && column.thresholdPrefix) {
                attrColumns.push({ column: column, index: index });
            }
        });

        if (attrColumns.length === 0) {
            return {
                name: 'Attribute Threshold',
                value: [{
                    style: $WT.EDITORGROUP,
                    items: [
                        { style: $WT.LABEL, labelText: 'Add at least one attribute to configure attribute threshold.' }
                    ]
                }]
            };
        }

        var thresholdItems = [];
        attrColumns.forEach(function (item) {
            var column = item.column;
            var prefix = column.thresholdPrefix;
            var disabled = host.getProperty(prefix + 'attr_enabled') !== 'true';

            thresholdItems.push({ style: $WT.LABEL, labelText: column.name });
            thresholdItems.push({ style: $WT.CHECKBOXANDLABEL, propertyName: prefix + 'attr_enabled', labelText: 'Enable categorical threshold' });
            thresholdItems.push(pullDown('Apply style to', prefix + 'attr_target', [
                { name: 'Status badge', value: 'badge' },
                { name: 'Cell background', value: 'cell' },
                { name: 'Text color', value: 'text' }
            ], disabled));

            var ruleIndex;
            for (ruleIndex = 1; ruleIndex <= 10; ruleIndex += 1) {
                thresholdItems.push({ style: $WT.LABEL, labelText: 'Rule ' + ruleIndex });
                thresholdItems.push(textBox('Value text', prefix + 'attr_rule' + ruleIndex + '_text', disabled));
                thresholdItems.push(fill('Background', prefix + 'attr_rule' + ruleIndex + '_bg', disabled));
                thresholdItems.push(fill('Text Color', prefix + 'attr_rule' + ruleIndex + '_color', disabled));
            }
        });

        return {
            name: 'Attribute Threshold',
            value: [{
                style: $WT.EDITORGROUP,
                items: thresholdItems
            }]
        };
    }

    function metricThresholdGroup(host) {
        var state = host._flexTableState;
        var columns = state && state.columns ? state.columns : [];
        var metricColumns = [];

        columns.forEach(function (column, index) {
            if (column.isMetric && column.thresholdPrefix) {
                metricColumns.push({ column: column, index: index });
            }
        });

        if (metricColumns.length === 0) {
            return {
                name: 'Metric Formatting & Thresholds',
                value: [{
                    style: $WT.EDITORGROUP,
                    items: [
                        { style: $WT.LABEL, labelText: 'Add at least one metric to configure data bars or thresholds.' }
                    ]
                }]
            };
        }

        var thresholdItems = [];
        metricColumns.forEach(function (item) {
            var column = item.column;
            var prefix = column.thresholdPrefix;

            var dataBarDisabled = host.getProperty(prefix + 'showDataBar') !== 'true';
            var dataBarCustomDisabled = dataBarDisabled || host.getProperty(prefix + 'dataBarRangeMode') !== 'custom';

            var disabled = host.getProperty(prefix + 'enabled') !== 'true';
            var isStaged = host.getProperty(prefix + 'mode') === 'staged';
            var continuousDisabled = disabled || isStaged;
            var stagedDisabled = disabled || !isStaged;
            var customRangeDisabled = disabled || host.getProperty(prefix + 'rangeMode') !== 'custom';
            var customCutoffDisabled = stagedDisabled || host.getProperty(prefix + 'rangeMode') !== 'custom';

            thresholdItems.push({ style: $WT.LABEL, labelText: column.name });

            thresholdItems.push({ style: $WT.CHECKBOXANDLABEL, propertyName: prefix + 'showDataBar', labelText: 'Enable data bar' });
            thresholdItems.push(pullDown('Data bar style', prefix + 'dataBarMode', [
                { name: 'Fill bar inside cell', value: 'fill' },
                { name: 'Mini bar at bottom of cell', value: 'bottom' }
            ], dataBarDisabled));
            thresholdItems.push(fill('Bar primary color', prefix + 'dataBarColor', dataBarDisabled));
            thresholdItems.push(fill('Bar gradient color', prefix + 'dataBarGradientColor', dataBarDisabled));
            thresholdItems.push(fill('Negative bar color', prefix + 'dataBarNegativeColor', dataBarDisabled));
            thresholdItems.push(pullDown('Bar min/max range', prefix + 'dataBarRangeMode', [
                { name: 'Auto (Column Min/Max)', value: 'auto' },
                { name: 'Custom values', value: 'custom' }
            ], dataBarDisabled));
            thresholdItems.push(textBox('Custom bar min', prefix + 'dataBarMin', dataBarCustomDisabled));
            thresholdItems.push(textBox('Custom bar max', prefix + 'dataBarMax', dataBarCustomDisabled));

            thresholdItems.push({ style: $WT.CHECKBOXANDLABEL, propertyName: prefix + 'enabled', labelText: 'Enable metric threshold' });
            thresholdItems.push(pullDown('Color mode', prefix + 'mode', [
                { name: 'Continuous color', value: 'continuous' },
                { name: 'Staged color', value: 'staged' }
            ], disabled));
            thresholdItems.push(pullDown('Apply color to', prefix + 'target', [
                { name: 'Cell background', value: 'background' },
                { name: 'Text color', value: 'text' }
            ], disabled));

            thresholdItems.push(pullDown('Value range mode', prefix + 'rangeMode', [
                { name: 'Auto (Column Min/Max)', value: 'auto' },
                { name: 'Custom values', value: 'custom' }
            ], disabled));

            thresholdItems.push({ style: $WT.LABEL, labelText: 'Continuous color' });
            thresholdItems.push(textBox('Custom minimum', prefix + 'min', customRangeDisabled));
            thresholdItems.push(textBox('Custom maximum', prefix + 'max', customRangeDisabled));
            thresholdItems.push(fill('Low-value color', prefix + 'lowColor', continuousDisabled));
            thresholdItems.push(fill('Mid-value color', prefix + 'midColor', continuousDisabled));
            thresholdItems.push(fill('High-value color', prefix + 'highColor', continuousDisabled));

            thresholdItems.push({ style: $WT.LABEL, labelText: 'Staged color (3 stages)' });
            thresholdItems.push(textBox('Stage 1 -> 2 cutoff', prefix + 'cutoff1', customCutoffDisabled));
            thresholdItems.push(textBox('Stage 2 -> 3 cutoff', prefix + 'cutoff2', customCutoffDisabled));
            thresholdItems.push(fill('Stage 1 color', prefix + 'stage1Color', stagedDisabled));
            thresholdItems.push(fill('Stage 2 color', prefix + 'stage2Color', stagedDisabled));
            thresholdItems.push(fill('Stage 3 color', prefix + 'stage3Color', stagedDisabled));
        });

        return {
            name: 'Metric Formatting & Thresholds',
            value: [{
                style: $WT.EDITORGROUP,
                items: thresholdItems
            }]
        };
    }

    mstrmojo.plugins.FlexTable.FlexTableEditorModel = mstrmojo.declare(
        mstrmojo.vi.models.editors.CustomVisEditorModel,
        null,
        {
            scriptClass: 'mstrmojo.plugins.FlexTable.FlexTableEditorModel',

            getCustomProperty: function () {
                var host = this.getHost();
                var paginationDisabled = host.getProperty('enablePagination') !== 'true';
                var bandingDisabled = host.getProperty('showBanding') !== 'true';
                var outlineDisabled = host.getProperty('showOutline') !== 'true';
                var totalDisabled = host.getProperty('showTotal') !== 'true';
                var fixedColumnDisabled = host.getProperty('columnSizing') !== 'fixed';
                var fixedRowDisabled = host.getProperty('rowSizing') !== 'fixed';
                var kpiDisabled = host.getProperty('showKpiCards') !== 'true';

                var properties = [
                    {
                        name: 'Theme & Preset Colors',
                        value: [{
                            style: $WT.EDITORGROUP,
                            items: [
                                pullDown('Preset theme', 'presetTheme', [
                                    { name: 'Default Light', value: 'default' },
                                    { name: 'Dark Slate', value: 'dark' },
                                    { name: 'Navy Blue', value: 'navy' },
                                    { name: 'Emerald Green', value: 'emerald' },
                                    { name: 'Cyberpunk Neon', value: 'cyberpunk' },
                                    { name: 'Warm Amber', value: 'amber' },
                                    { name: 'Minimalist Monochrome', value: 'minimalist' }
                                ])
                            ]
                        }]
                    },
                    {
                        name: 'Top KPI Summary Cards',
                        value: [{
                            style: $WT.EDITORGROUP,
                            items: [
                                { style: $WT.CHECKBOXANDLABEL, propertyName: 'showKpiCards', labelText: 'Show top KPI summary cards' },
                                pullDown('Calculation method', 'kpiAggregation', [
                                    { name: 'Auto (same as Totals)', value: 'auto' },
                                    { name: 'Sum', value: 'sum' },
                                    { name: 'Average', value: 'average' },
                                    { name: 'Minimum', value: 'min' },
                                    { name: 'Maximum', value: 'max' }
                                ], kpiDisabled),
                                pullDown('Card layout', 'kpiLayout', [
                                    { name: 'Grid (auto wrap)', value: 'grid' },
                                    { name: 'Scrollable row', value: 'scroll' },
                                    { name: 'Compact cards', value: 'compact' }
                                ], kpiDisabled),
                                { style: $WT.CHECKBOXANDLABEL, propertyName: 'showKpiMinMax', labelText: 'Show Min / Max subtitle', disabled: kpiDisabled },
                                fill('Card background', 'kpiCardFill', kpiDisabled),
                                fill('Card border color', 'kpiCardBorderFill', kpiDisabled),
                                fill('Title text color', 'kpiTitleColor', kpiDisabled),
                                fill('Value text color', 'kpiValueColor', kpiDisabled)
                            ]
                        }]
                    },
                    {
                        name: 'Controls & Pagination',
                        value: [{
                            style: $WT.EDITORGROUP,
                            items: [
                                { style: $WT.CHECKBOXANDLABEL, propertyName: 'showSearch', labelText: 'Show search box' },
                                { style: $WT.CHECKBOXANDLABEL, propertyName: 'showExport', labelText: 'Show Export CSV button' },
                                { style: $WT.CHECKBOXANDLABEL, propertyName: 'enablePagination', labelText: 'Enable pagination' },
                                pullDown('Rows per page', 'pageSize', [
                                    { name: '10', value: '10' },
                                    { name: '25', value: '25' },
                                    { name: '50', value: '50' },
                                    { name: '100', value: '100' }
                                ], paginationDisabled)
                            ]
                        }]
                    },
                    {
                        name: 'Column Headers',
                        value: [{
                            style: $WT.EDITORGROUP,
                            items: [
                                fill('Text color', 'headerTextColor'),
                                fill('Background color', 'headerFill'),
                                pullDown('Font family', 'headerFontFamily', fontFamilies),
                                stepper('Font size (px)', 'headerFontSize', 8, 48),
                                pullDown('Horizontal align', 'headerHAlign', horizontalAlignment),
                                pullDown('Vertical align', 'headerVAlign', verticalAlignment),
                                { style: $WT.CHECKBOXANDLABEL, propertyName: 'headerWrap', labelText: 'Wrap header text' }
                            ]
                        }]
                    },
                    {
                        name: 'Row Values',
                        value: [{
                            style: $WT.EDITORGROUP,
                            items: [
                                fill('Text color', 'valueTextColor'),
                                fill('Row background', 'rowFill'),
                                pullDown('Font family', 'valueFontFamily', fontFamilies),
                                stepper('Font size (px)', 'valueFontSize', 8, 48),
                                pullDown('Text alignment', 'attributeHAlign', horizontalAlignment),
                                pullDown('Metric alignment', 'metricHAlign', horizontalAlignment),
                                pullDown('Vertical align', 'valueVAlign', verticalAlignment),
                                { style: $WT.CHECKBOXANDLABEL, propertyName: 'valueWrap', labelText: 'Wrap row values' },
                                { style: $WT.CHECKBOXANDLABEL, propertyName: 'mergeRepetitive', labelText: 'Merge repetitive attribute cells' }
                            ]
                        }]
                    },
                    {
                        name: 'Grid & Colors',
                        value: [{
                            style: $WT.EDITORGROUP,
                            items: [
                                fill('Table background', 'tableFill'),
                                { style: $WT.CHECKBOXANDLABEL, propertyName: 'showBanding', labelText: 'Show row banding' },
                                fill('Banding color', 'bandFill', bandingDisabled),
                                { style: $WT.CHECKBOXANDLABEL, propertyName: 'showOutline', labelText: 'Show grid/borders' },
                                pullDown('Grid type', 'gridMode', [
                                    { name: 'All borders', value: 'all' },
                                    { name: 'Horizontal only', value: 'horizontal' },
                                    { name: 'Vertical only', value: 'vertical' },
                                    { name: 'Outer border only', value: 'outline' },
                                    { name: 'No borders', value: 'none' }
                                ], outlineDisabled),
                                line('Border style & color', 'gridLine', outlineDisabled)
                            ]
                        }]
                    },
                    {
                        name: 'Totals',
                        value: [{
                            style: $WT.EDITORGROUP,
                            items: [
                                { style: $WT.CHECKBOXANDLABEL, propertyName: 'showTotal', labelText: 'Show total row' },
                                pullDown('Position', 'totalPosition', [
                                    { name: 'Top', value: 'top' },
                                    { name: 'Bottom', value: 'bottom' }
                                ], totalDisabled),
                                pullDown('Aggregation', 'totalAggregation', [
                                    { name: 'Sum', value: 'sum' },
                                    { name: 'Average', value: 'average' },
                                    { name: 'Minimum', value: 'min' },
                                    { name: 'Maximum', value: 'max' }
                                ], totalDisabled),
                                fill('Text color', 'totalTextColor'),
                                fill('Background color', 'totalFill', totalDisabled)
                            ]
                        }]
                    },
                    {
                        name: 'Column & Row Size',
                        value: [{
                            style: $WT.EDITORGROUP,
                            items: [
                                { style: $WT.CHECKBOXANDLABEL, propertyName: 'pinFirstColumn', labelText: 'Freeze first attribute column' },
                                pullDown('Column sizing', 'columnSizing', [
                                    { name: 'Fit to container', value: 'fitContainer' },
                                    { name: 'Fit to content', value: 'fitContent' },
                                    { name: 'Fixed width', value: 'fixed' }
                                ]),
                                stepper('Fixed width (px)', 'fixedColumnWidth', 40, 600, fixedColumnDisabled),
                                pullDown('Row sizing', 'rowSizing', [
                                    { name: 'Fit to container', value: 'fitContainer' },
                                    { name: 'Fit to content', value: 'fitContent' },
                                    { name: 'Fixed height', value: 'fixed' }
                                ]),
                                stepper('Fixed height (px)', 'fixedRowHeight', 20, 200, fixedRowDisabled)
                            ]
                        }]
                    }
                ];
                return properties.concat([attributeThresholdGroup(host), metricThresholdGroup(host)]);
            }
        }
    );
}());
