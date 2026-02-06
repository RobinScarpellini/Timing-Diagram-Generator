// SPDX-License-Identifier: GPL-3.0-only

import { afterEach, describe, expect, it } from 'vitest';
import { profileMeasure, readProfileStats } from './profile';

const originalWindow = globalThis.window;

afterEach(() => {
    if (originalWindow === undefined) {
        delete globalThis.window;
    } else {
        globalThis.window = originalWindow;
    }
});

describe('profileMeasure', () => {
    it('returns callback result when profiling is disabled', () => {
        if (globalThis.window) {
            globalThis.window.__TD_PROFILE__ = false;
        }

        const value = profileMeasure('test.label', () => 123);
        expect(value).toBe(123);
    });

    it('records stats when profiling is enabled', () => {
        globalThis.window = { __TD_PROFILE__: true };

        const result = profileMeasure('test.enabled', () => 'ok');
        const stats = readProfileStats().find((entry) => entry.label === 'test.enabled');

        expect(result).toBe('ok');
        expect(stats).toBeTruthy();
        expect(stats.count).toBe(1);
    });
});
