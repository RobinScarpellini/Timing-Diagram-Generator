// SPDX-License-Identifier: GPL-3.0-only

import React from 'react';
import { makeSafeColorToken } from './utils';

export const renderLegend = ({
    legend,
    legendBox,
    fontSize,
    fontFamily,
    arrowSize,
    hatchType,
    zonePatternWidth
}) => {
    if (!legendBox || !(legend?.entries || []).length) return null;

    return (
        <g>
            <rect
                x={legendBox.x}
                y={legendBox.y}
                width={legendBox.width}
                height={legendBox.height}
                rx={Math.max(0, legend?.layout?.cornerRadius || 0)}
                ry={Math.max(0, legend?.layout?.cornerRadius || 0)}
                fill="#ffffff"
                opacity={0.95}
                stroke={legend?.layout?.border ? '#0f172a' : 'none'}
                strokeWidth={legend?.layout?.border ? (legend?.layout?.borderWidth || 1) : 0}
            />
            {(legend?.entries || []).map((entry, index) => {
                if (!entry || typeof entry !== 'object') return null;

                const rowY = legendBox.y + legendBox.padding + index * (legendBox.rowHeight + legendBox.gap);
                const midY = rowY + legendBox.rowHeight / 2;
                const symbolX = legendBox.x + legendBox.padding;
                const textX = symbolX + legendBox.symbolWidth + legendBox.labelGap;
                const color = entry.color || '#000000';
                const lineW = entry.lineWidth || 1.2;

                const safeColor = makeSafeColorToken(color);
                const markerSize = entry.arrowSize ?? arrowSize ?? 10;
                const markerId = `${safeColor}-${Math.round(((markerSize ?? 10) || 10) * 100)}`;

                return (
                    <g key={entry.id || `${index}`}>
                        {entry.type === 'hatch' ? (
                            (() => {
                                const type = entry.hatchType || hatchType;
                                const width = entry.patternWidth ?? zonePatternWidth ?? 1;
                                const patternId = `${type}-${safeColor}-${Math.round(((width ?? 1) || 1) * 100)}`;
                                return (
                                    <rect
                                        x={symbolX}
                                        y={rowY + 2}
                                        width={legendBox.symbolWidth}
                                        height={legendBox.rowHeight - 4}
                                        fill={`url(#${patternId})`}
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
    );
};
