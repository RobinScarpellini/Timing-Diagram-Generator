// SPDX-License-Identifier: GPL-3.0-only

import { describe, expect, it } from 'vitest';
import { updateSignal, normalizeCounterRanges } from './actions';
import { DEFAULT_STATE } from './defaults';

const makeState = (patch = {}) => ({
    ...DEFAULT_STATE,
    ...patch,
    settings: {
        ...DEFAULT_STATE.settings,
        ...(patch.settings || {})
    }
});

describe('state actions', () => {
    it('clamps oscillator period to duration-based minimum', () => {
        const state = makeState({
            settings: { duration: 10000 },
            signals: [{
                id: 'osc-1',
                type: 'oscillator',
                name: 'CLK 1',
                period: 100,
                delay: 0,
                edgeCount: -1,
                inverted: false,
                color: '#000000'
            }]
        });

        const next = updateSignal(state, { id: 'osc-1', field: 'period', value: 1 });
        expect(next.signals[0].period).toBe(10);
    });

    it('prevents reducing oscillator edge count below referenced elements', () => {
        const state = makeState({
            signals: [{
                id: 'osc-1',
                type: 'oscillator',
                name: 'CLK 1',
                period: 20,
                delay: 0,
                edgeCount: -1,
                inverted: false,
                color: '#000000'
            }],
            guides: [{
                id: 'guide-1',
                oscId: 'osc-1',
                edgeIndex: 5,
                style: 'dotted',
                lineWidth: 1,
                dashLength: 2,
                dashGap: 2
            }]
        });

        const next = updateSignal(state, { id: 'osc-1', field: 'edgeCount', value: 2 });
        expect(next.signals[0].edgeCount).toBe(6);
    });

    it('normalizes counter range to visible edge count', () => {
        const state = makeState({
            settings: { duration: 30 },
            signals: [
                {
                    id: 'osc-1',
                    type: 'oscillator',
                    name: 'CLK 1',
                    period: 20,
                    delay: 0,
                    edgeCount: -1,
                    inverted: false,
                    color: '#000000'
                },
                {
                    id: 'cnt-1',
                    type: 'counter',
                    name: 'CNT 1',
                    startEdge: 5,
                    endEdge: 10,
                    color: '#000000',
                    referenceOscId: 'osc-1',
                    polarity: 'rising'
                }
            ]
        });

        const next = normalizeCounterRanges(state);
        const counter = next.signals.find((signal) => signal.id === 'cnt-1');

        expect(counter.startEdge).toBe(2);
        expect(counter.endEdge).toBe(2);
    });
});
