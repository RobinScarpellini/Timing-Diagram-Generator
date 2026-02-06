// SPDX-License-Identifier: GPL-3.0-only

import { describe, expect, it } from 'vitest';
import { CREATION_MODES } from '../constants/modes';
import { MODE_EVENTS, transitionCreationMode } from './modeMachine';

describe('modeMachine', () => {
    it('toggles tool mode deterministically', () => {
        const enabled = transitionCreationMode(null, { type: MODE_EVENTS.TOOL_TOGGLE, mode: CREATION_MODES.GUIDE });
        const disabled = transitionCreationMode(enabled, { type: MODE_EVENTS.TOOL_TOGGLE, mode: CREATION_MODES.GUIDE });

        expect(enabled).toBe(CREATION_MODES.GUIDE);
        expect(disabled).toBeNull();
    });

    it('transitions zone and link modes according to events and auto settings', () => {
        const zoneEnd = transitionCreationMode(
            CREATION_MODES.ZONE_START,
            { type: MODE_EVENTS.ZONE_POINT_CAPTURED }
        );
        const zoneNext = transitionCreationMode(
            zoneEnd,
            { type: MODE_EVENTS.ZONE_COMPLETED },
            { autoZone: true }
        );

        const linkEnd = transitionCreationMode(
            CREATION_MODES.LINK_START,
            { type: MODE_EVENTS.LINK_POINT_CAPTURED }
        );
        const linkNext = transitionCreationMode(
            linkEnd,
            { type: MODE_EVENTS.LINK_COMPLETED },
            { autoLink: false }
        );

        expect(zoneEnd).toBe(CREATION_MODES.ZONE_END);
        expect(zoneNext).toBe(CREATION_MODES.ZONE_START);
        expect(linkEnd).toBe(CREATION_MODES.LINK_END);
        expect(linkNext).toBeNull();
    });

    it('transitions guide/bold/edge-arrow according to auto settings', () => {
        expect(
            transitionCreationMode(CREATION_MODES.GUIDE, { type: MODE_EVENTS.GUIDE_COMPLETED }, { autoGuide: true })
        ).toBe(CREATION_MODES.GUIDE);

        expect(
            transitionCreationMode(CREATION_MODES.BOLD, { type: MODE_EVENTS.BOLD_COMPLETED }, { autoBoldEdge: false })
        ).toBeNull();

        expect(
            transitionCreationMode(CREATION_MODES.EDGE_ARROW, { type: MODE_EVENTS.EDGE_ARROW_COMPLETED }, { autoEdgeArrow: true })
        ).toBe(CREATION_MODES.EDGE_ARROW);
    });

    it('transitions measure start/end deterministically', () => {
        const endMode = transitionCreationMode(CREATION_MODES.MEASURE_START, { type: MODE_EVENTS.MEASURE_POINT_CAPTURED });
        const finalMode = transitionCreationMode(endMode, { type: MODE_EVENTS.MEASURE_COMPLETED });

        expect(endMode).toBe(CREATION_MODES.MEASURE_END);
        expect(finalMode).toBeNull();
    });
});
