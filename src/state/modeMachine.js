// SPDX-License-Identifier: GPL-3.0-only

import { CREATION_MODES } from '../constants/modes';

export const MODE_EVENTS = Object.freeze({
    TOOL_TOGGLE: 'tool-toggle',
    CLEAR: 'clear',
    MEASURE_POINT_CAPTURED: 'measure-point-captured',
    MEASURE_COMPLETED: 'measure-completed',
    ZONE_POINT_CAPTURED: 'zone-point-captured',
    ZONE_COMPLETED: 'zone-completed',
    LINK_POINT_CAPTURED: 'link-point-captured',
    LINK_COMPLETED: 'link-completed',
    GUIDE_COMPLETED: 'guide-completed',
    BOLD_COMPLETED: 'bold-completed',
    EDGE_ARROW_COMPLETED: 'edge-arrow-completed'
});

export const transitionCreationMode = (currentMode, event, settings = {}) => {
    if (!event || typeof event !== 'object') return currentMode;

    switch (event.type) {
    case MODE_EVENTS.TOOL_TOGGLE:
        return currentMode === event.mode ? null : event.mode;
    case MODE_EVENTS.CLEAR:
        return null;
    case MODE_EVENTS.MEASURE_POINT_CAPTURED:
        return currentMode === CREATION_MODES.MEASURE_START
            ? CREATION_MODES.MEASURE_END
            : currentMode;
    case MODE_EVENTS.MEASURE_COMPLETED:
        return null;
    case MODE_EVENTS.ZONE_POINT_CAPTURED:
        return currentMode === CREATION_MODES.ZONE_START
            ? CREATION_MODES.ZONE_END
            : currentMode;
    case MODE_EVENTS.ZONE_COMPLETED:
        return settings.autoZone ? CREATION_MODES.ZONE_START : null;
    case MODE_EVENTS.LINK_POINT_CAPTURED:
        return currentMode === CREATION_MODES.LINK_START
            ? CREATION_MODES.LINK_END
            : currentMode;
    case MODE_EVENTS.LINK_COMPLETED:
        return settings.autoLink ? CREATION_MODES.LINK_START : null;
    case MODE_EVENTS.GUIDE_COMPLETED:
        return settings.autoGuide ? CREATION_MODES.GUIDE : null;
    case MODE_EVENTS.BOLD_COMPLETED:
        return settings.autoBoldEdge ? CREATION_MODES.BOLD : null;
    case MODE_EVENTS.EDGE_ARROW_COMPLETED:
        return settings.autoEdgeArrow ? CREATION_MODES.EDGE_ARROW : null;
    default:
        return currentMode;
    }
};
