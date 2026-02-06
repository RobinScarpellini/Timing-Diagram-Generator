// SPDX-License-Identifier: GPL-3.0-only

import { DEFAULT_SIGNAL, DEFAULT_STATE } from './defaults';
import { EDGE_ARROW_TYPES, HATCH_TYPES, LABEL_JUSTIFY, LABEL_POSITIONS, LEGEND_ENTRY_TYPES, LINE_STYLES, LINK_MARKERS, MEASUREMENT_LABEL_POSITIONS, SPACING_MODES } from '../constants/styles';
import { EDGE_POLARITY, SIGNAL_TYPES } from '../constants/signal';

const DEFAULT_COUNTER_SIGNAL = {
    type: SIGNAL_TYPES.COUNTER,
    name: 'CNT',
    startEdge: 1,
    endEdge: 10,
    color: '#000000',
    referenceOscId: null,
    polarity: EDGE_POLARITY.RISING
};

const GUIDE_STYLE_OPTIONS = new Set(Object.values(LINE_STYLES));
const LINK_STYLE_OPTIONS = new Set(Object.values(LINE_STYLES));
const LINK_MARKER_OPTIONS = new Set(Object.values(LINK_MARKERS));
const HATCH_TYPE_OPTIONS = new Set(Object.values(HATCH_TYPES));
const LEGEND_ENTRY_TYPE_OPTIONS = new Set(Object.values(LEGEND_ENTRY_TYPES));
const EDGE_ARROW_TYPE_OPTIONS = new Set(Object.values(EDGE_ARROW_TYPES));
const LABEL_POS_OPTIONS = new Set(Object.values(LABEL_POSITIONS));
const MEASUREMENT_LABEL_POS_OPTIONS = new Set(Object.values(MEASUREMENT_LABEL_POSITIONS));
const SPACING_MODE_OPTIONS = new Set(Object.values(SPACING_MODES));
const JUSTIFY_OPTIONS = new Set(Object.values(LABEL_JUSTIFY));

const toNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toInt = (value, fallback) => {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const toOption = (value, allowed, fallback) => (
    allowed.has(value) ? value : fallback
);

const toStringSafe = (value, fallback = '') => (
    typeof value === 'string' ? value : fallback
);

const cloneDefaults = () => ({
    ...DEFAULT_STATE,
    signals: DEFAULT_STATE.signals.map((signal) => ({ ...signal })),
    settings: { ...DEFAULT_STATE.settings },
    layers: { ...DEFAULT_STATE.layers },
    legend: {
        ...DEFAULT_STATE.legend,
        entries: DEFAULT_STATE.legend.entries.map((entry) => ({ ...entry })),
        layout: { ...DEFAULT_STATE.legend.layout }
    }
});

export const normalizeState = (raw) => {
    const state = cloneDefaults();
    if (!raw || typeof raw !== 'object') return state;

    if (typeof raw.diagramName === 'string') {
        state.diagramName = raw.diagramName;
    }

    const makeId = (prefix, index) => `${prefix}-${index}-${Math.random().toString(36).slice(2, 7)}`;
    const ensureIds = (items, prefix) => items
        .filter((item) => item && typeof item === 'object')
        .map((item, index) => (item.id ? item : { ...item, id: makeId(prefix, index) }));

    if (!Array.isArray(raw.signals)) {
        throw new Error('Invalid state: signals is required.');
    }

    state.signals = raw.signals.map((signal, index) => {
        if (!signal || typeof signal !== 'object') {
            throw new Error(`Invalid signal at index ${index}.`);
        }
        const type = signal.type;
        if (type !== SIGNAL_TYPES.OSCILLATOR && type !== SIGNAL_TYPES.COUNTER) {
            throw new Error(`Invalid signal type at index ${index}.`);
        }
        const id = signal.id || makeId(type, index);

        if (type === SIGNAL_TYPES.OSCILLATOR) {
            return {
                ...DEFAULT_SIGNAL,
                ...signal,
                id,
                type: SIGNAL_TYPES.OSCILLATOR,
                name: toStringSafe(signal.name, DEFAULT_SIGNAL.name),
                period: toNumber(signal.period, DEFAULT_SIGNAL.period),
                delay: toNumber(signal.delay, DEFAULT_SIGNAL.delay),
                edgeCount: toInt(signal.edgeCount, DEFAULT_SIGNAL.edgeCount),
                inverted: typeof signal.inverted === 'boolean' ? signal.inverted : DEFAULT_SIGNAL.inverted,
                color: toStringSafe(signal.color, DEFAULT_SIGNAL.color)
            };
        }

        return {
            ...DEFAULT_COUNTER_SIGNAL,
            ...signal,
            id,
            type: SIGNAL_TYPES.COUNTER,
            name: toStringSafe(signal.name, DEFAULT_COUNTER_SIGNAL.name),
            startEdge: Math.max(1, toInt(signal.startEdge, DEFAULT_COUNTER_SIGNAL.startEdge)),
            endEdge: Math.max(1, toInt(signal.endEdge, DEFAULT_COUNTER_SIGNAL.endEdge)),
            color: toStringSafe(signal.color, DEFAULT_COUNTER_SIGNAL.color),
            referenceOscId: signal.referenceOscId ?? DEFAULT_COUNTER_SIGNAL.referenceOscId,
            polarity: (signal.polarity === EDGE_POLARITY.FALLING ? EDGE_POLARITY.FALLING : EDGE_POLARITY.RISING)
        };
    });

    const firstOscillatorId = state.signals.find((s) => s.type === SIGNAL_TYPES.OSCILLATOR)?.id ?? null;
    const oscillatorIdSet = new Set(state.signals.filter((s) => s.type === SIGNAL_TYPES.OSCILLATOR).map((s) => s.id));
    state.signals = state.signals.map((signal) => {
        if (signal.type !== SIGNAL_TYPES.COUNTER) return signal;
        const refId = (signal.referenceOscId && oscillatorIdSet.has(signal.referenceOscId))
            ? signal.referenceOscId
            : firstOscillatorId;
        const startEdge = Math.max(1, toInt(signal.startEdge, 1));
        const endEdge = Math.max(startEdge, toInt(signal.endEdge, startEdge));
        return {
            ...signal,
            referenceOscId: refId,
            startEdge,
            endEdge
        };
    });

    const settingsSource = raw.settings && typeof raw.settings === 'object' ? raw.settings : null;
    if (settingsSource) {
        Object.keys(state.settings).forEach((key) => {
            if (settingsSource[key] !== undefined) {
                state.settings[key] = settingsSource[key];
            }
        });
    }
    state.settings.duration = Math.max(2, Number(state.settings.duration) || 2);
    state.settings.spacing = Math.max(1, Number(state.settings.spacing) || 1);
    state.settings.signalSpacingMode = toOption(state.settings.signalSpacingMode, SPACING_MODE_OPTIONS, 'pitch');
    state.settings.lineWidth = Math.max(2, Number(state.settings.lineWidth) || 2);
    state.settings.boldWeight = Math.max(0.1, Number(state.settings.boldWeight) || 0.1);
    state.settings.fontSize = Math.max(2, Number(state.settings.fontSize) || 2);
    state.settings.labelJustify = toOption(state.settings.labelJustify, JUSTIFY_OPTIONS, LABEL_JUSTIFY.START);
    state.settings.counterFontSize = Math.max(2, Number(state.settings.counterFontSize) || 2);
    state.settings.linkLineWidth = Math.max(0.1, Number(state.settings.linkLineWidth) || 0.1);
    state.settings.linkStyle = toOption(state.settings.linkStyle, LINK_STYLE_OPTIONS, LINE_STYLES.DASHED);
    state.settings.arrowSize = Math.max(1, Number(state.settings.arrowSize) || 1);
    state.settings.linkDashLength = Math.max(1, Number(state.settings.linkDashLength) || 1);
    state.settings.linkDashGap = Math.max(1, Number(state.settings.linkDashGap) || 1);
    state.settings.linkStartMarker = toOption(state.settings.linkStartMarker, LINK_MARKER_OPTIONS, 'none');
    state.settings.linkEndMarker = toOption(state.settings.linkEndMarker, LINK_MARKER_OPTIONS, 'arrow');
    state.settings.guideLineWidth = Math.max(0.1, Number(state.settings.guideLineWidth) || 0.1);
    state.settings.guideStyle = toOption(state.settings.guideStyle, GUIDE_STYLE_OPTIONS, LINE_STYLES.DOTTED);
    state.settings.guideDashLength = Math.max(1, Number(state.settings.guideDashLength) || 1);
    state.settings.guideDashGap = Math.max(1, Number(state.settings.guideDashGap) || 1);
    state.settings.oscWaveHeight = Math.max(2, Number(state.settings.oscWaveHeight) || 2);
    state.settings.counterWaveHeight = Math.max(2, Number(state.settings.counterWaveHeight) || 2);
    state.settings.timeScale = Math.max(0.001, Number(state.settings.timeScale) || 1);
    state.settings.edgeArrowType = toOption(state.settings.edgeArrowType, EDGE_ARROW_TYPE_OPTIONS, EDGE_ARROW_TYPES.FILLED);
    state.settings.edgeArrowSize = Math.max(1, Number(state.settings.edgeArrowSize) || 1);
    state.settings.edgeArrowRatio = Math.min(2, Math.max(0.5, Number(state.settings.edgeArrowRatio) || 1.4));
    state.settings.edgeArrowLabelSize = Math.max(1, Number(state.settings.edgeArrowLabelSize) || 1);
    state.settings.edgeArrowLabelPosition = toOption(state.settings.edgeArrowLabelPosition, LABEL_POS_OPTIONS, LABEL_POSITIONS.ABOVE);
    state.settings.measurementLineWidth = Math.max(0.1, Number(state.settings.measurementLineWidth) || 0.1);
    state.settings.measurementArrowSize = Math.max(1, Number(state.settings.measurementArrowSize) || 1);
    state.settings.measurementLabelSize = Math.max(1, Number(state.settings.measurementLabelSize) || 1);
    state.settings.measurementLabelPosition = toOption(state.settings.measurementLabelPosition, MEASUREMENT_LABEL_POS_OPTIONS, MEASUREMENT_LABEL_POSITIONS.TOP);
    state.settings.zoneBorderWidth = Math.max(0, Number(state.settings.zoneBorderWidth) || 0);
    state.settings.zonePatternWidth = Math.max(0.1, Number(state.settings.zonePatternWidth) || 0.1);
    state.settings.hatchType = toOption(state.settings.hatchType, HATCH_TYPE_OPTIONS, HATCH_TYPES.HATCH_45);

    const minPeriod = 2;
    state.signals = state.signals.map((signal) => {
        if (signal.type !== SIGNAL_TYPES.OSCILLATOR) return signal;
        const parsed = Number(signal.period);
        return {
            ...signal,
            period: Math.max(minPeriod, Number.isFinite(parsed) ? parsed : 100)
        };
    });

    if (Array.isArray(raw.guides)) {
        state.guides = ensureIds(raw.guides, 'guide')
            .map((guide) => ({
                id: guide.id,
                oscId: guide.oscId ?? null,
                edgeIndex: toInt(guide.edgeIndex, 0),
                style: toOption(guide.style, GUIDE_STYLE_OPTIONS, state.settings.guideStyle),
                lineWidth: Math.max(0.1, toNumber(guide.lineWidth, state.settings.guideLineWidth)),
                dashLength: Math.max(1, toNumber(guide.dashLength, state.settings.guideDashLength)),
                dashGap: Math.max(1, toNumber(guide.dashGap, state.settings.guideDashGap)),
                upperExtension: Number.isFinite(Number(guide.upperExtension)) ? Number(guide.upperExtension) : null,
                lowerExtension: Number.isFinite(Number(guide.lowerExtension)) ? Number(guide.lowerExtension) : null
            }))
            .filter((guide) => typeof guide.oscId === 'string' && guide.oscId.length > 0);
    }

    if (Array.isArray(raw.zones)) {
        state.zones = ensureIds(raw.zones, 'zone')
            .map((zone) => {
                const start = zone.start && typeof zone.start === 'object' ? zone.start : {};
                const end = zone.end && typeof zone.end === 'object' ? zone.end : {};
                const oscillatorId = zone.oscillatorId ?? end.oscId ?? null;
                return {
                    id: zone.id,
                    start: {
                        oscId: start.oscId ?? null,
                        edgeIndex: toInt(start.edgeIndex, 0)
                    },
                    end: {
                        oscId: end.oscId ?? null,
                        edgeIndex: toInt(end.edgeIndex, 0)
                    },
                    oscillatorId,
                    hatchType: toOption(zone.hatchType, HATCH_TYPE_OPTIONS, state.settings.hatchType),
                    color: toStringSafe(zone.color, state.settings.zoneColor),
                    borderWidth: Math.max(0, toNumber(zone.borderWidth, state.settings.zoneBorderWidth)),
                    patternWidth: Math.max(0.1, toNumber(zone.patternWidth, state.settings.zonePatternWidth))
                };
            })
            .filter((zone) => zone.start.oscId && zone.end.oscId && zone.oscillatorId);
    }
    if (Array.isArray(raw.links)) {
        state.links = ensureIds(raw.links, 'link')
            .map((link) => {
                const start = link.start && typeof link.start === 'object' ? link.start : {};
                const end = link.end && typeof link.end === 'object' ? link.end : {};
                const label = link.arrowLabel && typeof link.arrowLabel === 'object' ? link.arrowLabel : null;
                return {
                    id: link.id,
                    start: {
                        oscId: start.oscId ?? null,
                        counterId: start.counterId ?? null,
                        edgeIndex: toInt(start.edgeIndex, 0)
                    },
                    end: {
                        oscId: end.oscId ?? null,
                        counterId: end.counterId ?? null,
                        edgeIndex: toInt(end.edgeIndex, 0)
                    },
                    color: toStringSafe(link.color, state.settings.linkColor),
                    style: toOption(link.style, LINK_STYLE_OPTIONS, state.settings.linkStyle),
                    lineWidth: Math.max(0.1, toNumber(link.lineWidth, state.settings.linkLineWidth)),
                    dashLength: Math.max(1, toNumber(link.dashLength, state.settings.linkDashLength)),
                    dashGap: Math.max(1, toNumber(link.dashGap, state.settings.linkDashGap)),
                    arrowSize: Math.max(1, toNumber(link.arrowSize, state.settings.arrowSize)),
                    startMarker: toOption(link.startMarker, LINK_MARKER_OPTIONS, state.settings.linkStartMarker),
                    endMarker: toOption(link.endMarker, LINK_MARKER_OPTIONS, state.settings.linkEndMarker),
                    arrowLabel: (label && toStringSafe(label.text, '').trim().length)
                        ? {
                            text: toStringSafe(label.text, ''),
                            size: Math.max(1, toNumber(label.size, state.settings.fontSize)),
                            position: toOption(label.position, LABEL_POS_OPTIONS, LABEL_POSITIONS.ABOVE)
                        }
                        : null
                };
            })
            .filter((link) => (
                (link.start.oscId || link.start.counterId) && (link.end.oscId || link.end.counterId)
            ));
    }

    if (Array.isArray(raw.measurements)) {
        state.measurements = ensureIds(raw.measurements, 'measurement').map((m) => {
            const label = m.arrowLabel && typeof m.arrowLabel === 'object' ? m.arrowLabel : null;
            return {
                ...m,
                id: m.id,
                color: toStringSafe(m.color, state.settings.measurementColor ?? '#000000'),
                lineWidth: Math.max(0.1, toNumber(m.lineWidth, state.settings.measurementLineWidth ?? 1.2)),
                arrowSize: Math.max(1, toNumber(m.arrowSize, state.settings.measurementArrowSize ?? state.settings.arrowSize ?? 10)),
                y: Number.isFinite(Number(m.y)) ? Number(m.y) : 24,
                arrowLabel: (label && toStringSafe(label.text, '').trim().length)
                    ? {
                        text: toStringSafe(label.text, ''),
                        size: Math.max(1, toNumber(label.size, state.settings.measurementLabelSize ?? state.settings.fontSize)),
                        position: toOption(label.position, MEASUREMENT_LABEL_POS_OPTIONS, state.settings.measurementLabelPosition ?? MEASUREMENT_LABEL_POSITIONS.TOP)
                    }
                    : null
            };
        });
    }

    if (Array.isArray(raw.edgeArrows)) {
        state.edgeArrows = ensureIds(raw.edgeArrows, 'edge-arrow')
            .map((arrow) => {
                const label = arrow.arrowLabel && typeof arrow.arrowLabel === 'object' ? arrow.arrowLabel : null;
                return {
                    id: arrow.id,
                    oscId: arrow.oscId ?? null,
                    edgeIndex: toInt(arrow.edgeIndex, 0),
                    type: toOption(arrow.type, EDGE_ARROW_TYPE_OPTIONS, state.settings.edgeArrowType),
                    size: Math.max(1, toNumber(arrow.size, state.settings.edgeArrowSize)),
                    ratio: Math.min(2, Math.max(0.5, toNumber(arrow.ratio, state.settings.edgeArrowRatio))),
                    color: toStringSafe(arrow.color, state.settings.edgeArrowColor),
                    arrowLabel: (label && toStringSafe(label.text, '').trim().length)
                        ? {
                            text: toStringSafe(label.text, ''),
                            size: Math.max(1, toNumber(label.size, state.settings.edgeArrowLabelSize ?? state.settings.fontSize)),
                            position: toOption(label.position, LABEL_POS_OPTIONS, state.settings.edgeArrowLabelPosition)
                        }
                        : null
                };
            })
            .filter((arrow) => typeof arrow.oscId === 'string' && arrow.oscId.length > 0);
    }

    if (Array.isArray(raw.boldEdges)) {
        state.boldEdges = raw.boldEdges
            .filter((edge) => edge && typeof edge === 'object' && edge.id)
            .map((edge) => ({
                ...edge,
                weight: Math.max(0.1, toNumber(edge.weight, state.settings.boldWeight))
            }));
    }

    const rawLegend = raw.legend && typeof raw.legend === 'object' ? raw.legend : null;
    if (rawLegend) {
        if (Array.isArray(rawLegend.entries)) {
            state.legend.entries = ensureIds(rawLegend.entries, 'legend')
                .map((entry) => ({
                    id: entry.id,
                    type: toOption(entry.type, LEGEND_ENTRY_TYPE_OPTIONS, 'line'),
                    label: toStringSafe(entry.label, ''),
                    color: toStringSafe(entry.color, '#000000'),
                    lineWidth: Math.max(0.1, toNumber(entry.lineWidth, 1.2)),
                    arrowSize: Math.max(1, toNumber(entry.arrowSize, 10)),
                    arrowRatio: Math.min(2, Math.max(0.5, toNumber(entry.arrowRatio, 1.4))),
                    hatchType: toOption(entry.hatchType, HATCH_TYPE_OPTIONS, state.settings.hatchType),
                    patternWidth: Math.max(0.1, toNumber(entry.patternWidth, state.settings.zonePatternWidth))
                }));
        }
        if (rawLegend.layout && typeof rawLegend.layout === 'object') {
            Object.keys(state.legend.layout).forEach((key) => {
                const value = rawLegend.layout[key];
                if (value === undefined) return;
                if (key === 'x' || key === 'y') {
                    state.legend.layout[key] = (typeof value === 'number') ? value : null;
                    return;
                }
                if (key === 'padding' || key === 'gap' || key === 'borderWidth' || key === 'cornerRadius') {
                    if (typeof value === 'number') state.legend.layout[key] = Math.max(0, value);
                    return;
                }
                if (key === 'border') {
                    if (typeof value === 'boolean') state.legend.layout[key] = value;
                }
            });
        }
    }

    const rawLayers = raw.layers && typeof raw.layers === 'object' ? raw.layers : null;
    const normalizeLayerList = (key, items) => {
        const ids = items.map((item) => item.id).filter(Boolean);
        const fromRaw = Array.isArray(rawLayers?.[key]) ? rawLayers[key].filter((id) => ids.includes(id)) : [];
        const remaining = ids.filter((id) => !fromRaw.includes(id));
        return [...fromRaw, ...remaining];
    };
    state.layers = {
        ...state.layers,
        guides: normalizeLayerList('guides', state.guides),
        zones: normalizeLayerList('zones', state.zones),
        links: normalizeLayerList('links', state.links),
        edgeArrows: normalizeLayerList('edgeArrows', state.edgeArrows),
        measurements: normalizeLayerList('measurements', state.measurements)
    };

    return state;
};
