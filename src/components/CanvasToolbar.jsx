// SPDX-License-Identifier: GPL-3.0-only

import React from 'react';
import { CREATION_MODES, isLinkMode, isMeasureMode, isZoneMode } from '../constants/modes';
import { MODE_EVENTS, transitionCreationMode } from '../state/modeMachine';

const IconLink = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="4" x2="20" y2="20" />
        <polyline points="13 20 20 20 20 13" />
    </svg>
);

const IconGuide = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="1 5" strokeLinecap="round" strokeWidth="3" />
    </svg>
);

const IconZone = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" />
        <path d="M9 20V4" />
        <path d="M15 20V4" />
        <path d="M4 15h16" />
        <path d="M4 9h16" />
    </svg>
);

const IconDelete = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const IconBold = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <text x="12" y="19" textAnchor="middle" fontSize="20" fontWeight="bold" fill="currentColor" stroke="none" style={{ fontFamily: 'sans-serif' }}>B</text>
    </svg>
);

const IconEdgeArrow = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="4" x2="12" y2="20" />
        <polyline points="8 13 12 9 16 13" />
    </svg>
);

const IconMeasure = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="12" x2="18" y2="12" />
        <polyline points="9 9 6 12 9 15" />
        <polyline points="15 9 18 12 15 15" />
    </svg>
);

const IconCopy = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

const IconPaste = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
);

const IconCursor = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 3l7 17 2-7 7-2Z" />
    </svg>
);

const CanvasToolbar = ({
    creationMode,
    setCreationMode,
    cursorFilter,
    setCursorFilter,
    onCopyStyle,
    onPasteStyle,
    canPaste
}) => {
    const isGuide = creationMode === CREATION_MODES.GUIDE;
    const isZone = isZoneMode(creationMode);
    const isLink = isLinkMode(creationMode);
    const isDelete = creationMode === CREATION_MODES.DELETE;
    const isBold = creationMode === CREATION_MODES.BOLD;
    const isEdgeArrow = creationMode === CREATION_MODES.EDGE_ARROW;
    const isMeasure = isMeasureMode(creationMode);
    const isCopy = creationMode === CREATION_MODES.COPY;
    const isPaste = creationMode === CREATION_MODES.PASTE;
    const hasActive = isGuide || isZone || isLink || isDelete || isBold || isEdgeArrow || isMeasure || isCopy || isPaste;
    const toolSelectionType = isGuide
        ? 'guide'
        : isZone
            ? 'zone'
            : isLink
                ? 'link'
                : isBold
                    ? 'edge'
                    : isEdgeArrow
                        ? 'edge-arrow'
                        : isMeasure
                            ? 'measurement'
                            : null;

    const toggleMode = (mode) => {
        const modeByTool = {
            guide: CREATION_MODES.GUIDE,
            zone: CREATION_MODES.ZONE_START,
            link: CREATION_MODES.LINK_START,
            delete: CREATION_MODES.DELETE,
            bold: CREATION_MODES.BOLD,
            'edge-arrow': CREATION_MODES.EDGE_ARROW,
            measure: CREATION_MODES.MEASURE_START
        };

        const resolvedMode = modeByTool[mode];
        if (!resolvedMode) return;

        setCreationMode((currentMode) => transitionCreationMode(
            currentMode,
            { type: MODE_EVENTS.TOOL_TOGGLE, mode: resolvedMode }
        ));
    };

    const toggleCursorFilter = () => {
        if (typeof setCursorFilter !== 'function') return;
        if (!toolSelectionType) return;
        const next = cursorFilter === toolSelectionType ? null : toolSelectionType;
        setCursorFilter(next);
    };

    return (
        <div className={`canvas-toolbar ${hasActive ? 'has-active' : ''}`} onClick={(event) => event.stopPropagation()}>
            <div className="canvas-toolbar-group">
                <button
                    className={`canvas-toolbar-btn cursor-select-btn ${toolSelectionType ? 'ready' : ''} ${cursorFilter && cursorFilter === toolSelectionType ? 'active' : ''}`}
                    onClick={toggleCursorFilter}
                    disabled={!toolSelectionType}
                    title={toolSelectionType ? `Select ${toolSelectionType}` : 'Select'}
                >
                    <IconCursor />
                </button>
                <div className="canvas-toolbar-separator" />
                <button className={`canvas-toolbar-btn ${isLink ? 'active' : ''}`} onClick={() => toggleMode('link')} title="Link">
                    <IconLink />
                </button>
                <button className={`canvas-toolbar-btn ${isGuide ? 'active' : ''}`} onClick={() => toggleMode('guide')} title="Guide">
                    <IconGuide />
                </button>
                <button className={`canvas-toolbar-btn ${isZone ? 'active' : ''}`} onClick={() => toggleMode('zone')} title="Zone">
                    <IconZone />
                </button>
                <button className={`canvas-toolbar-btn ${isBold ? 'active' : ''}`} onClick={() => toggleMode('bold')} title="Bold Edge">
                    <IconBold />
                </button>
                <button className={`canvas-toolbar-btn ${isEdgeArrow ? 'active' : ''}`} onClick={() => toggleMode('edge-arrow')} title="Edge Arrow">
                    <IconEdgeArrow />
                </button>
                <button className={`canvas-toolbar-btn ${isMeasure ? 'active' : ''}`} onClick={() => toggleMode('measure')} title="Measure">
                    <IconMeasure />
                </button>
            </div>
            <div className="canvas-toolbar-separator" />
            <div className="canvas-toolbar-group">
                <button className={`canvas-toolbar-btn ${isDelete ? 'active' : ''}`} onClick={() => toggleMode('delete')} title="Delete">
                    <IconDelete />
                </button>
                <button className={`canvas-toolbar-btn ${isCopy ? 'active' : ''}`} onClick={onCopyStyle} title="Copy Style">
                    <IconCopy />
                </button>
                <button className={`canvas-toolbar-btn ${isPaste ? 'active' : ''}`} onClick={onPasteStyle} disabled={!canPaste} title="Paste Style">
                    <IconPaste />
                </button>
            </div>
        </div>
    );
};

export default CanvasToolbar;
