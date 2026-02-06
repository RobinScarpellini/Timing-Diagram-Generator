// SPDX-License-Identifier: GPL-3.0-only

import { describe, expect, it } from 'vitest';
import { normalizeState } from './migrate';

describe('normalizeState', () => {
    it('throws when signals is missing', () => {
        expect(() => normalizeState({})).toThrow(/signals is required/i);
    });

    it('fills missing signal and settings fields with defaults', () => {
        const next = normalizeState({
            signals: [{ id: 'osc-1', type: 'oscillator' }],
            settings: { duration: 42 }
        });

        expect(next.settings.duration).toBe(42);
        expect(next.settings.timeScale).toBe(1);
        expect(next.settings.spacing).toBeGreaterThan(0);
        expect(next.signals[0].name).toBe('CLK 1');
        expect(next.signals[0].period).toBeGreaterThan(0);
        expect(Array.isArray(next.guides)).toBe(true);
        expect(Array.isArray(next.links)).toBe(true);
        expect(Array.isArray(next.zones)).toBe(true);
        expect(Array.isArray(next.measurements)).toBe(true);
    });

    it('rebinds counter reference to first oscillator when missing', () => {
        const next = normalizeState({
            signals: [
                { id: 'osc-1', type: 'oscillator', period: 20 },
                { id: 'cnt-1', type: 'counter', referenceOscId: 'missing', startEdge: 1, endEdge: 10 }
            ]
        });

        const counter = next.signals.find((signal) => signal.id === 'cnt-1');
        expect(counter.referenceOscId).toBe('osc-1');
    });

    it('normalizes legend entries and layout numbers', () => {
        const next = normalizeState({
            signals: [{ id: 'osc-1', type: 'oscillator', period: 20 }],
            legend: {
                entries: [{ id: 'entry-1', label: 'L', type: 'line', lineWidth: -2 }],
                layout: { padding: -5, gap: 4 }
            }
        });

        expect(next.legend.entries).toHaveLength(1);
        expect(next.legend.entries[0].lineWidth).toBeGreaterThan(0);
        expect(next.legend.layout.padding).toBe(0);
        expect(next.legend.layout.gap).toBe(4);
    });
});
