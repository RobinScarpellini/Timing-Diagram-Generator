import { DEFAULT_STATE } from './defaults';

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
        if (signal.type !== 'oscillator' && signal.type !== 'counter') {
            throw new Error(`Invalid signal type at index ${index}.`);
        }
        const id = signal.id || makeId(signal.type, index);
        return { ...signal, id };
    });

    if (Array.isArray(raw.guides)) {
        state.guides = ensureIds(raw.guides, 'guide').filter((guide) => guide.oscId);
    }
    if (Array.isArray(raw.zones)) {
        state.zones = ensureIds(raw.zones, 'zone')
            .map((zone) => zone.oscillatorId ? zone : { ...zone, oscillatorId: zone.start?.oscId })
            .filter((zone) => zone.start?.oscId && zone.end?.oscId && zone.oscillatorId);
    }
    if (Array.isArray(raw.links)) {
        state.links = ensureIds(raw.links, 'link')
            .filter((link) => link.start && link.end)
            .filter((link) => (
                (link.start.oscId || link.start.counterId) && (link.end.oscId || link.end.counterId)
            ));
    }

    if (Array.isArray(raw.measurements)) {
        state.measurements = ensureIds(raw.measurements, 'measurement');
    }

    const settingsSource = raw.settings && typeof raw.settings === 'object' ? raw.settings : null;
    if (settingsSource) {
        Object.keys(state.settings).forEach((key) => {
            if (settingsSource[key] !== undefined) {
                state.settings[key] = settingsSource[key];
            }
        });
    }
    state.settings.duration = Math.max(2, Number(state.settings.duration) || 2);
    state.settings.lineWidth = Math.max(2, Number(state.settings.lineWidth) || 2);
    state.settings.fontSize = Math.max(2, Number(state.settings.fontSize) || 2);
    state.settings.counterFontSize = Math.max(2, Number(state.settings.counterFontSize) || 2);
    state.settings.oscWaveHeight = Math.max(2, Number(state.settings.oscWaveHeight) || 2);
    state.settings.counterWaveHeight = Math.max(2, Number(state.settings.counterWaveHeight) || 2);

    const minPeriod = Math.max(2, state.settings.duration / 1000);
    state.signals = state.signals.map((signal) => {
        if (signal.type !== 'oscillator') return signal;
        const parsed = Number(signal.period);
        return {
            ...signal,
            period: Math.max(minPeriod, Number.isFinite(parsed) ? parsed : 100)
        };
    });

    if (Array.isArray(raw.edgeArrows)) {
        state.edgeArrows = ensureIds(raw.edgeArrows, 'edge-arrow').map((arrow) => ({
            ...arrow,
            type: arrow.type ?? state.settings.edgeArrowType,
            size: arrow.size ?? state.settings.edgeArrowSize,
            ratio: arrow.ratio ?? state.settings.edgeArrowRatio,
            color: arrow.color ?? state.settings.edgeArrowColor
        }));
    }

    if (Array.isArray(raw.boldEdges)) {
        state.boldEdges = raw.boldEdges
            .filter((edge) => edge && typeof edge === 'object' && edge.id)
            .map((edge) => ({ ...edge, weight: edge.weight ?? state.settings.boldWeight }));
    }

    const rawLegend = raw.legend && typeof raw.legend === 'object' ? raw.legend : null;
    if (rawLegend) {
        if (Array.isArray(rawLegend.entries)) {
            state.legend.entries = ensureIds(rawLegend.entries, 'legend').filter((entry) => entry && typeof entry === 'object');
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
                    if (typeof value === 'number') state.legend.layout[key] = value;
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
