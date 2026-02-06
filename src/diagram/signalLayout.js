import {
    COUNTER_BOX_HEIGHT,
    DIAGRAM_HEIGHT_OFFSET,
    DIAGRAM_MIN_HEIGHT,
    OSC_WAVE_HEIGHT,
    SIGNAL_ROW_BASE_Y
} from '../constants/layout';

const MIN_SIZE = 2;

const toPositiveNumber = (value, fallback) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return parsed > 0 ? parsed : fallback;
};

export const getResolvedOscWaveHeight = (settings = {}) => Math.max(
    MIN_SIZE,
    toPositiveNumber(settings.oscWaveHeight, OSC_WAVE_HEIGHT)
);

export const getResolvedCounterWaveHeight = (settings = {}) => Math.max(
    MIN_SIZE,
    toPositiveNumber(settings.counterWaveHeight, COUNTER_BOX_HEIGHT)
);

export const getResolvedSpacingMode = (settings = {}) => (
    settings.signalSpacingMode === 'gap' ? 'gap' : 'pitch'
);

export const getSignalVisualHeight = (signal, settings = {}) => (
    signal?.type === 'counter'
        ? getResolvedCounterWaveHeight(settings)
        : getResolvedOscWaveHeight(settings)
);

export const computeSignalLayout = (signals = [], settings = {}) => {
    const spacing = Math.max(0, Number(settings.spacing) || 0);
    const spacingMode = getResolvedSpacingMode(settings);
    const rows = [];

    signals.forEach((signal, index) => {
        const height = getSignalVisualHeight(signal, settings);
        let top;
        let bottom;
        let mid;

        if (index === 0) {
            mid = SIGNAL_ROW_BASE_Y;
            top = mid - height / 2;
            bottom = mid + height / 2;
        } else if (spacingMode === 'gap') {
            top = rows[index - 1].bottom + spacing;
            bottom = top + height;
            mid = top + height / 2;
        } else {
            mid = SIGNAL_ROW_BASE_Y + index * spacing;
            top = mid - height / 2;
            bottom = mid + height / 2;
        }

        rows.push({
            id: signal.id,
            index,
            signal,
            top,
            bottom,
            mid,
            height
        });
    });

    return rows;
};

export const makeSignalLayoutMap = (rows = []) => new Map(
    rows.map((row) => [row.id, row])
);

export const computeDiagramHeightFromLayout = (rows = []) => {
    if (!rows.length) return DIAGRAM_MIN_HEIGHT;
    const tailPadding = DIAGRAM_HEIGHT_OFFSET - SIGNAL_ROW_BASE_Y;
    return Math.max(DIAGRAM_MIN_HEIGHT, rows[rows.length - 1].bottom + tailPadding);
};
