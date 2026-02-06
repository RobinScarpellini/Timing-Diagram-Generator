const generateSignalName = (signals, type, prefix) => {
    const count = signals.filter((s) => s.type === type).length;
    return `${prefix} ${count + 1}`;
};

export const applySignalValue = (field, value) => {
    if (field === 'name' || field === 'inverted' || field === 'color' || field === 'type' || field === 'referenceOscId' || field === 'polarity') {
        return value;
    }
    if (field === 'edgeCount') {
        const parsed = parseInt(value, 10);
        return Number.isNaN(parsed) ? -1 : parsed;
    }
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
};

export const getMaxReferencedEdgeIndex = (appState, oscId) => {
    let max = -1;
    const updateMax = (candidate) => {
        if (candidate === undefined || candidate === null) return;
        const parsed = parseInt(candidate, 10);
        if (Number.isNaN(parsed)) return;
        if (parsed > max) max = parsed;
    };

    appState.guides.forEach((guide) => {
        if (guide?.oscId !== oscId) return;
        updateMax(guide.edgeIndex);
    });

    appState.zones.forEach((zone) => {
        if (zone?.start?.oscId === oscId) updateMax(zone.start.edgeIndex);
        if (zone?.end?.oscId === oscId) updateMax(zone.end.edgeIndex);
    });

    appState.links.forEach((link) => {
        if (link?.start?.oscId === oscId) updateMax(link.start.edgeIndex);
        if (link?.end?.oscId === oscId) updateMax(link.end.edgeIndex);
    });

    appState.edgeArrows.forEach((arrow) => {
        if (arrow?.oscId !== oscId) return;
        updateMax(arrow.edgeIndex);
    });

    (appState.measurements || []).forEach((m) => {
        const endpoints = [m?.start, m?.end];
        endpoints.forEach((ep) => {
            if (!ep || typeof ep !== 'object') return;
            if (ep.kind !== 'edge') return;
            if (ep.oscId !== oscId) return;
            updateMax(ep.edgeIndex);
        });
    });

    const prefix = `${oscId}-v-`;
    appState.boldEdges.forEach((edge) => {
        const edgeId = edge?.id;
        if (!edgeId || !edgeId.startsWith(prefix)) return;
        updateMax(edgeId.slice(prefix.length));
    });

    return max;
};

export const addOscillator = (state, id) => {
    const nextSignals = [
        ...state.signals,
        {
            id,
            type: 'oscillator',
            name: generateSignalName(state.signals, 'oscillator', 'CLK'),
            period: 100,
            delay: 0,
            edgeCount: -1,
            inverted: false,
            color: '#000000'
        }
    ];
    return { ...state, signals: nextSignals };
};

export const addCounter = (state, id) => {
    const oscillators = state.signals.filter((s) => s.type === 'oscillator');
    const nextSignals = [
        ...state.signals,
        {
            id,
            type: 'counter',
            name: generateSignalName(state.signals, 'counter', 'CNT'),
            startEdge: 1,
            endEdge: 10,
            color: '#000000',
            referenceOscId: oscillators.length > 0 ? oscillators[0].id : null,
            polarity: 'rising'
        }
    ];
    return { ...state, signals: nextSignals };
};

export const updateSignal = (state, { id, field, value }) => {
    const nextSignals = state.signals.map((sig) => sig.id === id ? {
        ...sig,
        [field]: (() => {
            let nextValue = applySignalValue(field, value);
            if (nextValue === null) return sig[field];
            if (field === 'edgeCount' && sig.type === 'oscillator') {
                if (nextValue < -1) nextValue = -1;
                if (nextValue >= 0) {
                    const maxRef = getMaxReferencedEdgeIndex(state, sig.id);
                    const minAllowed = maxRef + 1;
                    if (nextValue < minAllowed) nextValue = minAllowed;
                }
            }
            if (field === 'period' && sig.type === 'oscillator') {
                const minPeriod = Math.max(2, (state.settings?.duration || 0) / 1000);
                if (nextValue < minPeriod) nextValue = minPeriod;
            }
            return nextValue;
        })()
    } : sig);
    return { ...state, signals: nextSignals };
};

export const removeSignalAndDependencies = (state, id) => {
    const nextSignals = state.signals.filter((sig) => sig.id !== id);
    const removedGuideIds = state.guides.filter((guide) => guide.oscId === id).map((guide) => guide.id);
    const nextGuides = state.guides.filter((guide) => guide.oscId !== id);
    const removedZoneIds = state.zones.filter((zone) => (
        zone.start?.oscId === id || zone.end?.oscId === id || zone.oscillatorId === id
    )).map((zone) => zone.id);
    const nextZones = state.zones.filter((zone) => (
        zone.start?.oscId !== id && zone.end?.oscId !== id && zone.oscillatorId !== id
    ));
    const removedLinkIds = state.links.filter((link) => {
        const start = link.start || {};
        const end = link.end || {};
        return start.oscId === id || start.counterId === id || end.oscId === id || end.counterId === id;
    }).map((link) => link.id);
    const nextLinks = state.links.filter((link) => {
        const start = link.start || {};
        const end = link.end || {};
        return start.oscId !== id && start.counterId !== id && end.oscId !== id && end.counterId !== id;
    });
    const removedEdgeArrowIds = state.edgeArrows.filter((arrow) => arrow.oscId === id).map((arrow) => arrow.id);
    const nextEdgeArrows = state.edgeArrows.filter((arrow) => arrow.oscId !== id);
    const removedGuideIdSet = new Set(removedGuideIds);
    const removedMeasurements = (state.measurements || []).filter((m) => {
        const endpoints = [m?.start, m?.end];
        return endpoints.some((ep) => {
            if (!ep || typeof ep !== 'object') return false;
            if (ep.kind === 'edge') return ep.oscId === id;
            if (ep.kind === 'guide') return removedGuideIdSet.has(ep.guideId);
            return false;
        });
    });
    const removedMeasurementIds = removedMeasurements.map((m) => m.id);
    const nextMeasurements = (state.measurements || []).filter((m) => !removedMeasurementIds.includes(m.id));
    const oscPrefix = `${id}-v-`;
    const counterPrefix = `cnt-${id}-e-`;
    const nextBoldEdges = state.boldEdges.filter((edge) => {
        if (!edge?.id) return false;
        return !edge.id.startsWith(oscPrefix) && !edge.id.startsWith(counterPrefix);
    });

    const nextLayers = state.layers ? (() => {
        const next = { ...state.layers };
        if (Array.isArray(next.guides)) next.guides = next.guides.filter((gid) => !removedGuideIds.includes(gid));
        if (Array.isArray(next.zones)) next.zones = next.zones.filter((zid) => !removedZoneIds.includes(zid));
        if (Array.isArray(next.links)) next.links = next.links.filter((lid) => !removedLinkIds.includes(lid));
        if (Array.isArray(next.edgeArrows)) next.edgeArrows = next.edgeArrows.filter((aid) => !removedEdgeArrowIds.includes(aid));
        if (Array.isArray(next.measurements)) next.measurements = next.measurements.filter((mid) => !removedMeasurementIds.includes(mid));
        return next;
    })() : state.layers;

    return {
        ...state,
        signals: nextSignals,
        guides: nextGuides,
        zones: nextZones,
        links: nextLinks,
        boldEdges: nextBoldEdges,
        edgeArrows: nextEdgeArrows,
        measurements: nextMeasurements,
        layers: nextLayers
    };
};

export const reorderSignals = (state, sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId) return state;
    const fromIndex = state.signals.findIndex((sig) => sig.id === sourceId);
    const toIndex = state.signals.findIndex((sig) => sig.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return state;
    const nextSignals = [...state.signals];
    const [moved] = nextSignals.splice(fromIndex, 1);
    nextSignals.splice(toIndex, 0, moved);
    return { ...state, signals: nextSignals };
};

export const patchItemsByIds = (state, key, ids, patch) => {
    const idSet = new Set(ids);
    const list = state[key] || [];
    return {
        ...state,
        [key]: list.map((item) => (idSet.has(item.id) ? { ...item, ...patch } : item))
    };
};

export const removeItemsByIds = (state, key, ids) => {
    const idSet = new Set(ids);
    const list = state[key] || [];
    const layerKeyByStateKey = {
        guides: 'guides',
        zones: 'zones',
        links: 'links',
        edgeArrows: 'edgeArrows',
        measurements: 'measurements'
    };
    const layerKey = layerKeyByStateKey[key];
    const nextLayers = (state.layers && layerKey && Array.isArray(state.layers[layerKey]))
        ? {
            ...state.layers,
            [layerKey]: state.layers[layerKey].filter((id) => !idSet.has(id))
        }
        : state.layers;
    return {
        ...state,
        [key]: list.filter((item) => !idSet.has(item.id)),
        layers: nextLayers
    };
};
