// SPDX-License-Identifier: GPL-3.0-only

export const LAYER_KEYS = Object.freeze({
    GUIDES: 'guides',
    ZONES: 'zones',
    LINKS: 'links',
    EDGE_ARROWS: 'edgeArrows',
    MEASUREMENTS: 'measurements'
});

export const LAYER_KEY_VALUES = Object.freeze(Object.values(LAYER_KEYS));

export const LAYER_KEY_BY_STATE_KEY = Object.freeze({
    guides: LAYER_KEYS.GUIDES,
    zones: LAYER_KEYS.ZONES,
    links: LAYER_KEYS.LINKS,
    edgeArrows: LAYER_KEYS.EDGE_ARROWS,
    measurements: LAYER_KEYS.MEASUREMENTS
});
