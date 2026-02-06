// SPDX-License-Identifier: GPL-3.0-only

import React from 'react';
import { CREATION_MODES } from '../../constants/modes';
import { getSignalEdgeTime } from '../../diagram/geometry';
import { getDashPatternValue, makeSafeColorToken } from './utils';

export const renderLinkElements = ({
    links,
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
    defaultDash,
    linkStyle,
    fontFamily,
    defaultLabelSize,
    deleteLink,
    onElementClick,
    edgeTimeCtx
}) => {
    if (!links?.length) return null;

    return links.map((link) => {
        const sStart = signalsById.get(link?.start?.oscId || link?.start?.counterId);
        const sEnd = signalsById.get(link?.end?.oscId || link?.end?.counterId);
        if (!sStart || !sEnd) return null;

        const geoStart = signalLayoutById.get(sStart.id);
        const geoEnd = signalLayoutById.get(sEnd.id);
        if (!geoStart || !geoEnd) return null;

        const ySBase = geoStart.bottom;
        const yEBase = geoEnd.bottom;
        const startHeight = geoStart.height;
        const endHeight = geoEnd.height;

        const tStart = getSignalEdgeTime(sStart, link.start.edgeIndex, edgeTimeCtx);
        const tEnd = getSignalEdgeTime(sEnd, link.end.edgeIndex, edgeTimeCtx);
        const x1 = labelColumnWidth + tStart * timeScale;
        const x2 = labelColumnWidth + tEnd * timeScale;

        let yS;
        let yE;
        if (geoStart.index < geoEnd.index) {
            yS = ySBase;
            yE = yEBase - endHeight;
        } else {
            yS = ySBase - startHeight;
            yE = yEBase;
        }

        const isSelected = selection?.type === 'link' && selection?.ids?.includes(link.id);
        const dash = link.style
            ? getDashPatternValue(link.style, link.dashLength || 8, link.dashGap || 4)
            : defaultDash;
        const linkStrokeColor = link.color || linkColor;
        const markerSize = link.arrowSize ?? arrowSize ?? 10;
        const markerColorId = makeSafeColorToken(linkStrokeColor);
        const markerId = `${markerColorId}-${Math.round(markerSize * 100)}`;

        const cursor = getCursorForElement('link');

        return (
            <g key={link.id}>
                <line
                    x1={x1}
                    y1={yS}
                    x2={x2}
                    y2={yE}
                    stroke="transparent"
                    strokeWidth={12}
                    pointerEvents={canInteractWithElement('link') ? 'stroke' : 'none'}
                    style={{ cursor }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (creationMode === CREATION_MODES.DELETE) {
                            deleteLink(link.id);
                        } else if (onElementClick && link.id) {
                            onElementClick('link', link, { multi: e.shiftKey || e.ctrlKey || e.metaKey });
                        }
                    }}
                />
                <line x1={x1} y1={ySBase} x2={x1} y2={ySBase - startHeight} stroke={linkStrokeColor} strokeWidth={(link.lineWidth || linkLineWidth) * 0.5} strokeDasharray={dash} opacity="0.2" />
                <line x1={x2} y1={yEBase} x2={x2} y2={yEBase - endHeight} stroke={linkStrokeColor} strokeWidth={(link.lineWidth || linkLineWidth) * 0.5} strokeDasharray={dash} opacity="0.2" />
                <line
                    x1={x1}
                    y1={yS}
                    x2={x2}
                    y2={yE}
                    stroke={linkStrokeColor}
                    strokeWidth={link.lineWidth || linkLineWidth}
                    strokeDasharray={dash}
                    strokeLinecap={(link.style || linkStyle || 'solid') === 'dotted' ? 'round' : 'butt'}
                    markerStart={(link.startMarker || linkStartMarker) === 'arrow' ? `url(#arrowhead-start-${markerId})` : (link.startMarker || linkStartMarker) === 'dot' ? `url(#dot-${markerId})` : 'none'}
                    markerEnd={(link.endMarker || linkEndMarker) === 'arrow' ? `url(#arrowhead-${markerId})` : (link.endMarker || linkEndMarker) === 'dot' ? `url(#dot-${markerId})` : 'none'}
                />
                {isSelected && (
                    <line
                        x1={x1}
                        y1={yS}
                        x2={x2}
                        y2={yE}
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
                    const isCenter = pos === 'center';
                    const dy = pos === 'below' ? (size + 6) : pos === 'above' ? -6 : 0;
                    const textValue = String(label);
                    const padX = 6;
                    const padY = 3;
                    const labelW = textValue.length * size * 0.62 + padX * 2;
                    const labelH = size + padY * 2;
                    const textY = midY + dy;
                    return (
                        <g pointerEvents="none">
                            {isCenter && (
                                <rect
                                    x={midX - labelW / 2}
                                    y={textY - size * 0.82}
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
                                fontSize={size}
                                fontFamily={fontFamily}
                                fill={linkStrokeColor}
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
