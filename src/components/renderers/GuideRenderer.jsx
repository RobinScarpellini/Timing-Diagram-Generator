// SPDX-License-Identifier: GPL-3.0-only

import React from 'react';
import { CREATION_MODES } from '../../constants/modes';
import { getSafeOscillatorPeriod } from '../../diagram/geometry';
import { getDashPatternValue } from './utils';

export const renderGuideElements = ({
    guides,
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
}) => {
    if (!guides?.length) return null;

    return guides.map((guide) => {
        const oscillator = oscillatorsById.get(guide.oscId);
        if (!oscillator) return null;

        const row = signalLayoutById.get(guide.oscId);
        if (!row) return null;

        const edgeY = row.mid;
        const hasCustomExtents = Number.isFinite(guide.upperExtension) && Number.isFinite(guide.lowerExtension);
        const useGlobalExtents = !hasCustomExtents && guideUseRelativeExtents;
        const upper = hasCustomExtents
            ? guide.upperExtension
            : useGlobalExtents
                ? guideUpperExtension
                : null;
        const lower = hasCustomExtents
            ? guide.lowerExtension
            : useGlobalExtents
                ? guideLowerExtension
                : null;

        const yTop = Number.isFinite(upper) ? Math.max(0, edgeY - upper) : 0;
        const yBottom = Number.isFinite(lower) ? Math.min(guideHeight, edgeY + lower) : guideHeight;

        const period = getSafeOscillatorPeriod(oscillator, duration);
        const t = (oscillator.delay || 0) + guide.edgeIndex * (period / 2);
        if (t < 0 || t > duration) return null;

        const x = labelColumnWidth + t * timeScale;
        const lineStyle = guide.style || guideStyle;
        const dash = getDashPatternValue(lineStyle, guide.dashLength || guideDashLength, guide.dashGap || guideDashGap);
        const lineWidth = guide.lineWidth || guideLineWidth;
        const isSelected = selection?.type === 'guide' && selection?.ids?.includes(guide.id);
        const cursor = getCursorForElement('guide');

        return (
            <g key={guide.id}>
                <line
                    x1={x}
                    y1={yTop}
                    x2={x}
                    y2={yBottom}
                    stroke="transparent"
                    strokeWidth={12}
                    pointerEvents={canInteractWithElement('guide') ? 'stroke' : 'none'}
                    style={{ cursor }}
                    onClick={(event) => {
                        event.stopPropagation();
                        if (creationMode === CREATION_MODES.DELETE) {
                            deleteGuide(guide.id);
                        } else if (onElementClick && guide.id) {
                            onElementClick('guide', guide, { multi: event.shiftKey || event.ctrlKey || event.metaKey });
                        }
                    }}
                />
                <line
                    x1={x}
                    y1={yTop}
                    x2={x}
                    y2={yBottom}
                    stroke="#000"
                    strokeWidth={lineWidth}
                    strokeDasharray={dash}
                    strokeLinecap={lineStyle === 'dotted' ? 'round' : 'butt'}
                    opacity="0.6"
                    pointerEvents="none"
                />
                {isSelected && (
                    <line
                        x1={x}
                        y1={yTop}
                        x2={x}
                        y2={yBottom}
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
