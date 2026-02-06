// SPDX-License-Identifier: GPL-3.0-only

import React, { useEffect, useRef, useState } from 'react';
import RightSidebarGeneralSettings from './RightSidebarGeneralSettings';
import RightSidebarLegendPanel from './rightSidebar/RightSidebarLegendPanel';
import RightSidebarSelectionPanel from './rightSidebar/RightSidebarSelectionPanel';
import RightSidebarToolPanel from './rightSidebar/RightSidebarToolPanel';
import { addLegendEntryCommand, removeLegendEntryCommand, setLegendLayoutCommand, updateLegendEntryCommand } from '../state/commands';

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
    updateGuides,
    updateZones,
    updateLinks,
    updateMeasurements,
    updateBoldEdges,
    updateEdgeArrows,
    creationMode
}) => {
    const scrollShellRef = useRef(null);
    const [activeTab, setActiveTab] = useState('tool');
    const [selectedLegendEntryId, setSelectedLegendEntryId] = useState(null);

    const legendEntries = Array.isArray(legend?.entries) ? legend.entries : [];
    const legendLayout = legend?.layout && typeof legend.layout === 'object' ? legend.layout : {};
    const resolvedActiveTab = creationMode ? 'tool' : activeTab;
    const effectiveSelectedLegendEntryId = selectedLegendEntryId && legendEntries.some((entry) => entry?.id === selectedLegendEntryId)
        ? selectedLegendEntryId
        : null;

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
        applyStateBatch((current) => setLegendLayoutCommand(current, patch));
    };

    const addLegendEntry = (type = 'line') => {
        const newId = `legend-${Math.random().toString(36).slice(2, 10)}`;
        applyStateBatch((current) => {
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
            return addLegendEntryCommand(current, entry);
        });
        setSelectedLegendEntryId(newId);
    };

    const updateLegendEntry = (id, patch) => {
        applyStateBatch((current) => updateLegendEntryCommand(current, id, patch));
    };

    const removeLegendEntry = (id) => {
        applyStateBatch((current) => removeLegendEntryCommand(current, id));
        if (selectedLegendEntryId === id) setSelectedLegendEntryId(null);
    };

    const buildLegendStylePatchFromSelection = () => {
        if (selection?.type === 'zone' && selectedZone) {
            return {
                type: 'hatch',
                color: selectedZone.color ?? settings.zoneColor ?? '#000000',
                lineWidth: selectedZone.borderWidth ?? settings.zoneBorderWidth ?? 1.2,
                hatchType: selectedZone.hatchType ?? settings.hatchType ?? 'hatch-45',
                patternWidth: selectedZone.patternWidth ?? settings.zonePatternWidth ?? 0.8
            };
        }
        if (selection?.type === 'link' && selectedLink) {
            return {
                type: 'arrow',
                color: selectedLink.color ?? settings.linkColor ?? '#000000',
                lineWidth: selectedLink.lineWidth ?? settings.linkLineWidth ?? 1.2,
                arrowSize: selectedLink.arrowSize ?? settings.arrowSize ?? 10,
                arrowRatio: 1.4
            };
        }
        if (selection?.type === 'edge-arrow' && selectedArrow) {
            return {
                type: 'arrow',
                color: selectedArrow.color ?? settings.edgeArrowColor ?? '#000000',
                lineWidth: 1.2,
                arrowSize: selectedArrow.size ?? settings.edgeArrowSize ?? 10,
                arrowRatio: selectedArrow.ratio ?? settings.edgeArrowRatio ?? 1.4
            };
        }
        if (selection?.type === 'measurement' && selectedMeasurement) {
            return {
                type: 'arrow',
                color: selectedMeasurement.color ?? '#000000',
                lineWidth: selectedMeasurement.lineWidth ?? 1.2,
                arrowSize: selectedMeasurement.arrowSize ?? settings.arrowSize ?? 10,
                arrowRatio: 1.4
            };
        }
        if (selection?.type === 'guide' && selectedGuide) {
            return {
                type: 'line',
                color: '#000000',
                lineWidth: selectedGuide.lineWidth ?? settings.guideLineWidth ?? 1
            };
        }
        if (selection?.type === 'edge' && selectedEdge) {
            return {
                type: 'line',
                color: '#000000',
                lineWidth: selectedEdge.weight ?? settings.boldWeight ?? 2
            };
        }
        return null;
    };

    const copyStyleToLegendEntry = (entryId) => {
        const patch = buildLegendStylePatchFromSelection();
        if (!patch) return;
        updateLegendEntry(entryId, patch);
        setSelectedLegendEntryId(entryId);
    };
    const canCopyLegendStyle = Boolean(buildLegendStylePatchFromSelection());

    const getSelectedIdsForType = (type) => {
        if (type === 'guide') return selectedGuides.map((item) => item.id).filter(Boolean);
        if (type === 'zone') return selectedZones.map((item) => item.id).filter(Boolean);
        if (type === 'link') return selectedLinks.map((item) => item.id).filter(Boolean);
        if (type === 'edge-arrow') return selectedArrows.map((item) => item.id).filter(Boolean);
        if (type === 'measurement') return selectedMeasurements.map((item) => item.id).filter(Boolean);
        return [];
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

    const renderToolPanel = () => {
        if (selection) {
            return (
                <RightSidebarSelectionPanel
                    selection={selection}
                    settings={settings}
                    selectedGuide={selectedGuide}
                    selectedZone={selectedZone}
                    selectedLink={selectedLink}
                    selectedEdge={selectedEdge}
                    selectedArrow={selectedArrow}
                    selectedMeasurement={selectedMeasurement}
                    selectedGuides={selectedGuides}
                    selectedZones={selectedZones}
                    selectedLinks={selectedLinks}
                    selectedEdges={selectedEdges}
                    selectedArrows={selectedArrows}
                    selectedMeasurements={selectedMeasurements}
                    getMixed={getMixed}
                    makeScroll={makeScroll}
                    renderLayerControls={renderLayerControls}
                    applyGuidePatch={applyGuidePatch}
                    applyZonePatch={applyZonePatch}
                    applyLinkPatch={applyLinkPatch}
                    applyEdgePatch={applyEdgePatch}
                    applyArrowPatch={applyArrowPatch}
                    applyMeasurementPatch={applyMeasurementPatch}
                />
            );
        }

        return (
            <RightSidebarToolPanel
                settings={settings}
                creationMode={creationMode}
                updateSettings={updateSettings}
                toggleUniformize={toggleUniformize}
                makeScroll={makeScroll}
                renderLayerControls={renderLayerControls}
                applyGuideSetting={applyGuideSetting}
                applyLinkSetting={applyLinkSetting}
                applyZoneSetting={applyZoneSetting}
                applyBoldSetting={applyBoldSetting}
                applyEdgeArrowSetting={applyEdgeArrowSetting}
            />
        );
    };

    return (
        <div className="right-sidebar" style={style}>
            <div className="right-sidebar-tabs" role="tablist" aria-label="Right panel">
                <button
                    type="button"
                    className={`right-sidebar-tab ${resolvedActiveTab === 'tool' ? 'active' : ''}`}
                    role="tab"
                    aria-selected={resolvedActiveTab === 'tool'}
                    onClick={() => setActiveTab('tool')}
                >
                    Tool
                </button>
                <button
                    type="button"
                    className={`right-sidebar-tab ${resolvedActiveTab === 'settings' ? 'active' : ''}`}
                    role="tab"
                    aria-selected={resolvedActiveTab === 'settings'}
                    onClick={() => setActiveTab('settings')}
                >
                    Settings
                </button>
                <button
                    type="button"
                    className={`right-sidebar-tab ${resolvedActiveTab === 'legend' ? 'active' : ''}`}
                    role="tab"
                    aria-selected={resolvedActiveTab === 'legend'}
                    onClick={() => setActiveTab('legend')}
                >
                    Legend
                </button>
            </div>

            <div className="right-sidebar-tab-shell right-sidebar-scroll" ref={scrollShellRef}>
                <div className="right-sidebar-content">
                    {resolvedActiveTab === 'tool' ? (
                        renderToolPanel()
                    ) : resolvedActiveTab === 'settings' ? (
                        <RightSidebarGeneralSettings
                            settings={settings}
                            updateSettings={updateSettings}
                            handleSettingScroll={handleSettingScroll}
                        />
                    ) : (
                        <RightSidebarLegendPanel
                            settings={settings}
                            legendEntries={legendEntries}
                            legendLayout={legendLayout}
                            selectedLegendEntryId={effectiveSelectedLegendEntryId}
                            setSelectedLegendEntryId={setSelectedLegendEntryId}
                            addLegendEntry={addLegendEntry}
                            updateLegendEntry={updateLegendEntry}
                            removeLegendEntry={removeLegendEntry}
                            updateLegendLayout={updateLegendLayout}
                            makeScroll={makeScroll}
                            copyStyleToLegendEntry={copyStyleToLegendEntry}
                            canCopyLegendStyle={canCopyLegendStyle}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default RightSidebar;
