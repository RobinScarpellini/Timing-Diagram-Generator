// SPDX-License-Identifier: GPL-3.0-only

export const getDashPatternValue = (style, len, gap) => {
    const safeLen = Math.max(0.1, Number(len) || 0.1);
    const safeGap = Math.max(0.1, Number(gap) || 0.1);
    if (style === 'dashed') return `${safeLen},${safeGap}`;
    if (style === 'dotted') return `${safeLen},${safeGap}`;
    return '';
};

export const makeSafeColorToken = (color) => String(color || '').replace(/[^a-zA-Z0-9]/g, '');
