import React from 'react';
import { NumberField, SelectField, TextField } from '../InputFields';
import { ColorPicker } from '../ColorPicker';
import { ArrowEditor, GuideEditor, LinkEditor, ZoneEditor } from './SharedEditors';

const RightSidebarSelectionPanel = ({
    selection,
    settings,
    selectedGuide,
    selectedZone,
    selectedLink,
    selectedEdge,
    selectedArrow,
    selectedMeasurement,
    selectedGuides,
    selectedZones,
    selectedLinks,
    selectedEdges,
    selectedArrows,
    selectedMeasurements,
    getMixed,
    makeScroll,
    renderLayerControls,
    applyGuidePatch,
    applyZonePatch,
    applyLinkPatch,
    applyEdgePatch,
    applyArrowPatch,
    applyMeasurementPatch
}) => {
    if (selection.type === 'guide' && selectedGuide) {
        const guideStyleState = getMixed(selectedGuides, (g) => g.style ?? settings.guideStyle);
        const guideLineWidthState = getMixed(selectedGuides, (g) => g.lineWidth ?? settings.guideLineWidth);
        const guideDashLengthState = getMixed(selectedGuides, (g) => g.dashLength ?? settings.guideDashLength);
        const guideDashGapState = getMixed(selectedGuides, (g) => g.dashGap ?? settings.guideDashGap);
        const guideExtEnabledState = getMixed(selectedGuides, (g) => (
            Number.isFinite(g.upperExtension) && Number.isFinite(g.lowerExtension)
        ));
        const guideUpperExtState = getMixed(selectedGuides, (g) => (
            Number.isFinite(g.upperExtension) ? g.upperExtension : 120
        ));
        const guideLowerExtState = getMixed(selectedGuides, (g) => (
            Number.isFinite(g.lowerExtension) ? g.lowerExtension : 240
        ));
        const isUniformized = settings.uniformizeGuide;

        return (
            <>
                <div style={isUniformized ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
                    <GuideEditor
                        makeScroll={makeScroll}
                        guideStyleState={guideStyleState}
                        guideLineWidthState={guideLineWidthState}
                        guideDashLengthState={guideDashLengthState}
                        guideDashGapState={guideDashGapState}
                        guideExtEnabledState={guideExtEnabledState}
                        guideUpperExtState={guideUpperExtState}
                        guideLowerExtState={guideLowerExtState}
                        onGuideStyleChange={(value) => applyGuidePatch({ style: value })}
                        onGuideLineWidthChange={(value) => applyGuidePatch({ lineWidth: value })}
                        onGuideDashLengthChange={(value) => applyGuidePatch({ dashLength: value })}
                        onGuideDashGapChange={(value) => applyGuidePatch({ dashGap: value })}
                        onGuideExtEnabledChange={(enabled) => {
                            if (enabled) {
                                applyGuidePatch({ upperExtension: guideUpperExtState.value, lowerExtension: guideLowerExtState.value });
                            } else {
                                applyGuidePatch({ upperExtension: null, lowerExtension: null });
                            }
                        }}
                        onGuideUpperExtChange={(value) => applyGuidePatch({ upperExtension: value })}
                        onGuideLowerExtChange={(value) => applyGuidePatch({ lowerExtension: value })}
                    />
                </div>
                {renderLayerControls('guide')}
            </>
        );
    }

    if (selection.type === 'measurement' && selectedMeasurement) {
        const lineWidthState = getMixed(selectedMeasurements, (m) => m.lineWidth ?? 1.2);
        const colorState = getMixed(selectedMeasurements, (m) => m.color ?? '#000000');
        const arrowSizeState = getMixed(selectedMeasurements, (m) => m.arrowSize ?? settings.arrowSize);
        const labelTextState = getMixed(selectedMeasurements, (m) => m.arrowLabel?.text ?? '');
        const labelSizeState = getMixed(selectedMeasurements, (m) => m.arrowLabel?.size ?? settings.fontSize);
        const labelPosState = getMixed(selectedMeasurements, (m) => m.arrowLabel?.position ?? 'top');

        return (
            <>
                <div>
                    <div className="grid-2">
                        <NumberField
                            label="Line Width"
                            value={lineWidthState.value}
                            step={0.1}
                            className={lineWidthState.mixed ? 'input-mixed' : ''}
                            onScroll={makeScroll(lineWidthState.value, 0.1, false, (next) => applyMeasurementPatch({ lineWidth: next }))}
                            onChange={(e) => {
                                const v = Math.max(0.1, parseFloat(e.target.value) || 0.1);
                                applyMeasurementPatch({ lineWidth: v });
                            }}
                        />
                        <NumberField
                            label="Arrow Size"
                            value={arrowSizeState.value}
                            step={0.5}
                            className={arrowSizeState.mixed ? 'input-mixed' : ''}
                            onScroll={makeScroll(arrowSizeState.value, 0.5, false, (next) => applyMeasurementPatch({ arrowSize: next }))}
                            onChange={(e) => {
                                const v = Math.max(1, parseFloat(e.target.value) || 1);
                                applyMeasurementPatch({ arrowSize: v });
                            }}
                        />
                    </div>
                    <ColorPicker
                        label="Color"
                        color={colorState.value}
                        className={colorState.mixed ? 'input-mixed' : ''}
                        onChange={(c) => applyMeasurementPatch({ color: c })}
                        variant="compact"
                    />
                    <div className="settings-separator" />
                    <div className="tool-settings-block" style={{ marginTop: '12px' }}>
                        <TextField
                            label="Label"
                            value={labelTextState.value}
                            className={labelTextState.mixed ? 'input-mixed' : ''}
                            placeholder="(none)"
                            onChange={(e) => {
                                const text = e.target.value;
                                const next = text.trim().length
                                    ? { text, size: labelSizeState.value || settings.fontSize, position: labelPosState.value || 'top' }
                                    : null;
                                applyMeasurementPatch({ arrowLabel: next });
                            }}
                        />
                        <div className="grid-2">
                            <NumberField
                                label="Label Size"
                                value={labelSizeState.value}
                                step={1}
                                disabled={!String(labelTextState.value || '').trim().length}
                                className={labelSizeState.mixed ? 'input-mixed' : ''}
                                onScroll={makeScroll(labelSizeState.value, 1, false, (next) => applyMeasurementPatch({ arrowLabel: { text: labelTextState.value, size: next, position: labelPosState.value } }))}
                                onChange={(e) => {
                                    const v = Math.max(1, parseFloat(e.target.value) || 1);
                                    applyMeasurementPatch({ arrowLabel: { text: labelTextState.value, size: v, position: labelPosState.value } });
                                }}
                            />
                            <SelectField
                                label="Label Pos"
                                value={labelPosState.value}
                                className={labelPosState.mixed ? 'input-mixed' : ''}
                                onChange={(e) => applyMeasurementPatch({ arrowLabel: { text: labelTextState.value, size: labelSizeState.value, position: e.target.value } })}
                                options={[
                                    { value: 'top', label: 'Top' },
                                    { value: 'bottom', label: 'Bottom' }
                                ]}
                            />
                        </div>
                    </div>
                    <div className="settings-separator" />
                </div>
                {renderLayerControls('measurement')}
            </>
        );
    }

    if (selection.type === 'link' && selectedLink) {
        const linkStyleState = getMixed(selectedLinks, (l) => l.style ?? settings.linkStyle);
        const linkLineWidthState = getMixed(selectedLinks, (l) => l.lineWidth ?? settings.linkLineWidth);
        const linkDashLengthState = getMixed(selectedLinks, (l) => l.dashLength ?? settings.linkDashLength);
        const linkDashGapState = getMixed(selectedLinks, (l) => l.dashGap ?? settings.linkDashGap);
        const linkStartMarkerState = getMixed(selectedLinks, (l) => l.startMarker ?? settings.linkStartMarker);
        const linkEndMarkerState = getMixed(selectedLinks, (l) => l.endMarker ?? settings.linkEndMarker);
        const linkColorState = getMixed(selectedLinks, (l) => l.color ?? settings.linkColor);
        const linkArrowSizeState = getMixed(selectedLinks, (l) => l.arrowSize ?? settings.arrowSize);
        const linkLabelTextState = getMixed(selectedLinks, (l) => l.arrowLabel?.text ?? '');
        const linkLabelSizeState = getMixed(selectedLinks, (l) => l.arrowLabel?.size ?? settings.fontSize);
        const linkLabelPosState = getMixed(selectedLinks, (l) => l.arrowLabel?.position ?? 'above');
        const isUniformized = settings.uniformizeLink;

        return (
            <>
                <div style={isUniformized ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
                    <LinkEditor
                        makeScroll={makeScroll}
                        linkStyleState={linkStyleState}
                        linkLineWidthState={linkLineWidthState}
                        linkDashLengthState={linkDashLengthState}
                        linkDashGapState={linkDashGapState}
                        linkStartMarkerState={linkStartMarkerState}
                        linkEndMarkerState={linkEndMarkerState}
                        linkArrowSizeState={linkArrowSizeState}
                        linkColorState={linkColorState}
                        labelTextState={linkLabelTextState}
                        labelSizeState={linkLabelSizeState}
                        labelPosState={linkLabelPosState}
                        onLinkStyleChange={(value) => applyLinkPatch({ style: value })}
                        onLinkLineWidthChange={(value) => applyLinkPatch({ lineWidth: value })}
                        onLinkDashLengthChange={(value) => applyLinkPatch({ dashLength: value })}
                        onLinkDashGapChange={(value) => applyLinkPatch({ dashGap: value })}
                        onLinkStartMarkerChange={(value) => applyLinkPatch({ startMarker: value })}
                        onLinkEndMarkerChange={(value) => applyLinkPatch({ endMarker: value })}
                        onLinkArrowSizeChange={(value) => applyLinkPatch({ arrowSize: value })}
                        onLinkColorChange={(value) => applyLinkPatch({ color: value })}
                        onLabelTextChange={(text) => {
                            const next = text.trim().length
                                ? { text, size: linkLabelSizeState.value || settings.fontSize, position: linkLabelPosState.value || 'above' }
                                : null;
                            applyLinkPatch({ arrowLabel: next });
                        }}
                        onLabelSizeChange={(value) => applyLinkPatch({
                            arrowLabel: { text: linkLabelTextState.value, size: value, position: linkLabelPosState.value }
                        })}
                        onLabelPosChange={(value) => applyLinkPatch({
                            arrowLabel: { text: linkLabelTextState.value, size: linkLabelSizeState.value, position: value }
                        })}
                    />
                </div>
                {renderLayerControls('link')}
            </>
        );
    }

    if (selection.type === 'zone' && selectedZone) {
        const zoneHatchTypeState = getMixed(selectedZones, (z) => z.hatchType ?? settings.hatchType);
        const zoneBorderWidthState = getMixed(selectedZones, (z) => z.borderWidth ?? settings.zoneBorderWidth);
        const zonePatternWidthState = getMixed(selectedZones, (z) => z.patternWidth ?? settings.zonePatternWidth);
        const zoneColorState = getMixed(selectedZones, (z) => z.color ?? settings.zoneColor);
        const isUniformized = settings.uniformizeZone;

        return (
            <>
                <div style={isUniformized ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
                    <ZoneEditor
                        makeScroll={makeScroll}
                        zoneHatchTypeState={zoneHatchTypeState}
                        zoneBorderWidthState={zoneBorderWidthState}
                        zonePatternWidthState={zonePatternWidthState}
                        zoneColorState={zoneColorState}
                        onZoneHatchTypeChange={(value) => applyZonePatch({ hatchType: value })}
                        onZoneBorderWidthChange={(value) => applyZonePatch({ borderWidth: value })}
                        onZonePatternWidthChange={(value) => applyZonePatch({ patternWidth: value })}
                        onZoneColorChange={(value) => applyZonePatch({ color: value })}
                    />
                </div>
                {renderLayerControls('zone')}
            </>
        );
    }

    if (selection.type === 'edge' && selectedEdge) {
        const edgeWeightState = getMixed(selectedEdges, (edge) => edge.weight ?? settings.boldWeight);
        const isUniformized = settings.uniformizeBoldEdge;

        return (
            <>
                <div style={isUniformized ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
                    <NumberField
                        label="Bold Weight"
                        value={edgeWeightState.value}
                        step={0.1}
                        className={edgeWeightState.mixed ? 'input-mixed' : ''}
                        onScroll={makeScroll(edgeWeightState.value, 0.1, false, (next) => applyEdgePatch({ weight: next }))}
                        onChange={(e) => {
                            const v = Math.max(0.1, parseFloat(e.target.value) || 0.1);
                            applyEdgePatch({ weight: v });
                        }}
                    />
                </div>
            </>
        );
    }

    if (selection.type === 'edge-arrow' && selectedArrow) {
        const arrowTypeState = getMixed(selectedArrows, (arrow) => arrow.type ?? settings.edgeArrowType);
        const arrowSizeState = getMixed(selectedArrows, (arrow) => arrow.size ?? settings.edgeArrowSize);
        const arrowRatioState = getMixed(selectedArrows, (arrow) => arrow.ratio ?? settings.edgeArrowRatio);
        const arrowColorState = getMixed(selectedArrows, (arrow) => arrow.color ?? settings.edgeArrowColor);
        const arrowLabelTextState = getMixed(selectedArrows, (arrow) => arrow.arrowLabel?.text ?? '');
        const arrowLabelSizeState = getMixed(selectedArrows, (arrow) => arrow.arrowLabel?.size ?? (settings.edgeArrowLabelSize ?? settings.fontSize));
        const arrowLabelPosState = getMixed(selectedArrows, (arrow) => arrow.arrowLabel?.position ?? 'above');
        const isUniformized = settings.uniformizeEdgeArrow;

        return (
            <>
                <div style={isUniformized ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
                    <ArrowEditor
                        makeScroll={makeScroll}
                        arrowTypeState={arrowTypeState}
                        arrowSizeState={arrowSizeState}
                        arrowRatioState={arrowRatioState}
                        arrowColorState={arrowColorState}
                        labelTextState={arrowLabelTextState}
                        labelSizeState={arrowLabelSizeState}
                        labelPosState={arrowLabelPosState}
                        onArrowTypeChange={(value) => applyArrowPatch({ type: value })}
                        onArrowSizeChange={(value) => applyArrowPatch({ size: value })}
                        onArrowRatioChange={(value) => applyArrowPatch({ ratio: value })}
                        onArrowColorChange={(value) => applyArrowPatch({ color: value })}
                        onLabelTextChange={(text) => {
                            const next = text.trim().length
                                ? { text, size: arrowLabelSizeState.value || settings.edgeArrowLabelSize || settings.fontSize, position: arrowLabelPosState.value || 'above' }
                                : null;
                            applyArrowPatch({ arrowLabel: next });
                        }}
                        onLabelSizeChange={(value) => applyArrowPatch({
                            arrowLabel: { text: arrowLabelTextState.value, size: value, position: arrowLabelPosState.value }
                        })}
                        onLabelPosChange={(value) => applyArrowPatch({
                            arrowLabel: { text: arrowLabelTextState.value, size: arrowLabelSizeState.value, position: value }
                        })}
                    />
                </div>
                {renderLayerControls('edge-arrow')}
            </>
        );
    }

    return (
        <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
            Select a measurement, link, guide, zone, bold edge, or edge arrow to edit its properties.
        </div>
    );
};

export default RightSidebarSelectionPanel;
