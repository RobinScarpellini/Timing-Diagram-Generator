// SPDX-License-Identifier: GPL-3.0-only

import React from 'react';
import { CREATION_MODES } from '../../constants/modes';
import { getSafeOscillatorPeriod } from '../../diagram/geometry';
import { makeSafeColorToken } from './utils';

export const renderZonesForOscillator = ({
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
}) => {
    const zones = zonesByOscillatorId.get(oscillator.id) || [];
    if (!zones.length) {
        return {
            visualElements: [],
            hitElements: []
        };
    }

    const visualElements = [];
    const hitElements = [];

    zones.forEach((zone) => {
        const startOscillator = oscillatorsById.get(zone?.start?.oscId);
        const endOscillator = oscillatorsById.get(zone?.end?.oscId);
        if (!startOscillator || !endOscillator) return;

        const startHalfPeriod = getSafeOscillatorPeriod(startOscillator, duration) / 2;
        const endHalfPeriod = getSafeOscillatorPeriod(endOscillator, duration) / 2;
        const tStart = (startOscillator.delay || 0) + zone.start.edgeIndex * startHalfPeriod;
        const tEnd = (endOscillator.delay || 0) + zone.end.edgeIndex * endHalfPeriod;

        const xMin = labelColumnWidth + Math.min(tStart, tEnd) * timeScale;
        const xMax = labelColumnWidth + Math.max(tStart, tEnd) * timeScale;
        const clipX1 = Math.max(labelColumnWidth, xMin);
        const clipX2 = Math.min(labelColumnWidth + duration * timeScale, xMax);
        if (clipX1 >= clipX2) return;

        const isSelected = selection?.type === 'zone' && selection?.ids?.includes(zone.id);
        const hatchColor = zone.color || zoneColor || '#000';
        const patternWidth = zone.patternWidth ?? zonePatternWidth ?? 1;
        const patternId = `${(zone.hatchType || hatchType)}-${makeSafeColorToken(hatchColor)}-${Math.round((patternWidth || 1) * 100)}`;
        const canInteract = canInteractWithElement('zone');

        visualElements.push(
            <g key={`zone-visual-${zone.id}`}>
                <rect
                    x={clipX1}
                    y={row.bottom - row.height}
                    width={clipX2 - clipX1}
                    height={row.height}
                    fill={`url(#${patternId})`}
                    stroke={zone.color || (zone.borderWidth > 0 ? '#000' : 'none')}
                    strokeWidth={zone.borderWidth !== undefined ? zone.borderWidth : zoneBorderWidth}
                    pointerEvents="none"
                />
                {isSelected && (
                    <rect
                        x={clipX1}
                        y={row.bottom - row.height}
                        width={clipX2 - clipX1}
                        height={row.height}
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth={2}
                        opacity={0.7}
                        pointerEvents="none"
                    />
                )}
            </g>
        );

        hitElements.push(
            <rect
                key={`zone-hit-${zone.id}`}
                x={clipX1}
                y={row.bottom - row.height}
                width={clipX2 - clipX1}
                height={row.height}
                fill="#ffffff"
                fillOpacity={0.001}
                stroke="none"
                style={{ cursor: getCursorForElement('zone') }}
                pointerEvents={canInteract ? 'all' : 'none'}
                onClick={(event) => {
                    event.stopPropagation();
                    if (creationMode === CREATION_MODES.DELETE) {
                        deleteZone(zone.id);
                    } else if (onElementClick && zone.id) {
                        onElementClick('zone', zone, { multi: event.shiftKey || event.ctrlKey || event.metaKey });
                    }
                }}
            />
        );
    });

    return {
        visualElements,
        hitElements
    };
};
