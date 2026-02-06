// SPDX-License-Identifier: GPL-3.0-only

export const CREATION_MODES = Object.freeze({
    GUIDE: 'guide',
    ZONE_START: 'zone-start',
    ZONE_END: 'zone-end',
    LINK_START: 'link-start',
    LINK_END: 'link-end',
    BOLD: 'bold',
    EDGE_ARROW: 'edge-arrow',
    DELETE: 'delete',
    MEASURE_START: 'measure-start',
    MEASURE_END: 'measure-end',
    COPY: 'copy',
    PASTE: 'paste'
});

export const isMeasureMode = (mode) => mode === CREATION_MODES.MEASURE_START || mode === CREATION_MODES.MEASURE_END;
export const isZoneMode = (mode) => mode === CREATION_MODES.ZONE_START || mode === CREATION_MODES.ZONE_END;
export const isLinkMode = (mode) => mode === CREATION_MODES.LINK_START || mode === CREATION_MODES.LINK_END;

export const getModeSelectionType = (mode) => {
    if (!mode) return null;
    if (mode === CREATION_MODES.GUIDE) return 'guide';
    if (isZoneMode(mode)) return 'zone';
    if (isLinkMode(mode)) return 'link';
    if (mode === CREATION_MODES.BOLD) return 'edge';
    if (mode === CREATION_MODES.EDGE_ARROW) return 'edge-arrow';
    if (isMeasureMode(mode)) return 'measurement';
    return null;
};

export const isEdgeToolMode = (mode) => (
    mode === CREATION_MODES.BOLD ||
    mode === CREATION_MODES.EDGE_ARROW ||
    mode === CREATION_MODES.GUIDE ||
    mode === CREATION_MODES.ZONE_START ||
    mode === CREATION_MODES.ZONE_END ||
    mode === CREATION_MODES.LINK_START ||
    mode === CREATION_MODES.LINK_END
);
