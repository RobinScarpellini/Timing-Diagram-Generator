import React from 'react';
import { NumberField, SelectField, TextField } from '../InputFields';
import { ColorPicker } from '../ColorPicker';

export const ArrowEditor = ({
    makeScroll,
    arrowTypeState,
    arrowSizeState,
    arrowRatioState,
    arrowColorState,
    labelTextState,
    labelSizeState,
    labelPosState,
    onArrowTypeChange,
    onArrowSizeChange,
    onArrowRatioChange,
    onArrowColorChange,
    onLabelTextChange,
    onLabelSizeChange,
    onLabelPosChange
}) => (
    <>
        <div className="grid-2">
            <SelectField
                label="Arrow Type"
                value={arrowTypeState.value}
                className={arrowTypeState.mixed ? 'input-mixed' : ''}
                onChange={(e) => onArrowTypeChange(e.target.value)}
                options={[
                    { value: 'filled', label: 'Filled' },
                    { value: 'open', label: 'Open' }
                ]}
            />
            <NumberField
                label="Arrow Size"
                value={arrowSizeState.value}
                step={0.5}
                className={arrowSizeState.mixed ? 'input-mixed' : ''}
                onScroll={makeScroll(arrowSizeState.value, 0.5, false, (next) => onArrowSizeChange(next))}
                onChange={(e) => {
                    const v = Math.max(1, parseFloat(e.target.value) || 1);
                    onArrowSizeChange(v);
                }}
            />
        </div>
        <div className="grid-2">
            <NumberField
                label="Arrow Ratio"
                value={arrowRatioState.value}
                step={0.1}
                className={arrowRatioState.mixed ? 'input-mixed' : ''}
                onScroll={makeScroll(arrowRatioState.value, 0.1, false, (next) => onArrowRatioChange(Math.min(2, Math.max(0.5, next))))}
                onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    const next = Number.isNaN(v) ? 1 : Math.min(2, Math.max(0.5, v));
                    onArrowRatioChange(next);
                }}
            />
            <div />
        </div>
        <ColorPicker
            label="Color"
            color={arrowColorState.value}
            className={arrowColorState.mixed ? 'input-mixed' : ''}
            onChange={(c) => onArrowColorChange(c)}
            variant="compact"
        />
        <div className="settings-separator" />

        <div className="tool-settings-block" style={{ marginTop: '12px' }}>
            <TextField
                label="Label"
                value={labelTextState.value}
                className={labelTextState.mixed ? 'input-mixed' : ''}
                placeholder="(none)"
                onChange={(e) => onLabelTextChange(e.target.value)}
            />
            <div className="grid-2">
                <NumberField
                    label="Label Size"
                    value={labelSizeState.value}
                    step={1}
                    disabled={!String(labelTextState.value || '').trim().length}
                    className={labelSizeState.mixed ? 'input-mixed' : ''}
                    onScroll={makeScroll(labelSizeState.value, 1, false, (next) => onLabelSizeChange(next))}
                    onChange={(e) => {
                        const v = Math.max(1, parseFloat(e.target.value) || 1);
                        onLabelSizeChange(v);
                    }}
                />
                <SelectField
                    label="Label Pos"
                    value={labelPosState.value}
                    className={labelPosState.mixed ? 'input-mixed' : ''}
                    onChange={(e) => onLabelPosChange(e.target.value)}
                    options={[
                        { value: 'above', label: 'Above' },
                        { value: 'below', label: 'Below' },
                        { value: 'center', label: 'Center' }
                    ]}
                />
            </div>
        </div>
        <div className="settings-separator" />
    </>
);

export const GuideEditor = ({
    makeScroll,
    guideStyleState,
    guideLineWidthState,
    guideDashLengthState,
    guideDashGapState,
    guideExtEnabledState,
    guideUpperExtState,
    guideLowerExtState,
    onGuideStyleChange,
    onGuideLineWidthChange,
    onGuideDashLengthChange,
    onGuideDashGapChange,
    onGuideExtEnabledChange,
    onGuideUpperExtChange,
    onGuideLowerExtChange
}) => {
    const guideStyle = guideStyleState.value;
    const showExtents = Boolean(
        guideExtEnabledState &&
        guideUpperExtState &&
        guideLowerExtState &&
        onGuideExtEnabledChange &&
        onGuideUpperExtChange &&
        onGuideLowerExtChange
    );

    return (
        <>
            <SelectField
                label="Line Type"
                value={guideStyle}
                className={guideStyleState.mixed ? 'input-mixed' : ''}
                onChange={(e) => onGuideStyleChange(e.target.value)}
                options={[
                    { value: 'solid', label: 'Solid' },
                    { value: 'dashed', label: 'Dashed' },
                    { value: 'dotted', label: 'Dotted' }
                ]}
            />
            <NumberField
                label="Line Width"
                value={guideLineWidthState.value}
                step={0.1}
                className={guideLineWidthState.mixed ? 'input-mixed' : ''}
                onScroll={makeScroll(guideLineWidthState.value, 0.1, false, (next) => onGuideLineWidthChange(next))}
                onChange={(e) => {
                    const v = Math.max(0.1, parseFloat(e.target.value) || 0.1);
                    onGuideLineWidthChange(v);
                }}
            />
            <div className="grid-2">
                <NumberField
                    label="Dash"
                    value={guideDashLengthState.value}
                    disabled={guideStyle === 'solid'}
                    className={guideDashLengthState.mixed ? 'input-mixed' : ''}
                    onScroll={makeScroll(guideDashLengthState.value, 1, false, (next) => onGuideDashLengthChange(next))}
                    onChange={(e) => {
                        const v = Math.max(1, parseFloat(e.target.value) || 1);
                        onGuideDashLengthChange(v);
                    }}
                />
                <NumberField
                    label="Gap"
                    value={guideDashGapState.value}
                    disabled={guideStyle === 'solid'}
                    className={guideDashGapState.mixed ? 'input-mixed' : ''}
                    onScroll={makeScroll(guideDashGapState.value, 1, false, (next) => onGuideDashGapChange(next))}
                    onChange={(e) => {
                        const v = Math.max(1, parseFloat(e.target.value) || 1);
                        onGuideDashGapChange(v);
                    }}
                />
            </div>
            {showExtents ? (
                <>
                    <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: '8px', marginTop: '12px' }}>
                        <input
                            type="checkbox"
                            id="guide-extents"
                            checked={Boolean(guideExtEnabledState.value)}
                            style={{ width: '16px', height: '16px' }}
                            onChange={(e) => onGuideExtEnabledChange(e.target.checked)}
                        />
                        <label htmlFor="guide-extents" style={{ textTransform: 'none', marginTop: 0 }}>Custom Extents</label>
                    </div>
                    <div className="grid-2">
                        <NumberField
                            label="Upper"
                            value={guideUpperExtState.value}
                            step={5}
                            disabled={!guideExtEnabledState.value}
                            className={guideUpperExtState.mixed ? 'input-mixed' : ''}
                            onScroll={makeScroll(guideUpperExtState.value, 5, false, (next) => onGuideUpperExtChange(next))}
                            onChange={(e) => {
                                const v = Math.max(0, parseFloat(e.target.value) || 0);
                                onGuideUpperExtChange(v);
                            }}
                        />
                        <NumberField
                            label="Lower"
                            value={guideLowerExtState.value}
                            step={5}
                            disabled={!guideExtEnabledState.value}
                            className={guideLowerExtState.mixed ? 'input-mixed' : ''}
                            onScroll={makeScroll(guideLowerExtState.value, 5, false, (next) => onGuideLowerExtChange(next))}
                            onChange={(e) => {
                                const v = Math.max(0, parseFloat(e.target.value) || 0);
                                onGuideLowerExtChange(v);
                            }}
                        />
                    </div>
                </>
            ) : null}
        </>
    );
};

export const LinkEditor = ({
    makeScroll,
    linkStyleState,
    linkLineWidthState,
    linkDashLengthState,
    linkDashGapState,
    linkStartMarkerState,
    linkEndMarkerState,
    linkArrowSizeState,
    linkColorState,
    labelTextState,
    labelSizeState,
    labelPosState,
    onLinkStyleChange,
    onLinkLineWidthChange,
    onLinkDashLengthChange,
    onLinkDashGapChange,
    onLinkStartMarkerChange,
    onLinkEndMarkerChange,
    onLinkArrowSizeChange,
    onLinkColorChange,
    onLabelTextChange,
    onLabelSizeChange,
    onLabelPosChange
}) => {
    const linkStyle = linkStyleState.value;
    const showLabelEditor = Boolean(
        labelTextState &&
        labelSizeState &&
        labelPosState &&
        onLabelTextChange &&
        onLabelSizeChange &&
        onLabelPosChange
    );

    return (
        <>
            <SelectField
                label="Line Type"
                value={linkStyle}
                className={linkStyleState.mixed ? 'input-mixed' : ''}
                onChange={(e) => onLinkStyleChange(e.target.value)}
                options={[
                    { value: 'solid', label: 'Solid' },
                    { value: 'dashed', label: 'Dashed' },
                    { value: 'dotted', label: 'Dotted' }
                ]}
            />
            <NumberField
                label="Line Width"
                value={linkLineWidthState.value}
                step={0.1}
                className={linkLineWidthState.mixed ? 'input-mixed' : ''}
                onScroll={makeScroll(linkLineWidthState.value, 0.1, false, (next) => onLinkLineWidthChange(next))}
                onChange={(e) => {
                    const v = Math.max(0.1, parseFloat(e.target.value) || 0.1);
                    onLinkLineWidthChange(v);
                }}
            />
            <div className="grid-2">
                <NumberField
                    label="Dash"
                    value={linkDashLengthState.value}
                    disabled={linkStyle === 'solid'}
                    className={linkDashLengthState.mixed ? 'input-mixed' : ''}
                    onScroll={makeScroll(linkDashLengthState.value, 1, false, (next) => onLinkDashLengthChange(next))}
                    onChange={(e) => {
                        const v = Math.max(1, parseFloat(e.target.value) || 1);
                        onLinkDashLengthChange(v);
                    }}
                />
                <NumberField
                    label="Gap"
                    value={linkDashGapState.value}
                    disabled={linkStyle === 'solid'}
                    className={linkDashGapState.mixed ? 'input-mixed' : ''}
                    onScroll={makeScroll(linkDashGapState.value, 1, false, (next) => onLinkDashGapChange(next))}
                    onChange={(e) => {
                        const v = Math.max(1, parseFloat(e.target.value) || 1);
                        onLinkDashGapChange(v);
                    }}
                />
            </div>
            <div className="grid-2">
                <SelectField
                    label="Start"
                    value={linkStartMarkerState.value}
                    className={linkStartMarkerState.mixed ? 'input-mixed' : ''}
                    onChange={(e) => onLinkStartMarkerChange(e.target.value)}
                    options={[
                        { value: 'none', label: 'None' },
                        { value: 'arrow', label: 'Arrow' },
                        { value: 'dot', label: 'Dot' }
                    ]}
                />
                <SelectField
                    label="End"
                    value={linkEndMarkerState.value}
                    className={linkEndMarkerState.mixed ? 'input-mixed' : ''}
                    onChange={(e) => onLinkEndMarkerChange(e.target.value)}
                    options={[
                        { value: 'none', label: 'None' },
                        { value: 'arrow', label: 'Arrow' },
                        { value: 'dot', label: 'Dot' }
                    ]}
                />
            </div>
            <NumberField
                label="Arrow Size"
                value={linkArrowSizeState.value}
                step={0.5}
                className={linkArrowSizeState.mixed ? 'input-mixed' : ''}
                onScroll={makeScroll(linkArrowSizeState.value, 0.5, false, (next) => onLinkArrowSizeChange(next))}
                onChange={(e) => {
                    const v = Math.max(1, parseFloat(e.target.value) || 1);
                    onLinkArrowSizeChange(v);
                }}
            />
            <ColorPicker
                label="Color"
                color={linkColorState.value}
                className={linkColorState.mixed ? 'input-mixed' : ''}
                onChange={(c) => onLinkColorChange(c)}
                variant="compact"
            />
            {showLabelEditor ? (
                <>
                    <div className="settings-separator" />
                    <div className="tool-settings-block" style={{ marginTop: '12px' }}>
                        <TextField
                            label="Label"
                            value={labelTextState.value}
                            className={labelTextState.mixed ? 'input-mixed' : ''}
                            placeholder="(none)"
                            onChange={(e) => onLabelTextChange(e.target.value)}
                        />
                        <div className="grid-2">
                            <NumberField
                                label="Label Size"
                                value={labelSizeState.value}
                                step={1}
                                disabled={!String(labelTextState.value || '').trim().length}
                                className={labelSizeState.mixed ? 'input-mixed' : ''}
                                onScroll={makeScroll(labelSizeState.value, 1, false, (next) => onLabelSizeChange(next))}
                                onChange={(e) => {
                                    const v = Math.max(1, parseFloat(e.target.value) || 1);
                                    onLabelSizeChange(v);
                                }}
                            />
                            <SelectField
                                label="Label Pos"
                                value={labelPosState.value}
                                className={labelPosState.mixed ? 'input-mixed' : ''}
                                onChange={(e) => onLabelPosChange(e.target.value)}
                                options={[
                                    { value: 'above', label: 'Above' },
                                    { value: 'below', label: 'Below' },
                                    { value: 'center', label: 'Center' }
                                ]}
                            />
                        </div>
                    </div>
                    <div className="settings-separator" />
                </>
            ) : null}
        </>
    );
};

export const ZoneEditor = ({
    makeScroll,
    zoneHatchTypeState,
    zoneBorderWidthState,
    zonePatternWidthState,
    zoneColorState,
    onZoneHatchTypeChange,
    onZoneBorderWidthChange,
    onZonePatternWidthChange,
    onZoneColorChange
}) => (
    <>
        <SelectField
            label="Pattern Type"
            value={zoneHatchTypeState.value}
            className={zoneHatchTypeState.mixed ? 'input-mixed' : ''}
            onChange={(e) => onZoneHatchTypeChange(e.target.value)}
            options={[
                { value: 'hatch-45', label: '45° Slant' },
                { value: 'hatch-135', label: '-45° Slant' },
                { value: 'hatch-cross', label: 'Cross Hatch' },
                { value: 'hatch-dots', label: 'Dot Pattern' }
            ]}
        />
        <div className="grid-2">
            <NumberField
                label="Border Width"
                value={zoneBorderWidthState.value}
                step={0.1}
                className={zoneBorderWidthState.mixed ? 'input-mixed' : ''}
                onScroll={makeScroll(zoneBorderWidthState.value, 0.1, false, (next) => onZoneBorderWidthChange(next))}
                onChange={(e) => {
                    const v = Math.max(0, parseFloat(e.target.value) || 0);
                    onZoneBorderWidthChange(v);
                }}
            />
            <NumberField
                label="Pattern Width"
                value={zonePatternWidthState.value}
                step={0.1}
                className={zonePatternWidthState.mixed ? 'input-mixed' : ''}
                onScroll={makeScroll(zonePatternWidthState.value, 0.1, false, (next) => onZonePatternWidthChange(next))}
                onChange={(e) => {
                    const v = Math.max(0.1, parseFloat(e.target.value) || 0.1);
                    onZonePatternWidthChange(v);
                }}
            />
        </div>
        <ColorPicker
            label="Color"
            color={zoneColorState.value}
            className={zoneColorState.mixed ? 'input-mixed' : ''}
            onChange={(c) => onZoneColorChange(c)}
            variant="compact"
        />
    </>
);
