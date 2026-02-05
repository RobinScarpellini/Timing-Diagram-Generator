const estimateTextWidth = (text, fontSize) => {
    const safe = String(text || '');
    return safe.length * (fontSize * 0.6);
};

export const estimateLegendSize = (legend, { fontSize = 10 } = {}) => {
    const entries = Array.isArray(legend?.entries) ? legend.entries : [];
    if (!entries.length) {
        return { width: 0, height: 0, rowHeight: 0, symbolWidth: 0 };
    }

    const layout = legend?.layout && typeof legend.layout === 'object' ? legend.layout : {};
    const padding = typeof layout.padding === 'number' ? layout.padding : 8;
    const gap = typeof layout.gap === 'number' ? layout.gap : 6;
    const rowHeight = Math.max(14, fontSize + 4);
    const symbolWidth = 26;
    const labelGap = 10;

    let maxLabelWidth = 0;
    entries.forEach((entry) => {
        const w = estimateTextWidth(entry?.label || '', fontSize);
        if (w > maxLabelWidth) maxLabelWidth = w;
    });

    const width = padding * 2 + symbolWidth + labelGap + maxLabelWidth;
    const height = padding * 2 + entries.length * rowHeight + Math.max(0, entries.length - 1) * gap;
    return { width, height, rowHeight, symbolWidth, padding, gap, labelGap };
};

export const resolveLegendPosition = (legend, legendSize, { baseWidth } = {}) => {
    const layout = legend?.layout && typeof legend.layout === 'object' ? legend.layout : {};
    const xRaw = layout.x;
    const yRaw = layout.y;
    const x = (typeof xRaw === 'number') ? xRaw : Math.max(0, (baseWidth || 0) - legendSize.width - 8);
    const y = (typeof yRaw === 'number') ? yRaw : 8;
    return { x, y };
};

