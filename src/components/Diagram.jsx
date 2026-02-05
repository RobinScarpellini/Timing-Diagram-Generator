import React, { useMemo } from 'react';
import {
    COUNTER_BOX_HEIGHT,
    DIAGRAM_HEIGHT_OFFSET,
    DIAGRAM_LABEL_COLUMN_WIDTH,
    DIAGRAM_MIN_HEIGHT,
    DIAGRAM_PADDING,
    OSC_WAVE_HEIGHT,
    SIGNAL_ROW_BASE_Y
} from '../constants/layout';
import { getOscillatorLevelAt, getSignalEdgeTime } from '../diagram/geometry';
import { estimateLegendSize, resolveLegendPosition } from '../diagram/legend';

const getDashPatternValue = (style, len, gap) => {
    if (style === 'dashed') return `${len},${gap}`;
    if (style === 'dotted') return `1,${gap}`;
    return '';
};

const renderLinkElements = ({
    links,
    signals,
    spacing,
    timeScale,
    labelColumnWidth,
    selection,
    creationMode,
    canInteractWithElement,
    getCursorForElement,
    linkLineWidth,
    linkStartMarker,
    linkEndMarker,
    linkColor,
    arrowSize,
    defaultDash,
    fontFamily,
    defaultLabelSize,
    deleteLink,
    onElementClick,
    edgeTimeCtx
}) => {
    if (!links?.length) return null;
    return links.map((link) => {
        const sStart = signals.find((s) => s.id === link.start.oscId || s.id === link.start.counterId);
        const sEnd = signals.find((s) => s.id === link.end.oscId || s.id === link.end.counterId);

        if (!sStart || !sEnd) return null;

        const oIdxS = signals.indexOf(sStart);
        const oIdxE = signals.indexOf(sEnd);
        const ySBase = oIdxS * spacing + SIGNAL_ROW_BASE_Y;
        const yEBase = oIdxE * spacing + SIGNAL_ROW_BASE_Y;

        const tStart = getSignalEdgeTime(sStart, link.start.edgeIndex, edgeTimeCtx);
        const tEnd = getSignalEdgeTime(sEnd, link.end.edgeIndex, edgeTimeCtx);
        const x1 = labelColumnWidth + tStart * timeScale;
        const x2 = labelColumnWidth + tEnd * timeScale;

        let yS;
        let yE;
        if (oIdxS < oIdxE) {
            yS = ySBase;
            yE = yEBase - (sEnd.type === 'counter' ? COUNTER_BOX_HEIGHT : OSC_WAVE_HEIGHT);
        } else {
            yS = ySBase - (sStart.type === 'counter' ? COUNTER_BOX_HEIGHT : OSC_WAVE_HEIGHT);
            yE = yEBase;
        }

        const isSelected = selection?.type === 'link' && selection?.ids?.includes(link.id);
        const dash = link.style
            ? getDashPatternValue(link.style, link.dashLength || 8, link.dashGap || 4)
            : defaultDash;
        const linkStrokeColor = link.color || linkColor;
        const markerSize = link.arrowSize ?? arrowSize ?? 10;
        const markerColorId = linkStrokeColor.replace(/[^a-zA-Z0-9]/g, '');
        const markerId = `${markerColorId}-${Math.round(markerSize * 100)}`;

        const cursor = getCursorForElement('link');

        return (
            <g key={link.id}>
                <line
                    x1={x1} y1={yS} x2={x2} y2={yE}
                    stroke="transparent"
                    strokeWidth={12}
                    pointerEvents={canInteractWithElement('link') ? 'stroke' : 'none'}
                    style={{ cursor }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (creationMode === 'delete') {
                            deleteLink(link.id);
                        } else if (onElementClick && link.id) {
                            onElementClick('link', link, { multi: e.shiftKey || e.ctrlKey || e.metaKey });
                        }
                    }}
                />
                <line x1={x1} y1={ySBase} x2={x1} y2={ySBase - (sStart.type === 'counter' ? COUNTER_BOX_HEIGHT : OSC_WAVE_HEIGHT)} stroke={linkStrokeColor} strokeWidth={(link.lineWidth || linkLineWidth) * 0.5} strokeDasharray={dash} opacity="0.2" />
                <line x1={x2} y1={yEBase} x2={x2} y2={yEBase - (sEnd.type === 'counter' ? COUNTER_BOX_HEIGHT : OSC_WAVE_HEIGHT)} stroke={linkStrokeColor} strokeWidth={(link.lineWidth || linkLineWidth) * 0.5} strokeDasharray={dash} opacity="0.2" />
                <line
                    x1={x1} y1={yS} x2={x2} y2={yE}
                    stroke={linkStrokeColor}
                    strokeWidth={link.lineWidth || linkLineWidth}
                    strokeDasharray={dash}
                    markerStart={(link.startMarker || linkStartMarker) === 'arrow' ? `url(#arrowhead-start-${markerId})` : (link.startMarker || linkStartMarker) === 'dot' ? `url(#dot-${markerId})` : 'none'}
                    markerEnd={(link.endMarker || linkEndMarker) === 'arrow' ? `url(#arrowhead-${markerId})` : (link.endMarker || linkEndMarker) === 'dot' ? `url(#dot-${markerId})` : 'none'}
                />
                {isSelected && (
                    <line
                        x1={x1} y1={yS} x2={x2} y2={yE}
                        stroke="#2563eb"
                        strokeWidth={(link.lineWidth || linkLineWidth) + 3}
                        opacity={0.35}
                        pointerEvents="none"
                    />
                )}
                {(() => {
                    const label = link.arrowLabel?.text;
                    if (!label || !String(label).trim().length) return null;
                    const size = Math.max(6, link.arrowLabel?.size ?? defaultLabelSize ?? 10);
                    const pos = link.arrowLabel?.position || 'above';
                    const midX = (x1 + x2) / 2;
                    const midY = (yS + yE) / 2;
                    const dy = pos === 'below' ? (size + 6) : -6;
                    return (
                        <text
                            x={midX}
                            y={midY + dy}
                            fontSize={size}
                            fontFamily={fontFamily}
                            fill={linkStrokeColor}
                            textAnchor="middle"
                            pointerEvents="none"
                        >
                            {String(label)}
                        </text>
                    );
                })()}
            </g>
        );
    });
};

const renderGuideElements = ({
    guides,
    signals,
    spacing,
    duration,
    timeScale,
    labelColumnWidth,
    guideHeight,
    guideStyle,
    guideDashLength,
    guideDashGap,
    guideLineWidth,
    selection,
    creationMode,
    canInteractWithElement,
    getCursorForElement,
    deleteGuide,
    onElementClick
}) => {
    if (!guides?.length) return null;
    return guides.map((g) => {
        const osc = signals.find((s) => s.id === g.oscId);
        if (!osc) return null;
        const oscIndex = signals.findIndex((s) => s.id === g.oscId);
        const yBase = oscIndex * spacing + SIGNAL_ROW_BASE_Y;
        const edgeY = yBase - OSC_WAVE_HEIGHT / 2;
        const hasCustomExtents = Number.isFinite(g.upperExtension) && Number.isFinite(g.lowerExtension);
        const yTop = hasCustomExtents ? Math.max(0, edgeY - g.upperExtension) : 0;
        const yBottom = hasCustomExtents ? Math.min(guideHeight, edgeY + g.lowerExtension) : guideHeight;

        const t = (osc.delay || 0) + g.edgeIndex * ((osc.period || 100) / 2);
        if (t < 0 || t > duration) return null;
        const x = labelColumnWidth + t * timeScale;

        const lineStyle = g.style || guideStyle;
        const dash = getDashPatternValue(lineStyle, g.dashLength || guideDashLength, g.dashGap || guideDashGap);
        const lineWidth = g.lineWidth || guideLineWidth;
        const isSelected = selection?.type === 'guide' && selection?.ids?.includes(g.id);

        const cursor = getCursorForElement('guide');

        return (
            <g key={g.id}>
                <line
                    x1={x} y1={yTop} x2={x} y2={yBottom}
                    stroke="transparent"
                    strokeWidth={12}
                    pointerEvents={canInteractWithElement('guide') ? 'stroke' : 'none'}
                    style={{ cursor }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (creationMode === 'delete') {
                            deleteGuide(g.id);
                        } else if (onElementClick && g.id) {
                            onElementClick('guide', g, { multi: e.shiftKey || e.ctrlKey || e.metaKey });
                        }
                    }}
                />
                <line
                    x1={x} y1={yTop} x2={x} y2={yBottom}
                    stroke="#000"
                    strokeWidth={lineWidth}
                    strokeDasharray={dash}
                    opacity="0.6"
                    pointerEvents="none"
                />
                {isSelected && (
                    <line
                        x1={x} y1={yTop} x2={x} y2={yBottom}
                        stroke="#2563eb"
                        strokeWidth={lineWidth + 2}
                        opacity={0.5}
                        pointerEvents="none"
                    />
                )}
            </g>
        );
    });
};

const renderMeasurementElements = ({
    measurements,
    guides,
    signals,
    duration,
    timeScale,
    labelColumnWidth,
    selection,
    creationMode,
    canInteractWithElement,
    getCursorForElement,
    deleteMeasurement,
    onElementClick,
    fontFamily,
    defaultLabelSize
}) => {
    if (!measurements?.length) return null;

    const resolveEdgeTime = (oscId, edgeIndex) => {
        const osc = signals.find((s) => s.id === oscId && s.type === 'oscillator');
        if (!osc) return null;
        const t = (osc.delay || 0) + edgeIndex * ((osc.period || 100) / 2);
        if (t < 0 || t > duration) return null;
        return t;
    };

    const resolveEndpointTime = (endpoint) => {
        if (!endpoint || typeof endpoint !== 'object') return null;
        if (endpoint.kind === 'guide') {
            const guide = guides.find((g) => g.id === endpoint.guideId);
            if (!guide) return null;
            return resolveEdgeTime(guide.oscId, guide.edgeIndex);
        }
        if (endpoint.kind === 'edge') {
            return resolveEdgeTime(endpoint.oscId, endpoint.edgeIndex);
        }
        return null;
    };

    return measurements.map((m, index) => {
        const t1 = resolveEndpointTime(m.start);
        const t2 = resolveEndpointTime(m.end);
        if (t1 === null || t2 === null) return null;

        const x1 = labelColumnWidth + t1 * timeScale;
        const x2 = labelColumnWidth + t2 * timeScale;
        const xMin = Math.min(x1, x2);
        const xMax = Math.max(x1, x2);

        const y = 24 + index * 14;
        const color = m.color || '#000000';
        const width = m.lineWidth || 1.2;
        const size = m.arrowSize ?? 10;
        const safeColor = color.replace(/[^a-zA-Z0-9]/g, '');
        const markerId = `${safeColor}-${Math.round(((size ?? 10) || 10) * 100)}`;

        const isSelected = selection?.type === 'measurement' && selection?.ids?.includes(m.id);
        const cursor = getCursorForElement('measurement');

        return (
            <g key={m.id}>
                <line
                    x1={xMin}
                    y1={y}
                    x2={xMax}
                    y2={y}
                    stroke="transparent"
                    strokeWidth={12}
                    pointerEvents={canInteractWithElement('measurement') ? 'stroke' : 'none'}
                    style={{ cursor }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (creationMode === 'delete') {
                            deleteMeasurement(m.id);
                        } else if (onElementClick && m.id) {
                            onElementClick('measurement', m, { multi: e.shiftKey || e.ctrlKey || e.metaKey });
                        }
                    }}
                />
                <line
                    x1={xMin}
                    y1={y}
                    x2={xMax}
                    y2={y}
                    stroke={color}
                    strokeWidth={width}
                    markerStart={`url(#arrowhead-start-${markerId})`}
                    markerEnd={`url(#arrowhead-${markerId})`}
                    pointerEvents="none"
                />
                {isSelected && (
                    <line
                        x1={xMin}
                        y1={y}
                        x2={xMax}
                        y2={y}
                        stroke="#2563eb"
                        strokeWidth={width + 3}
                        opacity={0.35}
                        pointerEvents="none"
                    />
                )}
                {(() => {
                    const label = m.arrowLabel?.text;
                    if (!label || !String(label).trim().length) return null;
                    const sizeLabel = Math.max(6, m.arrowLabel?.size ?? defaultLabelSize ?? 10);
                    const pos = m.arrowLabel?.position || 'top';
                    const dy = pos === 'bottom' ? (sizeLabel + 6) : -6;
                    const midX = (xMin + xMax) / 2;
                    return (
                        <text
                            x={midX}
                            y={y + dy}
                            fontSize={sizeLabel}
                            fontFamily={fontFamily}
                            fill={color}
                            textAnchor="middle"
                            pointerEvents="none"
                        >
                            {String(label)}
                        </text>
                    );
                })()}
            </g>
        );
    });
};

const Diagram = ({
    diagramName,
    legend,
    bounds,
    signals = [], boldEdges, toggleBoldEdge, duration, spacing,
    guides, zones, links, layers, measurements, creationMode, timeScale,
    lineWidth, boldWeight, fontSize, fontFamily, boldLabels, labelX, labelYOffset, labelJustify,
    edgeArrows, edgeArrowType, edgeArrowSize, edgeArrowRatio, edgeArrowColor,
    deleteGuide, deleteZone, deleteLink, deleteMeasurement,
    linkLineWidth, linkStyle, linkDashLength, linkDashGap,
    linkStartMarker, linkEndMarker, linkColor, arrowSize,
    guideLineWidth, guideStyle, guideDashLength, guideDashGap,
    guideExtraHeight,
    zoneBorderWidth, zonePatternWidth, hatchType, zoneColor,
    counterFontSize,
    selection,
    clipboardType,
    onElementClick,
    deleteEdgeArrow,
    cursorFilter
}) => {
    // Derived list for rendering logic
    const oscillators = signals.filter((s) => s.type === 'oscillator');
    const layerOrder = layers && typeof layers === 'object' ? layers : null;
    const orderByLayer = (items, orderIds) => {
        if (!Array.isArray(items) || !items.length) return [];
        if (!Array.isArray(orderIds) || !orderIds.length) return items;
        const map = new Map(items.map((item) => [item.id, item]));
        const fromOrder = orderIds.map((id) => map.get(id)).filter(Boolean);
        const remaining = items.filter((item) => !orderIds.includes(item.id));
        return [...fromOrder, ...remaining];
    };
    const orderedGuides = useMemo(() => orderByLayer(guides || [], layerOrder?.guides), [guides, layerOrder]);
    const orderedZones = useMemo(() => orderByLayer(zones || [], layerOrder?.zones), [zones, layerOrder]);
    const orderedLinks = useMemo(() => orderByLayer(links || [], layerOrder?.links), [links, layerOrder]);
    const orderedEdgeArrows = useMemo(() => orderByLayer(edgeArrows || [], layerOrder?.edgeArrows), [edgeArrows, layerOrder]);
    const orderedMeasurements = useMemo(() => orderByLayer(measurements || [], layerOrder?.measurements), [measurements, layerOrder]);

    const labelColumnWidth = DIAGRAM_LABEL_COLUMN_WIDTH;
    const extraLeft = Math.max(0, -(labelX || 0));
    const width = duration * timeScale + labelColumnWidth + DIAGRAM_PADDING + extraLeft;

    const baseHeight = Math.max(DIAGRAM_MIN_HEIGHT, (signals.length - 1) * spacing + DIAGRAM_HEIGHT_OFFSET);
    const height = baseHeight;
    const guideHeight = Math.min(height, Math.max(0, height + (guideExtraHeight || 0)));

    const isDefaultMode = creationMode === null;
    const isCopyMode = creationMode === 'copy';
    const isPasteMode = creationMode === 'paste';
    const isDeleteMode = creationMode === 'delete';
    const isMeasureMode = Boolean(creationMode && creationMode.startsWith('measure'));
    const isEdgeMode = creationMode === 'bold' || creationMode === 'edge-arrow' || creationMode === 'guide' || creationMode === 'zone-start' || creationMode === 'zone-end' || creationMode === 'link-start' || creationMode === 'link-end';

    const getCursorForElement = (type) => {
        if (cursorFilter) return type === cursorFilter ? 'pointer' : 'default';
        if (isDeleteMode && (type === 'guide' || type === 'zone' || type === 'link' || type === 'edge-arrow' || type === 'measurement')) return 'pointer';
        if (isMeasureMode) return (type === 'guide' || type === 'edge') ? 'pointer' : 'default';
        if (isEdgeMode) return type === 'edge' ? 'pointer' : 'default';
        if (isCopyMode) return type === 'edge' ? 'pointer' : 'pointer';
        if (isPasteMode) return clipboardType === type ? 'pointer' : 'default';
        if (isDefaultMode) return type === 'edge' ? 'pointer' : 'pointer';
        return 'default';
    };

    const getCursorForEdge = (isBold) => {
        if (cursorFilter) return cursorFilter === 'edge' ? 'pointer' : 'default';
        if (isMeasureMode) return 'pointer';
        if (isEdgeMode) return 'pointer';
        if (isDeleteMode) return isBold ? 'pointer' : 'default';
        if (isPasteMode) return clipboardType === 'edge' ? 'pointer' : 'default';
        if (isCopyMode) return isBold ? 'pointer' : 'default';
        if (isDefaultMode) return isBold ? 'pointer' : 'default';
        return 'default';
    };

    const canSelectEdge = (isBold) => {
        if (cursorFilter) return isBold;
        if (isPasteMode) return clipboardType === 'edge';
        if (isCopyMode) return isBold;
        if (isDefaultMode) return isBold;
        return false;
    };

    const canInteractWithElement = (type) => {
        if (cursorFilter) return type === cursorFilter;
        if (type === 'edge') {
            if (isDeleteMode) return true;
            if (isMeasureMode) return true;
            if (isEdgeMode) return true;
            if (isCopyMode) return true;
            if (isPasteMode) return clipboardType === 'edge';
            if (isDefaultMode) return true;
            return false;
        }
        if (type === 'edge-arrow') {
            if (isDeleteMode) return true;
            if (isEdgeMode) return false;
            if (isCopyMode) return true;
            if (isPasteMode) return clipboardType === 'edge-arrow';
            if (isDefaultMode) return true;
            return false;
        }
        if (isMeasureMode) return type === 'guide';
        if (isDeleteMode) return type === 'guide' || type === 'zone' || type === 'link' || type === 'edge-arrow' || type === 'measurement';
        if (isEdgeMode) return false;
        if (isCopyMode) return type === 'guide' || type === 'zone' || type === 'link';
        if (isPasteMode) return clipboardType === type;
        if (isDefaultMode) return type === 'guide' || type === 'zone' || type === 'link' || type === 'measurement';
        return false;
    };

    const edgeTimeCtx = useMemo(() => ({ oscillators, duration }), [oscillators, duration]);

    const renderOscillator = (osc, index) => {
        const yBase = index * spacing + SIGNAL_ROW_BASE_Y;
        const waveHeight = OSC_WAVE_HEIGHT;
        const halfPeriod = (osc.period || 100) / 2;
        const delay = osc.delay || 0;
        const edgeLimit = osc.edgeCount ?? -1;
        const maxEdgeIndex = edgeLimit >= 0 ? edgeLimit - 1 : Infinity;
        let waveElements = [];
        let edgeElements = [];

        const startK = delay < 0 ? Math.ceil(-delay / halfPeriod) : 0;
        const endKByDuration = Math.floor((duration - delay) / halfPeriod);
        const endK = Math.min(endKByDuration, maxEdgeIndex);

        const tFirst = delay + startK * halfPeriod;
        const levelAtZero = getOscillatorLevelAt(osc, 0);
        const yAtZero = levelAtZero === 1 ? yBase - waveHeight : yBase;
        const drawUntil = startK > endK ? duration : Math.min(tFirst, duration);
        if (drawUntil > 0) {
            const xEnd = Math.min(labelColumnWidth + drawUntil * timeScale, labelColumnWidth + duration * timeScale);

            waveElements.push(
                <line key={`${osc.id}-init`}
                    x1={labelColumnWidth} y1={yAtZero} x2={xEnd} y2={yAtZero}
                    stroke={osc.color || "#000"} strokeWidth={lineWidth} strokeLinecap="square" pointerEvents="none" />
            );
        }

        for (let k = startK; k <= endK; k++) {
            const tToken = delay + k * halfPeriod;
            if (tToken >= duration) break;
            if (tToken < 0) continue;

            const nextT = delay + (k + 1) * halfPeriod;
            const isLastEdgeByCount = edgeLimit >= 0 && k === maxEdgeIndex;
            const tEnd = Math.min(isLastEdgeByCount ? duration : nextT, duration);

            let baseLevel = (k % 2 === 0) ? 1 : 0;
            let level = osc.inverted ? (1 - baseLevel) : baseLevel;

            const y = level === 1 ? yBase - waveHeight : yBase;
            const xStart = labelColumnWidth + tToken * timeScale;
            const xEnd = labelColumnWidth + tEnd * timeScale;

            waveElements.push(
                <line key={`${osc.id}-h-${k}`}
                    x1={xStart} y1={y} x2={xEnd} y2={y}
                    stroke={osc.color || "#000"} strokeWidth={lineWidth} strokeLinecap="square" pointerEvents="none" />
            );

            const y1 = level === 1 ? yBase : yBase - waveHeight;
            const y2 = level === 1 ? yBase - waveHeight : yBase;

            const edgeId = `${osc.id}-v-${k}`;
            const boldEdge = boldEdges.get(edgeId);
            const isBold = Boolean(boldEdge);
            const edgeWeight = boldEdge?.weight ?? boldWeight;
            const isSelected = selection?.type === 'edge' && selection?.ids?.includes(edgeId);

            waveElements.push(
                <line key={`${osc.id}-v-${k}`}
                    x1={xStart} y1={y1} x2={xStart} y2={y2}
                    stroke={osc.color || "#000"} strokeWidth={isBold ? edgeWeight : lineWidth} pointerEvents="none" />
            );

            edgeElements.push(
                <line key={`hit-${edgeId}`}
                    x1={xStart} y1={yBase} x2={xStart} y2={yBase - waveHeight}
                    stroke="transparent" strokeWidth={14}
                    pointerEvents={canInteractWithElement('edge') ? 'stroke' : 'none'}
                    style={{ cursor: getCursorForEdge(isBold) }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (cursorFilter || creationMode === null || creationMode === 'copy' || creationMode === 'paste') {
                            if (onElementClick && canSelectEdge(isBold)) {
                                onElementClick('edge', { id: edgeId, weight: edgeWeight }, { multi: e.shiftKey || e.ctrlKey || e.metaKey });
                            }
                        } else {
                            toggleBoldEdge(edgeId, { oscId: osc.id, edgeIndex: k, oscillatorId: osc.id, signalIndex: index });
                        }
                    }} />
            );

            if (isSelected) {
                waveElements.push(
                    <line key={`sel-${edgeId}`}
                        x1={xStart} y1={y1} x2={xStart} y2={y2}
                        stroke="#2563eb"
                        strokeWidth={(isBold ? edgeWeight : lineWidth) + 2}
                        opacity={0.6}
                        pointerEvents="none"
                    />
                );
            }
        }

        const arrowElements = orderedEdgeArrows.filter((arrow) => arrow.oscId === osc.id).map((arrow) => {
            if (edgeLimit >= 0 && arrow.edgeIndex > maxEdgeIndex) return null;
            const tEdge = delay + arrow.edgeIndex * halfPeriod;
            if (tEdge < 0 || tEdge > duration) return null;

            const baseLevel = (arrow.edgeIndex % 2 === 0) ? 1 : 0;
            const level = osc.inverted ? (1 - baseLevel) : baseLevel;
            const direction = level === 1 ? -1 : 1;
            const size = Math.max(2, arrow.size ?? edgeArrowSize ?? 10);
            const ratioValue = arrow.ratio ?? edgeArrowRatio ?? 1;
            const ratio = Math.min(2, Math.max(0.5, ratioValue));
            const arrowLength = size * ratio;
            const arrowWidth = size;
            const halfLength = arrowLength / 2;
            const halfWidth = arrowWidth / 2;

            const x = labelColumnWidth + tEdge * timeScale;
            const yCenter = yBase - waveHeight / 2;
            const tipY = yCenter + direction * halfLength;
            const baseY = yCenter - direction * halfLength;
            const leftX = x - halfWidth;
            const rightX = x + halfWidth;
            const points = `${x} ${tipY}, ${leftX} ${baseY}, ${rightX} ${baseY}`;
            const openPoints = `${leftX} ${baseY}, ${x} ${tipY}, ${rightX} ${baseY}`;

            const arrowType = arrow.type ?? edgeArrowType;
            const arrowColor = arrow.color ?? edgeArrowColor ?? '#000';
            const isSelected = selection?.type === 'edge-arrow' && selection?.ids?.includes(arrow.id);

            const cursor = getCursorForElement('edge-arrow');
            const canInteract = canInteractWithElement('edge-arrow');

            return (
                <g key={arrow.id}>
                    {arrowType === 'open' ? (
                        <polyline
                            points={openPoints}
                            fill="none"
                            stroke={arrowColor}
                            strokeWidth={Math.max(1, size * 0.12)}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            pointerEvents="none"
                        />
                    ) : (
                        <polygon
                            points={points}
                            fill={arrowColor}
                            stroke="none"
                            pointerEvents="none"
                        />
                    )}
                    <polygon
                        points={points}
                        fill="transparent"
                        stroke="transparent"
                        strokeWidth={Math.max(8, size)}
                        pointerEvents={canInteract ? 'all' : 'none'}
                        style={{ cursor }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (creationMode === 'delete') {
                                deleteEdgeArrow(arrow.id);
                            } else if (onElementClick && arrow.id) {
                                onElementClick('edge-arrow', arrow, { multi: e.shiftKey || e.ctrlKey || e.metaKey });
                            }
                        }}
                    />
                    {isSelected && (
                        <polygon
                            points={points}
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth={2}
                            opacity={0.7}
                            pointerEvents="none"
                        />
                    )}
                    {(() => {
                        const label = arrow.arrowLabel?.text;
                        if (!label || !String(label).trim().length) return null;
                        const sizeLabel = Math.max(6, arrow.arrowLabel?.size ?? fontSize ?? 10);
                        const pos = arrow.arrowLabel?.position || 'above';
                        const dy = pos === 'below' ? (sizeLabel + 6) : -(sizeLabel + 6);
                        return (
                            <text
                                x={x}
                                y={yCenter + dy}
                                fontSize={sizeLabel}
                                fontFamily={fontFamily}
                                fill={arrowColor}
                                textAnchor="middle"
                                pointerEvents="none"
                            >
                                {String(label)}
                            </text>
                        );
                    })()}
                </g>
            );
        });

        const oscillatorZones = orderedZones.filter((z) => z.oscillatorId === osc.id);
        const hatchVisualElements = [];
        const hatchHitElements = [];
        oscillatorZones.forEach((z) => {
            const oStart = oscillators.find(o => o.id === z.start.oscId);
            const oEnd = oscillators.find(o => o.id === z.end.oscId);
            if (!oStart || !oEnd) return;

            const tStart = (oStart.delay || 0) + z.start.edgeIndex * ((oStart.period || 100) / 2);
            const tEnd = (oEnd.delay || 0) + z.end.edgeIndex * ((oEnd.period || 100) / 2);

            const xMin = labelColumnWidth + Math.min(tStart, tEnd) * timeScale;
            const xMax = labelColumnWidth + Math.max(tStart, tEnd) * timeScale;
            const clipX1 = Math.max(labelColumnWidth, xMin);
            const clipX2 = Math.min(labelColumnWidth + duration * timeScale, xMax);

            if (clipX1 >= clipX2) return;

            const isSelected = selection?.type === 'zone' && selection?.ids?.includes(z.id);
            const hatchColor = z.color || zoneColor || '#000';
            const patternWidth = z.patternWidth ?? zonePatternWidth ?? 1;
            const patternId = `${(z.hatchType || hatchType)}-${hatchColor.replace(/[^a-zA-Z0-9]/g, '')}-${Math.round((patternWidth || 1) * 100)}`;
            const canInteract = canInteractWithElement('zone');

            hatchVisualElements.push(
                <g key={`zone-visual-${z.id}`}>
                    <rect
                        x={clipX1} y={yBase - waveHeight}
                        width={clipX2 - clipX1} height={waveHeight}
                        fill={`url(#${patternId})`}
                        stroke={z.color || (z.borderWidth > 0 ? "#000" : "none")}
                        strokeWidth={z.borderWidth !== undefined ? z.borderWidth : zoneBorderWidth}
                        pointerEvents="none"
                    />
                    {isSelected && (
                        <rect
                            x={clipX1} y={yBase - waveHeight}
                            width={clipX2 - clipX1} height={waveHeight}
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth={2}
                            opacity={0.7}
                            pointerEvents="none"
                        />
                    )}
                </g>
            );

            hatchHitElements.push(
                <rect
                    key={`zone-hit-${z.id}`}
                    x={clipX1} y={yBase - waveHeight}
                    width={clipX2 - clipX1} height={waveHeight}
                    fill="#ffffff"
                    fillOpacity={0.001}
                    stroke="none"
                    style={{ cursor: getCursorForElement('zone') }}
                    pointerEvents={canInteract ? 'all' : 'none'}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (creationMode === 'delete') {
                            deleteZone(z.id);
                        } else if (onElementClick && z.id) {
                            onElementClick('zone', z, { multi: e.shiftKey || e.ctrlKey || e.metaKey });
                        }
                    }}
                />
            );
        });

        return (
            <g key={osc.id}>
                <text
                    x={labelX} y={yBase + labelYOffset - 3}
                    fontSize={fontSize}
                    fontWeight={boldLabels ? "bold" : "normal"}
                    fontFamily={fontFamily}
                    fill="#000"
                    textAnchor={labelJustify || "start"}
                >
                    {osc.name}
                </text>
                {hatchVisualElements}
                {waveElements}
                {edgeElements}
                {hatchHitElements}
                {arrowElements}
            </g>
        );
    };

    const renderCounter = (cnt, index) => {
        const yBase = index * spacing + SIGNAL_ROW_BASE_Y;
        const boxHeight = COUNTER_BOX_HEIGHT;

        const targetOsc = cnt.referenceOscId ? oscillators.find(o => o.id === cnt.referenceOscId) : oscillators[0];
        if (!targetOsc) return null;

        const halfPeriod = (targetOsc.period || 100) / 2;
        const delay = targetOsc.delay || 0;
        const polarity = cnt.polarity || 'rising';
        const startEdgeNum = cnt.startEdge || 1;
        const endEdgeNum = cnt.endEdge || 10;
        const edgeLimit = targetOsc.edgeCount ?? -1;
        const maxEdgeIndex = edgeLimit >= 0 ? edgeLimit - 1 : Infinity;

        let allValidEdges = [];
        const maxK = Math.floor((duration - delay) / halfPeriod);
        const minK = Math.floor((-delay) / halfPeriod);

        for (let k = minK; k <= maxK; k++) {
            if (k >= 0 && k > maxEdgeIndex) break;
            const t = delay + k * halfPeriod;
            if (t < 0 || t > duration) continue;

            const isRefRising = (k % 2 === 0);
            const effectiveRising = targetOsc.inverted ? !isRefRising : isRefRising;
            const matches = (polarity === 'rising' && effectiveRising) || (polarity === 'falling' && !effectiveRising);

            if (matches) {
                allValidEdges.push(t);
            }
        }

        const segments = [];
        let currentCount = 0;
        let segmentStartT = 0;

        allValidEdges.forEach((tEdge, idx) => {
            const edgeNum = idx + 1;
            let nextCount = currentCount;
            if (edgeNum >= startEdgeNum && edgeNum <= endEdgeNum) {
                nextCount++;
            }
            if (nextCount !== currentCount) {
                segments.push({ t1: segmentStartT, t2: tEdge, val: currentCount });
                segmentStartT = tEdge;
                currentCount = nextCount;
            }
        });
        segments.push({ t1: segmentStartT, t2: duration, val: currentCount });

        return (
            <g key={cnt.id}>
                <text
                    x={labelX} y={yBase + labelYOffset}
                    fontSize={fontSize}
                    fontWeight={boldLabels ? "bold" : "normal"}
                    fontFamily={fontFamily}
                    fill="#000"
                    textAnchor={labelJustify || "start"}
                >
                    {cnt.name}
                </text>

                {segments.map((seg, sIdx) => {
                    const x1 = labelColumnWidth + seg.t1 * timeScale;
                    const x2 = labelColumnWidth + seg.t2 * timeScale;
                    if (x1 >= x2) return null;

                    return (
                        <g key={sIdx}>
                            <line x1={x1} y1={yBase - boxHeight} x2={x2} y2={yBase - boxHeight} stroke={cnt.color || "#000"} strokeWidth={lineWidth} />
                            <line x1={x1} y1={yBase} x2={x2} y2={yBase} stroke={cnt.color || "#000"} strokeWidth={lineWidth} />

                            {seg.t1 > 0 && (
                                <line x1={x1} y1={yBase} x2={x1} y2={yBase - boxHeight} stroke={cnt.color || "#000"} strokeWidth={lineWidth} />
                            )}

                            <text
                                x={(x1 + x2) / 2}
                                y={yBase - boxHeight / 2}
                                dy="0.35em"
                                textAnchor="middle"
                                fontSize={counterFontSize || fontSize * 0.9}
                                fontFamily={fontFamily}
                                fill={cnt.color || "#000"}
                            >
                                {seg.val}
                            </text>
                        </g>
                    );
                })}

                {allValidEdges.map((tEdge, idx) => {
                    const x = labelColumnWidth + tEdge * timeScale;
                    const edgeId = `cnt-${cnt.id}-e-${idx + 1}`;
                    const isBold = boldEdges.has(edgeId);
                    const isSelected = selection?.type === 'edge' && selection?.ids?.includes(edgeId);
                    return (
                        <g key={edgeId}>
                            <line
                                x1={x} y1={yBase} x2={x} y2={yBase - boxHeight}
                                stroke="transparent"
                                strokeWidth={14}
                                pointerEvents={canInteractWithElement('edge') ? 'stroke' : 'none'}
                                style={{ cursor: getCursorForEdge(isBold) }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (cursorFilter || creationMode === null || creationMode === 'copy' || creationMode === 'paste') {
                                        if (onElementClick && canSelectEdge(isBold)) {
                                            onElementClick('edge', { id: edgeId, isBold }, { multi: e.shiftKey || e.ctrlKey || e.metaKey });
                                        }
                                    } else {
                                        toggleBoldEdge(edgeId, { counterId: cnt.id, edgeIndex: idx + 1, signalIndex: index });
                                    }
                                }}
                            />
                            {isSelected && (
                                <line
                                    x1={x} y1={yBase} x2={x} y2={yBase - boxHeight}
                                    stroke="#2563eb"
                                    strokeWidth={2}
                                    opacity={0.6}
                                    pointerEvents="none"
                                />
                            )}
                        </g>
                    );
                })}
            </g>
        );
    };

    const hatchPatterns = useMemo(() => {
        const map = new Map();
        zones.forEach((zone) => {
            const type = zone.hatchType || hatchType;
            const color = zone.color || zoneColor || '#000';
            const lineWidth = zone.patternWidth ?? zonePatternWidth ?? 1;
            const key = `${type}|${color}|${lineWidth}`;
            if (!map.has(key)) {
                const safeColor = color.replace(/[^a-zA-Z0-9]/g, '');
                map.set(key, {
                    id: `${type}-${safeColor}-${Math.round((lineWidth || 1) * 100)}`,
                    type,
                    color,
                    lineWidth
                });
            }
        });
        (legend?.entries || []).forEach((entry) => {
            if (!entry || typeof entry !== 'object') return;
            if (entry.type !== 'hatch') return;
            const type = entry.hatchType || hatchType;
            const color = entry.color || zoneColor || '#000';
            const lineWidth = entry.patternWidth ?? zonePatternWidth ?? 1;
            const key = `${type}|${color}|${lineWidth}`;
            if (!map.has(key)) {
                const safeColor = color.replace(/[^a-zA-Z0-9]/g, '');
                map.set(key, {
                    id: `${type}-${safeColor}-${Math.round((lineWidth || 1) * 100)}`,
                    type,
                    color,
                    lineWidth
                });
            }
        });
        return Array.from(map.values());
    }, [zones, legend, hatchType, zoneColor, zonePatternWidth]);

    const defaultLinkDash = useMemo(
        () => getDashPatternValue(linkStyle, linkDashLength, linkDashGap),
        [linkStyle, linkDashLength, linkDashGap]
    );

    const renderPattern = ({ id, type, color, lineWidth }) => {
        const strokeWidth = Math.max(0.1, lineWidth || 1);
        if (type === 'hatch-45') {
            return (
                <pattern key={id} id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="6" stroke={color} strokeWidth={strokeWidth} opacity="0.4" />
                </pattern>
            );
        }
        if (type === 'hatch-135') {
            return (
                <pattern key={id} id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(135)">
                    <line x1="0" y1="0" x2="0" y2="6" stroke={color} strokeWidth={strokeWidth} opacity="0.4" />
                </pattern>
            );
        }
        if (type === 'hatch-cross') {
            return (
                <pattern key={id} id={id} width="6" height="6" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="6" y2="6" stroke={color} strokeWidth={strokeWidth} opacity="0.4" />
                    <line x1="6" y1="0" x2="0" y2="6" stroke={color} strokeWidth={strokeWidth} opacity="0.4" />
                </pattern>
            );
        }
        if (type === 'hatch-dots') {
            const radius = Math.max(0.4, strokeWidth * 0.6);
            return (
                <pattern key={id} id={id} width="4" height="4" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r={radius} fill={color} opacity="0.4" />
                </pattern>
            );
        }
        return null;
    };

    const linkMarkerDefs = useMemo(() => {
        const map = new Map();
        const addMarker = (color, size) => {
            if (!color) return;
            const safeColor = color.replace(/[^a-zA-Z0-9]/g, '');
            const safeSize = Math.round(((size ?? 10) || 10) * 100);
            const key = `${safeColor}-${safeSize}`;
            if (map.has(key)) return;
            map.set(key, {
                id: key,
                color,
                size: size ?? 10
            });
        };

        addMarker(linkColor, arrowSize);
        (links || []).forEach((link) => {
            addMarker(link.color || linkColor, link.arrowSize ?? arrowSize);
        });
        (measurements || []).forEach((m) => {
            addMarker(m.color || '#000000', m.arrowSize ?? arrowSize);
        });
        (legend?.entries || []).forEach((entry) => {
            if (!entry || typeof entry !== 'object') return;
            if (entry.type !== 'arrow') return;
            addMarker(entry.color || '#000000', entry.arrowSize ?? arrowSize);
        });

        return Array.from(map.values());
    }, [links, measurements, legend, linkColor, arrowSize]);

    const legendBox = useMemo(() => {
        if (bounds?.legendBox) return bounds.legendBox;
        const size = estimateLegendSize(legend, { fontSize });
        if (size.width <= 0 || size.height <= 0) return null;
        const baseWidth = duration * timeScale + labelColumnWidth + DIAGRAM_PADDING;
        const pos = resolveLegendPosition(legend, size, { baseWidth });
        return { x: pos.x, y: pos.y, width: size.width, height: size.height, ...size };
    }, [bounds, legend, fontSize, duration, timeScale, labelColumnWidth]);

    const svgBounds = bounds && typeof bounds === 'object'
        ? bounds
        : { width, height, viewBoxX: -extraLeft, viewBoxY: 0, legendBox: null };
    const svgWidth = svgBounds.width ?? width;
    const svgHeight = svgBounds.height ?? height;
    const viewBoxX = svgBounds.viewBoxX ?? -extraLeft;
    const viewBoxY = svgBounds.viewBoxY ?? 0;

    return (
        <svg width={svgWidth} height={svgHeight} viewBox={`${viewBoxX} ${viewBoxY} ${svgWidth} ${svgHeight}`} style={{ background: '#fff' }}>
            {diagramName ? <title>{diagramName}</title> : null}
            <defs>
                {hatchPatterns.map(renderPattern)}
                {linkMarkerDefs.map((marker) => {
                    const arrowWidth = Math.max(2, marker.size);
                    const arrowHeight = Math.max(2, marker.size * 0.7);
                    const arrowRefX = arrowWidth * 0.9;
                    const arrowRefY = arrowHeight / 2;
                    const dotSize = Math.max(2, marker.size * 0.6);
                    const dotRadius = Math.max(0.5, marker.size * 0.25);
                    const dotRef = dotSize / 2;
                    return (
                        <React.Fragment key={marker.id}>
                            <marker id={`arrowhead-${marker.id}`} markerWidth={arrowWidth} markerHeight={arrowHeight} refX={arrowRefX} refY={arrowRefY} orient="auto">
                                <polygon points={`0 0, ${arrowWidth} ${arrowRefY}, 0 ${arrowHeight}`} fill={marker.color} />
                            </marker>
                            <marker id={`arrowhead-start-${marker.id}`} markerWidth={arrowWidth} markerHeight={arrowHeight} refX={arrowWidth * 0.1} refY={arrowRefY} orient="auto">
                                <polygon points={`${arrowWidth} 0, 0 ${arrowRefY}, ${arrowWidth} ${arrowHeight}`} fill={marker.color} />
                            </marker>
                            <marker id={`dot-${marker.id}`} markerWidth={dotSize} markerHeight={dotSize} refX={dotRef} refY={dotRef} orient="auto">
                                <circle cx={dotRef} cy={dotRef} r={dotRadius} fill={marker.color} />
                            </marker>
                        </React.Fragment>
                    );
                })}
            </defs>

            {signals.map((signal, index) => (
                signal.type === 'counter'
                    ? renderCounter(signal, index)
                    : renderOscillator(signal, index)
            ))}

            {renderLinkElements({
                links: orderedLinks,
                signals,
                spacing,
                timeScale,
                labelColumnWidth,
                selection,
                creationMode,
                canInteractWithElement,
                getCursorForElement,
                linkLineWidth,
                linkStartMarker,
                linkEndMarker,
                linkColor,
                arrowSize,
                defaultDash: defaultLinkDash,
                fontFamily,
                defaultLabelSize: fontSize,
                deleteLink,
                onElementClick,
                edgeTimeCtx
            })}

            {renderGuideElements({
                guides: orderedGuides,
                signals,
                spacing,
                duration,
                timeScale,
                labelColumnWidth,
                guideHeight,
                guideStyle,
                guideDashLength,
                guideDashGap,
                guideLineWidth,
                selection,
                creationMode,
                canInteractWithElement,
                getCursorForElement,
                deleteGuide,
                onElementClick
            })}

            {renderMeasurementElements({
                measurements: orderedMeasurements,
                guides: orderedGuides,
                signals,
                duration,
                timeScale,
                labelColumnWidth,
                selection,
                creationMode,
                canInteractWithElement,
                getCursorForElement,
                deleteMeasurement,
                onElementClick,
                fontFamily,
                defaultLabelSize: fontSize
            })}

            {legendBox && (legend?.entries || []).length ? (
                <g>
                    <rect
                        x={legendBox.x}
                        y={legendBox.y}
                        width={legendBox.width}
                        height={legendBox.height}
                        fill="#ffffff"
                        opacity={0.95}
                        stroke={legend?.layout?.border ? '#0f172a' : 'none'}
                        strokeWidth={legend?.layout?.border ? (legend?.layout?.borderWidth || 1) : 0}
                    />
                    {(legend?.entries || []).map((entry, idx) => {
                        if (!entry || typeof entry !== 'object') return null;
                        const rowY = legendBox.y + legendBox.padding + idx * (legendBox.rowHeight + legendBox.gap);
                        const midY = rowY + legendBox.rowHeight / 2;
                        const symbolX = legendBox.x + legendBox.padding;
                        const textX = symbolX + legendBox.symbolWidth + legendBox.labelGap;
                        const color = entry.color || '#000000';
                        const lineW = entry.lineWidth || 1.2;

                        const safeColor = color.replace(/[^a-zA-Z0-9]/g, '');
                        const markerSize = entry.arrowSize ?? arrowSize ?? 10;
                        const markerId = `${safeColor}-${Math.round(((markerSize ?? 10) || 10) * 100)}`;

                        return (
                            <g key={entry.id || `${idx}`}>
                                {entry.type === 'hatch' ? (
                                    (() => {
                                        const type = entry.hatchType || hatchType;
                                        const w = entry.patternWidth ?? zonePatternWidth ?? 1;
                                        const pid = `${type}-${safeColor}-${Math.round(((w ?? 1) || 1) * 100)}`;
                                        return (
                                            <rect
                                                x={symbolX}
                                                y={rowY + 2}
                                                width={legendBox.symbolWidth}
                                                height={legendBox.rowHeight - 4}
                                                fill={`url(#${pid})`}
                                                stroke={color}
                                                strokeWidth={Math.max(0.5, lineW)}
                                                opacity={0.9}
                                            />
                                        );
                                    })()
                                ) : (
                                    <line
                                        x1={symbolX}
                                        y1={midY}
                                        x2={symbolX + legendBox.symbolWidth}
                                        y2={midY}
                                        stroke={color}
                                        strokeWidth={lineW}
                                        markerEnd={entry.type === 'arrow' ? `url(#arrowhead-${markerId})` : 'none'}
                                    />
                                )}
                                <text
                                    x={textX}
                                    y={midY + (fontSize * 0.35)}
                                    fontSize={fontSize}
                                    fontFamily={fontFamily}
                                    fill="#0f172a"
                                >
                                    {entry.label || ''}
                                </text>
                            </g>
                        );
                    })}
                </g>
            ) : null}
        </svg>
    );
};

export default Diagram;
