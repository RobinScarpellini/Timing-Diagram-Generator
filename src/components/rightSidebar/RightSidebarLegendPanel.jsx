import React, { useState } from 'react';
import { NumberField, SelectField, TextField } from '../InputFields';
import { ColorPicker } from '../ColorPicker';

const LEGEND_TYPE_OPTIONS = [
    { value: 'line', label: '━━━━' },
    { value: 'arrow', label: '━━▶' },
    { value: 'hatch', label: '▥▥▥' }
];

const getLegendTypeGlyph = (type) => {
    if (type === 'arrow') return '━━▶';
    if (type === 'hatch') return '▥▥▥';
    return '━━━━';
};

const RightSidebarLegendPanel = ({
    settings,
    legendEntries,
    legendLayout,
    selectedLegendEntryId,
    setSelectedLegendEntryId,
    addLegendEntry,
    updateLegendEntry,
    removeLegendEntry,
    updateLegendLayout,
    makeScroll,
    copyStyleToLegendEntry,
    canCopyLegendStyle
}) => {
    const [newEntryType, setNewEntryType] = useState('line');
    const selectedEntry = selectedLegendEntryId
        ? legendEntries.find((entry) => entry?.id === selectedLegendEntryId)
        : null;

    return (
        <div className="legend-panel">
            <div className="legend-top-section">
                <div className="legend-toolbar legend-add-toolbar">
                    <SelectField
                        label="Type"
                        value={newEntryType}
                        onChange={(e) => setNewEntryType(e.target.value)}
                        options={LEGEND_TYPE_OPTIONS}
                    />
                    <button type="button" className="layer-btn legend-add-btn" onClick={() => addLegendEntry(newEntryType)}>+ Add</button>
                </div>

                {legendEntries.length ? (
                    <div className="legend-list">
                        {legendEntries.map((entry) => (
                            <div key={entry.id} className={`legend-item-row ${entry.id === selectedLegendEntryId ? 'active' : ''}`}>
                                <button
                                    type="button"
                                    className="legend-item-copy-btn"
                                    onClick={() => copyStyleToLegendEntry(entry.id)}
                                    disabled={!canCopyLegendStyle}
                                    title="Copy selected element style to this legend row"
                                >
                                    ⎘
                                </button>
                                <button
                                    type="button"
                                    className={`legend-item ${entry.id === selectedLegendEntryId ? 'active' : ''}`}
                                    onClick={() => setSelectedLegendEntryId(entry.id)}
                                >
                                    <span className="legend-item-type">{getLegendTypeGlyph(entry.type || 'line')}</span>
                                    <span className="legend-item-swatch" style={{ backgroundColor: entry.color || '#000000' }} />
                                    <span className="legend-item-label">{entry.label || '(untitled)'}</span>
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="sidebar-placeholder">No legend entries yet.</div>
                )}

                {selectedEntry ? (
                    <div className="tool-settings-block legend-entry-settings">
                        <div className="grid-2">
                            <SelectField
                                label="Type"
                                value={selectedEntry.type || 'line'}
                                onChange={(e) => updateLegendEntry(selectedEntry.id, { type: e.target.value })}
                                options={LEGEND_TYPE_OPTIONS}
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
                        <div className="legend-toolbar legend-remove-row">
                            <button type="button" className="layer-btn" onClick={() => removeLegendEntry(selectedEntry.id)}>Remove</button>
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="settings-separator legend-separator" />

            <div className="tool-settings-block legend-layout-settings">
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
                <div className="grid-2">
                    <NumberField
                        label="Corner (pt)"
                        value={legendLayout.cornerRadius ?? 0}
                        step={0.5}
                        onScroll={makeScroll(legendLayout.cornerRadius ?? 0, 0.5, false, (next) => updateLegendLayout({ cornerRadius: next }))}
                        onChange={(e) => updateLegendLayout({ cornerRadius: Math.max(0, parseFloat(e.target.value) || 0) })}
                    />
                    <NumberField
                        label="Border Width"
                        value={legendLayout.borderWidth ?? 1}
                        step={0.5}
                        disabled={!legendLayout.border}
                        onScroll={makeScroll(legendLayout.borderWidth ?? 1, 0.5, false, (next) => updateLegendLayout({ borderWidth: next }))}
                        onChange={(e) => updateLegendLayout({ borderWidth: Math.max(0.5, parseFloat(e.target.value) || 1) })}
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
            </div>
        </div>
    );
};

export default RightSidebarLegendPanel;
