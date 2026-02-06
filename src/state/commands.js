// SPDX-License-Identifier: GPL-3.0-only

import { LAYER_KEYS } from '../constants/layers';

const appendLayerId = (layers, layerKey, id) => ({
    ...(layers || {}),
    [layerKey]: [...((layers && layers[layerKey]) || []), id]
});

export const toggleBoldEdgeCommand = (state, edgeId, defaultWeight) => {
    const existing = (state.boldEdges || []).find((edge) => edge.id === edgeId);
    if (existing) {
        return {
            ...state,
            boldEdges: (state.boldEdges || []).filter((edge) => edge.id !== edgeId)
        };
    }

    return {
        ...state,
        boldEdges: [...(state.boldEdges || []), { id: edgeId, weight: defaultWeight }]
    };
};

export const createGuideCommand = (state, { id, oscId, edgeIndex }) => {
    const guide = {
        id,
        oscId,
        edgeIndex,
        style: state.settings.guideStyle,
        lineWidth: state.settings.guideLineWidth,
        dashLength: state.settings.guideDashLength,
        dashGap: state.settings.guideDashGap
    };

    return {
        ...state,
        guides: [...(state.guides || []), guide],
        layers: appendLayerId(state.layers, LAYER_KEYS.GUIDES, id)
    };
};

export const createZoneCommand = (state, { id, start, end }) => ({
    ...state,
    zones: [
        ...(state.zones || []),
        {
            id,
            start: { oscId: start.oscId, edgeIndex: start.edgeIndex },
            end: { oscId: end.oscId, edgeIndex: end.edgeIndex },
            oscillatorId: end.oscId,
            hatchType: state.settings.hatchType,
            color: state.settings.zoneColor,
            borderWidth: state.settings.zoneBorderWidth,
            patternWidth: state.settings.zonePatternWidth
        }
    ],
    layers: appendLayerId(state.layers, LAYER_KEYS.ZONES, id)
});

export const createLinkCommand = (state, { id, start, end }) => ({
    ...state,
    links: [
        ...(state.links || []),
        {
            id,
            start,
            end,
            color: state.settings.linkColor,
            style: state.settings.linkStyle,
            lineWidth: state.settings.linkLineWidth,
            dashLength: state.settings.linkDashLength,
            dashGap: state.settings.linkDashGap,
            arrowSize: state.settings.arrowSize,
            startMarker: state.settings.linkStartMarker,
            endMarker: state.settings.linkEndMarker
        }
    ],
    layers: appendLayerId(state.layers, LAYER_KEYS.LINKS, id)
});

export const createEdgeArrowCommand = (state, { id, oscId, edgeIndex }) => {
    const labelText = String(state.settings.edgeArrowLabelText || '');

    return {
        ...state,
        edgeArrows: [
            ...(state.edgeArrows || []),
            {
                id,
                oscId,
                edgeIndex,
                type: state.settings.edgeArrowType,
                size: state.settings.edgeArrowSize,
                ratio: state.settings.edgeArrowRatio,
                color: state.settings.edgeArrowColor,
                ...(labelText.trim().length ? {
                    arrowLabel: {
                        text: labelText,
                        size: state.settings.edgeArrowLabelSize ?? state.settings.fontSize,
                        position: state.settings.edgeArrowLabelPosition || 'above'
                    }
                } : {})
            }
        ],
        layers: appendLayerId(state.layers, LAYER_KEYS.EDGE_ARROWS, id)
    };
};

export const createMeasurementCommand = (state, { id, start, end, y }) => {
    const nextMeasurement = {
        id,
        start,
        end,
        color: state.settings.measurementColor || '#000000',
        lineWidth: state.settings.measurementLineWidth ?? 1.2,
        arrowSize: state.settings.measurementArrowSize ?? state.settings.arrowSize,
        ...(String(state.settings.measurementLabelText || '').trim().length ? {
            arrowLabel: {
                text: state.settings.measurementLabelText,
                size: state.settings.measurementLabelSize ?? state.settings.fontSize,
                position: state.settings.measurementLabelPosition || 'top'
            }
        } : {}),
        y
    };

    return {
        ...state,
        measurements: [...(state.measurements || []), nextMeasurement],
        layers: appendLayerId(state.layers, LAYER_KEYS.MEASUREMENTS, id)
    };
};

export const setLegendLayoutCommand = (state, patch) => ({
    ...state,
    legend: {
        ...(state.legend || {}),
        layout: {
            ...((state.legend && state.legend.layout) || {}),
            ...patch
        }
    }
});

export const addLegendEntryCommand = (state, entry) => {
    const legend = state.legend || { entries: [], layout: {} };
    const entries = Array.isArray(legend.entries) ? legend.entries : [];
    return {
        ...state,
        legend: {
            ...legend,
            entries: [...entries, entry]
        }
    };
};

export const updateLegendEntryCommand = (state, id, patch) => {
    const legend = state.legend || { entries: [], layout: {} };
    const entries = Array.isArray(legend.entries) ? legend.entries : [];

    return {
        ...state,
        legend: {
            ...legend,
            entries: entries.map((entry) => (entry?.id === id ? { ...entry, ...patch } : entry))
        }
    };
};

export const removeLegendEntryCommand = (state, id) => {
    const legend = state.legend || { entries: [], layout: {} };
    const entries = Array.isArray(legend.entries) ? legend.entries : [];

    return {
        ...state,
        legend: {
            ...legend,
            entries: entries.filter((entry) => entry?.id !== id)
        }
    };
};
