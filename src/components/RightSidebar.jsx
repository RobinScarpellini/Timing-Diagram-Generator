import React, { useEffect, useRef, useState } from 'react';
import { NumberField, SelectField, TextField } from './InputFields';
import { ColorPicker } from './ColorPicker';

const RightSidebar = ({
    style,
    settings,
    legend,
    updateSettings,
    applyStateBatch,
    handleSettingScroll,
    selection,
    selectedGuide,
    selectedZone,
    selectedLink,
    selectedEdge,
    selectedArrow,
    selectedMeasurement,
    selectedGuides = [],
    selectedZones = [],
    selectedLinks = [],
    selectedEdges = [],
    selectedArrows = [],
    selectedMeasurements = [],
    guides = [],
    zones = [],
    links = [],
    boldEdges = [],
    edgeArrows = [],
    measurements = [],
    updateGuides,
    updateZones,
    updateLinks,
    updateMeasurements,
    updateBoldEdges,
    updateEdgeArrows,
    creationMode
}) => {
    const scrollShellRef = useRef(null);
    const [activeTab, setActiveTab] = useState('generic');
    const [selectedLegendEntryId, setSelectedLegendEntryId] = useState(null);

    const legendEntries = Array.isArray(legend?.entries) ? legend.entries : [];
    const legendLayout = legend?.layout && typeof legend.layout === 'object' ? legend.layout : {};

    useEffect(() => {
        if (!selectedLegendEntryId) return;
        const stillExists = legendEntries.some((entry) => entry?.id === selectedLegendEntryId);
        if (!stillExists) setSelectedLegendEntryId(null);
    }, [selectedLegendEntryId, legendEntries]);

    useEffect(() => {
        const container = scrollShellRef.current;
        if (!container) return;
        const handleWheel = (event) => {
            const active = document.activeElement;
            if (!active) return;
            if (active.tagName !== 'INPUT' || active.type !== 'number') return;
            if (!container.contains(active)) return;
            event.preventDefault();
        };
        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [activeTab]);

    const makeScroll = (value, step, allowNegative, onUpdate) => (e) => {
        e.preventDefault();
        const direction = e.deltaY > 0 ? -1 : 1;
        const next = parseFloat((value + direction * step).toFixed(6));
        if (!allowNegative && next < 0) return;
        onUpdate(next);
    };

    const updateLegendLayout = (patch) => {
        applyStateBatch((current) => ({
            ...current,
            legend: {
                ...(current.legend || {}),
                layout: {
                    ...((current.legend && current.legend.layout) || {}),
                    ...patch
                }
            }
        }));
    };

    const addLegendEntry = (type) => {
        const newId = `legend-${Math.random().toString(36).slice(2, 10)}`;
        applyStateBatch((current) => {
            const nextLegend = current.legend || { entries: [], layout: {} };
            const nextEntries = Array.isArray(nextLegend.entries) ? nextLegend.entries : [];
            const entry = {
                id: newId,
                type,
                label: '',
                color: '#000000',
                lineWidth: 1.2,
                arrowSize: 10,
                arrowRatio: 1.4,
                hatchType: current.settings?.hatchType || 'hatch-45',
                patternWidth: current.settings?.zonePatternWidth || 0.8
            };
            return {
                ...current,
                legend: {
                    ...nextLegend,
                    entries: [...nextEntries, entry]
                }
            };
        });
        setSelectedLegendEntryId(newId);
    };

    const updateLegendEntry = (id, patch) => {
        applyStateBatch((current) => {
            const nextLegend = current.legend || { entries: [], layout: {} };
            const nextEntries = Array.isArray(nextLegend.entries) ? nextLegend.entries : [];
            return {
                ...current,
                legend: {
                    ...nextLegend,
                    entries: nextEntries.map((entry) => entry?.id === id ? { ...entry, ...patch } : entry)
                }
            };
        });
    };

    const removeLegendEntry = (id) => {
        applyStateBatch((current) => {
            const nextLegend = current.legend || { entries: [], layout: {} };
            const nextEntries = Array.isArray(nextLegend.entries) ? nextLegend.entries : [];
            return {
                ...current,
                legend: {
                    ...nextLegend,
                    entries: nextEntries.filter((entry) => entry?.id !== id)
                }
            };
        });
        if (selectedLegendEntryId === id) setSelectedLegendEntryId(null);
    };

    const renderLegendPanel = () => {
        const selectedEntry = selectedLegendEntryId
            ? legendEntries.find((entry) => entry?.id === selectedLegendEntryId)
            : null;

        return (
            <div>
                <div className="legend-toolbar">
                    <button type="button" className="layer-btn" onClick={() => addLegendEntry('line')}>+ Line</button>
                    <button type="button" className="layer-btn" onClick={() => addLegendEntry('arrow')}>+ Arrow</button>
                    <button type="button" className="layer-btn" onClick={() => addLegendEntry('hatch')}>+ Hatch</button>
                </div>

                {legendEntries.length ? (
                    <div className="legend-list">
                        {legendEntries.map((entry) => (
                            <button
                                key={entry.id}
                                type="button"
                                className={`legend-item ${entry.id === selectedLegendEntryId ? 'active' : ''}`}
                                onClick={() => setSelectedLegendEntryId(entry.id)}
                            >
                                <span className="legend-item-type">{(entry.type || 'line').slice(0, 1).toUpperCase()}</span>
                                <span className="legend-item-swatch" style={{ backgroundColor: entry.color || '#000000' }} />
                                <span className="legend-item-label">{entry.label || '(untitled)'}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="sidebar-placeholder">No legend entries yet.</div>
                )}

                {selectedEntry ? (
                    <div className="tool-settings-block" style={{ marginTop: '12px' }}>
                        <div className="grid-2">
                            <SelectField
                                label="Type"
                                value={selectedEntry.type || 'line'}
                                onChange={(e) => updateLegendEntry(selectedEntry.id, { type: e.target.value })}
                                options={[
                                    { value: 'line', label: 'Line' },
                                    { value: 'arrow', label: 'Arrow' },
                                    { value: 'hatch', label: 'Hatch' }
                                ]}
                            />
                            <NumberField
                                label="Line Width"
                                value={selectedEntry.lineWidth ?? 1.2}
                                step={0.1}
                                onScroll={makeScroll(selectedEntry.lineWidth ?? 1.2, 0.1, false, (next) => updateLegendEntry(selectedEntry.id, { lineWidth: next }))}
                                onChange={(e) => {
                                    const v = Math.max(0.1, parseFloat(e.target.value) || 0.1);
                                    updateLegendEntry(selectedEntry.id, { lineWidth: v });
                                }}
                            />
                        </div>
                        <TextField
                            label="Label"
                            value={selectedEntry.label ?? ''}
                            onChange={(e) => updateLegendEntry(selectedEntry.id, { label: e.target.value })}
                            placeholder="Legend label"
                        />
                        <ColorPicker
                            label="Color"
                            color={selectedEntry.color ?? '#000000'}
                            onChange={(c) => updateLegendEntry(selectedEntry.id, { color: c })}
                            variant="compact"
                        />
                        {selectedEntry.type === 'arrow' && (
                            <div className="grid-2">
                                <NumberField
                                    label="Arrow Size"
                                    value={selectedEntry.arrowSize ?? 10}
                                    step={0.5}
                                    onScroll={makeScroll(selectedEntry.arrowSize ?? 10, 0.5, false, (next) => updateLegendEntry(selectedEntry.id, { arrowSize: next }))}
                                    onChange={(e) => {
                                        const v = Math.max(1, parseFloat(e.target.value) || 1);
                                        updateLegendEntry(selectedEntry.id, { arrowSize: v });
                                    }}
                                />
                                <NumberField
                                    label="Arrow Ratio"
                                    value={selectedEntry.arrowRatio ?? 1.4}
                                    step={0.1}
                                    onScroll={makeScroll(selectedEntry.arrowRatio ?? 1.4, 0.1, false, (next) => updateLegendEntry(selectedEntry.id, { arrowRatio: Math.min(2, Math.max(0.5, next)) }))}
                                    onChange={(e) => {
                                        const v = parseFloat(e.target.value);
                                        const next = Number.isNaN(v) ? 1.4 : Math.min(2, Math.max(0.5, v));
                                        updateLegendEntry(selectedEntry.id, { arrowRatio: next });
                                    }}
                                />
                            </div>
                        )}
                        {selectedEntry.type === 'hatch' && (
                            <div className="grid-2">
                                <SelectField
                                    label="Pattern"
                                    value={selectedEntry.hatchType ?? (settings.hatchType || 'hatch-45')}
                                    onChange={(e) => updateLegendEntry(selectedEntry.id, { hatchType: e.target.value })}
                                    options={[
                                        { value: 'hatch-45', label: '45° Slant' },
                                        { value: 'hatch-135', label: '-45° Slant' },
                                        { value: 'hatch-cross', label: 'Cross Hatch' },
                                        { value: 'hatch-dots', label: 'Dot Pattern' }
                                    ]}
                                />
                                <NumberField
                                    label="Pattern Width"
                                    value={selectedEntry.patternWidth ?? (settings.zonePatternWidth || 0.8)}
                                    step={0.1}
                                    onScroll={makeScroll(selectedEntry.patternWidth ?? (settings.zonePatternWidth || 0.8), 0.1, false, (next) => updateLegendEntry(selectedEntry.id, { patternWidth: next }))}
                                    onChange={(e) => {
                                        const v = Math.max(0.1, parseFloat(e.target.value) || 0.1);
                                        updateLegendEntry(selectedEntry.id, { patternWidth: v });
                                    }}
                                />
                            </div>
                        )}
                        <div className="legend-toolbar" style={{ marginTop: 10 }}>
                            <button type="button" className="layer-btn" onClick={() => removeLegendEntry(selectedEntry.id)}>Remove</button>
                        </div>
                    </div>
                ) : null}

                <div className="tool-settings-block" style={{ marginTop: '16px' }}>
                    <div className="selection-meta">Legend Layout</div>
                    <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <input
                            type="checkbox"
                            id="legend-auto-pos"
                            checked={legendLayout.x === null && legendLayout.y === null}
                            style={{ width: '16px', height: '16px' }}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    updateLegendLayout({ x: null, y: null });
                                } else {
                                    updateLegendLayout({ x: 0, y: 0 });
                                }
                            }}
                        />
                        <label htmlFor="legend-auto-pos" style={{ textTransform: 'none', marginTop: 0 }}>Auto Top-Right</label>
                    </div>
                    <div className="grid-2">
                        <NumberField
                            label="X"
                            value={typeof legendLayout.x === 'number' ? legendLayout.x : 0}
                            step={5}
                            disabled={legendLayout.x === null && legendLayout.y === null}
                            onScroll={makeScroll(typeof legendLayout.x === 'number' ? legendLayout.x : 0, 5, true, (next) => updateLegendLayout({ x: next }))}
                            onChange={(e) => updateLegendLayout({ x: parseFloat(e.target.value) || 0 })}
                        />
                        <NumberField
                            label="Y"
                            value={typeof legendLayout.y === 'number' ? legendLayout.y : 0}
                            step={5}
                            disabled={legendLayout.x === null && legendLayout.y === null}
                            onScroll={makeScroll(typeof legendLayout.y === 'number' ? legendLayout.y : 0, 5, true, (next) => updateLegendLayout({ y: next }))}
                            onChange={(e) => updateLegendLayout({ y: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="grid-2">
                        <NumberField
                            label="Padding"
                            value={legendLayout.padding ?? 8}
                            step={1}
                            onScroll={makeScroll(legendLayout.padding ?? 8, 1, false, (next) => updateLegendLayout({ padding: next }))}
                            onChange={(e) => updateLegendLayout({ padding: Math.max(0, parseFloat(e.target.value) || 0) })}
                        />
                        <NumberField
                            label="Gap"
                            value={legendLayout.gap ?? 6}
                            step={1}
                            onScroll={makeScroll(legendLayout.gap ?? 6, 1, false, (next) => updateLegendLayout({ gap: next }))}
                            onChange={(e) => updateLegendLayout({ gap: Math.max(0, parseFloat(e.target.value) || 0) })}
                        />
                    </div>
                    <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: '8px', marginTop: '12px' }}>
                        <input
                            type="checkbox"
                            id="legend-border"
                            checked={Boolean(legendLayout.border)}
                            style={{ width: '16px', height: '16px' }}
                            onChange={(e) => updateLegendLayout({ border: e.target.checked })}
                        />
                        <label htmlFor="legend-border" style={{ textTransform: 'none', marginTop: 0 }}>Border</label>
                    </div>
                    <NumberField
                        label="Border Width"
                        value={legendLayout.borderWidth ?? 1}
                        step={0.5}
                        disabled={!legendLayout.border}
                        onScroll={makeScroll(legendLayout.borderWidth ?? 1, 0.5, false, (next) => updateLegendLayout({ borderWidth: next }))}
                        onChange={(e) => updateLegendLayout({ borderWidth: Math.max(0.5, parseFloat(e.target.value) || 1) })}
                    />
                </div>
            </div>
        );
    };

    const applyLayerReorder = (layerKey, selectedIds, mode) => {
        if (!layerKey || !selectedIds?.length) return;
        const selectedSet = new Set(selectedIds);
        const moveForwardOnce = (order) => {
            const next = [...order];
            for (let i = next.length - 2; i >= 0; i--) {
                if (selectedSet.has(next[i]) && !selectedSet.has(next[i + 1])) {
                    const tmp = next[i];
                    next[i] = next[i + 1];
                    next[i + 1] = tmp;
                }
            }
            return next;
        };
        const moveBackOnce = (order) => {
            const next = [...order];
            for (let i = 1; i < next.length; i++) {
                if (selectedSet.has(next[i]) && !selectedSet.has(next[i - 1])) {
                    const tmp = next[i];
                    next[i] = next[i - 1];
                    next[i - 1] = tmp;
                }
            }
            return next;
        };

        applyStateBatch((current) => {
            const idsInState = (current[layerKey] || []).map((item) => item.id).filter(Boolean);
            const rawOrder = current.layers?.[layerKey];
            const baseOrder = Array.isArray(rawOrder) ? rawOrder.filter((id) => idsInState.includes(id)) : [];
            const missing = idsInState.filter((id) => !baseOrder.includes(id));
            const order = [...baseOrder, ...missing];

            let nextOrder = order;
            if (mode === 'force-front') {
                const kept = order.filter((id) => !selectedSet.has(id));
                const moved = order.filter((id) => selectedSet.has(id));
                nextOrder = [...kept, ...moved];
            } else if (mode === 'force-back') {
                const kept = order.filter((id) => !selectedSet.has(id));
                const moved = order.filter((id) => selectedSet.has(id));
                nextOrder = [...moved, ...kept];
            } else if (mode === 'move-front') {
                nextOrder = moveForwardOnce(order);
            } else if (mode === 'move-back') {
                nextOrder = moveBackOnce(order);
            }

            return {
                ...current,
                layers: {
                    ...(current.layers || {}),
                    [layerKey]: nextOrder
                }
            };
        });
    };

    const getSelectedIdsForType = (type) => {
        if (type === 'guide') return selectedGuides.map((item) => item.id).filter(Boolean);
        if (type === 'zone') return selectedZones.map((item) => item.id).filter(Boolean);
        if (type === 'link') return selectedLinks.map((item) => item.id).filter(Boolean);
        if (type === 'edge-arrow') return selectedArrows.map((item) => item.id).filter(Boolean);
        if (type === 'measurement') return selectedMeasurements.map((item) => item.id).filter(Boolean);
        return [];
    };

    const renderLayerControls = (type) => {
        const layerKey = type === 'guide' ? 'guides'
            : type === 'zone' ? 'zones'
            : type === 'link' ? 'links'
            : type === 'edge-arrow' ? 'edgeArrows'
            : type === 'measurement' ? 'measurements'
            : null;
        if (!layerKey) return null;
        const selectedIds = getSelectedIdsForType(type);
        const hasSelection = selectedIds.length > 0;
        return (
            <div className="tool-settings-block positioning-controls">
                <div className="positioning-controls-title">Position</div>
                <div className="layer-controls">
                    <button type="button" className="layer-btn" onClick={() => applyLayerReorder(layerKey, selectedIds, 'force-front')} disabled={!hasSelection} title="Move selection to the front">To Front</button>
                    <button type="button" className="layer-btn" onClick={() => applyLayerReorder(layerKey, selectedIds, 'force-back')} disabled={!hasSelection} title="Move selection to the back">To Back</button>
                    <button type="button" className="layer-btn" onClick={() => applyLayerReorder(layerKey, selectedIds, 'move-front')} disabled={!hasSelection} title="Move selection forward by one layer">Send Forward</button>
                    <button type="button" className="layer-btn" onClick={() => applyLayerReorder(layerKey, selectedIds, 'move-back')} disabled={!hasSelection} title="Move selection backward by one layer">Send Backward</button>
                </div>
            </div>
        );
    };

    const getMixed = (items, getter) => {
        if (!items.length) return { value: undefined, mixed: false };
        const first = getter(items[0]);
        const mixed = items.some((item) => getter(item) !== first);
        return { value: first, mixed };
    };

    const renderArrowEditor = ({
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
                            { value: 'below', label: 'Below' }
                        ]}
                    />
                </div>
            </div>
            <div className="settings-separator" />
        </>
    );

    const renderGuideEditor = ({
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
                        disabled={guideStyle !== 'dashed'}
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

    const renderLinkEditor = ({
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
                        disabled={linkStyle !== 'dashed'}
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
                                        { value: 'below', label: 'Below' }
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

    const renderZoneEditor = ({
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

    const applyGuidePatch = (patch) => {
        const targetIds = selectedGuides.map((guide) => guide.id);
        if (!targetIds.length) return;
        updateGuides(targetIds, patch);
    };

    const applyZonePatch = (patch) => {
        const targetIds = selectedZones.map((zone) => zone.id);
        if (!targetIds.length) return;
        updateZones(targetIds, patch);
    };

    const applyLinkPatch = (patch) => {
        const targetIds = selectedLinks.map((link) => link.id);
        if (!targetIds.length) return;
        updateLinks(targetIds, patch);
    };

    const applyEdgePatch = (patch) => {
        const targetIds = selectedEdges.map((edge) => edge.id);
        if (!targetIds.length) return;
        updateBoldEdges(targetIds, patch);
    };

    const applyArrowPatch = (patch) => {
        const targetIds = selectedArrows.map((arrow) => arrow.id);
        if (!targetIds.length) return;
        updateEdgeArrows(targetIds, patch);
    };

    const applyMeasurementPatch = (patch) => {
        const targetIds = selectedMeasurements.map((measurement) => measurement.id);
        if (!targetIds.length) return;
        updateMeasurements(targetIds, patch);
    };

    const applyGuideSetting = (settingsPatch) => {
        applyStateBatch((current) => {
            const nextSettings = { ...current.settings, ...settingsPatch };
            if (!current.settings.uniformizeGuide || !current.guides.length) {
                return { ...current, settings: nextSettings };
            }
            const elementPatch = {};
            if (settingsPatch.guideStyle !== undefined) elementPatch.style = settingsPatch.guideStyle;
            if (settingsPatch.guideLineWidth !== undefined) elementPatch.lineWidth = settingsPatch.guideLineWidth;
            if (settingsPatch.guideDashLength !== undefined) elementPatch.dashLength = settingsPatch.guideDashLength;
            if (settingsPatch.guideDashGap !== undefined) elementPatch.dashGap = settingsPatch.guideDashGap;
            const nextGuides = Object.keys(elementPatch).length
                ? current.guides.map((guide) => ({ ...guide, ...elementPatch }))
                : current.guides;
            return { ...current, settings: nextSettings, guides: nextGuides };
        });
    };

    const applyLinkSetting = (settingsPatch) => {
        applyStateBatch((current) => {
            const nextSettings = { ...current.settings, ...settingsPatch };
            if (!current.settings.uniformizeLink || !current.links.length) {
                return { ...current, settings: nextSettings };
            }
            const elementPatch = {};
            if (settingsPatch.linkStyle !== undefined) elementPatch.style = settingsPatch.linkStyle;
            if (settingsPatch.linkLineWidth !== undefined) elementPatch.lineWidth = settingsPatch.linkLineWidth;
            if (settingsPatch.linkDashLength !== undefined) elementPatch.dashLength = settingsPatch.linkDashLength;
            if (settingsPatch.linkDashGap !== undefined) elementPatch.dashGap = settingsPatch.linkDashGap;
            if (settingsPatch.linkColor !== undefined) elementPatch.color = settingsPatch.linkColor;
            if (settingsPatch.linkStartMarker !== undefined) elementPatch.startMarker = settingsPatch.linkStartMarker;
            if (settingsPatch.linkEndMarker !== undefined) elementPatch.endMarker = settingsPatch.linkEndMarker;
            if (settingsPatch.arrowSize !== undefined) elementPatch.arrowSize = settingsPatch.arrowSize;
            const nextLinks = Object.keys(elementPatch).length
                ? current.links.map((link) => ({ ...link, ...elementPatch }))
                : current.links;
            return { ...current, settings: nextSettings, links: nextLinks };
        });
    };

    const applyZoneSetting = (settingsPatch) => {
        applyStateBatch((current) => {
            const nextSettings = { ...current.settings, ...settingsPatch };
            if (!current.settings.uniformizeZone || !current.zones.length) {
                return { ...current, settings: nextSettings };
            }
            const elementPatch = {};
            if (settingsPatch.hatchType !== undefined) elementPatch.hatchType = settingsPatch.hatchType;
            if (settingsPatch.zoneColor !== undefined) elementPatch.color = settingsPatch.zoneColor;
            if (settingsPatch.zoneBorderWidth !== undefined) elementPatch.borderWidth = settingsPatch.zoneBorderWidth;
            if (settingsPatch.zonePatternWidth !== undefined) elementPatch.patternWidth = settingsPatch.zonePatternWidth;
            const nextZones = Object.keys(elementPatch).length
                ? current.zones.map((zone) => ({ ...zone, ...elementPatch }))
                : current.zones;
            return { ...current, settings: nextSettings, zones: nextZones };
        });
    };

    const applyBoldSetting = (settingsPatch) => {
        applyStateBatch((current) => {
            const nextSettings = { ...current.settings, ...settingsPatch };
            if (!current.settings.uniformizeBoldEdge || !current.boldEdges.length) {
                return { ...current, settings: nextSettings };
            }
            const nextBoldEdges = settingsPatch.boldWeight !== undefined
                ? current.boldEdges.map((edge) => ({ ...edge, weight: settingsPatch.boldWeight }))
                : current.boldEdges;
            return { ...current, settings: nextSettings, boldEdges: nextBoldEdges };
        });
    };

    const applyEdgeArrowSetting = (settingsPatch) => {
        applyStateBatch((current) => {
            const nextSettings = { ...current.settings, ...settingsPatch };
            if (!current.settings.uniformizeEdgeArrow || !current.edgeArrows.length) {
                return { ...current, settings: nextSettings };
            }
            const elementPatch = {};
            if (settingsPatch.edgeArrowType !== undefined) elementPatch.type = settingsPatch.edgeArrowType;
            if (settingsPatch.edgeArrowSize !== undefined) elementPatch.size = settingsPatch.edgeArrowSize;
            if (settingsPatch.edgeArrowRatio !== undefined) elementPatch.ratio = settingsPatch.edgeArrowRatio;
            if (settingsPatch.edgeArrowColor !== undefined) elementPatch.color = settingsPatch.edgeArrowColor;
            if (
                settingsPatch.edgeArrowLabelText !== undefined ||
                settingsPatch.edgeArrowLabelSize !== undefined ||
                settingsPatch.edgeArrowLabelPosition !== undefined
            ) {
                const labelText = String(
                    settingsPatch.edgeArrowLabelText !== undefined
                        ? settingsPatch.edgeArrowLabelText
                        : current.settings.edgeArrowLabelText || ''
                );
                const labelSize = settingsPatch.edgeArrowLabelSize !== undefined
                    ? settingsPatch.edgeArrowLabelSize
                    : current.settings.edgeArrowLabelSize ?? current.settings.fontSize;
                const labelPosition = settingsPatch.edgeArrowLabelPosition !== undefined
                    ? settingsPatch.edgeArrowLabelPosition
                    : current.settings.edgeArrowLabelPosition || 'above';
                elementPatch.arrowLabel = labelText.trim().length
                    ? { text: labelText, size: labelSize, position: labelPosition }
                    : null;
            }
            const nextArrows = Object.keys(elementPatch).length
                ? current.edgeArrows.map((arrow) => ({ ...arrow, ...elementPatch }))
                : current.edgeArrows;
            return { ...current, settings: nextSettings, edgeArrows: nextArrows };
        });
    };

    const confirmUniformize = (label, count) => {
        if (count <= 1) return true;
        return window.confirm(`Uniformize ${label}? This will update all existing ${label} to match current settings.`);
    };

    const toggleUniformize = (key, label, itemsKey, patchFromSettings) => (event) => {
        const next = event.target.checked;
        if (!next) {
            updateSettings({ [key]: false });
            return;
        }
        const count = itemsKey === 'guides' ? guides.length
            : itemsKey === 'zones' ? zones.length
            : itemsKey === 'links' ? links.length
            : itemsKey === 'boldEdges' ? boldEdges.length
            : edgeArrows.length;
        if (!confirmUniformize(label, count)) return;
        applyStateBatch((current) => {
            const nextSettings = { ...current.settings, [key]: true };
            const items = current[itemsKey] || [];
            if (!items.length) return { ...current, settings: nextSettings };
            const patch = patchFromSettings(current.settings);
            const nextItems = items.map((item) => ({ ...item, ...patch }));
            return { ...current, settings: nextSettings, [itemsKey]: nextItems };
        });
    };

    const renderSelectionContent = () => {
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
                        {renderGuideEditor({
                            guideStyleState,
                            guideLineWidthState,
                            guideDashLengthState,
                            guideDashGapState,
                            guideExtEnabledState,
                            guideUpperExtState,
                            guideLowerExtState,
                            onGuideStyleChange: (value) => applyGuidePatch({ style: value }),
                            onGuideLineWidthChange: (value) => applyGuidePatch({ lineWidth: value }),
                            onGuideDashLengthChange: (value) => applyGuidePatch({ dashLength: value }),
                            onGuideDashGapChange: (value) => applyGuidePatch({ dashGap: value }),
                            onGuideExtEnabledChange: (enabled) => {
                                if (enabled) {
                                    applyGuidePatch({ upperExtension: guideUpperExtState.value, lowerExtension: guideLowerExtState.value });
                                } else {
                                    applyGuidePatch({ upperExtension: null, lowerExtension: null });
                                }
                            },
                            onGuideUpperExtChange: (value) => applyGuidePatch({ upperExtension: value }),
                            onGuideLowerExtChange: (value) => applyGuidePatch({ lowerExtension: value })
                        })}
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
                        {renderLinkEditor({
                            linkStyleState,
                            linkLineWidthState,
                            linkDashLengthState,
                            linkDashGapState,
                            linkStartMarkerState,
                            linkEndMarkerState,
                            linkArrowSizeState,
                            linkColorState,
                            labelTextState: linkLabelTextState,
                            labelSizeState: linkLabelSizeState,
                            labelPosState: linkLabelPosState,
                            onLinkStyleChange: (value) => applyLinkPatch({ style: value }),
                            onLinkLineWidthChange: (value) => applyLinkPatch({ lineWidth: value }),
                            onLinkDashLengthChange: (value) => applyLinkPatch({ dashLength: value }),
                            onLinkDashGapChange: (value) => applyLinkPatch({ dashGap: value }),
                            onLinkStartMarkerChange: (value) => applyLinkPatch({ startMarker: value }),
                            onLinkEndMarkerChange: (value) => applyLinkPatch({ endMarker: value }),
                            onLinkArrowSizeChange: (value) => applyLinkPatch({ arrowSize: value }),
                            onLinkColorChange: (value) => applyLinkPatch({ color: value }),
                            onLabelTextChange: (text) => {
                                const next = text.trim().length
                                    ? { text, size: linkLabelSizeState.value || settings.fontSize, position: linkLabelPosState.value || 'above' }
                                    : null;
                                applyLinkPatch({ arrowLabel: next });
                            },
                            onLabelSizeChange: (value) => applyLinkPatch({
                                arrowLabel: { text: linkLabelTextState.value, size: value, position: linkLabelPosState.value }
                            }),
                            onLabelPosChange: (value) => applyLinkPatch({
                                arrowLabel: { text: linkLabelTextState.value, size: linkLabelSizeState.value, position: value }
                            })
                        })}
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
                        {renderZoneEditor({
                            zoneHatchTypeState,
                            zoneBorderWidthState,
                            zonePatternWidthState,
                            zoneColorState,
                            onZoneHatchTypeChange: (value) => applyZonePatch({ hatchType: value }),
                            onZoneBorderWidthChange: (value) => applyZonePatch({ borderWidth: value }),
                            onZonePatternWidthChange: (value) => applyZonePatch({ patternWidth: value }),
                            onZoneColorChange: (value) => applyZonePatch({ color: value })
                        })}
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
                        {renderArrowEditor({
                            arrowTypeState,
                            arrowSizeState,
                            arrowRatioState,
                            arrowColorState,
                            labelTextState: arrowLabelTextState,
                            labelSizeState: arrowLabelSizeState,
                            labelPosState: arrowLabelPosState,
                            onArrowTypeChange: (value) => applyArrowPatch({ type: value }),
                            onArrowSizeChange: (value) => applyArrowPatch({ size: value }),
                            onArrowRatioChange: (value) => applyArrowPatch({ ratio: value }),
                            onArrowColorChange: (value) => applyArrowPatch({ color: value }),
                            onLabelTextChange: (text) => {
                                const next = text.trim().length
                                    ? { text, size: arrowLabelSizeState.value || settings.edgeArrowLabelSize || settings.fontSize, position: arrowLabelPosState.value || 'above' }
                                    : null;
                                applyArrowPatch({ arrowLabel: next });
                            },
                            onLabelSizeChange: (value) => applyArrowPatch({
                                arrowLabel: { text: arrowLabelTextState.value, size: value, position: arrowLabelPosState.value }
                            }),
                            onLabelPosChange: (value) => applyArrowPatch({
                                arrowLabel: { text: arrowLabelTextState.value, size: arrowLabelSizeState.value, position: value }
                            })
                        })}
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

    const renderToolSettings = () => {
        if (creationMode === 'guide') {
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
                    <SelectField
                        label="Line Type"
                        value={settings.guideStyle}
                        onChange={(e) => applyGuideSetting({ guideStyle: e.target.value })}
                        options={[
                            { value: 'solid', label: 'Solid' },
                            { value: 'dashed', label: 'Dashed' },
                            { value: 'dotted', label: 'Dotted' }
                        ]}
                    />
                    <NumberField
                        label="Line Width"
                        value={settings.guideLineWidth}
                        step={0.1}
                        onScroll={makeScroll(settings.guideLineWidth, 0.1, false, (next) => applyGuideSetting({ guideLineWidth: next }))}
                        onChange={(e) => { const v = Math.max(0.1, parseFloat(e.target.value) || 0.1); applyGuideSetting({ guideLineWidth: v }); }}
                    />
                    <div className="grid-2">
                        <NumberField
                            label="Dash"
                            value={settings.guideDashLength}
                            disabled={settings.guideStyle !== 'dashed'}
                            onScroll={makeScroll(settings.guideDashLength, 1, false, (next) => applyGuideSetting({ guideDashLength: next }))}
                            onChange={(e) => { const v = Math.max(1, parseFloat(e.target.value) || 1); applyGuideSetting({ guideDashLength: v }); }}
                        />
                        <NumberField
                            label="Gap"
                            value={settings.guideDashGap}
                            disabled={settings.guideStyle === 'solid'}
                            onScroll={makeScroll(settings.guideDashGap, 1, false, (next) => applyGuideSetting({ guideDashGap: next }))}
                            onChange={(e) => { const v = Math.max(1, parseFloat(e.target.value) || 1); applyGuideSetting({ guideDashGap: v }); }}
                        />
                    </div>
                    <NumberField label="Extra Height" value={settings.guideExtraHeight} step={5} onScroll={makeScroll(settings.guideExtraHeight, 5, true, (next) => applyGuideSetting({ guideExtraHeight: next }))} onChange={(e) => { const v = parseFloat(e.target.value) || 0; applyGuideSetting({ guideExtraHeight: v }); }} />
                    {renderLayerControls('guide')}
                </>
            );
        }

        if (creationMode === 'link-start' || creationMode === 'link-end') {
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
                    <SelectField
                        label="Line Type"
                        value={settings.linkStyle}
                        onChange={(e) => applyLinkSetting({ linkStyle: e.target.value })}
                        options={[
                            { value: 'solid', label: 'Solid' },
                            { value: 'dashed', label: 'Dashed' },
                            { value: 'dotted', label: 'Dotted' }
                        ]}
                    />
                    <NumberField
                        label="Line Width"
                        value={settings.linkLineWidth}
                        step={0.1}
                        onScroll={makeScroll(settings.linkLineWidth, 0.1, false, (next) => applyLinkSetting({ linkLineWidth: next }))}
                        onChange={(e) => { const v = Math.max(0.1, parseFloat(e.target.value) || 0.1); applyLinkSetting({ linkLineWidth: v }); }}
                    />
                    <div className="grid-2">
                        <NumberField
                            label="Dash"
                            value={settings.linkDashLength}
                            disabled={settings.linkStyle !== 'dashed'}
                            onScroll={makeScroll(settings.linkDashLength, 1, false, (next) => applyLinkSetting({ linkDashLength: next }))}
                            onChange={(e) => { const v = Math.max(1, parseFloat(e.target.value) || 1); applyLinkSetting({ linkDashLength: v }); }}
                        />
                        <NumberField
                            label="Gap"
                            value={settings.linkDashGap}
                            disabled={settings.linkStyle === 'solid'}
                            onScroll={makeScroll(settings.linkDashGap, 1, false, (next) => applyLinkSetting({ linkDashGap: next }))}
                            onChange={(e) => { const v = Math.max(1, parseFloat(e.target.value) || 1); applyLinkSetting({ linkDashGap: v }); }}
                        />
                    </div>
                    <div className="grid-2">
                        <SelectField
                            label="Start"
                            value={settings.linkStartMarker}
                            onChange={(e) => applyLinkSetting({ linkStartMarker: e.target.value })}
                            options={[
                                { value: 'none', label: 'None' },
                                { value: 'arrow', label: 'Arrow' },
                                { value: 'dot', label: 'Dot' }
                            ]}
                        />
                        <SelectField
                            label="End"
                            value={settings.linkEndMarker}
                            onChange={(e) => applyLinkSetting({ linkEndMarker: e.target.value })}
                            options={[
                                { value: 'none', label: 'None' },
                                { value: 'arrow', label: 'Arrow' },
                                { value: 'dot', label: 'Dot' }
                            ]}
                        />
                    </div>
                    <NumberField
                        label="Arrow Size"
                        value={settings.arrowSize}
                        step={0.5}
                        onScroll={makeScroll(settings.arrowSize, 0.5, false, (next) => applyLinkSetting({ arrowSize: next }))}
                        onChange={(e) => { const v = Math.max(1, parseFloat(e.target.value) || 1); applyLinkSetting({ arrowSize: v }); }}
                    />
                    <ColorPicker label="Color" color={settings.linkColor} onChange={(c) => applyLinkSetting({ linkColor: c })} variant="compact" />
                    {renderLayerControls('link')}
                </>
            );
        }

        if (creationMode === 'zone-start' || creationMode === 'zone-end') {
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
                    <SelectField
                        label="Pattern Type"
                        value={settings.hatchType}
                        onChange={(e) => applyZoneSetting({ hatchType: e.target.value })}
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
                            value={settings.zoneBorderWidth}
                            step={0.1}
                            onScroll={makeScroll(settings.zoneBorderWidth, 0.1, false, (next) => applyZoneSetting({ zoneBorderWidth: next }))}
                            onChange={(e) => { const v = Math.max(0, parseFloat(e.target.value) || 0); applyZoneSetting({ zoneBorderWidth: v }); }}
                        />
                        <NumberField
                            label="Pattern Width"
                            value={settings.zonePatternWidth}
                            step={0.1}
                            onScroll={makeScroll(settings.zonePatternWidth, 0.1, false, (next) => applyZoneSetting({ zonePatternWidth: next }))}
                            onChange={(e) => { const v = Math.max(0.1, parseFloat(e.target.value) || 0.1); applyZoneSetting({ zonePatternWidth: v }); }}
                        />
                    </div>
                    <ColorPicker label="Color" color={settings.zoneColor} onChange={(c) => applyZoneSetting({ zoneColor: c })} variant="compact" />
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
                    {renderArrowEditor({
                        arrowTypeState,
                        arrowSizeState,
                        arrowRatioState,
                        arrowColorState,
                        labelTextState: arrowLabelTextState,
                        labelSizeState: arrowLabelSizeState,
                        labelPosState: arrowLabelPosState,
                        onArrowTypeChange: (value) => applyEdgeArrowSetting({ edgeArrowType: value }),
                        onArrowSizeChange: (value) => applyEdgeArrowSetting({ edgeArrowSize: value }),
                        onArrowRatioChange: (value) => applyEdgeArrowSetting({ edgeArrowRatio: value }),
                        onArrowColorChange: (value) => applyEdgeArrowSetting({ edgeArrowColor: value }),
                        onLabelTextChange: (value) => applyEdgeArrowSetting({ edgeArrowLabelText: value }),
                        onLabelSizeChange: (value) => applyEdgeArrowSetting({ edgeArrowLabelSize: value }),
                        onLabelPosChange: (value) => applyEdgeArrowSetting({ edgeArrowLabelPosition: value })
                    })}
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

    const renderDynamicPanel = () => {
        if (selection) return renderSelectionContent();
        if (creationMode) return renderToolSettings();
        return (
            <div className="right-sidebar-general-settings">
                <div className="grid-2">
                    <NumberField label="Plot Duration" value={settings.duration} step={10} onScroll={handleSettingScroll('duration', settings.duration, 10, false)} onChange={(e) => { const v = Math.max(0, parseFloat(e.target.value) || 0); updateSettings({ duration: v }); }} />
                    <NumberField label="Stretch Factor" value={settings.timeScale} step={0.001} onScroll={handleSettingScroll('timeScale', settings.timeScale, 0.001, false)} onChange={(e) => { const v = Math.max(0, parseFloat(e.target.value) || 0); updateSettings({ timeScale: v }); }} />
                </div>
                <div className="grid-2">
                    <NumberField label="Y-Spacing" value={settings.spacing} step={5} onScroll={handleSettingScroll('spacing', settings.spacing, 5, false)} onChange={(e) => { const v = Math.max(1, parseFloat(e.target.value) || 1); updateSettings({ spacing: v }); }} />
                    <NumberField label="Line Width" value={settings.lineWidth} step={0.1} onScroll={handleSettingScroll('lineWidth', settings.lineWidth, 0.1, false)} onChange={(e) => { const v = Math.max(0.1, parseFloat(e.target.value) || 0.1); updateSettings({ lineWidth: v }); }} />
                </div>

                <div className="tool-settings-block">
                    <div className="grid-2">
                        <NumberField label="Label Fontsize" value={settings.fontSize} onScroll={handleSettingScroll('fontSize', settings.fontSize, 1, false)} onChange={(e) => { const v = Math.max(1, parseFloat(e.target.value) || 1); updateSettings({ fontSize: v }); }} />
                        <NumberField label="Count Fontsize" value={settings.counterFontSize} onScroll={handleSettingScroll('counterFontSize', settings.counterFontSize, 1, false)} onChange={(e) => { const v = Math.max(1, parseFloat(e.target.value) || 1); updateSettings({ counterFontSize: v }); }} />
                    </div>

                    <div className="grid-2">
                        <SelectField label="Font" value={settings.fontFamily} onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                            options={[
                                { value: "'Inter', sans-serif", label: 'Inter' },
                                { value: "'Times New Roman', serif", label: 'Times New Roman' },
                                { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
                                { value: 'Arial, sans-serif', label: 'Arial' }
                            ]} />
                        <SelectField label="Justify" value={settings.labelJustify} onChange={(e) => updateSettings({ labelJustify: e.target.value })}
                            options={[{ value: 'start', label: 'Left' }, { value: 'middle', label: 'Center' }, { value: 'end', label: 'Right' }]} />
                    </div>

                    <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: '8px', marginTop: '12px' }}>
                        <input type="checkbox" id="bold-labels" checked={settings.boldLabels} style={{ width: '16px', height: '16px' }} onChange={(e) => updateSettings({ boldLabels: e.target.checked })} />
                        <label htmlFor="bold-labels" style={{ textTransform: 'none', marginTop: 0 }}>Bold Labels</label>
                    </div>
                    <div className="grid-2">
                        <NumberField label="Label X-Pos" value={settings.labelX} onScroll={handleSettingScroll('labelX', settings.labelX, 1, true)} onChange={(e) => { const v = parseFloat(e.target.value) || 0; updateSettings({ labelX: v }); }} />
                        <NumberField label="Label Y-Pos" value={settings.labelYOffset} onScroll={handleSettingScroll('labelYOffset', settings.labelYOffset, 1, true)} onChange={(e) => { const v = parseFloat(e.target.value) || 0; updateSettings({ labelYOffset: v }); }} />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="right-sidebar" style={style}>
            <div className="right-sidebar-tabs" role="tablist" aria-label="Right panel">
                <button
                    type="button"
                    className={`right-sidebar-tab ${activeTab === 'generic' ? 'active' : ''}`}
                    role="tab"
                    aria-selected={activeTab === 'generic'}
                    onClick={() => setActiveTab('generic')}
                >
                    Generic
                </button>
                <button
                    type="button"
                    className={`right-sidebar-tab ${activeTab === 'legend' ? 'active' : ''}`}
                    role="tab"
                    aria-selected={activeTab === 'legend'}
                    onClick={() => setActiveTab('legend')}
                >
                    Legend
                </button>
            </div>

            <div className="right-sidebar-tab-shell right-sidebar-scroll" ref={scrollShellRef}>
                <div className="right-sidebar-content">
                    {activeTab === 'generic' ? (
                        renderDynamicPanel()
                    ) : (
                        renderLegendPanel()
                    )}
                </div>
            </div>
        </div>
    );
};

export default RightSidebar;
