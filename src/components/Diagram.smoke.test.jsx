// SPDX-License-Identifier: GPL-3.0-only

import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Diagram from './Diagram';

const noop = () => {};

const makeProps = (overrides = {}) => ({
    diagramName: 'Smoke Diagram',
    legend: {
        entries: [{ id: 'legend-1', type: 'line', label: 'Legend Line', color: '#000000', lineWidth: 1.2 }],
        layout: { x: null, y: null, padding: 8, gap: 6, border: true, borderWidth: 1, cornerRadius: 0 }
    },
    bounds: null,
    signals: [
        {
            id: 'osc-1',
            type: 'oscillator',
            name: 'CLK 1',
            period: 20,
            delay: 0,
            edgeCount: -1,
            inverted: false,
            color: '#000000'
        },
        {
            id: 'cnt-1',
            type: 'counter',
            name: 'CNT 1',
            startEdge: 1,
            endEdge: 3,
            color: '#000000',
            referenceOscId: 'osc-1',
            polarity: 'rising'
        }
    ],
    boldEdges: new Map(),
    toggleBoldEdge: noop,
    duration: 100,
    spacing: 50,
    guides: [{ id: 'guide-1', oscId: 'osc-1', edgeIndex: 2, style: 'dotted', lineWidth: 1, dashLength: 2, dashGap: 2 }],
    zones: [{
        id: 'zone-1',
        start: { oscId: 'osc-1', edgeIndex: 1 },
        end: { oscId: 'osc-1', edgeIndex: 3 },
        oscillatorId: 'osc-1',
        hatchType: 'hatch-45',
        color: '#000000',
        borderWidth: 0.8,
        patternWidth: 0.8
    }],
    links: [{
        id: 'link-1',
        start: { oscId: 'osc-1', edgeIndex: 1 },
        end: { counterId: 'cnt-1', edgeIndex: 1 },
        color: '#000000',
        style: 'dashed',
        lineWidth: 1.2,
        dashLength: 8,
        dashGap: 4,
        arrowSize: 10,
        startMarker: 'none',
        endMarker: 'arrow'
    }],
    layers: {
        guides: ['guide-1'],
        zones: ['zone-1'],
        links: ['link-1'],
        edgeArrows: ['arrow-1'],
        measurements: ['measurement-1']
    },
    measurements: [{
        id: 'measurement-1',
        start: { kind: 'edge', oscId: 'osc-1', edgeIndex: 0 },
        end: { kind: 'guide', guideId: 'guide-1' },
        color: '#000000',
        lineWidth: 1.2,
        arrowSize: 10,
        y: 20
    }],
    creationMode: null,
    timeScale: 1,
    lineWidth: 2,
    boldWeight: 3,
    fontSize: 12,
    fontFamily: 'Arial, sans-serif',
    boldLabels: false,
    labelX: 0,
    labelYOffset: 0,
    labelJustify: 'start',
    edgeArrows: [{ id: 'arrow-1', oscId: 'osc-1', edgeIndex: 1, type: 'filled', size: 10, ratio: 1.4, color: '#000000' }],
    edgeArrowType: 'filled',
    edgeArrowSize: 10,
    edgeArrowRatio: 1.4,
    edgeArrowColor: '#000000',
    deleteGuide: noop,
    deleteZone: noop,
    deleteLink: noop,
    deleteMeasurement: noop,
    linkLineWidth: 1.2,
    linkStyle: 'dashed',
    linkDashLength: 8,
    linkDashGap: 4,
    linkStartMarker: 'none',
    linkEndMarker: 'arrow',
    linkColor: '#000000',
    arrowSize: 10,
    guideLineWidth: 1,
    guideStyle: 'dotted',
    guideDashLength: 2,
    guideDashGap: 2,
    guideExtraHeight: 20,
    guideUseRelativeExtents: false,
    guideUpperExtension: 120,
    guideLowerExtension: 240,
    oscWaveHeight: 30,
    counterWaveHeight: 24,
    signalSpacingMode: 'pitch',
    zoneBorderWidth: 0.8,
    zonePatternWidth: 0.8,
    hatchType: 'hatch-45',
    zoneColor: '#000000',
    counterFontSize: 10,
    selection: null,
    clipboardType: null,
    onElementClick: noop,
    deleteEdgeArrow: noop,
    cursorFilter: null,
    ...overrides
});

describe('Diagram smoke', () => {
    it('renders core signal types and legend into static SVG markup', () => {
        const html = renderToStaticMarkup(<Diagram {...makeProps()} />);

        expect(html).toContain('<svg');
        expect(html).toContain('CLK 1');
        expect(html).toContain('CNT 1');
        expect(html).toContain('Legend Line');
    });

    it('renders under delete mode without throwing', () => {
        const html = renderToStaticMarkup(<Diagram {...makeProps({ creationMode: 'delete' })} />);

        expect(html).toContain('<title>Smoke Diagram</title>');
    });
});
