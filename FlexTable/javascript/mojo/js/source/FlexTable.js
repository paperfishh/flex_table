/**
 * FlexTable
 * A dependency-free MicroStrategy Mojo visualization that presents the current
 * grid data as an interactive HTML table.
 */
(function () {
    'use strict';

    if (!mstrmojo.plugins.FlexTable) {
        mstrmojo.plugins.FlexTable = {};
    }

    mstrmojo.requiresCls('mstrmojo.CustomVisBase');

    function getCollectionSize(collection) {
        if (!collection) {
            return 0;
        }
        if (typeof collection.Size === 'function') {
            return collection.Size();
        }
        if (typeof collection.size === 'function') {
            return collection.size();
        }
        return 0;
    }

    function getName(item, fallback) {
        if (item && typeof item.getName === 'function') {
            return item.getName() || fallback;
        }
        return fallback;
    }

    function addElement(parent, tagName, className, text) {
        var element = document.createElement(tagName);
        if (className) {
            element.className = className;
        }
        if (typeof text !== 'undefined') {
            element.textContent = text;
        }
        parent.appendChild(element);
        return element;
    }

    function isHtmlString(value) {
        if (value === null || typeof value === 'undefined') {
            return false;
        }
        var str = String(value).trim();
        return /<[a-z][\s\S]*>/i.test(str);
    }

    function stripHtml(html) {
        if (!html) return '';
        var tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    function escapeCsv(value) {
        var text = value === null || typeof value === 'undefined' ? '' : String(value);
        if (isHtmlString(text)) {
            text = stripHtml(text);
        }
        return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
    }

    function compareValues(left, right) {
        var leftNumber = typeof left === 'number' && isFinite(left);
        var rightNumber = typeof right === 'number' && isFinite(right);

        if (leftNumber && rightNumber) {
            return left - right;
        }
        return String(left === null || typeof left === 'undefined' ? '' : left)
            .localeCompare(String(right === null || typeof right === 'undefined' ? '' : right), undefined, {
                numeric: true,
                sensitivity: 'base'
            });
    }

    function normaliseText(value) {
        return String(value === null || typeof value === 'undefined' ? '' : value).toLowerCase();
    }

    function getBoolean(value, fallback) {
        if (value === null || typeof value === 'undefined' || value === '') {
            return fallback;
        }
        if (typeof value === 'boolean') {
            return value;
        }
        var str = String(value).trim().toLowerCase();
        if (str === 'true' || str === '1' || str === 'yes' || str === 'on') {
            return true;
        }
        if (str === 'false' || str === '0' || str === 'no' || str === 'off') {
            return false;
        }
        return fallback;
    }

    function getNumber(value, fallback) {
        var parsed = Number(value);
        return isFinite(parsed) && parsed > 0 ? parsed : fallback;
    }

    function fillColor(fill, fallback) {
        var color = (fill && typeof fill === 'object' && fill.fillColor) ? fill.fillColor : (typeof fill === 'string' && fill ? fill : fallback);
        var alpha = fill && typeof fill === 'object' && fill.fillAlpha !== null && typeof fill.fillAlpha !== 'undefined' ? Number(fill.fillAlpha) : 100;
        var hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color);
        var red;
        var green;
        var blue;

        if (!hex || !isFinite(alpha) || alpha >= 100) {
            return color;
        }
        alpha = Math.max(0, Math.min(100, alpha)) / 100;
        if (hex[1].length === 3) {
            red = parseInt(hex[1].charAt(0) + hex[1].charAt(0), 16);
            green = parseInt(hex[1].charAt(1) + hex[1].charAt(1), 16);
            blue = parseInt(hex[1].charAt(2) + hex[1].charAt(2), 16);
        } else {
            red = parseInt(hex[1].substr(0, 2), 16);
            green = parseInt(hex[1].substr(2, 2), 16);
            blue = parseInt(hex[1].substr(4, 2), 16);
        }
        return 'rgba(' + red + ',' + green + ',' + blue + ',' + alpha + ')';
    }

    function formatFontSize(size, fallback) {
        if (size === null || typeof size === 'undefined' || size === '') {
            return fallback;
        }
        var str = String(size).trim();
        if (!str) {
            return fallback;
        }
        if (/^\d+(?:\.\d+)?$/.test(str)) {
            return str + 'px';
        }
        return str;
    }

    function fontSettings(font, defaults) {
        var value = font || {};
        var family = value.fontFamily || value.family || value.fontName || value.name || (defaults && defaults.family ? defaults.family : 'Arial');
        var rawSize = value.fontSize !== null && typeof value.fontSize !== 'undefined' ? value.fontSize : (value.size || (defaults && defaults.size ? defaults.size : '12px'));
        var size = formatFontSize(rawSize, defaults && defaults.size ? defaults.size : '12px');
        var color = (defaults && defaults.color) ? defaults.color : fillColor(value.fontColor || value.color || value.fc, '#1f2937');

        var styleCode = parseInt(value.fontStyle, 10);
        var isNumericStyle = isFinite(styleCode);
        var styleText = String(value.fontStyle || value.style || '').toLowerCase();
        var weightText = String(value.fontWeight || value.weight || '').toLowerCase();
        var decText = String(value.textDecoration || value.decoration || '').toLowerCase();

        // 1. Check Bold
        var isBold = false;
        var hasBoldProp = (typeof value.isBold !== 'undefined' && value.isBold !== null && value.isBold !== '') ||
                          (typeof value.bold !== 'undefined' && value.bold !== null && value.bold !== '');
        if (hasBoldProp) {
            var valBold = (typeof value.isBold !== 'undefined' && value.isBold !== null && value.isBold !== '') ? value.isBold : value.bold;
            isBold = getBoolean(valBold, false);
        } else {
            isBold = (isNumericStyle && (styleCode & 1) !== 0) ||
                     styleText.indexOf('bold') !== -1 ||
                     weightText === 'bold' ||
                     weightText === 'b' ||
                     (isFinite(Number(weightText)) && Number(weightText) >= 600);
        }

        // 2. Check Italic
        var isItalic = false;
        var hasItalicProp = (typeof value.isItalic !== 'undefined' && value.isItalic !== null && value.isItalic !== '') ||
                            (typeof value.italic !== 'undefined' && value.italic !== null && value.italic !== '');
        if (hasItalicProp) {
            var valItalic = (typeof value.isItalic !== 'undefined' && value.isItalic !== null && value.isItalic !== '') ? value.isItalic : value.italic;
            isItalic = getBoolean(valItalic, false);
        } else {
            isItalic = (isNumericStyle && (styleCode & 2) !== 0) ||
                       styleText.indexOf('italic') !== -1 ||
                       styleText.indexOf('oblique') !== -1;
        }

        // 3. Check Underline
        var isUnderline = false;
        var hasUnderlineProp = (typeof value.isUnderline !== 'undefined' && value.isUnderline !== null && value.isUnderline !== '') ||
                               (typeof value.isUnderLine !== 'undefined' && value.isUnderLine !== null && value.isUnderLine !== '') ||
                               (typeof value.underline !== 'undefined' && value.underline !== null && value.underline !== '');
        if (hasUnderlineProp) {
            var valUnd = (typeof value.isUnderline !== 'undefined' && value.isUnderline !== null && value.isUnderline !== '') ? value.isUnderline :
                         ((typeof value.isUnderLine !== 'undefined' && value.isUnderLine !== null && value.isUnderLine !== '') ? value.isUnderLine : value.underline);
            isUnderline = getBoolean(valUnd, false);
        } else {
            isUnderline = (isNumericStyle && (styleCode & 4) !== 0) ||
                         styleText.indexOf('underline') !== -1 ||
                         decText.indexOf('underline') !== -1;
        }

        // 4. Check Strikethrough
        var isStrikethrough = false;
        var hasStrikeProp = (typeof value.isStrikeThrough !== 'undefined' && value.isStrikeThrough !== null && value.isStrikeThrough !== '') ||
                            (typeof value.isStrikethrough !== 'undefined' && value.isStrikethrough !== null && value.isStrikethrough !== '') ||
                            (typeof value.strikethrough !== 'undefined' && value.strikethrough !== null && value.strikethrough !== '') ||
                            (typeof value.strikeThrough !== 'undefined' && value.strikeThrough !== null && value.strikeThrough !== '') ||
                            (typeof value.isLineThrough !== 'undefined' && value.isLineThrough !== null && value.isLineThrough !== '') ||
                            (typeof value.lineThrough !== 'undefined' && value.lineThrough !== null && value.lineThrough !== '');
        if (hasStrikeProp) {
            var valStrike = (typeof value.isStrikeThrough !== 'undefined' && value.isStrikeThrough !== null && value.isStrikeThrough !== '') ? value.isStrikeThrough :
                            ((typeof value.isStrikethrough !== 'undefined' && value.isStrikethrough !== null && value.isStrikethrough !== '') ? value.isStrikethrough :
                            ((typeof value.strikethrough !== 'undefined' && value.strikethrough !== null && value.strikethrough !== '') ? value.strikethrough :
                            ((typeof value.strikeThrough !== 'undefined' && value.strikeThrough !== null && value.strikeThrough !== '') ? value.strikeThrough :
                            ((typeof value.isLineThrough !== 'undefined' && value.isLineThrough !== null && value.isLineThrough !== '') ? value.isLineThrough : value.lineThrough))));
            isStrikethrough = getBoolean(valStrike, false);
        } else {
            isStrikethrough = (isNumericStyle && (styleCode & 8) !== 0) ||
                             styleText.indexOf('strike') !== -1 ||
                             styleText.indexOf('line-through') !== -1 ||
                             decText.indexOf('line-through') !== -1 ||
                             decText.indexOf('strike') !== -1;
        }

        var decorations = [];
        if (isUnderline) {
            decorations.push('underline');
        }
        if (isStrikethrough) {
            decorations.push('line-through');
        }

        return {
            family: family,
            size: size,
            color: color,
            weight: isBold ? '700' : '400',
            style: isItalic ? 'italic' : 'normal',
            decoration: decorations.length ? decorations.join(' ') : 'none'
        };
    }

    function lineSettings(line, fallbackColor) {
        var value = line || {};
        var rawStyle = typeof value.lineStyle !== 'undefined' && value.lineStyle !== null ? value.lineStyle : (value.style || value.pattern || value.type || 'solid');
        var rawWidth = typeof value.lineWidth !== 'undefined' && value.lineWidth !== null ? value.lineWidth : (value.width || value.weight || value.size || null);
        var rawColor = value.lineColor || value.color || value.lc || value.clr || value.fillColor || fallbackColor;

        var styleText = String(rawStyle).toLowerCase().trim();
        var styleCode = parseInt(rawStyle, 10);
        var isNumericStyle = isFinite(styleCode);

        var style = 'solid';
        var width = '1px';

        if (isNumericStyle) {
            switch (styleCode) {
                case 0:
                    style = 'none';
                    width = '0px';
                    break;
                case 1:
                    style = 'solid';
                    width = '1px';
                    break;
                case 2:
                    style = 'solid';
                    width = '2px';
                    break;
                case 3:
                    style = 'dashed';
                    width = '1px';
                    break;
                case 4:
                    style = 'dotted';
                    width = '1px';
                    break;
                case 5:
                    style = 'double';
                    width = '3px';
                    break;
                default:
                    style = 'solid';
                    width = '1px';
                    break;
            }
        } else {
            if (styleText.indexOf('none') !== -1) {
                style = 'none';
                width = '0px';
            } else if (styleText.indexOf('dash') !== -1) {
                style = 'dashed';
            } else if (styleText.indexOf('dot') !== -1) {
                style = 'dotted';
            } else if (styleText.indexOf('double') !== -1) {
                style = 'double';
                width = '3px';
            } else if (styleText.indexOf('bold') !== -1 || styleText.indexOf('thick') !== -1 || styleText.indexOf('heavy') !== -1) {
                style = 'solid';
                width = '2px';
            } else {
                style = 'solid';
            }
        }

        if (rawWidth !== null && typeof rawWidth !== 'undefined' && rawWidth !== '') {
            var parsedWidth = parseFloat(rawWidth);
            if (isFinite(parsedWidth) && parsedWidth > 0) {
                width = parsedWidth + 'px';
            }
        } else if (!isNumericStyle) {
            var widthMatch = styleText.match(/(\d+(?:\.\d+)?)\s*px/);
            if (widthMatch) {
                width = widthMatch[1] + 'px';
            }
        }

        return {
            color: fillColor(rawColor, fallbackColor),
            style: style,
            width: width
        };
    }

    var THEME_PALETTES = {
        default: {
            bg: '#ffffff',
            headerBg: '#f5f8fa',
            headerFg: '#324a5f',
            rowBg: '#ffffff',
            bandBg: '#fafbfd',
            rowFg: '#1f2937',
            gridColor: '#d9e1ea',
            totalBg: '#eef3f7',
            totalFg: '#1f2937',
            kpiBg: '#f8fafc',
            kpiBorder: '#d9e1ea',
            kpiTitleFg: '#52606d',
            kpiValueFg: '#1f2937'
        },
        dark: {
            bg: '#0f172a',
            headerBg: '#1e293b',
            headerFg: '#ffffff',
            rowBg: '#0f172a',
            bandBg: '#182234',
            rowFg: '#ffffff',
            gridColor: '#334155',
            totalBg: '#1e293b',
            totalFg: '#ffffff',
            kpiBg: '#1e293b',
            kpiBorder: '#334155',
            kpiTitleFg: '#cbd5e1',
            kpiValueFg: '#ffffff'
        },
        navy: {
            bg: '#0a192f',
            headerBg: '#112240',
            headerFg: '#64ffda',
            rowBg: '#0a192f',
            bandBg: '#112240',
            rowFg: '#ffffff',
            gridColor: '#233554',
            totalBg: '#172a45',
            totalFg: '#64ffda',
            kpiBg: '#112240',
            kpiBorder: '#233554',
            kpiTitleFg: '#94a3b8',
            kpiValueFg: '#ffffff'
        },
        emerald: {
            bg: '#f0fdf4',
            headerBg: '#dcfce7',
            headerFg: '#14532d',
            rowBg: '#ffffff',
            bandBg: '#f0fdf4',
            rowFg: '#166534',
            gridColor: '#bbf7d0',
            totalBg: '#dcfce7',
            totalFg: '#14532d',
            kpiBg: '#ffffff',
            kpiBorder: '#bbf7d0',
            kpiTitleFg: '#15803d',
            kpiValueFg: '#14532d'
        },
        cyberpunk: {
            bg: '#090d16',
            headerBg: '#131b2e',
            headerFg: '#00f0ff',
            rowBg: '#090d16',
            bandBg: '#0e1626',
            rowFg: '#ffffff',
            gridColor: '#263552',
            totalBg: '#1a2640',
            totalFg: '#ff007f',
            kpiBg: '#131b2e',
            kpiBorder: '#00f0ff',
            kpiTitleFg: '#ff007f',
            kpiValueFg: '#00f0ff'
        },
        amber: {
            bg: '#fffbeb',
            headerBg: '#fef3c7',
            headerFg: '#78350f',
            rowBg: '#ffffff',
            bandBg: '#fffbeb',
            rowFg: '#92400e',
            gridColor: '#fde68a',
            totalBg: '#fef3c7',
            totalFg: '#78350f',
            kpiBg: '#ffffff',
            kpiBorder: '#fde68a',
            kpiTitleFg: '#b45309',
            kpiValueFg: '#78350f'
        },
        minimalist: {
            bg: '#fafafa',
            headerBg: '#f4f4f5',
            headerFg: '#18181b',
            rowBg: '#ffffff',
            bandBg: '#fafafa',
            rowFg: '#27272a',
            gridColor: '#e4e4e7',
            totalBg: '#f4f4f5',
            totalFg: '#18181b',
            kpiBg: '#ffffff',
            kpiBorder: '#e4e4e7',
            kpiTitleFg: '#71717a',
            kpiValueFg: '#18181b'
        }
    };

    function resolveThemeColor(propVal, defaultLightHex, themeHex, isDefaultTheme) {
        var parsed = fillColor(propVal, null);
        if (!parsed) {
            return themeHex;
        }
        if (!isDefaultTheme && String(parsed).toLowerCase() === defaultLightHex.toLowerCase()) {
            return themeHex;
        }
        return parsed;
    }

    function resolveThemeTextColor(fontProp, defaultLightHex, themeFgHex, bgHex, isDefaultTheme) {
        var rawColor = fontProp ? (fontProp.fontColor || fontProp.color || fontProp.fc) : null;
        var parsed = fillColor(rawColor, null);
        var bgIsDark = contrastColor(bgHex) === '#ffffff';

        var commonLightModeDarkTexts = [
            '#324a5f', '#1f2937', '#52606d', '#000000', '#000', 'black',
            '#111827', '#18181b', '#27272a', '#333333', '#4b5563', '#374151', '#273444'
        ];

        if (!parsed) {
            return bgIsDark ? themeFgHex : (isDefaultTheme ? defaultLightHex : themeFgHex);
        }

        var parsedLower = String(parsed).toLowerCase();
        var defaultLightLower = String(defaultLightHex).toLowerCase();
        var isDefaultDarkText = (parsedLower === defaultLightLower) ||
                                (commonLightModeDarkTexts.indexOf(parsedLower) !== -1) ||
                                (contrastColor(parsed) === '#ffffff');

        if (!isDefaultTheme) {
            if (bgIsDark && isDefaultDarkText) {
                return themeFgHex;
            }
            if (isDefaultDarkText) {
                return themeFgHex;
            }
        } else {
            if (bgIsDark && isDefaultDarkText) {
                return '#f8fafc';
            }
        }

        return parsed;
    }

    function readSettings(viz) {
        var presetTheme = viz.getProperty('presetTheme') || 'default';
        var theme = THEME_PALETTES[presetTheme] || THEME_PALETTES['default'];
        var isDefaultTheme = presetTheme === 'default';

        var headerFillProp = viz.getProperty('headerFill');
        var rowFillProp = viz.getProperty('rowFill');
        var bandFillProp = viz.getProperty('bandFill');
        var tableFillProp = viz.getProperty('tableFill');
        var totalFillProp = viz.getProperty('totalFill');
        var outlineFillProp = viz.getProperty('outlineFill');
        var kpiCardFillProp = viz.getProperty('kpiCardFill');
        var kpiCardBorderFillProp = viz.getProperty('kpiCardBorderFill');

        var headerFontProp = viz.getProperty('headerFont');
        var valueFontProp = viz.getProperty('valueFont');
        var totalFontProp = viz.getProperty('totalFont');
        var kpiTitleFontProp = viz.getProperty('kpiTitleFont');
        var kpiValueFontProp = viz.getProperty('kpiValueFont');

        var headerColor = resolveThemeColor(headerFillProp, '#f5f8fa', theme.headerBg, isDefaultTheme);
        var rowColor = resolveThemeColor(rowFillProp, '#ffffff', theme.rowBg, isDefaultTheme);
        var bandColor = resolveThemeColor(bandFillProp, '#fafbfd', theme.bandBg, isDefaultTheme);
        var tableColor = resolveThemeColor(tableFillProp, '#ffffff', theme.bg, isDefaultTheme);
        var totalColor = resolveThemeColor(totalFillProp, '#eef3f7', theme.totalBg, isDefaultTheme);
        var kpiCardBg = resolveThemeColor(kpiCardFillProp, '#f8fafc', theme.kpiBg, isDefaultTheme);
        var kpiCardBorderColor = resolveThemeColor(kpiCardBorderFillProp, '#d9e1ea', theme.kpiBorder, isDefaultTheme);

        var gridColorVal = resolveThemeColor(outlineFillProp, '#d9e1ea', theme.gridColor, isDefaultTheme);
        var gridLine = lineSettings(viz.getProperty('gridLine'), gridColorVal);

        var headerFgColor = resolveThemeTextColor(headerFontProp, '#324a5f', theme.headerFg, headerColor, isDefaultTheme);
        var valueFgColor = resolveThemeTextColor(valueFontProp, '#1f2937', theme.rowFg, rowColor, isDefaultTheme);
        var totalFgColor = resolveThemeTextColor(totalFontProp, '#1f2937', theme.totalFg, totalColor, isDefaultTheme);
        var kpiTitleFgColor = resolveThemeTextColor(kpiTitleFontProp, '#52606d', theme.kpiTitleFg, kpiCardBg, isDefaultTheme);
        var kpiValueFgColor = resolveThemeTextColor(kpiValueFontProp, '#1f2937', theme.kpiValueFg, kpiCardBg, isDefaultTheme);

        var headerFont = fontSettings(headerFontProp, { family: 'Arial', size: '12px', color: headerFgColor });
        var valueFont = fontSettings(valueFontProp, { family: 'Arial', size: '12px', color: valueFgColor });
        var totalFont = fontSettings(totalFontProp, { family: 'Arial', size: '12px', color: totalFgColor });
        var kpiTitleFont = fontSettings(kpiTitleFontProp, { family: 'Arial', size: '10px', color: kpiTitleFgColor });
        var kpiValueFont = fontSettings(kpiValueFontProp, { family: 'Arial', size: '16px', color: kpiValueFgColor });

        return {
            presetTheme: presetTheme,
            showKpiCards: getBoolean(viz.getProperty('showKpiCards'), false),
            kpiAggregation: viz.getProperty('kpiAggregation') || 'auto',
            kpiLayout: viz.getProperty('kpiLayout') || 'grid',
            showKpiMinMax: getBoolean(viz.getProperty('showKpiMinMax'), true),
            kpiCardBg: kpiCardBg,
            kpiCardBorderColor: kpiCardBorderColor,
            showSearch: getBoolean(viz.getProperty('showSearch'), true),
            showExport: getBoolean(viz.getProperty('showExport'), true),
            enablePagination: getBoolean(viz.getProperty('enablePagination'), true),
            configuredPageSize: getNumber(viz.getProperty('pageSize'), 25),
            showBanding: getBoolean(viz.getProperty('showBanding'), true),
            showOutline: getBoolean(viz.getProperty('showOutline'), true),
            mergeRepetitive: getBoolean(viz.getProperty('mergeRepetitive'), false),
            showDataBars: getBoolean(viz.getProperty('showDataBars'), false),
            dataBarMode: viz.getProperty('dataBarMode') || 'fill',
            dataBarUseGradient: getBoolean(viz.getProperty('dataBarUseGradient'), true),
            dataBarColor: fillColor(viz.getProperty('dataBarFill'), '#2f80ed'),
            dataBarGradientColor: fillColor(viz.getProperty('dataBarGradientFill'), '#00c6ff'),
            dataBarNegativeColor: fillColor(viz.getProperty('dataBarNegativeFill'), '#ef4444'),
            pinFirstColumn: getBoolean(viz.getProperty('pinFirstColumn'), false),
            showTotal: getBoolean(viz.getProperty('showTotal'), false),
            totalPosition: viz.getProperty('totalPosition') || 'bottom',
            totalAggregation: viz.getProperty('totalAggregation') || 'sum',
            headerHAlign: viz.getProperty('headerHAlign') || 'left',
            headerVAlign: viz.getProperty('headerVAlign') || 'middle',
            headerWrap: getBoolean(viz.getProperty('headerWrap'), false),
            attributeHAlign: viz.getProperty('attributeHAlign') || 'left',
            metricHAlign: viz.getProperty('metricHAlign') || 'right',
            valueVAlign: viz.getProperty('valueVAlign') || 'middle',
            valueWrap: getBoolean(viz.getProperty('valueWrap'), false),
            gridMode: viz.getProperty('gridMode') || 'all',
            columnSizing: viz.getProperty('columnSizing') || 'fitContainer',
            fixedColumnWidth: getNumber(viz.getProperty('fixedColumnWidth'), 140),
            rowSizing: viz.getProperty('rowSizing') || 'fitContent',
            fixedRowHeight: getNumber(viz.getProperty('fixedRowHeight'), 36),
            headerColor: headerColor,
            rowColor: rowColor,
            bandColor: bandColor,
            tableColor: tableColor,
            totalColor: totalColor,
            headerFont: headerFont,
            valueFont: valueFont,
            totalFont: totalFont,
            kpiTitleFont: kpiTitleFont,
            kpiValueFont: kpiValueFont,
            gridLine: gridLine
        };
    }

    function setStyleVariable(root, name, value) {
        root.style.setProperty(name, String(value));
    }

    function applyTheme(root, settings) {
        root.className = [
            'FlexTable',
            settings.presetTheme && settings.presetTheme !== 'default' ? 'flex-table-theme-' + settings.presetTheme : '',
            settings.showBanding ? '' : 'flex-table-no-banding',
            settings.showOutline ? '' : 'flex-table-no-outline',
            settings.pinFirstColumn ? 'flex-table-pinned-col' : '',
            settings.kpiLayout && settings.kpiLayout !== 'grid' ? 'flex-table-kpi-layout-' + settings.kpiLayout : '',
            'flex-table-grid-' + settings.gridMode,
            'flex-table-column-' + settings.columnSizing,
            'flex-table-row-' + settings.rowSizing,
            settings.headerWrap ? 'flex-table-header-wrap' : '',
            settings.valueWrap ? 'flex-table-value-wrap' : ''
        ].join(' ').replace(/\s+/g, ' ').replace(/^\s|\s$/g, '');
        setStyleVariable(root, '--flex-table-header-color', settings.headerColor);
        setStyleVariable(root, '--flex-table-row-color', settings.rowColor);
        setStyleVariable(root, '--flex-table-band-color', settings.bandColor);
        setStyleVariable(root, '--flex-table-background-color', settings.tableColor);
        setStyleVariable(root, '--flex-table-total-color', settings.totalColor);
        setStyleVariable(root, '--flex-table-grid-color', settings.gridLine.color);
        setStyleVariable(root, '--flex-table-grid-style', settings.gridLine.style);
        setStyleVariable(root, '--flex-table-grid-width', settings.gridLine.width);
        setStyleVariable(root, '--flex-table-header-font-family', settings.headerFont.family);
        setStyleVariable(root, '--flex-table-header-font-size', settings.headerFont.size);
        setStyleVariable(root, '--flex-table-header-font-color', settings.headerFont.color);
        setStyleVariable(root, '--flex-table-header-font-weight', settings.headerFont.weight);
        setStyleVariable(root, '--flex-table-header-font-style', settings.headerFont.style);
        setStyleVariable(root, '--flex-table-header-text-decoration', settings.headerFont.decoration);
        setStyleVariable(root, '--flex-table-value-font-family', settings.valueFont.family);
        setStyleVariable(root, '--flex-table-value-font-size', settings.valueFont.size);
        setStyleVariable(root, '--flex-table-value-font-color', settings.valueFont.color);
        setStyleVariable(root, '--flex-table-value-font-weight', settings.valueFont.weight);
        setStyleVariable(root, '--flex-table-value-font-style', settings.valueFont.style);
        setStyleVariable(root, '--flex-table-value-text-decoration', settings.valueFont.decoration);
        setStyleVariable(root, '--flex-table-total-font-family', settings.totalFont.family);
        setStyleVariable(root, '--flex-table-total-font-size', settings.totalFont.size);
        setStyleVariable(root, '--flex-table-total-font-color', settings.totalFont.color);
        setStyleVariable(root, '--flex-table-total-font-weight', settings.totalFont.weight);
        setStyleVariable(root, '--flex-table-total-font-style', settings.totalFont.style);
        setStyleVariable(root, '--flex-table-total-text-decoration', settings.totalFont.decoration);
        setStyleVariable(root, '--flex-table-kpi-bg-color', settings.kpiCardBg);
        setStyleVariable(root, '--flex-table-kpi-border-color', settings.kpiCardBorderColor);
        setStyleVariable(root, '--flex-table-kpi-title-font-family', settings.kpiTitleFont.family);
        setStyleVariable(root, '--flex-table-kpi-title-font-size', settings.kpiTitleFont.size);
        setStyleVariable(root, '--flex-table-kpi-title-font-color', settings.kpiTitleFont.color);
        setStyleVariable(root, '--flex-table-kpi-title-font-weight', settings.kpiTitleFont.weight);
        setStyleVariable(root, '--flex-table-kpi-title-font-style', settings.kpiTitleFont.style);
        setStyleVariable(root, '--flex-table-kpi-title-text-decoration', settings.kpiTitleFont.decoration);
        setStyleVariable(root, '--flex-table-kpi-value-font-family', settings.kpiValueFont.family);
        setStyleVariable(root, '--flex-table-kpi-value-font-size', settings.kpiValueFont.size);
        setStyleVariable(root, '--flex-table-kpi-value-font-color', settings.kpiValueFont.color);
        setStyleVariable(root, '--flex-table-kpi-value-font-weight', settings.kpiValueFont.weight);
        setStyleVariable(root, '--flex-table-kpi-value-font-style', settings.kpiValueFont.style);
        setStyleVariable(root, '--flex-table-kpi-value-text-decoration', settings.kpiValueFont.decoration);
        setStyleVariable(root, '--flex-table-header-h-align', settings.headerHAlign);
        setStyleVariable(root, '--flex-table-header-v-align', settings.headerVAlign);
        setStyleVariable(root, '--flex-table-attribute-h-align', settings.attributeHAlign);
        setStyleVariable(root, '--flex-table-metric-h-align', settings.metricHAlign);
        setStyleVariable(root, '--flex-table-value-v-align', settings.valueVAlign);
        setStyleVariable(root, '--flex-table-fixed-column-width', settings.fixedColumnWidth + 'px');
        setStyleVariable(root, '--flex-table-fixed-row-height', settings.fixedRowHeight + 'px');
    }

    function getVisibleRows(state) {
        var query = normaliseText(state.query).trim();
        var rows = state.rows.filter(function (row) {
            if (!query) {
                return true;
            }
            return row.cells.some(function (cell) {
                return normaliseText(cell.display).indexOf(query) !== -1;
            });
        });

        if (state.sort.column !== null) {
            rows.sort(function (left, right) {
                var result = compareValues(
                    left.cells[state.sort.column].sortValue,
                    right.cells[state.sort.column].sortValue
                );
                return result === 0 ? left.index - right.index : result * state.sort.direction;
            });
        }
        return rows;
    }

    function aggregate(values, method) {
        if (!values.length) {
            return null;
        }
        if (method === 'average') {
            return values.reduce(function (sum, value) { return sum + value; }, 0) / values.length;
        }
        if (method === 'min') {
            return Math.min.apply(Math, values);
        }
        if (method === 'max') {
            return Math.max.apply(Math, values);
        }
        return values.reduce(function (sum, value) { return sum + value; }, 0);
    }

    function formatTotal(value, sampleCell) {
        if (value === null) {
            return '';
        }
        var sample = sampleCell ? String(sampleCell.display || '') : '';
        var firstDigit = sample.search(/\d/);
        var lastDigit = -1;
        var index;
        for (index = sample.length - 1; index >= 0; index -= 1) {
            if (/\d/.test(sample.charAt(index))) {
                lastDigit = index;
                break;
            }
        }
        var prefix = firstDigit > 0 ? sample.substring(0, firstDigit) : '';
        var suffix = lastDigit >= 0 && lastDigit < sample.length - 1 ? sample.substring(lastDigit + 1) : '';
        var formatted;
        try {
            formatted = Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
        } catch (ignore) {
            formatted = String(Math.round(value * 100) / 100);
        }
        return prefix + formatted + suffix;
    }

    function getTotalLabel(aggregation) {
        var agg = String(aggregation || 'sum').toLowerCase();
        switch (agg) {
            case 'average':
            case 'avg':
                return 'Average';
            case 'min':
            case 'minimum':
                return 'Minimum';
            case 'max':
            case 'maximum':
                return 'Maximum';
            case 'sum':
            default:
                return 'Total';
        }
    }

    function buildTotalRow(state, rows) {
        var cells = [];
        var label = getTotalLabel(state.settings.totalAggregation);
        state.columns.forEach(function (column, columnIndex) {
            if (!column.isMetric) {
                cells.push({ display: columnIndex === 0 ? label : '', sortValue: '' });
                return;
            }
            var numericValues = [];
            var sampleCell = null;
            rows.forEach(function (row) {
                var value = Number(row.cells[columnIndex].sortValue);
                if (isFinite(value)) {
                    numericValues.push(value);
                    sampleCell = sampleCell || row.cells[columnIndex];
                }
            });
            var total = aggregate(numericValues, state.settings.totalAggregation);
            cells.push({ display: formatTotal(total, sampleCell), sortValue: total });
        });
        return { index: -1, cells: cells, isTotal: true };
    }

    function buildMergeSpans(rows, attributeCount) {
        var spans = rows.map(function () { return []; });
        var columnIndex;
        var rowIndex;
        for (columnIndex = 0; columnIndex < attributeCount; columnIndex += 1) {
            rowIndex = 0;
            while (rowIndex < rows.length) {
                var runLength = 1;
                while (rowIndex + runLength < rows.length) {
                    var current = rows[rowIndex];
                    var candidate = rows[rowIndex + runLength];
                    var sameParents = true;
                    var parentIndex;
                    for (parentIndex = 0; parentIndex < columnIndex; parentIndex += 1) {
                        if (current.cells[parentIndex].display !== candidate.cells[parentIndex].display) {
                            sameParents = false;
                            break;
                        }
                    }
                    if (!sameParents || current.cells[columnIndex].display !== candidate.cells[columnIndex].display) {
                        break;
                    }
                    runLength += 1;
                }
                spans[rowIndex][columnIndex] = runLength;
                for (var skipped = 1; skipped < runLength; skipped += 1) {
                    spans[rowIndex + skipped][columnIndex] = 0;
                }
                rowIndex += runLength;
            }
        }
        return spans;
    }

    function parseColor(color, fallback) {
        var value = String(color || fallback || '#000000');
        var hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value);
        var rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(value);
        if (hex) {
            if (hex[1].length === 3) {
                return {
                    red: parseInt(hex[1].charAt(0) + hex[1].charAt(0), 16),
                    green: parseInt(hex[1].charAt(1) + hex[1].charAt(1), 16),
                    blue: parseInt(hex[1].charAt(2) + hex[1].charAt(2), 16)
                };
            }
            return {
                red: parseInt(hex[1].substr(0, 2), 16),
                green: parseInt(hex[1].substr(2, 2), 16),
                blue: parseInt(hex[1].substr(4, 2), 16)
            };
        }
        if (rgb) {
            return { red: Number(rgb[1]), green: Number(rgb[2]), blue: Number(rgb[3]) };
        }
        return parseColor(fallback || '#000000', '#000000');
    }

    function rgbString(color) {
        return 'rgb(' + color.red + ',' + color.green + ',' + color.blue + ')';
    }

    function interpolateColor(color1, color2, ratio) {
        var c1 = parseColor(color1, '#f8696b');
        var c2 = parseColor(color2, '#63be7b');
        var amount = Math.max(0, Math.min(1, ratio));
        return rgbString({
            red: Math.round(c1.red + (c2.red - c1.red) * amount),
            green: Math.round(c1.green + (c2.green - c1.green) * amount),
            blue: Math.round(c1.blue + (c2.blue - c1.blue) * amount)
        });
    }

    function interpolateColor3(lowColor, midColor, highColor, ratio) {
        var amount = Math.max(0, Math.min(1, ratio));
        if (amount <= 0.5) {
            return interpolateColor(lowColor, midColor, amount * 2);
        }
        return interpolateColor(midColor, highColor, (amount - 0.5) * 2);
    }

    function contrastColor(background) {
        var rgb = parseColor(background, '#ffffff');
        var luminance = (rgb.red * 299 + rgb.green * 587 + rgb.blue * 114) / 1000;
        return luminance >= 145 ? '#111111' : '#ffffff';
    }

    function optionalNumber(value) {
        if (value === null || typeof value === 'undefined' || String(value).replace(/\s/g, '') === '') {
            return null;
        }
        var parsed = Number(value);
        return isFinite(parsed) ? parsed : null;
    }

    function metricStatistics(rows, columns) {
        var statistics = {};
        columns.forEach(function (column, columnIndex) {
            if (!column.isMetric) {
                return;
            }
            var values = [];
            rows.forEach(function (row) {
                var value = Number(row.cells[columnIndex].sortValue);
                if (isFinite(value)) {
                    values.push(value);
                }
            });
            statistics[column.thresholdPrefix] = {
                min: values.length ? Math.min.apply(Math, values) : 0,
                max: values.length ? Math.max.apply(Math, values) : 0
            };
        });
        return statistics;
    }

    function readAttributeThresholds(viz, columns, rows) {
        var thresholds = {};
        var defaultBgs = ['#e0f2fe', '#dcfce7', '#fef3c7', '#fee2e2', '#f3e8ff', '#e0e7ff', '#fce7f3', '#fef9c3', '#ccfbf1', '#f3f4f6'];
        var defaultColors = ['#0369a1', '#15803d', '#b45309', '#b91c1c', '#6b21a8', '#3730a3', '#9d174d', '#854d0e', '#115e59', '#374151'];

        columns.forEach(function (column, colIndex) {
            if (column.isMetric || !column.thresholdPrefix) {
                return;
            }
            var prefix = column.thresholdPrefix;
            var rulesMap = {};

            // 1. Backward compatibility: check legacy attr_rule1..10
            var ruleIndex;
            for (ruleIndex = 1; ruleIndex <= 10; ruleIndex += 1) {
                var ruleText = String(viz.getProperty(prefix + 'attr_rule' + ruleIndex + '_text') || '').trim();
                if (ruleText) {
                    var ruleBg = viz.getProperty(prefix + 'attr_rule' + ruleIndex + '_bg');
                    var ruleColor = viz.getProperty(prefix + 'attr_rule' + ruleIndex + '_color');
                    rulesMap[ruleText.toLowerCase()] = {
                        text: ruleText,
                        bg: fillColor(ruleBg, defaultBgs[(ruleIndex - 1) % defaultBgs.length]),
                        color: fillColor(ruleColor, defaultColors[(ruleIndex - 1) % defaultColors.length])
                    };
                }
            }

            // 2. Scan unique data values from rows for prefix + 'v_' + safeKey + '_bg' / '_color'
            var seenVal = {};
            if (rows) {
                rows.forEach(function (row) {
                    if (row.cells && row.cells[colIndex]) {
                        var rawVal = String(row.cells[colIndex].display || row.cells[colIndex].sortValue || '').trim();
                        if (rawVal && !seenVal[rawVal.toLowerCase()]) {
                            seenVal[rawVal.toLowerCase()] = true;
                            var safeKey = rawVal.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
                            var vBg = viz.getProperty(prefix + 'v_' + safeKey + '_bg');
                            var vColor = viz.getProperty(prefix + 'v_' + safeKey + '_color');
                            if (vBg || vColor) {
                                rulesMap[rawVal.toLowerCase()] = {
                                    text: rawVal,
                                    bg: fillColor(vBg, defaultBgs[0]),
                                    color: fillColor(vColor, defaultColors[0])
                                };
                            }
                        }
                    }
                });
            }

            thresholds[prefix] = {
                enabled: getBoolean(viz.getProperty(prefix + 'attr_enabled'), false),
                target: viz.getProperty(prefix + 'attr_target') || 'badge',
                rulesMap: rulesMap
            };
        });
        return thresholds;
    }

    function getAttributeThresholdMatch(state, column, cellValue) {
        var config = state.attributeThresholds ? state.attributeThresholds[column.thresholdPrefix] : null;
        if (!config || !config.enabled || cellValue === null || typeof cellValue === 'undefined') {
            return null;
        }
        var valLower = String(cellValue).trim().toLowerCase();
        if (config.rulesMap && config.rulesMap[valLower]) {
            var matchedRule = config.rulesMap[valLower];
            return {
                target: config.target,
                bg: matchedRule.bg,
                color: matchedRule.color
            };
        }
        return null;
    }



    function renderKpiCards(parent, state) {
        if (!state.settings.showKpiCards) {
            return;
        }
        var container = addElement(parent, 'div', 'flex-table-kpi-container');
        state.columns.forEach(function (column, colIdx) {
            if (!column.isMetric) {
                return;
            }
            var stats = state.metricStats[column.thresholdPrefix];
            if (!stats) {
                return;
            }
            var card = addElement(container, 'div', 'flex-table-kpi-card');
            addElement(card, 'div', 'flex-table-kpi-title', column.name);

            var numericValues = [];
            var sampleCell = null;
            state.rows.forEach(function (row) {
                var val = Number(row.cells[colIdx].sortValue);
                if (isFinite(val)) {
                    numericValues.push(val);
                    sampleCell = sampleCell || row.cells[colIdx];
                }
            });

            var aggMethod = state.settings.kpiAggregation && state.settings.kpiAggregation !== 'auto' ? state.settings.kpiAggregation : (state.settings.totalAggregation || 'sum');
            var totalVal = aggregate(numericValues, aggMethod);
            var formatted = formatTotal(totalVal, sampleCell);

            addElement(card, 'div', 'flex-table-kpi-value', formatted);
            if (state.settings.showKpiMinMax) {
                addElement(card, 'div', 'flex-table-kpi-sub', 'Min: ' + stats.min.toLocaleString() + ' | Max: ' + stats.max.toLocaleString());
            }
        });
    }

    function renderDataBar(td, numValue, stats, globalSettings, metricSettings) {
        if (!stats || !isFinite(numValue) || stats.max <= stats.min) {
            return;
        }
        var mode = (metricSettings && metricSettings.dataBarMode) || globalSettings.dataBarMode || 'fill';
        var useGradient = globalSettings.dataBarUseGradient;
        var barColor = (metricSettings && metricSettings.dataBarColor) || globalSettings.dataBarColor || '#2f80ed';
        var barGradientColor = (metricSettings && metricSettings.dataBarGradientColor) || globalSettings.dataBarGradientColor || '#00c6ff';
        var barNegativeColor = (metricSettings && metricSettings.dataBarNegativeColor) || globalSettings.dataBarNegativeColor || '#ef4444';

        var effectiveMin = stats.min;
        var effectiveMax = stats.max;
        if (metricSettings && metricSettings.dataBarRangeMode === 'custom') {
            if (metricSettings.dataBarMin !== null && metricSettings.dataBarMin !== undefined) {
                effectiveMin = metricSettings.dataBarMin;
            }
            if (metricSettings.dataBarMax !== null && metricSettings.dataBarMax !== undefined) {
                effectiveMax = metricSettings.dataBarMax;
            }
        }
        if (effectiveMax <= effectiveMin) {
            effectiveMin = stats.min;
            effectiveMax = stats.max;
        }
        if (effectiveMax <= effectiveMin) {
            return;
        }

        var isNegative = numValue < 0;
        var hasNegativeRange = effectiveMin < 0;
        var totalRange = Math.max(0, effectiveMax) - Math.min(0, effectiveMin);
        if (totalRange <= 0) {
            totalRange = 1;
        }

        var zeroPct = 0;
        var barLeft = 0;
        var barWidthPct = 0;
        var primaryColor = isNegative ? barNegativeColor : barColor;

        if (hasNegativeRange) {
            zeroPct = (Math.abs(Math.min(0, effectiveMin)) / totalRange) * 100;
            if (isNegative) {
                barWidthPct = (Math.abs(numValue) / totalRange) * 100;
                barLeft = Math.max(0, zeroPct - barWidthPct);
            } else {
                barLeft = zeroPct;
                barWidthPct = (numValue / totalRange) * 100;
            }
        } else {
            barLeft = 0;
            barWidthPct = Math.max(0, Math.min(100, ((numValue - effectiveMin) / (effectiveMax - effectiveMin)) * 100));
        }

        barWidthPct = Math.max(0, Math.min(100, barWidthPct));
        barLeft = Math.max(0, Math.min(100, barLeft));

        var fillStyle;
        if (useGradient && !isNegative) {
            fillStyle = 'linear-gradient(90deg, ' + primaryColor + ', ' + barGradientColor + ')';
        } else {
            fillStyle = primaryColor;
        }

        if (mode === 'capsule') {
            td.classList.add('flex-table-bar-cell');
            var track = addElement(td, 'div', 'flex-table-bar-track');
            var capsule = addElement(track, 'div', 'flex-table-bar-capsule');
            capsule.style.left = barLeft.toFixed(1) + '%';
            capsule.style.width = barWidthPct.toFixed(1) + '%';
            capsule.style.background = fillStyle;
            var contentWrap = document.createElement('span');
            contentWrap.className = 'flex-table-bar-content';
            while (td.firstChild && td.firstChild !== track) {
                contentWrap.appendChild(td.firstChild);
            }
            td.insertBefore(contentWrap, track);
        } else if (mode === 'bottomPill') {
            td.classList.add('flex-table-bar-cell');
            var bottomTrack = addElement(td, 'div', 'flex-table-bar-bottom-track');
            var bottomFill = addElement(bottomTrack, 'div', 'flex-table-bar-bottom-fill');
            bottomFill.style.left = barLeft.toFixed(1) + '%';
            bottomFill.style.width = barWidthPct.toFixed(1) + '%';
            bottomFill.style.background = fillStyle;
            var contentWrap2 = document.createElement('span');
            contentWrap2.className = 'flex-table-bar-content';
            while (td.firstChild && td.firstChild !== bottomTrack) {
                contentWrap2.appendChild(td.firstChild);
            }
            td.insertBefore(contentWrap2, bottomTrack);
        } else {
            var gradBackground;
            if (hasNegativeRange) {
                var rightBoundary = barLeft + barWidthPct;
                gradBackground = 'linear-gradient(90deg, transparent 0%, transparent ' + barLeft.toFixed(1) + '%, ' + primaryColor + ' ' + barLeft.toFixed(1) + '%, ' + primaryColor + ' ' + rightBoundary.toFixed(1) + '%, transparent ' + rightBoundary.toFixed(1) + '%)';
            } else if (useGradient) {
                gradBackground = 'linear-gradient(90deg, ' + primaryColor + ' 0%, ' + barGradientColor + ' ' + barWidthPct.toFixed(1) + '%, transparent ' + barWidthPct.toFixed(1) + '%)';
            } else {
                var alphaColor = fillColor({ fillColor: primaryColor, fillAlpha: '25' }, primaryColor);
                gradBackground = 'linear-gradient(90deg, ' + alphaColor + ' ' + barWidthPct.toFixed(1) + '%, transparent ' + barWidthPct.toFixed(1) + '%)';
            }
            td.style.background = gradBackground;
        }
    }

    function readMetricThresholds(viz, columns) {
        var thresholds = {};
        columns.forEach(function (column) {
            if (!column.isMetric) {
                return;
            }
            var prefix = column.thresholdPrefix;
            var barColorVal = viz.getProperty(prefix + 'dataBarColor');
            var barGradColorVal = viz.getProperty(prefix + 'dataBarGradientColor');
            var barNegColorVal = viz.getProperty(prefix + 'dataBarNegativeColor');
            thresholds[prefix] = {
                showDataBar: getBoolean(viz.getProperty(prefix + 'showDataBar'), false),
                dataBarMode: viz.getProperty(prefix + 'dataBarMode') || 'fill',
                dataBarRangeMode: viz.getProperty(prefix + 'dataBarRangeMode') || 'auto',
                dataBarMin: optionalNumber(viz.getProperty(prefix + 'dataBarMin')),
                dataBarMax: optionalNumber(viz.getProperty(prefix + 'dataBarMax')),
                dataBarColor: fillColor(barColorVal, '#2f80ed'),
                dataBarGradientColor: fillColor(barGradColorVal, '#00c6ff'),
                dataBarNegativeColor: fillColor(barNegColorVal, '#ef4444'),
                enabled: getBoolean(viz.getProperty(prefix + 'enabled'), false),
                mode: viz.getProperty(prefix + 'mode') || 'continuous',
                target: viz.getProperty(prefix + 'target') || 'background',
                rangeMode: viz.getProperty(prefix + 'rangeMode') || 'auto',
                min: optionalNumber(viz.getProperty(prefix + 'min')),
                max: optionalNumber(viz.getProperty(prefix + 'max')),
                cutoff1: optionalNumber(viz.getProperty(prefix + 'cutoff1')),
                cutoff2: optionalNumber(viz.getProperty(prefix + 'cutoff2')),
                lowColor: fillColor(viz.getProperty(prefix + 'lowColor'), '#f8696b'),
                midColor: fillColor(viz.getProperty(prefix + 'midColor'), '#ffeb84'),
                highColor: fillColor(viz.getProperty(prefix + 'highColor'), '#63be7b'),
                stage1Color: fillColor(viz.getProperty(prefix + 'stage1Color'), '#f8696b'),
                stage2Color: fillColor(viz.getProperty(prefix + 'stage2Color'), '#ffeb84'),
                stage3Color: fillColor(viz.getProperty(prefix + 'stage3Color'), '#63be7b')
            };
        });
        return thresholds;
    }

    function thresholdCellStyle(state, column, rawValue) {
        var config = state.thresholds[column.thresholdPrefix];
        var stats = state.metricStats[column.thresholdPrefix];
        var value = Number(rawValue);
        if (!config || !config.enabled || !stats || !isFinite(value)) {
            return null;
        }

        var color;
        if (config.mode === 'staged') {
            var cutoff1 = config.rangeMode === 'custom' ? config.cutoff1 : stats.min + (stats.max - stats.min) / 3;
            var cutoff2 = config.rangeMode === 'custom' ? config.cutoff2 : stats.min + (stats.max - stats.min) * 2 / 3;
            if (cutoff1 === null || cutoff2 === null || cutoff1 >= cutoff2) {
                cutoff1 = stats.min + (stats.max - stats.min) / 3;
                cutoff2 = stats.min + (stats.max - stats.min) * 2 / 3;
            }
            color = value <= cutoff1 ? config.stage1Color : (value <= cutoff2 ? config.stage2Color : config.stage3Color);
        } else {
            var minimum = config.rangeMode === 'custom' && config.min !== null ? config.min : stats.min;
            var maximum = config.rangeMode === 'custom' && config.max !== null ? config.max : stats.max;
            if (maximum <= minimum) {
                maximum = minimum + 1;
            }
            color = interpolateColor3(config.lowColor, config.midColor, config.highColor, (value - minimum) / (maximum - minimum));
        }

        if (config.target === 'text') {
            return { color: color };
        }
        return { backgroundColor: color, color: contrastColor(color) };
    }

    function exportCsv(state) {
        var rows = getVisibleRows(state);
        var lines = [state.columns.map(function (column) {
            return escapeCsv(column.name);
        }).join(',')];

        if (state.settings.showTotal && state.settings.totalPosition === 'top') {
            rows = [buildTotalRow(state, rows)].concat(rows);
        } else if (state.settings.showTotal) {
            rows = rows.concat([buildTotalRow(state, rows)]);
        }

        rows.forEach(function (row) {
            lines.push(row.cells.map(function (cell) {
                return escapeCsv(cell.display);
            }).join(','));
        });

        var blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
        var link = document.createElement('a');
        var url = (window.URL || window.webkitURL).createObjectURL(blob);
        link.href = url;
        link.download = 'FlexTable.csv';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.setTimeout(function () {
            (window.URL || window.webkitURL).revokeObjectURL(url);
        }, 0);
    }

    function escapeRegExp(string) {
        return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function highlightMatch(text, query) {
        if (!query || text === null || typeof text === 'undefined') {
            return text;
        }
        var stringText = String(text);
        var trimmedQuery = query.trim();
        if (!trimmedQuery) {
            return stringText;
        }
        var regex = new RegExp('(' + escapeRegExp(trimmedQuery) + ')', 'gi');
        var safeText = stringText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return safeText.replace(regex, '<mark class="flex-table-highlight">$1</mark>');
    }

    function renderCellContent(container, content, query) {
        if (content === null || typeof content === 'undefined') {
            return;
        }
        var strContent = String(content);
        if (isHtmlString(strContent)) {
            container.innerHTML = strContent;
        } else if (query) {
            container.innerHTML = highlightMatch(strContent, query);
        } else {
            container.appendChild(document.createTextNode(strContent));
        }
    }

    function createButton(parent, className, label, title, onClick) {
        var button = addElement(parent, 'button', className, label);
        button.type = 'button';
        button.title = title || label;
        button.addEventListener('click', onClick);
        return button;
    }

    function toggleFilterPopup(headerEl, column, columnIndex, state, root) {
        var existing = headerEl.querySelector('.flex-table-filter-popup');
        if (existing) {
            headerEl.removeChild(existing);
            return;
        }
        var popup = addElement(headerEl, 'div', 'flex-table-filter-popup');
        state.columnFilters = state.columnFilters || {};
        var currentFilter = state.columnFilters[columnIndex] || {};

        if (!column.isMetric) {
            var uniqueValues = [];
            state.rows.forEach(function (row) {
                var val = row.cells[columnIndex].display;
                if (uniqueValues.indexOf(val) === -1) {
                    uniqueValues.push(val);
                }
            });
            uniqueValues.sort();

            var searchInput = addElement(popup, 'input');
            searchInput.type = 'text';
            searchInput.placeholder = 'Search values...';

            var list = addElement(popup, 'div', 'flex-table-filter-list');
            var selectedVals = currentFilter.selectedValues ? currentFilter.selectedValues.slice() : uniqueValues.slice();

            function renderList(query) {
                list.innerHTML = '';
                uniqueValues.forEach(function (val) {
                    if (query && val.toLowerCase().indexOf(query.toLowerCase()) === -1) {
                        return;
                    }
                    var item = addElement(list, 'label', 'flex-table-filter-item');
                    var chk = addElement(item, 'input');
                    chk.type = 'checkbox';
                    chk.checked = selectedVals.indexOf(val) !== -1;
                    chk.addEventListener('change', function () {
                        if (chk.checked) {
                            if (selectedVals.indexOf(val) === -1) { selectedVals.push(val); }
                        } else {
                            var idx = selectedVals.indexOf(val);
                            if (idx !== -1) { selectedVals.splice(idx, 1); }
                        }
                    });
                    addElement(item, 'span', '', val);
                });
            }

            renderList('');
            searchInput.addEventListener('input', function () { renderList(searchInput.value); });

            var actions = addElement(popup, 'div', 'flex-table-filter-actions');
            createButton(actions, '', 'Apply', 'Apply filter', function (e) {
                e.stopPropagation();
                if (selectedVals.length === uniqueValues.length) {
                    delete state.columnFilters[columnIndex];
                } else {
                    state.columnFilters[columnIndex] = { selectedValues: selectedVals };
                }
                state.page = 0;
                render(root, state);
            });
            createButton(actions, '', 'Clear', 'Clear filter', function (e) {
                e.stopPropagation();
                delete state.columnFilters[columnIndex];
                state.page = 0;
                render(root, state);
            });
        } else {
            addElement(popup, 'div', '', 'Filter range:');
            var minInput = addElement(popup, 'input');
            minInput.type = 'number';
            minInput.placeholder = 'Min value';
            minInput.value = currentFilter.min !== null && typeof currentFilter.min !== 'undefined' ? currentFilter.min : '';

            var maxInput = addElement(popup, 'input');
            maxInput.type = 'number';
            maxInput.placeholder = 'Max value';
            maxInput.value = currentFilter.max !== null && typeof currentFilter.max !== 'undefined' ? currentFilter.max : '';

            var actions2 = addElement(popup, 'div', 'flex-table-filter-actions');
            createButton(actions2, '', 'Apply', 'Apply filter', function (e) {
                e.stopPropagation();
                var minVal = minInput.value !== '' ? Number(minInput.value) : null;
                var maxVal = maxInput.value !== '' ? Number(maxInput.value) : null;
                if (minVal === null && maxVal === null) {
                    delete state.columnFilters[columnIndex];
                } else {
                    state.columnFilters[columnIndex] = { min: minVal, max: maxVal };
                }
                state.page = 0;
                render(root, state);
            });
            createButton(actions2, '', 'Clear', 'Clear filter', function (e) {
                e.stopPropagation();
                delete state.columnFilters[columnIndex];
                state.page = 0;
                render(root, state);
            });
        }
    }

    function toggleColumnManagerPopup(actionsEl, state, root) {
        var existing = actionsEl.querySelector('.flex-table-filter-popup');
        if (existing) {
            actionsEl.removeChild(existing);
            return;
        }
        var popup = addElement(actionsEl, 'div', 'flex-table-filter-popup');
        popup.style.top = '100%';
        popup.style.right = '0';
        addElement(popup, 'div', '', 'Show/Hide Columns:');
        var list = addElement(popup, 'div', 'flex-table-filter-list');
        state.hiddenColumns = state.hiddenColumns || {};

        state.columns.forEach(function (column, colIdx) {
            var item = addElement(list, 'label', 'flex-table-filter-item');
            var chk = addElement(item, 'input');
            chk.type = 'checkbox';
            chk.checked = !state.hiddenColumns[colIdx];
            chk.addEventListener('change', function () {
                state.hiddenColumns[colIdx] = !chk.checked;
                render(root, state);
            });
            addElement(item, 'span', '', column.name);
        });
    }

    function render(root, state, renderOptions) {
        var visibleRows = getVisibleRows(state);
        var pageCount = state.settings.enablePagination ? Math.max(1, Math.ceil(visibleRows.length / state.pageSize)) : 1;
        state.page = Math.min(state.page, pageCount - 1);

        root.innerHTML = '';

        renderKpiCards(root, state);

        var toolbar = addElement(root, 'div', 'flex-table-toolbar');
        var search;
        if (state.settings.showSearch) {
            search = addElement(toolbar, 'input', 'flex-table-search');
            search.type = 'search';
            search.placeholder = 'Search table';
            search.setAttribute('aria-label', 'Search table');
            search.value = state.query;
            search.addEventListener('input', function () {
                state.query = search.value;
                state.page = 0;
                render(root, state, {
                    focusSearch: true,
                    selectionStart: search.selectionStart,
                    selectionEnd: search.selectionEnd
                });
            });
        }

        var count = addElement(toolbar, 'span', 'flex-table-count', visibleRows.length + ' row' + (visibleRows.length === 1 ? '' : 's'));
        count.setAttribute('aria-live', 'polite');

        var actions = addElement(toolbar, 'div', 'flex-table-actions');
        if (state.settings.enablePagination) {
            var pageSize = addElement(actions, 'select', 'flex-table-page-size');
            pageSize.setAttribute('aria-label', 'Rows per page');
            [10, 25, 50, 100].forEach(function (size) {
                var option = addElement(pageSize, 'option', '', String(size));
                option.value = size;
                option.selected = size === state.pageSize;
            });
            pageSize.addEventListener('change', function () {
                state.pageSize = Number(pageSize.value);
                state.page = 0;
                state.viz.setProperty('pageSize', String(state.pageSize), { suppressData: true });
                render(root, state);
            });
        }
        if (state.settings.showExport) {
            createButton(actions, 'flex-table-export', 'Export CSV', 'Export filtered table as CSV', function () {
                exportCsv(state);
            });
        }

        var viewport = addElement(root, 'div', 'flex-table-viewport');
        var table = addElement(viewport, 'table', 'flex-table-grid');
        var head = addElement(table, 'thead');
        var headerRow = addElement(head, 'tr');

        state.columns.forEach(function (column, columnIndex) {
            if (state.hiddenColumns && state.hiddenColumns[columnIndex]) {
                return;
            }
            var header = addElement(headerRow, 'th', column.isMetric ? 'flex-table-header-metric' : 'flex-table-header-attribute');
            header.scope = 'col';
            if (state.columnWidths && state.columnWidths[columnIndex]) {
                var widthPx = state.columnWidths[columnIndex] + 'px';
                header.style.width = widthPx;
                header.style.minWidth = widthPx;
                header.style.maxWidth = widthPx;
            }
            var isSorted = state.sort.column === columnIndex;
            var direction = isSorted ? (state.sort.direction === 1 ? 'ascending' : 'descending') : 'none';
            header.setAttribute('aria-sort', direction);
            var label = column.name + (isSorted ? (state.sort.direction === 1 ? ' \u25B2' : ' \u25BC') : '');
            createButton(header, 'flex-table-sort', label, 'Sort by ' + column.name, function () {
                if (state.sort.column === columnIndex) {
                    state.sort.direction *= -1;
                } else {
                    state.sort.column = columnIndex;
                    state.sort.direction = 1;
                }
                state.page = 0;
                render(root, state);
            });

            var resizer = addElement(header, 'div', 'flex-table-resizer');
            resizer.title = 'Drag to resize column';
            resizer.addEventListener('mousedown', function (event) {
                event.preventDefault();
                event.stopPropagation();
                var startX = event.pageX;
                var startWidth = header.offsetWidth;
                header.classList.add('flex-table-resizing');

                var onMouseMove = function (moveEvent) {
                    var newWidth = Math.max(40, startWidth + (moveEvent.pageX - startX));
                    state.columnWidths[columnIndex] = newWidth;
                    var newWidthPx = newWidth + 'px';
                    header.style.width = newWidthPx;
                    header.style.minWidth = newWidthPx;
                    header.style.maxWidth = newWidthPx;
                };

                var onMouseUp = function () {
                    header.classList.remove('flex-table-resizing');
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                };

                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            });
        });

        var body = addElement(table, 'tbody');
        var firstRow = state.settings.enablePagination ? state.page * state.pageSize : 0;
        var pageRows = state.settings.enablePagination ? visibleRows.slice(firstRow, firstRow + state.pageSize) : visibleRows;
        var totalRow = state.settings.showTotal ? buildTotalRow(state, visibleRows) : null;
        var mergeSpans = state.settings.mergeRepetitive ? buildMergeSpans(pageRows, state.attributeCount) : null;

        function appendDataRow(row, pageRowIndex) {
            var trClass = row.isTotal ? 'flex-table-total-row' : '';
            var tr = addElement(body, 'tr', trClass);

            var rowThresholdBg = null;
            var rowThresholdColor = null;
            if (!row.isTotal) {
                row.cells.forEach(function (cell, colIdx) {
                    if (!state.columns[colIdx].isMetric && !rowThresholdBg) {
                        var attrMatch = getAttributeThresholdMatch(state, state.columns[colIdx], cell.display);
                        if (attrMatch && attrMatch.target === 'row') {
                            rowThresholdBg = attrMatch.bg;
                            rowThresholdColor = attrMatch.color;
                        }
                    }
                });
            }

            if (rowThresholdBg) {
                tr.style.backgroundColor = rowThresholdBg;
                if (rowThresholdColor) {
                    tr.style.color = rowThresholdColor;
                }
            }

            row.cells.forEach(function (cell, columnIndex) {
                if (state.hiddenColumns && state.hiddenColumns[columnIndex]) {
                    return;
                }
                var column = state.columns[columnIndex];
                if (mergeSpans && !row.isTotal && columnIndex < state.attributeCount && mergeSpans[pageRowIndex][columnIndex] === 0) {
                    return;
                }
                var cellClass = column.isMetric ? 'flex-table-metric' : 'flex-table-attribute';
                var td = addElement(tr, 'td', cellClass);

                if (!row.isTotal && !column.isMetric) {
                    var attrMatch = getAttributeThresholdMatch(state, column, cell.display);
                    if (attrMatch) {
                        if (attrMatch.target === 'badge') {
                            var badge = addElement(td, 'span', 'flex-table-badge');
                            badge.style.backgroundColor = attrMatch.bg;
                            badge.style.color = attrMatch.color;
                            renderCellContent(badge, cell.display, state.query);
                        } else if (attrMatch.target === 'cell') {
                            td.style.backgroundColor = attrMatch.bg;
                            td.style.color = attrMatch.color;
                            renderCellContent(td, cell.display, state.query);
                        } else if (attrMatch.target === 'text') {
                            td.style.color = attrMatch.color;
                            renderCellContent(td, cell.display, state.query);
                        } else {
                            renderCellContent(td, cell.display, state.query);
                        }
                    } else {
                        renderCellContent(td, cell.display, state.query);
                    }
                } else {
                    renderCellContent(td, cell.display, row.isTotal ? '' : state.query);
                }

                if (!row.isTotal && column.isMetric) {
                    var thresholdStyle = thresholdCellStyle(state, column, cell.sortValue);
                    if (thresholdStyle) {
                        if (thresholdStyle.backgroundColor) {
                            td.style.backgroundColor = thresholdStyle.backgroundColor;
                        }
                        if (thresholdStyle.color) {
                            td.style.color = thresholdStyle.color;
                        }
                        td.className += ' flex-table-threshold-cell';
                    }

                    var metricConfig = state.thresholds ? state.thresholds[column.thresholdPrefix] : null;

                    var metricDataBarEnabled = metricConfig ? metricConfig.showDataBar : false;
                    if (metricDataBarEnabled && !thresholdStyle) {
                        var stats = state.metricStats[column.thresholdPrefix];
                        var numValue = Number(cell.sortValue);
                        renderDataBar(td, numValue, stats, state.settings, metricConfig || {});
                    }
                }

                if (mergeSpans && !row.isTotal && columnIndex < state.attributeCount && mergeSpans[pageRowIndex][columnIndex] > 1) {
                    td.rowSpan = mergeSpans[pageRowIndex][columnIndex];
                    td.className += ' flex-table-merged';
                }
            });
        }

        if (pageRows.length === 0) {
            var emptyRow = addElement(body, 'tr', 'flex-table-empty-row');
            var emptyCell = addElement(emptyRow, 'td', 'flex-table-empty', state.rows.length ? 'No rows match your search.' : 'Add attributes or metrics to display data.');
            emptyCell.colSpan = Math.max(1, state.columns.length);
        } else {
            if (totalRow && state.settings.totalPosition === 'top') {
                appendDataRow(totalRow, -1);
            }
            pageRows.forEach(function (row, pageRowIndex) {
                appendDataRow(row, pageRowIndex);
            });
            if (totalRow && state.settings.totalPosition !== 'top') {
                appendDataRow(totalRow, -1);
            }
        }

        if (state.settings.enablePagination) {
            var footer = addElement(root, 'div', 'flex-table-footer');
            var rangeStart = visibleRows.length ? firstRow + 1 : 0;
            var rangeEnd = Math.min(firstRow + state.pageSize, visibleRows.length);
            addElement(footer, 'span', 'flex-table-range', rangeStart + '-' + rangeEnd + ' of ' + visibleRows.length);
            var pagination = addElement(footer, 'div', 'flex-table-pagination');
            var first = createButton(pagination, 'flex-table-page', '\u00AB', 'First page', function () {
                state.page = 0;
                render(root, state);
            });
            first.disabled = state.page === 0;
            var previous = createButton(pagination, 'flex-table-page', '\u2039', 'Previous page', function () {
                state.page -= 1;
                render(root, state);
            });
            previous.disabled = state.page === 0;
            var pageInput = addElement(pagination, 'input', 'flex-table-page-input');
            pageInput.type = 'number';
            pageInput.min = '1';
            pageInput.max = String(pageCount);
            pageInput.value = String(state.page + 1);
            pageInput.setAttribute('aria-label', 'Go to page');
            var goToPage = function () {
                var destination = Math.max(1, Math.min(pageCount, Number(pageInput.value) || 1));
                state.page = destination - 1;
                render(root, state);
            };
            pageInput.addEventListener('change', goToPage);
            pageInput.addEventListener('keydown', function (event) {
                if ((event.key && event.key === 'Enter') || event.keyCode === 13) {
                    goToPage();
                }
            });
            addElement(pagination, 'span', 'flex-table-page-label', '/ ' + pageCount);
            var next = createButton(pagination, 'flex-table-page', '\u203A', 'Next page', function () {
                state.page += 1;
                render(root, state);
            });
            next.disabled = state.page >= pageCount - 1;
            var last = createButton(pagination, 'flex-table-page', '\u00BB', 'Last page', function () {
                state.page = pageCount - 1;
                render(root, state);
            });
            last.disabled = state.page >= pageCount - 1;
        }

        if (search && renderOptions && renderOptions.focusSearch) {
            search.focus();
            if (typeof search.setSelectionRange === 'function') {
                search.setSelectionRange(renderOptions.selectionStart, renderOptions.selectionEnd);
            }
        }
    }

    function getHeaderObjectId(header) {
        if (header && typeof header.getObjectId === 'function') {
            return header.getObjectId() || '';
        }
        if (header && typeof header.getElementId === 'function') {
            return header.getElementId() || '';
        }
        return '';
    }

    function thresholdPropertyPrefix(objectId, name, columnIndex) {
        var seed = String(objectId || name || ('col' + columnIndex)).replace(/[^a-z0-9]/gi, '').substring(0, 48);
        return 'threshold_' + (seed || ('col' + columnIndex)) + '_';
    }

    function metricColumnInfo(dataInterface, columnIndex) {
        var directHeaders;
        var sharedHeaders;
        var candidate;
        var header;
        var objectId = '';
        try {
            sharedHeaders = dataInterface.getColHeaders(0);
            header = sharedHeaders && sharedHeaders.getHeader(columnIndex);
            candidate = getName(header, '');
            objectId = getHeaderObjectId(header);
            if (candidate) {
                return {
                    name: candidate,
                    objectId: objectId,
                    thresholdPrefix: thresholdPropertyPrefix(objectId, candidate, columnIndex)
                };
            }
        } catch (ignoreShared) {
            sharedHeaders = null;
        }
        try {
            directHeaders = dataInterface.getColHeaders(columnIndex);
            header = directHeaders && directHeaders.getHeader(0);
            candidate = getName(header, '');
            objectId = getHeaderObjectId(header);
            if (candidate) {
                return {
                    name: candidate,
                    objectId: objectId,
                    thresholdPrefix: thresholdPropertyPrefix(objectId, candidate, columnIndex)
                };
            }
        } catch (ignoreDirect) {
            directHeaders = null;
        }
        try {
            var headerData = dataInterface.getColumnHeaderData();
            var headerItem = headerData && headerData[columnIndex];
            candidate = headerItem && (headerItem.name || headerItem.n || headerItem.title || headerItem.v);
            if (candidate) {
                objectId = headerItem.id || headerItem.objectId || headerItem.oid || '';
                return {
                    name: candidate,
                    objectId: objectId,
                    thresholdPrefix: thresholdPropertyPrefix(objectId, candidate, columnIndex)
                };
            }
        } catch (ignoreHeaderData) {
            candidate = '';
        }
        candidate = 'Metric ' + (columnIndex + 1);
        return {
            name: candidate,
            objectId: '',
            thresholdPrefix: thresholdPropertyPrefix('', candidate, columnIndex)
        };
    }

    function extractState(dataInterface) {
        var rowTitles = dataInterface.getRowTitles();
        var attributeCount = getCollectionSize(rowTitles);
        var metricCount = dataInterface.getTotalCols();
        var columns = [];
        var rows = [];
        var rowIndex;
        var columnIndex;

        for (columnIndex = 0; columnIndex < attributeCount; columnIndex += 1) {
            var titleHeader = rowTitles ? rowTitles.getTitle(columnIndex) : null;
            var attrName = getName(titleHeader, 'Attribute ' + (columnIndex + 1));
            var attrObjId = getHeaderObjectId(titleHeader);
            columns.push({
                name: attrName,
                isMetric: false,
                objectId: attrObjId,
                thresholdPrefix: thresholdPropertyPrefix(attrObjId, attrName, columnIndex)
            });
        }

        for (columnIndex = 0; columnIndex < metricCount; columnIndex += 1) {
            var metricInfo = metricColumnInfo(dataInterface, columnIndex);
            columns.push({
                name: metricInfo.name,
                isMetric: true,
                objectId: metricInfo.objectId,
                thresholdPrefix: metricInfo.thresholdPrefix
            });
        }

        for (rowIndex = 0; rowIndex < dataInterface.getTotalRows(); rowIndex += 1) {
            var headers = dataInterface.getRowHeaders(rowIndex);
            var cells = [];
            for (columnIndex = 0; columnIndex < attributeCount; columnIndex += 1) {
                var header = headers && headers.getHeader(columnIndex);
                var headerName = getName(header, '');
                cells.push({ display: headerName, sortValue: headerName, header: header });
            }
            for (columnIndex = 0; columnIndex < metricCount; columnIndex += 1) {
                var metric = dataInterface.getMetricValue(rowIndex, columnIndex);
                var formatted = metric && typeof metric.getValue === 'function' ? metric.getValue() : '';
                var raw = metric && typeof metric.getRawValue === 'function' ? metric.getRawValue() : formatted;
                cells.push({ display: formatted, sortValue: raw });
            }
            rows.push({ index: rowIndex, cells: cells });
        }

        return {
            columns: columns,
            rows: rows,
            attributeCount: attributeCount,
            query: '',
            page: 0,
            pageSize: 25,
            sort: { column: null, direction: 1 },
            columnWidths: {},
            columnFilters: {},
            hiddenColumns: {},
            collapsedGroups: {}
        };
    }

    mstrmojo.plugins.FlexTable.FlexTable = mstrmojo.declare(
        mstrmojo.CustomVisBase,
        null,
        {
            scriptClass: 'mstrmojo.plugins.FlexTable.FlexTable',
            cssClass: 'FlexTable',
            errorDetails: 'Unable to render Flex Table.',
            reuseDOMNode: false,
            supportNEE: true,

            plot: function () {
                try {
                    var currentData = extractState(this.dataInterface);
                    var defaultValues = {
                        presetTheme: 'default',
                        showKpiCards: 'false',
                        kpiAggregation: 'auto',
                        kpiLayout: 'grid',
                        showKpiMinMax: 'true',
                        kpiCardFill: { fillColor: '#f8fafc', fillAlpha: '100' },
                        kpiCardBorderFill: { fillColor: '#d9e1ea', fillAlpha: '100' },
                        kpiTitleFont: { fontFamily: 'Arial', fontStyle: '1', fontSize: '10px', fontColor: '#52606d' },
                        kpiValueFont: { fontFamily: 'Arial', fontStyle: '1', fontSize: '16px', fontColor: '#1f2937' },
                        showSearch: 'true',
                        showExport: 'true',
                        enablePagination: 'true',
                        pageSize: '25',
                        showBanding: 'true',
                        showOutline: 'true',
                        mergeRepetitive: 'false',
                        showDataBars: 'false',
                        dataBarMode: 'fill',
                        dataBarUseGradient: 'true',
                        dataBarFill: { fillColor: '#2f80ed', fillAlpha: '25' },
                        dataBarGradientFill: { fillColor: '#00c6ff', fillAlpha: '25' },
                        dataBarNegativeFill: { fillColor: '#ef4444', fillAlpha: '25' },
                        pinFirstColumn: 'false',
                        showTotal: 'false',
                        totalPosition: 'bottom',
                        totalAggregation: 'sum',
                        headerHAlign: 'left',
                        headerVAlign: 'middle',
                        headerWrap: 'false',
                        attributeHAlign: 'left',
                        metricHAlign: 'right',
                        valueVAlign: 'middle',
                        valueWrap: 'false',
                        gridMode: 'all',
                        columnSizing: 'fitContainer',
                        fixedColumnWidth: '140',
                        rowSizing: 'fitContent',
                        fixedRowHeight: '36',
                        headerFill: { fillColor: '#f5f8fa', fillAlpha: '100' },
                        rowFill: { fillColor: '#ffffff', fillAlpha: '100' },
                        bandFill: { fillColor: '#fafbfd', fillAlpha: '100' },
                        tableFill: { fillColor: '#ffffff', fillAlpha: '100' },
                        totalFill: { fillColor: '#eef3f7', fillAlpha: '100' },
                        gridLine: { lineColor: '#d9e1ea', lineStyle: '1px solid' },
                        headerFont: { fontFamily: 'Arial', fontStyle: '1', fontSize: '12px', fontColor: '#324a5f' },
                        valueFont: { fontFamily: 'Arial', fontStyle: '0', fontSize: '12px', fontColor: '#1f2937' },
                        totalFont: { fontFamily: 'Arial', fontStyle: '1', fontSize: '12px', fontColor: '#1f2937' }
                    };

                    currentData.columns.forEach(function (column) {
                        var prefix = column.thresholdPrefix;
                        if (!column.isMetric) {
                            defaultValues[prefix + 'attr_enabled'] = 'false';
                            defaultValues[prefix + 'attr_target'] = 'badge';
                            var ruleIndex;
                            var defaultBgs = ['#e0f2fe', '#dcfce7', '#fef3c7', '#fee2e2', '#f3e8ff', '#e0e7ff', '#fce7f3', '#fef9c3', '#ccfbf1', '#f3f4f6'];
                            var defaultColors = ['#0369a1', '#15803d', '#b45309', '#b91c1c', '#6b21a8', '#3730a3', '#9d174d', '#854d0e', '#115e59', '#374151'];
                            for (ruleIndex = 1; ruleIndex <= 10; ruleIndex += 1) {
                                defaultValues[prefix + 'attr_rule' + ruleIndex + '_text'] = '';
                                defaultValues[prefix + 'attr_rule' + ruleIndex + '_bg'] = { fillColor: defaultBgs[(ruleIndex - 1) % defaultBgs.length], fillAlpha: '100' };
                                defaultValues[prefix + 'attr_rule' + ruleIndex + '_color'] = { fillColor: defaultColors[(ruleIndex - 1) % defaultColors.length], fillAlpha: '100' };
                            }
                            return;
                        }
                        defaultValues[prefix + 'showDataBar'] = 'false';
                        defaultValues[prefix + 'dataBarMode'] = 'fill';
                        defaultValues[prefix + 'dataBarRangeMode'] = 'auto';
                        defaultValues[prefix + 'dataBarMin'] = '';
                        defaultValues[prefix + 'dataBarMax'] = '';
                        defaultValues[prefix + 'dataBarColor'] = { fillColor: '#2f80ed', fillAlpha: '100' };
                        defaultValues[prefix + 'dataBarGradientColor'] = { fillColor: '#00c6ff', fillAlpha: '100' };
                        defaultValues[prefix + 'dataBarNegativeColor'] = { fillColor: '#ef4444', fillAlpha: '100' };
                        defaultValues[prefix + 'enabled'] = 'false';
                        defaultValues[prefix + 'mode'] = 'continuous';
                        defaultValues[prefix + 'target'] = 'background';
                        defaultValues[prefix + 'rangeMode'] = 'auto';
                        defaultValues[prefix + 'min'] = '';
                        defaultValues[prefix + 'max'] = '';
                        defaultValues[prefix + 'cutoff1'] = '';
                        defaultValues[prefix + 'cutoff2'] = '';
                        defaultValues[prefix + 'lowColor'] = { fillColor: '#f8696b', fillAlpha: '100' };
                        defaultValues[prefix + 'midColor'] = { fillColor: '#ffeb84', fillAlpha: '100' };
                        defaultValues[prefix + 'highColor'] = { fillColor: '#63be7b', fillAlpha: '100' };
                        defaultValues[prefix + 'stage1Color'] = { fillColor: '#f8696b', fillAlpha: '100' };
                        defaultValues[prefix + 'stage2Color'] = { fillColor: '#ffeb84', fillAlpha: '100' };
                        defaultValues[prefix + 'stage3Color'] = { fillColor: '#63be7b', fillAlpha: '100' };
                    });

                    this.setDefaultPropertyValues(defaultValues);

                    var settings = readSettings(this);
                    var state = this._flexTableState;
                    if (!state) {
                        state = currentData;
                        state.pageSize = settings.configuredPageSize;
                        state.configuredPageSize = settings.configuredPageSize;
                        this._flexTableState = state;
                    } else {
                        state.columns = currentData.columns;
                        state.rows = currentData.rows;
                        state.attributeCount = currentData.attributeCount;
                        if (state.configuredPageSize !== settings.configuredPageSize) {
                            state.pageSize = settings.configuredPageSize;
                            state.configuredPageSize = settings.configuredPageSize;
                            state.page = 0;
                        }
                        if (state.sort.column !== null && state.sort.column >= state.columns.length) {
                            state.sort.column = null;
                        }
                    }
                    state.settings = settings;
                    state.thresholds = readMetricThresholds(this, state.columns);
                    state.attributeThresholds = readAttributeThresholds(this, state.columns, state.rows);
                    state.metricStats = metricStatistics(state.rows, state.columns);
                    state.viz = this;
                    applyTheme(this.domNode, settings);
                    render(this.domNode, state);
                } catch (error) {
                    this.domNode.innerHTML = '';
                    addElement(this.domNode, 'div', 'flex-table-error', 'Unable to display table data.');
                    if (window.console && typeof window.console.error === 'function') {
                        window.console.error('FlexTable rendering error', error);
                    }
                }

                this.raiseEvent({ name: 'renderFinished', id: this.k });
            }
        }
    );
}());
