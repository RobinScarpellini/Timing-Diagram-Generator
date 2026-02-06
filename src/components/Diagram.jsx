// SPDX-License-Identifier: GPL-3.0-only

import React, { useMemo } from 'react';
import {
    DIAGRAM_LABEL_COLUMN_WIDTH,
    DIAGRAM_MIN_HEIGHT,
    DIAGRAM_PADDING
} from '../constants/layout';
import { CREATION_MODES, isEdgeToolMode, isMeasureMode } from '../constants/modes';
import { SIGNAL_TYPES } from '../constants/signal';
import { getSafeOscillatorPeriod } from '../diagram/geometry';
import { estimateLegendSize, resolveLegendPosition } from '../diagram/legend';
import { computeDiagramHeightFromLayout, computeSignalLayout, makeSignalLayoutMap } from '../diagram/signalLayout';
import { renderCounterSignal } from './renderers/CounterRenderer';
import { renderGuideElements } from './renderers/GuideRenderer';
import { renderLegend } from './renderers/LegendRenderer';
import { renderLinkElements } from './renderers/LinkRenderer';
import { renderOscillatorSignal } from './renderers/OscillatorRenderer';
import { getDashPatternValue, makeSafeColorToken } from './renderers/utils';
import { profileMeasure } from '../perf/profile';

const renderMeasurementElements = ({
    measurements,
    guidesById,
    oscillatorsById,
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
        const oscillator = oscillatorsById.get(oscId);
        if (!oscillator) return null;
        const t = (oscillator.delay || 0) + edgeIndex * (getSafeOscillatorPeriod(oscillator, duration) / 2);
        if (t < 0 || t > duration) return null;
        return t;
    };

    const resolveEndpointTime = (endpoint) => {
        if (!endpoint || typeof endpoint !== 'object') return null;
        if (endpoint.kind === 'guide') {
            const guide = guidesById.get(endpoint.guideId);
            if (!guide) return null;
            return resolveEdgeTime(guide.oscId, guide.edgeIndex);
        }
        if (endpoint.kind === 'edge') {
            return resolveEdgeTime(endpoint.oscId, endpoint.edgeIndex);
        }
        return null;
    };

    return measurements.map((measurement, index) => {
        const t1 = resolveEndpointTime(measurement.start);
        const t2 = resolveEndpointTime(measurement.end);
        if (t1 === null || t2 === null) return null;

        const x1 = labelColumnWidth + t1 * timeScale;
        const x2 = labelColumnWidth + t2 * timeScale;
        const xMin = Math.min(x1, x2);
        const xMax = Math.max(x1, x2);

        const yFallback = 24 + index * 14;
        const y = Number.isFinite(measurement.y) ? measurement.y : yFallback;
        const color = measurement.color || '#000000';
        const width = measurement.lineWidth || 1.2;
        const size = measurement.arrowSize ?? 10;
        const safeColor = makeSafeColorToken(color);
        const markerId = `${safeColor}-${Math.round(((size ?? 10) || 10) * 100)}`;

        const isSelected = selection?.type === 'measurement' && selection?.ids?.includes(measurement.id);
        const cursor = getCursorForElement('measurement');

        return (
            <g key={measurement.id}>
                <line
                    x1={xMin}
                    y1={y}
                    x2={xMax}
                    y2={y}
                    stroke="transparent"
                    strokeWidth={12}
                    pointerEvents={canInteractWithElement('measurement') ? 'stroke' : 'none'}
                    style={{ cursor }}
                    onClick={(event) => {
                        event.stopPropagation();
                        if (creationMode === CREATION_MODES.DELETE) {
                            deleteMeasurement(measurement.id);
                        } else if (onElementClick && measurement.id) {
                            onElementClick('measurement', measurement, { multi: event.shiftKey || event.ctrlKey || event.metaKey });
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
                    const label = measurement.arrowLabel?.text;
                    if (!label || !String(label).trim().length) return null;
                    const sizeLabel = Math.max(6, measurement.arrowLabel?.size ?? defaultLabelSize ?? 10);
                    const pos = measurement.arrowLabel?.position || 'top';
                    const isCenter = pos === 'center';
                    const dy = pos === 'bottom' ? (sizeLabel + 6) : pos === 'top' ? -6 : 0;
                    const midX = (xMin + xMax) / 2;
                    const textValue = String(label);
                    const padX = 6;
                    const padY = 3;
                    const labelW = textValue.length * sizeLabel * 0.62 + padX * 2;
                    const labelH = sizeLabel + padY * 2;
                    const textY = y + dy;
                    return (
                        <g pointerEvents="none">
                            {isCenter && (
                                <rect
                                    x={midX - labelW / 2}
                                    y={textY - sizeLabel * 0.82}
                                    width={labelW}
                                    height={labelH}
                                    fill="#ffffff"
                                    rx={3}
                                    ry={3}
                                />
                            )}
                            <text
                                x={midX}
                                y={textY}
                                fontSize={sizeLabel}
                                fontFamily={fontFamily}
                                fill={color}
                                textAnchor="middle"
                            >
                                {textValue}
                            </text>
                        </g>
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
    signals = [],
    boldEdges,
    toggleBoldEdge,
    duration,
    spacing,
    guides,
    zones,
    links,
    layers,
    measurements,
    creationMode,
    timeScale,
    lineWidth,
    boldWeight,
    fontSize,
    fontFamily,
    boldLabels,
    labelX,
    labelYOffset,
    labelJustify,
    edgeArrows,
    edgeArrowType,
    edgeArrowSize,
    edgeArrowRatio,
    edgeArrowColor,
    deleteGuide,
    deleteZone,
    deleteLink,
    deleteMeasurement,
    linkLineWidth,
    linkStyle,
    linkDashLength,
    linkDashGap,
    linkStartMarker,
    linkEndMarker,
    linkColor,
    arrowSize,
    guideLineWidth,
    guideStyle,
    guideDashLength,
    guideDashGap,
    guideExtraHeight,
    guideUseRelativeExtents,
    guideUpperExtension,
    guideLowerExtension,
    oscWaveHeight,
    counterWaveHeight,
    signalSpacingMode,
    zoneBorderWidth,
    zonePatternWidth,
    hatchType,
    zoneColor,
    counterFontSize,
    selection,
    clipboardType,
    onElementClick,
    deleteEdgeArrow,
    cursorFilter
}) => {
    const layerOrder = layers && typeof layers === 'object' ? layers : null;

    const orderByLayer = (items, orderIds) => {
        if (!Array.isArray(items) || !items.length) return [];
        if (!Array.isArray(orderIds) || !orderIds.length) return items;
        const map = new Map(items.map((item) => [item.id, item]));
        const fromOrder = orderIds.map((id) => map.get(id)).filter(Boolean);
        const remaining = items.filter((item) => !orderIds.includes(item.id));
        return [...fromOrder, ...remaining];
    };

    const orderedGuides = useMemo(
        () => profileMeasure('diagram.order.guides', () => orderByLayer(guides || [], layerOrder?.guides)),
        [guides, layerOrder]
    );
    const orderedZones = useMemo(
        () => profileMeasure('diagram.order.zones', () => orderByLayer(zones || [], layerOrder?.zones)),
        [zones, layerOrder]
    );
    const orderedLinks = useMemo(
        () => profileMeasure('diagram.order.links', () => orderByLayer(links || [], layerOrder?.links)),
        [links, layerOrder]
    );
    const orderedEdgeArrows = useMemo(
        () => profileMeasure('diagram.order.edgeArrows', () => orderByLayer(edgeArrows || [], layerOrder?.edgeArrows)),
        [edgeArrows, layerOrder]
    );
    const orderedMeasurements = useMemo(
        () => profileMeasure('diagram.order.measurements', () => orderByLayer(measurements || [], layerOrder?.measurements)),
        [measurements, layerOrder]
    );

    const effectiveSettings = useMemo(() => ({
        spacing,
        signalSpacingMode,
        oscWaveHeight,
        counterWaveHeight
    }), [spacing, signalSpacingMode, oscWaveHeight, counterWaveHeight]);

    const signalRows = useMemo(
        () => profileMeasure('diagram.layout.rows', () => computeSignalLayout(signals, effectiveSettings)),
        [signals, effectiveSettings]
    );
    const signalLayoutById = useMemo(
        () => profileMeasure('diagram.layout.map', () => makeSignalLayoutMap(signalRows)),
        [signalRows]
    );

    const signalsById = useMemo(
        () => profileMeasure('diagram.lookup.signals', () => new Map(signals.map((signal) => [signal.id, signal]))),
        [signals]
    );
    const oscillators = useMemo(
        () => profileMeasure('diagram.lookup.oscillators.list', () => signals.filter((signal) => signal.type === SIGNAL_TYPES.OSCILLATOR)),
        [signals]
    );
    const oscillatorsById = useMemo(
        () => profileMeasure('diagram.lookup.oscillators.map', () => new Map(oscillators.map((oscillator) => [oscillator.id, oscillator]))),
        [oscillators]
    );
    const guidesById = useMemo(
        () => profileMeasure('diagram.lookup.guides', () => new Map(orderedGuides.map((guide) => [guide.id, guide]))),
        [orderedGuides]
    );

    const zonesByOscillatorId = useMemo(
        () => profileMeasure('diagram.lookup.zonesByOsc', () => {
            const map = new Map();
            orderedZones.forEach((zone) => {
                const key = zone.oscillatorId;
                if (!key) return;
                if (!map.has(key)) map.set(key, []);
                map.get(key).push(zone);
            });
            return map;
        }),
        [orderedZones]
    );

    const edgeArrowsByOscillatorId = useMemo(
        () => profileMeasure('diagram.lookup.edgeArrowsByOsc', () => {
            const map = new Map();
            orderedEdgeArrows.forEach((arrow) => {
                const key = arrow.oscId;
                if (!key) return;
                if (!map.has(key)) map.set(key, []);
                map.get(key).push(arrow);
            });
            return map;
        }),
        [orderedEdgeArrows]
    );

    const labelColumnWidth = DIAGRAM_LABEL_COLUMN_WIDTH;
    const extraLeft = Math.max(0, -(labelX || 0));
    const width = duration * timeScale + labelColumnWidth + DIAGRAM_PADDING + extraLeft;

    const baseHeight = Math.max(DIAGRAM_MIN_HEIGHT, computeDiagramHeightFromLayout(signalRows));
    const height = baseHeight;
    const guideHeight = Math.max(0, height + (guideExtraHeight || 0));

    const isDefaultMode = creationMode === null;
    const isCopyMode = creationMode === CREATION_MODES.COPY;
    const isPasteMode = creationMode === CREATION_MODES.PASTE;
    const isDeleteMode = creationMode === CREATION_MODES.DELETE;
    const isMeasureToolMode = isMeasureMode(creationMode);
    const isEdgeMode = isEdgeToolMode(creationMode);

    const getCursorForElement = (type) => {
        if (cursorFilter) return type === cursorFilter ? 'pointer' : 'default';
        if (isDeleteMode && (type === 'guide' || type === 'zone' || type === 'link' || type === 'edge-arrow' || type === 'measurement')) return 'pointer';
        if (isMeasureToolMode) return (type === 'guide' || type === 'edge') ? 'pointer' : 'default';
        if (isEdgeMode) return type === 'edge' ? 'pointer' : 'default';
        if (isCopyMode) return 'pointer';
        if (isPasteMode) return clipboardType === type ? 'pointer' : 'default';
        if (isDefaultMode) return 'pointer';
        return 'default';
    };

    const getCursorForEdge = (isBold) => {
        if (cursorFilter) return cursorFilter === 'edge' ? 'pointer' : 'default';
        if (isMeasureToolMode) return 'pointer';
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
            if (isMeasureToolMode) return true;
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
        if (isMeasureToolMode) return type === 'guide';
        if (isDeleteMode) return type === 'guide' || type === 'zone' || type === 'link' || type === 'edge-arrow' || type === 'measurement';
        if (isEdgeMode) return false;
        if (isCopyMode) return type === 'guide' || type === 'zone' || type === 'link';
        if (isPasteMode) return clipboardType === type;
        if (isDefaultMode) return type === 'guide' || type === 'zone' || type === 'link' || type === 'measurement';
        return false;
    };

    const edgeTimeCtx = useMemo(() => ({ oscillators, duration }), [oscillators, duration]);

    const hatchPatterns = useMemo(() => {
        const map = new Map();

        orderedZones.forEach((zone) => {
            const type = zone.hatchType || hatchType;
            const color = zone.color || zoneColor || '#000';
            const widthValue = zone.patternWidth ?? zonePatternWidth ?? 1;
            const key = `${type}|${color}|${widthValue}`;
            if (map.has(key)) return;
            map.set(key, {
                id: `${type}-${makeSafeColorToken(color)}-${Math.round((widthValue || 1) * 100)}`,
                type,
                color,
                lineWidth: widthValue
            });
        });

        (legend?.entries || []).forEach((entry) => {
            if (!entry || typeof entry !== 'object') return;
            if (entry.type !== 'hatch') return;
            const type = entry.hatchType || hatchType;
            const color = entry.color || zoneColor || '#000';
            const widthValue = entry.patternWidth ?? zonePatternWidth ?? 1;
            const key = `${type}|${color}|${widthValue}`;
            if (map.has(key)) return;
            map.set(key, {
                id: `${type}-${makeSafeColorToken(color)}-${Math.round((widthValue || 1) * 100)}`,
                type,
                color,
                lineWidth: widthValue
            });
        });

        return Array.from(map.values());
    }, [orderedZones, legend, hatchType, zoneColor, zonePatternWidth]);

    const defaultLinkDash = useMemo(
        () => getDashPatternValue(linkStyle, linkDashLength, linkDashGap),
        [linkStyle, linkDashLength, linkDashGap]
    );

    const renderPattern = ({ id, type, color, lineWidth: patternLineWidth }) => {
        const strokeWidth = Math.max(0.1, patternLineWidth || 1);
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
            const safeColor = makeSafeColorToken(color);
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
        orderedLinks.forEach((link) => {
            addMarker(link.color || linkColor, link.arrowSize ?? arrowSize);
        });
        orderedMeasurements.forEach((measurement) => {
            addMarker(measurement.color || '#000000', measurement.arrowSize ?? arrowSize);
        });
        (legend?.entries || []).forEach((entry) => {
            if (!entry || typeof entry !== 'object') return;
            if (entry.type !== 'arrow') return;
            addMarker(entry.color || '#000000', entry.arrowSize ?? arrowSize);
        });

        return Array.from(map.values());
    }, [orderedLinks, orderedMeasurements, legend, linkColor, arrowSize]);

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

            {signals.map((signal) => {
                const row = signalLayoutById.get(signal.id);
                if (signal.type === SIGNAL_TYPES.COUNTER) {
                    return renderCounterSignal({
                        counter: signal,
                        row,
                        oscillators,
                        duration,
                        timeScale,
                        labelColumnWidth,
                        lineWidth,
                        boldEdges,
                        selection,
                        creationMode,
                        cursorFilter,
                        canInteractWithElement,
                        getCursorForEdge,
                        canSelectEdge,
                        toggleBoldEdge,
                        onElementClick,
                        fontSize,
                        fontFamily,
                        boldLabels,
                        labelX,
                        labelYOffset,
                        labelJustify,
                        counterFontSize
                    });
                }

                return renderOscillatorSignal({
                    oscillator: signal,
                    row,
                    duration,
                    timeScale,
                    labelColumnWidth,
                    lineWidth,
                    boldWeight,
                    boldEdges,
                    selection,
                    creationMode,
                    cursorFilter,
                    canInteractWithElement,
                    getCursorForEdge,
                    canSelectEdge,
                    toggleBoldEdge,
                    onElementClick,
                    fontFamily,
                    fontSize,
                    boldLabels,
                    labelX,
                    labelYOffset,
                    labelJustify,
                    edgeArrowsByOscillatorId,
                    edgeArrowType,
                    edgeArrowSize,
                    edgeArrowRatio,
                    edgeArrowColor,
                    deleteEdgeArrow,
                    zonesByOscillatorId,
                    oscillatorsById,
                    deleteZone,
                    getCursorForElement,
                    hatchType,
                    zoneColor,
                    zonePatternWidth,
                    zoneBorderWidth
                });
            })}

            {renderLinkElements({
                links: orderedLinks,
                signalsById,
                signalLayoutById,
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
                linkStyle,
                fontFamily,
                defaultLabelSize: fontSize,
                deleteLink,
                onElementClick,
                edgeTimeCtx
            })}

            {renderGuideElements({
                guides: orderedGuides,
                oscillatorsById,
                signalLayoutById,
                duration,
                timeScale,
                labelColumnWidth,
                guideHeight,
                guideStyle,
                guideDashLength,
                guideDashGap,
                guideLineWidth,
                guideUseRelativeExtents,
                guideUpperExtension,
                guideLowerExtension,
                selection,
                creationMode,
                canInteractWithElement,
                getCursorForElement,
                deleteGuide,
                onElementClick
            })}

            {renderMeasurementElements({
                measurements: orderedMeasurements,
                guidesById,
                oscillatorsById,
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

            {renderLegend({
                legend,
                legendBox,
                fontSize,
                fontFamily,
                arrowSize,
                hatchType,
                zonePatternWidth
            })}
        </svg>
    );
};

export default Diagram;
