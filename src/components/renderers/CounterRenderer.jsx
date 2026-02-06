// SPDX-License-Identifier: GPL-3.0-only

import React from 'react';
import { CREATION_MODES } from '../../constants/modes';
import { getCounterEdgeTimes } from '../../diagram/geometry';

export const renderCounterSignal = ({
    counter,
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
}) => {
    if (!row || !oscillators?.length) return null;

    const yBase = row.bottom;
    const boxHeight = row.height;

    const allValidEdges = getCounterEdgeTimes(counter, { oscillators, duration });

    const startEdgeNum = counter.startEdge || 1;
    const endEdgeNum = counter.endEdge || 10;

    const segments = [];
    let currentCount = 0;
    let segmentStartT = 0;

    allValidEdges.forEach((edgeTime, index) => {
        const edgeNum = index + 1;
        let nextCount = currentCount;
        if (edgeNum >= startEdgeNum && edgeNum <= endEdgeNum) {
            nextCount += 1;
        }

        if (nextCount !== currentCount) {
            segments.push({ t1: segmentStartT, t2: edgeTime, val: currentCount });
            segmentStartT = edgeTime;
            currentCount = nextCount;
        }
    });

    segments.push({ t1: segmentStartT, t2: duration, val: currentCount });

    return (
        <g key={counter.id}>
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
                {counter.name}
            </text>

            {segments.map((segment, segmentIndex) => {
                const x1 = labelColumnWidth + segment.t1 * timeScale;
                const x2 = labelColumnWidth + segment.t2 * timeScale;
                if (x1 >= x2) return null;

                return (
                    <g key={segmentIndex}>
                        <line x1={x1} y1={yBase - boxHeight} x2={x2} y2={yBase - boxHeight} stroke={counter.color || '#000'} strokeWidth={lineWidth} />
                        <line x1={x1} y1={yBase} x2={x2} y2={yBase} stroke={counter.color || '#000'} strokeWidth={lineWidth} />
                        {segment.t1 > 0 && (
                            <line x1={x1} y1={yBase} x2={x1} y2={yBase - boxHeight} stroke={counter.color || '#000'} strokeWidth={lineWidth} />
                        )}
                        <text
                            x={(x1 + x2) / 2}
                            y={yBase - boxHeight / 2}
                            dy="0.35em"
                            textAnchor="middle"
                            fontSize={counterFontSize || fontSize * 0.9}
                            fontFamily={fontFamily}
                            fill={counter.color || '#000'}
                        >
                            {segment.val}
                        </text>
                    </g>
                );
            })}

            {allValidEdges.map((edgeTime, index) => {
                const x = labelColumnWidth + edgeTime * timeScale;
                const edgeId = `cnt-${counter.id}-e-${index + 1}`;
                const isBold = boldEdges.has(edgeId);
                const isSelected = selection?.type === 'edge' && selection?.ids?.includes(edgeId);

                return (
                    <g key={edgeId}>
                        <line
                            x1={x}
                            y1={yBase}
                            x2={x}
                            y2={yBase - boxHeight}
                            stroke="transparent"
                            strokeWidth={14}
                            pointerEvents={canInteractWithElement('edge') ? 'stroke' : 'none'}
                            style={{ cursor: getCursorForEdge(isBold) }}
                            onClick={(event) => {
                                event.stopPropagation();
                                if (cursorFilter || creationMode === null || creationMode === CREATION_MODES.COPY || creationMode === CREATION_MODES.PASTE) {
                                    if (onElementClick && canSelectEdge(isBold)) {
                                        onElementClick('edge', { id: edgeId, isBold }, { multi: event.shiftKey || event.ctrlKey || event.metaKey });
                                    }
                                } else {
                                    toggleBoldEdge(edgeId, { counterId: counter.id, edgeIndex: index + 1, signalIndex: row.index });
                                }
                            }}
                        />
                        {isSelected && (
                            <line
                                x1={x}
                                y1={yBase}
                                x2={x}
                                y2={yBase - boxHeight}
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
