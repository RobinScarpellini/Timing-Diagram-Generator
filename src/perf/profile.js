// SPDX-License-Identifier: GPL-3.0-only

const PROFILE_NAMESPACE = '__TD_PROFILE__';
const PROFILE_STORE_KEY = '__TD_PROFILE_STATS__';

const canUseWindow = () => typeof window !== 'undefined';

const isEnabled = () => (
    canUseWindow()
    && Boolean(window[PROFILE_NAMESPACE])
    && typeof performance !== 'undefined'
    && typeof performance.now === 'function'
);

const getStore = () => {
    if (!canUseWindow()) return null;
    if (!window[PROFILE_STORE_KEY]) {
        window[PROFILE_STORE_KEY] = new Map();
    }
    return window[PROFILE_STORE_KEY];
};

const recordSample = (label, duration) => {
    const store = getStore();
    if (!store) return;

    const prev = store.get(label) || { count: 0, total: 0, max: 0 };
    const next = {
        count: prev.count + 1,
        total: prev.total + duration,
        max: Math.max(prev.max, duration)
    };
    store.set(label, next);

    if (window[PROFILE_NAMESPACE] === 'verbose' && next.count % 30 === 0) {
        console.table([{
            label,
            count: next.count,
            avgMs: Number((next.total / next.count).toFixed(4)),
            maxMs: Number(next.max.toFixed(4))
        }]);
    }
};

export const profileMeasure = (label, callback) => {
    if (typeof callback !== 'function') return undefined;
    if (!isEnabled()) return callback();

    const start = performance.now();
    const result = callback();
    recordSample(label, performance.now() - start);
    return result;
};

export const readProfileStats = () => {
    const store = getStore();
    if (!store) return [];
    return Array.from(store.entries()).map(([label, value]) => ({
        label,
        count: value.count,
        avgMs: value.count ? value.total / value.count : 0,
        maxMs: value.max
    }));
};
