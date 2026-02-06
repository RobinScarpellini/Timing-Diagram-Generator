// SPDX-License-Identifier: GPL-3.0-only

import { describe, expect, it } from 'vitest';
import {
    createLinkCommand,
    createZoneCommand,
    setLegendLayoutCommand,
    toggleBoldEdgeCommand
} from './commands';
import { DEFAULT_STATE } from './defaults';

const makeState = (patch = {}) => ({
    ...DEFAULT_STATE,
    ...patch,
    settings: {
        ...DEFAULT_STATE.settings,
        ...(patch.settings || {})
    },
    layers: {
        ...DEFAULT_STATE.layers,
        ...(patch.layers || {})
    }
});

describe('state commands', () => {
    it('creates links and appends layer ordering', () => {
        const state = makeState();
        const next = createLinkCommand(state, {
            id: 'link-1',
            start: { oscId: 'osc-1', edgeIndex: 1 },
            end: { counterId: 'cnt-1', edgeIndex: 2 }
        });

        expect(next.links).toHaveLength(1);
        expect(next.links[0].id).toBe('link-1');
        expect(next.layers.links).toEqual(['link-1']);
    });

    it('creates zones and appends layer ordering', () => {
        const state = makeState();
        const next = createZoneCommand(state, {
            id: 'zone-1',
            start: { oscId: 'osc-1', edgeIndex: 1 },
            end: { oscId: 'osc-1', edgeIndex: 4 }
        });

        expect(next.zones).toHaveLength(1);
        expect(next.zones[0].oscillatorId).toBe('osc-1');
        expect(next.layers.zones).toEqual(['zone-1']);
    });

    it('toggles bold edge entries on and off', () => {
        const state = makeState();
        const withEdge = toggleBoldEdgeCommand(state, 'osc-1-v-1', 3);
        const withoutEdge = toggleBoldEdgeCommand(withEdge, 'osc-1-v-1', 3);

        expect(withEdge.boldEdges).toHaveLength(1);
        expect(withoutEdge.boldEdges).toHaveLength(0);
    });

    it('updates legend layout via dedicated command', () => {
        const state = makeState();
        const next = setLegendLayoutCommand(state, { x: 12, y: 24, border: false });

        expect(next.legend.layout.x).toBe(12);
        expect(next.legend.layout.y).toBe(24);
        expect(next.legend.layout.border).toBe(false);
    });
});
