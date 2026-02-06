// SPDX-License-Identifier: GPL-3.0-only

export const SIGNAL_TYPES = Object.freeze({
    OSCILLATOR: 'oscillator',
    COUNTER: 'counter'
});

export const EDGE_POLARITY = Object.freeze({
    RISING: 'rising',
    FALLING: 'falling'
});

export const SIGNAL_TYPE_VALUES = Object.freeze(Object.values(SIGNAL_TYPES));
export const EDGE_POLARITY_VALUES = Object.freeze(Object.values(EDGE_POLARITY));
