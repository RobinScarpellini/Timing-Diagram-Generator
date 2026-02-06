// SPDX-License-Identifier: GPL-3.0-only

import { EDGE_POLARITY, SIGNAL_TYPES } from '../../constants/signal';

export const getMinAllowedPeriod = (duration = 0) => Math.max(
    2,
    (Number.isFinite(duration) && duration > 0) ? (duration / 1000) : 0
);

export const getSafeOscillatorPeriod = (oscillator, duration = 0) => {
    const parsed = Number(oscillator?.period);
    const raw = Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
    return Math.max(getMinAllowedPeriod(duration), raw);
};

export const getOscillatorHalfPeriod = (oscillator, duration = 0) => (
    getSafeOscillatorPeriod(oscillator, duration) / 2
);

export const getOscillatorEdgeTime = (oscillator, edgeIndex, duration = 0) => {
    const delay = oscillator?.delay || 0;
    const halfPeriod = getOscillatorHalfPeriod(oscillator, duration);
    return delay + edgeIndex * halfPeriod;
};

export const getOscillatorLevelAt = (oscillator, t, duration = 0) => {
    const delay = oscillator?.delay || 0;
    const halfPeriod = getOscillatorHalfPeriod(oscillator, duration);
    let baseLevel = 0;
    if (t >= delay) {
        const k = Math.floor((t - delay) / halfPeriod);
        baseLevel = (k % 2 === 0) ? 1 : 0;
    }
    return oscillator?.inverted ? (1 - baseLevel) : baseLevel;
};

export const resolveCounterReferenceOscillator = (counter, oscillators = []) => (
    oscillators.find((oscillator) => oscillator.id === counter?.referenceOscId) || oscillators[0] || null
);

export const forEachCounterEdge = (counter, { oscillators = [], duration = 0 } = {}, visitor) => {
    const ref = resolveCounterReferenceOscillator(counter, oscillators);
    if (!ref || typeof visitor !== 'function') return;

    const halfPeriod = getOscillatorHalfPeriod(ref, duration);
    const delay = ref.delay || 0;
    const polarity = counter?.polarity === EDGE_POLARITY.FALLING
        ? EDGE_POLARITY.FALLING
        : EDGE_POLARITY.RISING;
    const edgeLimit = ref.edgeCount ?? -1;
    const maxEdgeIndex = edgeLimit >= 0 ? edgeLimit - 1 : Infinity;

    const maxK = Math.floor((duration - delay) / halfPeriod);
    const minK = Math.floor((-delay) / halfPeriod);

    let acceptedIndex = 0;
    for (let k = minK; k <= maxK; k++) {
        if (k >= 0 && k > maxEdgeIndex) break;

        const t = delay + k * halfPeriod;
        if (t < 0) continue;
        if (t > duration) break;

        const isRefRising = (k % 2 === 0);
        const effectiveRising = ref.inverted ? !isRefRising : isRefRising;
        const matches = (polarity === EDGE_POLARITY.RISING && effectiveRising)
            || (polarity === EDGE_POLARITY.FALLING && !effectiveRising);

        if (!matches) continue;

        acceptedIndex += 1;
        const shouldContinue = visitor(t, {
            acceptedIndex,
            edgeIndex: k,
            effectiveRising
        });
        if (shouldContinue === false) break;
    }
};

export const getCounterEdgeTimes = (counter, ctx = {}) => {
    const times = [];
    forEachCounterEdge(counter, ctx, (time) => {
        times.push(time);
    });
    return times;
};

export const getCounterEdgeTime = (counter, edgeNumber, ctx = {}) => {
    if (!Number.isFinite(edgeNumber) || edgeNumber <= 0) return 0;
    let resolvedTime = 0;
    forEachCounterEdge(counter, ctx, (time, meta) => {
        if (meta.acceptedIndex === edgeNumber) {
            resolvedTime = time;
            return false;
        }
        return true;
    });
    return resolvedTime;
};

export const getVisibleCounterEdgeCount = (counter, ctx = {}, minimum = 1) => {
    let count = 0;
    forEachCounterEdge(counter, ctx, () => {
        count += 1;
    });
    return Math.max(minimum, count);
};

export const clampCounterEdgeRange = (counter, visibleEdgeCount = 1) => {
    const visible = Math.max(1, Number(visibleEdgeCount) || 1);
    let startEdge = Math.max(1, parseInt(counter?.startEdge, 10) || 1);
    let endEdge = Math.max(1, parseInt(counter?.endEdge, 10) || 1);

    startEdge = Math.min(startEdge, visible);
    endEdge = Math.min(endEdge, visible);
    if (startEdge > endEdge) {
        endEdge = startEdge;
    }

    return {
        ...counter,
        startEdge,
        endEdge
    };
};

export const getSignalEdgeTime = (signal, edgeIndex, ctx = {}) => {
    if (!signal) return 0;
    if (signal.type === SIGNAL_TYPES.COUNTER) {
        return getCounterEdgeTime(signal, edgeIndex, ctx);
    }
    return getOscillatorEdgeTime(signal, edgeIndex, ctx.duration);
};
