// SPDX-License-Identifier: GPL-3.0-only

import { describe, expect, it } from 'vitest';
import {
    getCounterEdgeTime,
    getOscillatorEdgeTime,
    getSafeOscillatorPeriod
} from './geometry';

describe('geometry', () => {
    it('computes oscillator edge time from delay and half period', () => {
        const oscillator = { period: 20, delay: 5 };
        expect(getOscillatorEdgeTime(oscillator, 3, 100)).toBe(35);
    });

    it('clamps oscillator period to minimum allowed from duration', () => {
        const oscillator = { period: 1, delay: 0 };
        expect(getSafeOscillatorPeriod(oscillator, 12000)).toBe(12);
    });

    it('resolves counter edges with polarity and selected reference oscillator', () => {
        const oscillators = [
            { id: 'osc-a', period: 10, delay: 0, inverted: false },
            { id: 'osc-b', period: 20, delay: 0, inverted: false }
        ];
        const risingCounter = { type: 'counter', referenceOscId: 'osc-b', polarity: 'rising' };
        const fallingCounter = { type: 'counter', referenceOscId: 'osc-b', polarity: 'falling' };

        expect(getCounterEdgeTime(risingCounter, 1, { oscillators, duration: 100 })).toBe(0);
        expect(getCounterEdgeTime(risingCounter, 3, { oscillators, duration: 100 })).toBe(40);
        expect(getCounterEdgeTime(fallingCounter, 1, { oscillators, duration: 100 })).toBe(10);
    });

    it('falls back to first oscillator and respects inversion when resolving counter edges', () => {
        const oscillators = [
            { id: 'osc-a', period: 20, delay: 0, inverted: true }
        ];
        const counter = { type: 'counter', referenceOscId: 'missing', polarity: 'rising' };

        // Inverted oscillator flips rising/falling, so first rising counter edge is at t=10.
        expect(getCounterEdgeTime(counter, 1, { oscillators, duration: 100 })).toBe(10);
    });
});
