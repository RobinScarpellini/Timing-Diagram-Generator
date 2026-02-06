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

export const getCounterEdgeTime = (counter, edgeNumber, { oscillators = [], duration = 0 } = {}) => {
    const ref = oscillators.find((o) => o.id === counter?.referenceOscId) || oscillators[0];
    if (!ref) return 0;

    const halfPeriod = getOscillatorHalfPeriod(ref, duration);
    const delay = ref.delay || 0;
    const polarity = counter?.polarity || 'rising';
    const edgeLimit = ref.edgeCount ?? -1;
    const maxEdgeIndex = edgeLimit >= 0 ? edgeLimit - 1 : Infinity;

    let count = 0;
    const maxK = Math.floor((duration - delay) / halfPeriod);
    const minK = Math.floor((-delay) / halfPeriod);
    for (let k = minK; k <= maxK; k++) {
        if (k >= 0 && k > maxEdgeIndex) break;
        const t = delay + k * halfPeriod;
        if (t < 0) continue;
        if (t > duration) break;
        const isRefRising = (k % 2 === 0);
        const effectiveRising = ref.inverted ? !isRefRising : isRefRising;
        const matches = (polarity === 'rising' && effectiveRising) || (polarity === 'falling' && !effectiveRising);
        if (matches) {
            count++;
            if (count === edgeNumber) return t;
        }
    }
    return 0;
};

export const getSignalEdgeTime = (signal, edgeIndex, ctx = {}) => {
    if (!signal) return 0;
    if (signal.type === 'counter') {
        return getCounterEdgeTime(signal, edgeIndex, ctx);
    }
    return getOscillatorEdgeTime(signal, edgeIndex, ctx.duration);
};
