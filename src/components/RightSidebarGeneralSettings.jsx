import { NumberField, SelectField } from './InputFields';

const RightSidebarGeneralSettings = ({
    settings,
    updateSettings,
    handleSettingScroll
}) => (
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

export default RightSidebarGeneralSettings;
