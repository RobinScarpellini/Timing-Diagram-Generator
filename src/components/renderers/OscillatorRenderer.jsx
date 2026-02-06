// SPDX-License-Identifier: GPL-3.0-only

import React from 'react';
import { CREATION_MODES } from '../../constants/modes';
import { getOscillatorLevelAt, getSafeOscillatorPeriod } from '../../diagram/geometry';
import { renderZonesForOscillator } from './ZoneRenderer';

export const renderOscillatorSignal = ({
    oscillator,
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
}) => {
    if (!row) return null;

    const yBase = row.bottom;
    const waveHeight = row.height;
    const halfPeriod = getSafeOscillatorPeriod(oscillator, duration) / 2;
    const delay = oscillator.delay || 0;
    const edgeLimit = oscillator.edgeCount ?? -1;
    const maxEdgeIndex = edgeLimit >= 0 ? edgeLimit - 1 : Infinity;
    const waveElements = [];
    const edgeElements = [];

    const startK = delay < 0 ? Math.ceil(-delay / halfPeriod) : 0;
    const endKByDuration = Math.floor((duration - delay) / halfPeriod);
    const endK = Math.min(endKByDuration, maxEdgeIndex);

    const tFirst = delay + startK * halfPeriod;
    const levelAtZero = getOscillatorLevelAt(oscillator, 0, duration);
    const yAtZero = levelAtZero === 1 ? yBase - waveHeight : yBase;
    const drawUntil = startK > endK ? duration : Math.min(tFirst, duration);
    if (drawUntil > 0) {
        const xEnd = Math.min(labelColumnWidth + drawUntil * timeScale, labelColumnWidth + duration * timeScale);
        waveElements.push(
            <line
                key={`${oscillator.id}-init`}
                x1={labelColumnWidth}
                y1={yAtZero}
                x2={xEnd}
                y2={yAtZero}
                stroke={oscillator.color || '#000'}
                strokeWidth={lineWidth}
                strokeLinecap="square"
                pointerEvents="none"
            />
        );
    }

    for (let k = startK; k <= endK; k++) {
        const tToken = delay + k * halfPeriod;
        if (tToken >= duration) break;
        if (tToken < 0) continue;

        const nextT = delay + (k + 1) * halfPeriod;
        const isLastEdgeByCount = edgeLimit >= 0 && k === maxEdgeIndex;
        const tEnd = Math.min(isLastEdgeByCount ? duration : nextT, duration);

        const baseLevel = (k % 2 === 0) ? 1 : 0;
        const level = oscillator.inverted ? (1 - baseLevel) : baseLevel;

        const y = level === 1 ? yBase - waveHeight : yBase;
        const xStart = labelColumnWidth + tToken * timeScale;
        const xEnd = labelColumnWidth + tEnd * timeScale;

        waveElements.push(
            <line
                key={`${oscillator.id}-h-${k}`}
                x1={xStart}
                y1={y}
                x2={xEnd}
                y2={y}
                stroke={oscillator.color || '#000'}
                strokeWidth={lineWidth}
                strokeLinecap="square"
                pointerEvents="none"
            />
        );

        const y1 = level === 1 ? yBase : yBase - waveHeight;
        const y2 = level === 1 ? yBase - waveHeight : yBase;

        const edgeId = `${oscillator.id}-v-${k}`;
        const boldEdge = boldEdges.get(edgeId);
        const isBold = Boolean(boldEdge);
        const edgeWeight = boldEdge?.weight ?? boldWeight;
        const isSelected = selection?.type === 'edge' && selection?.ids?.includes(edgeId);

        waveElements.push(
            <line
                key={`${oscillator.id}-v-${k}`}
                x1={xStart}
                y1={y1}
                x2={xStart}
                y2={y2}
                stroke={oscillator.color || '#000'}
                strokeWidth={isBold ? edgeWeight : lineWidth}
                pointerEvents="none"
            />
        );

        edgeElements.push(
            <line
                key={`hit-${edgeId}`}
                x1={xStart}
                y1={yBase}
                x2={xStart}
                y2={yBase - waveHeight}
                stroke="transparent"
                strokeWidth={14}
                pointerEvents={canInteractWithElement('edge') ? 'stroke' : 'none'}
                style={{ cursor: getCursorForEdge(isBold) }}
                onClick={(event) => {
                    event.stopPropagation();
                    if (cursorFilter || creationMode === null || creationMode === CREATION_MODES.COPY || creationMode === CREATION_MODES.PASTE) {
                        if (onElementClick && canSelectEdge(isBold)) {
                            onElementClick('edge', { id: edgeId, weight: edgeWeight }, { multi: event.shiftKey || event.ctrlKey || event.metaKey });
                        }
                    } else {
                        toggleBoldEdge(edgeId, { oscId: oscillator.id, edgeIndex: k, oscillatorId: oscillator.id, signalIndex: row.index });
                    }
                }}
            />
        );

        if (isSelected) {
            waveElements.push(
                <line
                    key={`sel-${edgeId}`}
                    x1={xStart}
                    y1={y1}
                    x2={xStart}
                    y2={y2}
                    stroke="#2563eb"
                    strokeWidth={(isBold ? edgeWeight : lineWidth) + 2}
                    opacity={0.6}
                    pointerEvents="none"
                />
            );
        }
    }

    const oscillatorArrows = edgeArrowsByOscillatorId.get(oscillator.id) || [];
    const arrowElements = oscillatorArrows.map((arrow) => {
        if (edgeLimit >= 0 && arrow.edgeIndex > maxEdgeIndex) return null;

        const tEdge = delay + arrow.edgeIndex * halfPeriod;
        if (tEdge < 0 || tEdge > duration) return null;

        const baseLevel = (arrow.edgeIndex % 2 === 0) ? 1 : 0;
        const level = oscillator.inverted ? (1 - baseLevel) : baseLevel;
        const direction = level === 1 ? -1 : 1;
        const size = Math.max(2, arrow.size ?? edgeArrowSize ?? 10);
        const ratioValue = arrow.ratio ?? edgeArrowRatio ?? 1;
        const ratio = Math.min(2, Math.max(0.5, ratioValue));
        const arrowLength = size * ratio;
        const arrowWidth = size;
        const halfLength = arrowLength / 2;
        const halfWidth = arrowWidth / 2;

        const x = labelColumnWidth + tEdge * timeScale;
        const yCenter = row.mid;
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
                    onClick={(event) => {
                        event.stopPropagation();
                        if (creationMode === CREATION_MODES.DELETE) {
                            deleteEdgeArrow(arrow.id);
                        } else if (onElementClick && arrow.id) {
                            onElementClick('edge-arrow', arrow, { multi: event.shiftKey || event.ctrlKey || event.metaKey });
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
                    const isCenter = pos === 'center';
                    const dy = pos === 'below' ? (sizeLabel + 6) : pos === 'above' ? -(sizeLabel + 6) : 0;
                    const textValue = String(label);
                    const padX = 6;
                    const padY = 3;
                    const labelW = textValue.length * sizeLabel * 0.62 + padX * 2;
                    const labelH = sizeLabel + padY * 2;
                    const textY = yCenter + dy;
                    return (
                        <g pointerEvents="none">
                            {isCenter && (
                                <rect
                                    x={x - labelW / 2}
                                    y={textY - sizeLabel * 0.82}
                                    width={labelW}
                                    height={labelH}
                                    fill="#ffffff"
                                    rx={3}
                                    ry={3}
                                />
                            )}
                            <text
                                x={x}
                                y={textY}
                                fontSize={sizeLabel}
                                fontFamily={fontFamily}
                                fill={arrowColor}
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

    const { visualElements: hatchVisualElements, hitElements: hatchHitElements } = renderZonesForOscillator({
        oscillator,
        row,
        zonesByOscillatorId,
        oscillatorsById,
        duration,
        timeScale,
        labelColumnWidth,
        selection,
        canInteractWithElement,
        getCursorForElement,
        creationMode,
        deleteZone,
        onElementClick,
        hatchType,
        zoneColor,
        zonePatternWidth,
        zoneBorderWidth
    });

    return (
        <g key={oscillator.id}>
            <text
                x={labelX}
                y={row.mid + labelYOffset}
                fontSize={fontSize}
                fontWeight={boldLabels ? 'bold' : 'normal'}
                fontFamily={fontFamily}
                fill="#000"
                textAnchor={labelJustify || 'start'}
                dominantBaseline="middle"
            >
                {oscillator.name}
            </text>
            {hatchVisualElements}
            {waveElements}
            {edgeElements}
            {hatchHitElements}
            {arrowElements}
        </g>
    );
};
