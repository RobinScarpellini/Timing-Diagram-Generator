import React from 'react';
import { NumberField } from '../InputFields';
import { ArrowEditor, GuideEditor, LinkEditor, ZoneEditor } from './SharedEditors';

const RightSidebarToolPanel = ({
    settings,
    creationMode,
    updateSettings,
    toggleUniformize,
    makeScroll,
    renderLayerControls,
    applyGuideSetting,
    applyLinkSetting,
    applyZoneSetting,
    applyBoldSetting,
    applyEdgeArrowSetting
}) => {
    if (creationMode === 'guide') {
        const guideStyleState = { value: settings.guideStyle, mixed: false };
        const guideLineWidthState = { value: settings.guideLineWidth, mixed: false };
        const guideDashLengthState = { value: settings.guideDashLength, mixed: false };
        const guideDashGapState = { value: settings.guideDashGap, mixed: false };
        return (
            <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: 0 }}>
                        <input
                            type="checkbox"
                            id="uniformize-guide"
                            checked={settings.uniformizeGuide}
                            style={{ width: '16px', height: '16px' }}
                            onChange={toggleUniformize(
                                'uniformizeGuide',
                                'guides',
                                'guides',
                                (currentSettings) => ({
                                    style: currentSettings.guideStyle,
                                    lineWidth: currentSettings.guideLineWidth,
                                    dashLength: currentSettings.guideDashLength,
                                    dashGap: currentSettings.guideDashGap
                                })
                            )}
                        />
                        <label htmlFor="uniformize-guide" style={{ textTransform: 'none', marginTop: 0 }}>Uniformize</label>
                    </div>
                    <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: 0 }}>
                        <input
                            type="checkbox"
                            id="auto-guide"
                            checked={settings.autoGuide}
                            style={{ width: '16px', height: '16px' }}
                            onChange={(e) => updateSettings({ autoGuide: e.target.checked })}
                        />
                        <label htmlFor="auto-guide" style={{ textTransform: 'none', marginTop: 0 }}>Auto Tool</label>
                    </div>
                </div>
                <GuideEditor
                    makeScroll={makeScroll}
                    guideStyleState={guideStyleState}
                    guideLineWidthState={guideLineWidthState}
                    guideDashLengthState={guideDashLengthState}
                    guideDashGapState={guideDashGapState}
                    onGuideStyleChange={(value) => applyGuideSetting({ guideStyle: value })}
                    onGuideLineWidthChange={(value) => applyGuideSetting({ guideLineWidth: value })}
                    onGuideDashLengthChange={(value) => applyGuideSetting({ guideDashLength: value })}
                    onGuideDashGapChange={(value) => applyGuideSetting({ guideDashGap: value })}
                />
                <NumberField label="Extra Height" value={settings.guideExtraHeight} step={5} onScroll={makeScroll(settings.guideExtraHeight, 5, true, (next) => applyGuideSetting({ guideExtraHeight: next }))} onChange={(e) => { const v = parseFloat(e.target.value) || 0; applyGuideSetting({ guideExtraHeight: v }); }} />
                {renderLayerControls('guide')}
            </>
        );
    }

    if (creationMode === 'link-start' || creationMode === 'link-end') {
        const linkStyleState = { value: settings.linkStyle, mixed: false };
        const linkLineWidthState = { value: settings.linkLineWidth, mixed: false };
        const linkDashLengthState = { value: settings.linkDashLength, mixed: false };
        const linkDashGapState = { value: settings.linkDashGap, mixed: false };
        const linkStartMarkerState = { value: settings.linkStartMarker, mixed: false };
        const linkEndMarkerState = { value: settings.linkEndMarker, mixed: false };
        const linkArrowSizeState = { value: settings.arrowSize, mixed: false };
        const linkColorState = { value: settings.linkColor, mixed: false };
        return (
            <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: 0 }}>
                        <input
                            type="checkbox"
                            id="uniformize-link"
                            checked={settings.uniformizeLink}
                            style={{ width: '16px', height: '16px' }}
                            onChange={toggleUniformize(
                                'uniformizeLink',
                                'links',
                                'links',
                                (currentSettings) => ({
                                    style: currentSettings.linkStyle,
                                    lineWidth: currentSettings.linkLineWidth,
                                    dashLength: currentSettings.linkDashLength,
                                    dashGap: currentSettings.linkDashGap,
                                    color: currentSettings.linkColor,
                                    startMarker: currentSettings.linkStartMarker,
                                    endMarker: currentSettings.linkEndMarker,
                                    arrowSize: currentSettings.arrowSize
                                })
                            )}
                        />
                        <label htmlFor="uniformize-link" style={{ textTransform: 'none', marginTop: 0 }}>Uniformize</label>
                    </div>
                    <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: 0 }}>
                        <input
                            type="checkbox"
                            id="auto-link"
                            checked={settings.autoLink}
                            style={{ width: '16px', height: '16px' }}
                            onChange={(e) => updateSettings({ autoLink: e.target.checked })}
                        />
                        <label htmlFor="auto-link" style={{ textTransform: 'none', marginTop: 0 }}>Auto Tool</label>
                    </div>
                </div>
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
                    onLinkStyleChange={(value) => applyLinkSetting({ linkStyle: value })}
                    onLinkLineWidthChange={(value) => applyLinkSetting({ linkLineWidth: value })}
                    onLinkDashLengthChange={(value) => applyLinkSetting({ linkDashLength: value })}
                    onLinkDashGapChange={(value) => applyLinkSetting({ linkDashGap: value })}
                    onLinkStartMarkerChange={(value) => applyLinkSetting({ linkStartMarker: value })}
                    onLinkEndMarkerChange={(value) => applyLinkSetting({ linkEndMarker: value })}
                    onLinkArrowSizeChange={(value) => applyLinkSetting({ arrowSize: value })}
                    onLinkColorChange={(value) => applyLinkSetting({ linkColor: value })}
                />
                {renderLayerControls('link')}
            </>
        );
    }

    if (creationMode === 'zone-start' || creationMode === 'zone-end') {
        const zoneHatchTypeState = { value: settings.hatchType, mixed: false };
        const zoneBorderWidthState = { value: settings.zoneBorderWidth, mixed: false };
        const zonePatternWidthState = { value: settings.zonePatternWidth, mixed: false };
        const zoneColorState = { value: settings.zoneColor, mixed: false };
        return (
            <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: 0 }}>
                        <input
                            type="checkbox"
                            id="uniformize-zone"
                            checked={settings.uniformizeZone}
                            style={{ width: '16px', height: '16px' }}
                            onChange={toggleUniformize(
                                'uniformizeZone',
                                'zones',
                                'zones',
                                (currentSettings) => ({
                                    hatchType: currentSettings.hatchType,
                                    color: currentSettings.zoneColor,
                                    borderWidth: currentSettings.zoneBorderWidth,
                                    patternWidth: currentSettings.zonePatternWidth
                                })
                            )}
                        />
                        <label htmlFor="uniformize-zone" style={{ textTransform: 'none', marginTop: 0 }}>Uniformize</label>
                    </div>
                    <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: 0 }}>
                        <input
                            type="checkbox"
                            id="auto-zone"
                            checked={settings.autoZone}
                            style={{ width: '16px', height: '16px' }}
                            onChange={(e) => updateSettings({ autoZone: e.target.checked })}
                        />
                        <label htmlFor="auto-zone" style={{ textTransform: 'none', marginTop: 0 }}>Auto Tool</label>
                    </div>
                </div>
                <ZoneEditor
                    makeScroll={makeScroll}
                    zoneHatchTypeState={zoneHatchTypeState}
                    zoneBorderWidthState={zoneBorderWidthState}
                    zonePatternWidthState={zonePatternWidthState}
                    zoneColorState={zoneColorState}
                    onZoneHatchTypeChange={(value) => applyZoneSetting({ hatchType: value })}
                    onZoneBorderWidthChange={(value) => applyZoneSetting({ zoneBorderWidth: value })}
                    onZonePatternWidthChange={(value) => applyZoneSetting({ zonePatternWidth: value })}
                    onZoneColorChange={(value) => applyZoneSetting({ zoneColor: value })}
                />
                {renderLayerControls('zone')}
            </>
        );
    }

    if (creationMode === 'bold') {
        return (
            <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: 0 }}>
                        <input
                            type="checkbox"
                            id="uniformize-bold"
                            checked={settings.uniformizeBoldEdge}
                            style={{ width: '16px', height: '16px' }}
                            onChange={toggleUniformize(
                                'uniformizeBoldEdge',
                                'bold edges',
                                'boldEdges',
                                (currentSettings) => ({ weight: currentSettings.boldWeight })
                            )}
                        />
                        <label htmlFor="uniformize-bold" style={{ textTransform: 'none', marginTop: 0 }}>Uniformize</label>
                    </div>
                    <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: 0 }}>
                        <input
                            type="checkbox"
                            id="auto-bold"
                            checked={settings.autoBoldEdge}
                            style={{ width: '16px', height: '16px' }}
                            onChange={(e) => updateSettings({ autoBoldEdge: e.target.checked })}
                        />
                        <label htmlFor="auto-bold" style={{ textTransform: 'none', marginTop: 0 }}>Auto Tool</label>
                    </div>
                </div>
                <NumberField
                    label="Bold Weight"
                    value={settings.boldWeight}
                    step={0.1}
                    onScroll={makeScroll(settings.boldWeight, 0.1, false, (next) => applyBoldSetting({ boldWeight: next }))}
                    onChange={(e) => { const v = Math.max(0.1, parseFloat(e.target.value) || 0.1); applyBoldSetting({ boldWeight: v }); }}
                />
                <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>
                    Click waveform edges to toggle bold styling.
                </div>
            </>
        );
    }

    if (creationMode === 'edge-arrow') {
        const arrowTypeState = { value: settings.edgeArrowType, mixed: false };
        const arrowSizeState = { value: settings.edgeArrowSize, mixed: false };
        const arrowRatioState = { value: settings.edgeArrowRatio, mixed: false };
        const arrowColorState = { value: settings.edgeArrowColor, mixed: false };
        const arrowLabelTextState = { value: settings.edgeArrowLabelText || '', mixed: false };
        const arrowLabelSizeState = { value: settings.edgeArrowLabelSize ?? settings.fontSize, mixed: false };
        const arrowLabelPosState = { value: settings.edgeArrowLabelPosition || 'above', mixed: false };
        return (
            <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: 0 }}>
                        <input
                            type="checkbox"
                            id="uniformize-edge-arrow"
                            checked={settings.uniformizeEdgeArrow}
                            style={{ width: '16px', height: '16px' }}
                            onChange={toggleUniformize(
                                'uniformizeEdgeArrow',
                                'edge arrows',
                                'edgeArrows',
                                (currentSettings) => ({
                                    type: currentSettings.edgeArrowType,
                                    size: currentSettings.edgeArrowSize,
                                    ratio: currentSettings.edgeArrowRatio,
                                    color: currentSettings.edgeArrowColor,
                                    arrowLabel: String(currentSettings.edgeArrowLabelText || '').trim().length
                                        ? {
                                            text: currentSettings.edgeArrowLabelText,
                                            size: currentSettings.edgeArrowLabelSize ?? currentSettings.fontSize,
                                            position: currentSettings.edgeArrowLabelPosition || 'above'
                                        }
                                        : null
                                })
                            )}
                        />
                        <label htmlFor="uniformize-edge-arrow" style={{ textTransform: 'none', marginTop: 0 }}>Uniformize</label>
                    </div>
                    <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: 0 }}>
                        <input
                            type="checkbox"
                            id="auto-edge-arrow"
                            checked={settings.autoEdgeArrow}
                            style={{ width: '16px', height: '16px' }}
                            onChange={(e) => updateSettings({ autoEdgeArrow: e.target.checked })}
                        />
                        <label htmlFor="auto-edge-arrow" style={{ textTransform: 'none', marginTop: 0 }}>Auto Tool</label>
                    </div>
                </div>
                <ArrowEditor
                    makeScroll={makeScroll}
                    arrowTypeState={arrowTypeState}
                    arrowSizeState={arrowSizeState}
                    arrowRatioState={arrowRatioState}
                    arrowColorState={arrowColorState}
                    labelTextState={arrowLabelTextState}
                    labelSizeState={arrowLabelSizeState}
                    labelPosState={arrowLabelPosState}
                    onArrowTypeChange={(value) => applyEdgeArrowSetting({ edgeArrowType: value })}
                    onArrowSizeChange={(value) => applyEdgeArrowSetting({ edgeArrowSize: value })}
                    onArrowRatioChange={(value) => applyEdgeArrowSetting({ edgeArrowRatio: value })}
                    onArrowColorChange={(value) => applyEdgeArrowSetting({ edgeArrowColor: value })}
                    onLabelTextChange={(value) => applyEdgeArrowSetting({ edgeArrowLabelText: value })}
                    onLabelSizeChange={(value) => applyEdgeArrowSetting({ edgeArrowLabelSize: value })}
                    onLabelPosChange={(value) => applyEdgeArrowSetting({ edgeArrowLabelPosition: value })}
                />
                {renderLayerControls('edge-arrow')}
            </>
        );
    }

    if (creationMode === 'measure-start' || creationMode === 'measure-end') {
        return (
            <>
                <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>
                    Click two guides or oscillator edges to create a measurement.
                </div>
                {renderLayerControls('measurement')}
            </>
        );
    }
    if (creationMode === 'delete') {
        return (
            <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>
                Click a link, guide, zone, bold edge, or edge arrow to delete it.
            </div>
        );
    }

    if (creationMode === 'copy') {
        return (
            <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>
                Click an element to copy its style.
            </div>
        );
    }

    if (creationMode === 'paste') {
        return (
            <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>
                Click a matching element to paste the copied style.
            </div>
        );
    }

    return (
        <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>
            Select a tool or element to edit its properties.
        </div>
    );
};

export default RightSidebarToolPanel;
