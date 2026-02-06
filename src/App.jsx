import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import './App.css';
import Diagram from './components/Diagram';
import CanvasToolbar from './components/CanvasToolbar';
import TopBar from './components/TopBar';
import SignalsPanel from './components/SignalsPanel';
import RightSidebar from './components/RightSidebar';
import { useLocalStorageState } from './components/useLocalStorageState';
import { DEFAULT_STATE } from './state/defaults';
import { normalizeState } from './state/migrate';
import {
    addCounter as addCounterAction,
    addOscillator as addOscillatorAction,
    patchItemsByIds,
    removeItemsByIds,
    removeSignalAndDependencies,
    reorderSignals as reorderSignalsAction,
    updateSignal as updateSignalAction
} from './state/actions';
import { DIAGRAM_LABEL_COLUMN_WIDTH, DIAGRAM_PADDING } from './constants/layout';
import { HISTORY_LIMIT, PANELS, ZOOM } from './constants/ui';
import { estimateLegendSize, resolveLegendPosition } from './diagram/legend';
import { computeDiagramHeightFromLayout, computeSignalLayout, makeSignalLayoutMap } from './diagram/signalLayout';

const generateId = () => Math.random().toString(36).slice(2, 11);

const stateReducer = (state, action) => {
    if (action.type === 'set') return action.state;
    return state;
};

const IconZoomFit = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="8 4 4 4 4 8" />
        <polyline points="16 4 20 4 20 8" />
        <polyline points="20 16 20 20 16 20" />
        <polyline points="8 20 4 20 4 16" />
        <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
);

function App() {
    const [state, dispatch] = useReducer(stateReducer, DEFAULT_STATE);
    const [creationMode, setCreationMode] = useState(null);
    const [tempStart, setTempStart] = useState(null);
    const [measurementStart, setMeasurementStart] = useState(null);
    const [selection, setSelection] = useState(null);
    const [cursorFilter, setCursorFilter] = useState(null);
    const [styleClipboard, setStyleClipboard] = useState(null);
    const [historyState, setHistoryState] = useState({ entries: [], index: -1 });
    const [canvasZoom, setCanvasZoom] = useState(1);
    const fileInputRef = useRef(null);
    const canvasStageRef = useRef(null);
    const stateRef = useRef(state);
    const [leftPanelWidth, setLeftPanelWidth] = useLocalStorageState('timing_diagram_ui_left_panel_width', 360);
    const [rightPanelWidth, setRightPanelWidth] = useLocalStorageState('timing_diagram_ui_right_panel_width', 420);
    const getModeSelectionType = useCallback((mode) => {
        if (!mode) return null;
        if (mode === 'guide') return 'guide';
        if (mode.startsWith('zone')) return 'zone';
        if (mode.startsWith('link')) return 'link';
        if (mode === 'bold') return 'edge';
        if (mode === 'edge-arrow') return 'edge-arrow';
        if (mode.startsWith('measure')) return 'measurement';
        return null;
    }, []);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    useEffect(() => {
        if (!cursorFilter) return;
        const modeSelectionType = getModeSelectionType(creationMode);
        if (!modeSelectionType || cursorFilter !== modeSelectionType) {
            setCursorFilter(null);
        }
    }, [creationMode, cursorFilter, getModeSelectionType]);

    const boldEdgeMap = useMemo(() => {
        const map = new Map();
        state.boldEdges.forEach((edge) => {
            if (edge?.id) map.set(edge.id, edge);
        });
        return map;
    }, [state.boldEdges]);
    const oscillatorsOnly = useMemo(() => state.signals.filter((sig) => sig.type === 'oscillator'), [state.signals]);
    const signalLayoutSettings = useMemo(() => ({
        spacing: state.settings.spacing,
        signalSpacingMode: state.settings.signalSpacingMode,
        oscWaveHeight: state.settings.oscWaveHeight,
        counterWaveHeight: state.settings.counterWaveHeight
    }), [
        state.settings.spacing,
        state.settings.signalSpacingMode,
        state.settings.oscWaveHeight,
        state.settings.counterWaveHeight
    ]);
    const signalLayoutRows = useMemo(
        () => computeSignalLayout(state.signals, signalLayoutSettings),
        [state.signals, signalLayoutSettings]
    );
    const signalLayoutById = useMemo(
        () => makeSignalLayoutMap(signalLayoutRows),
        [signalLayoutRows]
    );

    const applyState = useCallback((nextState) => {
        stateRef.current = nextState;
        dispatch({ type: 'set', state: nextState });
    }, []);

    const saveToHistory = useCallback((newState) => {
        const entry = JSON.stringify(newState);
        setHistoryState((prev) => {
            const base = prev.entries.slice(0, prev.index + 1);
            base.push(entry);
            const trimmed = base.length > HISTORY_LIMIT ? base.slice(base.length - HISTORY_LIMIT) : base;
            return { entries: trimmed, index: trimmed.length - 1 };
        });
    }, []);

    const setStateAndHistory = useCallback((next) => {
        const nextState = typeof next === 'function' ? next(stateRef.current) : next;
        applyState(nextState);
        saveToHistory(nextState);
    }, [applyState, saveToHistory]);

    useEffect(() => {
        const saved = localStorage.getItem('timing_diagram_state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const normalized = normalizeState(parsed);
                applyState(normalized);
                setHistoryState({ entries: [JSON.stringify(normalized)], index: 0 });
                return;
            } catch (e) {
                console.error("Failed to load state", e);
            }
        }

        const initialState = normalizeState(DEFAULT_STATE);
        applyState(initialState);
        setHistoryState({ entries: [JSON.stringify(initialState)], index: 0 });
    }, [applyState]);

    useEffect(() => {
        if (historyState.index >= 0 && historyState.entries[historyState.index]) {
            localStorage.setItem('timing_diagram_state', historyState.entries[historyState.index]);
        }
    }, [historyState]);

    const undo = () => {
        setHistoryState((prev) => {
            if (prev.index <= 0) return prev;
            const nextIndex = prev.index - 1;
            const prevState = normalizeState(JSON.parse(prev.entries[nextIndex]));
            applyState(prevState);
            return { ...prev, index: nextIndex };
        });
    };

    const redo = () => {
        setHistoryState((prev) => {
            if (prev.index >= prev.entries.length - 1) return prev;
            const nextIndex = prev.index + 1;
            const nextState = normalizeState(JSON.parse(prev.entries[nextIndex]));
            applyState(nextState);
            return { ...prev, index: nextIndex };
        });
    };

    const updateSettings = useCallback((patch) => {
        setStateAndHistory((current) => ({
            ...current,
            settings: {
                ...current.settings,
                ...patch
            }
        }));
    }, [setStateAndHistory]);

    const updateDiagramName = useCallback((name) => {
        setStateAndHistory((current) => ({ ...current, diagramName: name }));
    }, [setStateAndHistory]);

    const handleSettingScroll = (key, value, step = 1, allowNegative = true) => (e) => {
        e.preventDefault();
        const direction = e.deltaY > 0 ? -1 : 1;
        const next = parseFloat((value + direction * step).toFixed(6));
        const minByKey = {
            duration: 2,
            lineWidth: 2,
            fontSize: 2,
            counterFontSize: 2,
            oscWaveHeight: 2,
            counterWaveHeight: 2
        };
        if (minByKey[key] !== undefined && next < minByKey[key]) return;
        if (!allowNegative && next < 0) return;
        updateSettings({ [key]: next });
    };

    const handleSignalScroll = (id, key, value, step = 1, allowNegative = true) => (e) => {
        e.preventDefault();
        const direction = e.deltaY > 0 ? -1 : 1;
        const next = parseFloat((value + direction * step).toFixed(6));
        if (key === 'period') {
            const duration = stateRef.current?.settings?.duration || 0;
            const minPeriod = Math.max(2, duration / 1000);
            if (next < minPeriod) return;
        }
        if (!allowNegative && next < 0) return;
        updateSignalValue(id, key, next);
    };

    const addOscillator = () => {
        const id = generateId();
        setStateAndHistory((current) => addOscillatorAction(current, id));
    };

    const addCounter = () => {
        const id = generateId();
        setStateAndHistory((current) => addCounterAction(current, id));
    };

    const updateSignalValue = useCallback((id, field, value) => {
        setStateAndHistory((current) => updateSignalAction(current, { id, field, value }));
    }, [setStateAndHistory]);

    const removeSignal = (id) => {
        const nextState = removeSignalAndDependencies(stateRef.current, id);

        if (selection?.type) {
            const pruneSelection = (validIds, type) => {
                const remaining = (selection.ids || []).filter((itemId) => validIds.has(itemId));
                return remaining.length ? { type, ids: remaining } : null;
            };
            let nextSelection = selection;
            if (selection.type === 'guide') {
                nextSelection = pruneSelection(new Set(nextState.guides.map((guide) => guide.id)), 'guide');
            } else if (selection.type === 'zone') {
                nextSelection = pruneSelection(new Set(nextState.zones.map((zone) => zone.id)), 'zone');
            } else if (selection.type === 'link') {
                nextSelection = pruneSelection(new Set(nextState.links.map((link) => link.id)), 'link');
            } else if (selection.type === 'edge') {
                nextSelection = pruneSelection(new Set(nextState.boldEdges.map((edge) => edge.id)), 'edge');
            } else if (selection.type === 'edge-arrow') {
                nextSelection = pruneSelection(new Set(nextState.edgeArrows.map((arrow) => arrow.id)), 'edge-arrow');
            } else if (selection.type === 'measurement') {
                nextSelection = pruneSelection(new Set((nextState.measurements || []).map((m) => m.id)), 'measurement');
            }
            if (nextSelection !== selection) {
                setSelection(nextSelection);
            }
        }

        setStateAndHistory(nextState);
    };

    const reorderSignals = useCallback((sourceId, targetId) => {
        setStateAndHistory((current) => reorderSignalsAction(current, sourceId, targetId));
    }, [setStateAndHistory]);

    const deleteGuide = (id) => {
        if (selection?.type === 'guide') {
            const remaining = selection.ids?.filter((guideId) => guideId !== id) || [];
            setSelection(remaining.length ? { type: 'guide', ids: remaining } : null);
        }
        if (selection?.type === 'measurement') {
            const measurementIdsToRemove = (stateRef.current.measurements || [])
                .filter((m) => (
                    (m?.start?.kind === 'guide' && m.start.guideId === id) ||
                    (m?.end?.kind === 'guide' && m.end.guideId === id)
                ))
                .map((m) => m.id);
            if (measurementIdsToRemove.length) {
                const remaining = selection.ids?.filter((mid) => !measurementIdsToRemove.includes(mid)) || [];
                setSelection(remaining.length ? { type: 'measurement', ids: remaining } : null);
            }
        }
        setStateAndHistory((current) => {
            let next = removeItemsByIds(current, 'guides', [id]);
            const measurementsToRemove = (next.measurements || [])
                .filter((m) => (
                    (m?.start?.kind === 'guide' && m.start.guideId === id) ||
                    (m?.end?.kind === 'guide' && m.end.guideId === id)
                ))
                .map((m) => m.id);
            if (measurementsToRemove.length) {
                next = removeItemsByIds(next, 'measurements', measurementsToRemove);
            }
            return next;
        });
    };

    const deleteZone = (id) => {
        if (selection?.type === 'zone') {
            const remaining = selection.ids?.filter((zoneId) => zoneId !== id) || [];
            setSelection(remaining.length ? { type: 'zone', ids: remaining } : null);
        }
        setStateAndHistory((current) => removeItemsByIds(current, 'zones', [id]));
    };

    const deleteLink = (id) => {
        if (selection?.type === 'link') {
            const remaining = selection.ids?.filter((linkId) => linkId !== id) || [];
            setSelection(remaining.length ? { type: 'link', ids: remaining } : null);
        }
        setStateAndHistory((current) => removeItemsByIds(current, 'links', [id]));
    };

    const deleteEdgeArrow = (id) => {
        removeEdgeArrows([id]);
    };

    const deleteMeasurement = (id) => {
        if (selection?.type === 'measurement') {
            const remaining = selection.ids?.filter((mid) => mid !== id) || [];
            setSelection(remaining.length ? { type: 'measurement', ids: remaining } : null);
        }
        setStateAndHistory((current) => removeItemsByIds(current, 'measurements', [id]));
    };

    const updateGuides = useCallback((ids, patch) => {
        setStateAndHistory((current) => patchItemsByIds(current, 'guides', ids, patch));
    }, [setStateAndHistory]);

    const updateZones = useCallback((ids, patch) => {
        setStateAndHistory((current) => patchItemsByIds(current, 'zones', ids, patch));
    }, [setStateAndHistory]);

    const updateLinks = useCallback((ids, patch) => {
        setStateAndHistory((current) => patchItemsByIds(current, 'links', ids, patch));
    }, [setStateAndHistory]);

    const updateMeasurements = useCallback((ids, patch) => {
        setStateAndHistory((current) => patchItemsByIds(current, 'measurements', ids, patch));
    }, [setStateAndHistory]);

    const removeEdgeArrows = useCallback((arrowIds) => {
        const idSet = new Set(arrowIds);
        if (selection?.type === 'edge-arrow') {
            const remaining = selection.ids?.filter((id) => !idSet.has(id)) || [];
            setSelection(remaining.length ? { type: 'edge-arrow', ids: remaining } : null);
        }
        setStateAndHistory((current) => removeItemsByIds(current, 'edgeArrows', arrowIds));
    }, [selection, setStateAndHistory]);

    const updateEdgeArrows = useCallback((arrowIds, patch) => {
        setStateAndHistory((current) => patchItemsByIds(current, 'edgeArrows', arrowIds, patch));
    }, [setStateAndHistory]);

    const removeBoldEdges = useCallback((edgeIds) => {
        const idSet = new Set(edgeIds);
        if (selection?.type === 'edge') {
            const remaining = selection.ids?.filter((id) => !idSet.has(id)) || [];
            setSelection(remaining.length ? { type: 'edge', ids: remaining } : null);
        }
        setStateAndHistory((current) => removeItemsByIds(current, 'boldEdges', edgeIds));
    }, [selection, setStateAndHistory]);

    const updateBoldEdges = useCallback((edgeIds, patch) => {
        setStateAndHistory((current) => patchItemsByIds(current, 'boldEdges', edgeIds, patch));
    }, [setStateAndHistory]);


    const resetDiagram = () => {
        if (window.confirm("Are you sure you want to create a new diagram? All current data will be lost.")) {
            const nextState = normalizeState(DEFAULT_STATE);
            applyState(nextState);
            setHistoryState({ entries: [JSON.stringify(nextState)], index: 0 });
        }
    };

    const resolveMeasurementY = useCallback((endpoint) => {
        if (endpoint?.kind === 'edge' && endpoint?.oscId) {
            const row = signalLayoutById.get(endpoint.oscId);
            if (row) return row.mid;
        }
        if (state.signals.length) {
            const firstId = state.signals[0].id;
            const firstRow = signalLayoutById.get(firstId);
            if (firstRow) {
                return Math.max(6, firstRow.top - 8);
            }
        }
        return 24;
    }, [signalLayoutById, state.signals]);

    const handleMeasurementEndpoint = useCallback((endpoint) => {
        if (!endpoint) return;
        if (creationMode === 'measure-start') {
            setMeasurementStart(endpoint);
            setCreationMode('measure-end');
            return;
        }
        if (creationMode === 'measure-end') {
            if (!measurementStart) return;
            const newId = generateId();
            const nextMeasurement = {
                id: newId,
                start: measurementStart,
                end: endpoint,
                color: '#000000',
                lineWidth: 1.2,
                arrowSize: state.settings.arrowSize,
                y: resolveMeasurementY(endpoint)
            };
            setStateAndHistory({
                ...state,
                measurements: [...(state.measurements || []), nextMeasurement],
                layers: {
                    ...state.layers,
                    measurements: [...(state.layers?.measurements || []), newId]
                }
            });
            setMeasurementStart(null);
            setCreationMode('measure-start');
        }
    }, [creationMode, measurementStart, resolveMeasurementY, state, setStateAndHistory]);

    const toggleBoldEdge = (edgeId, pointInfo) => {
        if (creationMode && creationMode.startsWith('measure')) {
            if (pointInfo.counterId) return;
            if (!pointInfo.oscId) return;
            handleMeasurementEndpoint({ kind: 'edge', oscId: pointInfo.oscId, edgeIndex: pointInfo.edgeIndex });
            return;
        }
        if (creationMode === 'delete') {
            const existing = state.boldEdges.find((edge) => edge.id === edgeId);
            if (existing) removeBoldEdges([edgeId]);
            return;
        }
        if (creationMode === null) return;

        if (creationMode === 'bold') {
            if (pointInfo.counterId) return;
            const existing = state.boldEdges.find((edge) => edge.id === edgeId);
            if (existing) {
                removeBoldEdges([edgeId]);
            } else {
                const nextBoldEdges = [...state.boldEdges, { id: edgeId, weight: state.settings.boldWeight }];
                setStateAndHistory({ ...state, boldEdges: nextBoldEdges });
                if (!state.settings.autoBoldEdge) {
                    setSelection({ type: 'edge', ids: [edgeId] });
                }
            }
            if (!state.settings.autoBoldEdge) {
                setCreationMode(null);
            }
            return;
        }

        if (creationMode === 'edge-arrow') {
            if (pointInfo.counterId) return;
            const existing = state.edgeArrows.find((arrow) => arrow.oscId === pointInfo.oscId && arrow.edgeIndex === pointInfo.edgeIndex);
            if (existing) {
                removeEdgeArrows([existing.id]);
            } else {
                const newId = generateId();
                const labelText = String(state.settings.edgeArrowLabelText || '');
                const nextArrows = [
                    ...state.edgeArrows,
                    {
                        id: newId,
                        oscId: pointInfo.oscId,
                        edgeIndex: pointInfo.edgeIndex,
                        type: state.settings.edgeArrowType,
                        size: state.settings.edgeArrowSize,
                        ratio: state.settings.edgeArrowRatio,
                        color: state.settings.edgeArrowColor,
                        ...(labelText.trim().length ? {
                            arrowLabel: {
                                text: labelText,
                                size: state.settings.edgeArrowLabelSize ?? state.settings.fontSize,
                                position: state.settings.edgeArrowLabelPosition || 'above'
                            }
                        } : {})
                    }
                ];
                setStateAndHistory({
                    ...state,
                    edgeArrows: nextArrows,
                    layers: {
                        ...state.layers,
                        edgeArrows: [...(state.layers?.edgeArrows || []), newId]
                    }
                });
                if (!state.settings.autoEdgeArrow) {
                    setSelection({ type: 'edge-arrow', ids: [newId] });
                }
            }
            if (!state.settings.autoEdgeArrow) {
                setCreationMode(null);
            }
            return;
        }

        if (creationMode === 'guide') {
            if (pointInfo.oscId) {
                const ref = {
                    id: generateId(),
                    oscId: pointInfo.oscId,
                    edgeIndex: pointInfo.edgeIndex,
                    style: state.settings.guideStyle,
                    lineWidth: state.settings.guideLineWidth,
                    dashLength: state.settings.guideDashLength,
                    dashGap: state.settings.guideDashGap
                };
                const nextGuides = [...state.guides, ref];
                setStateAndHistory({
                    ...state,
                    guides: nextGuides,
                    layers: {
                        ...state.layers,
                        guides: [...(state.layers?.guides || []), ref.id]
                    }
                });
                if (!state.settings.autoGuide) {
                    setCreationMode(null);
                    setSelection({ type: 'guide', ids: [ref.id] });
                }
            }
        } else if (creationMode === 'zone-start') {
            if (pointInfo.oscId) {
                setTempStart(pointInfo);
                setCreationMode('zone-end');
            }
        } else if (creationMode === 'zone-end') {
            if (pointInfo.oscId) {
                const newId = generateId();
                const nextZones = [...state.zones, {
                    id: newId,
                    start: { oscId: tempStart.oscId, edgeIndex: tempStart.edgeIndex },
                    end: { oscId: pointInfo.oscId, edgeIndex: pointInfo.edgeIndex },
                    oscillatorId: pointInfo.oscId,
                    hatchType: state.settings.hatchType,
                    color: state.settings.zoneColor,
                    borderWidth: state.settings.zoneBorderWidth,
                    patternWidth: state.settings.zonePatternWidth
                }];
                setCreationMode(state.settings.autoZone ? 'zone-start' : null);
                setTempStart(null);
                setStateAndHistory({
                    ...state,
                    zones: nextZones,
                    layers: {
                        ...state.layers,
                        zones: [...(state.layers?.zones || []), newId]
                    }
                });
                if (!state.settings.autoZone) {
                    setSelection({ type: 'zone', ids: [newId] });
                }
            }
        } else if (creationMode === 'link-start') {
            setTempStart(pointInfo);
            setCreationMode('link-end');
        } else if (creationMode === 'link-end') {
            const newId = generateId();
            const nextLinks = [...state.links, {
                id: newId,
                start: tempStart,
                end: pointInfo,
                color: state.settings.linkColor,
                style: state.settings.linkStyle,
                lineWidth: state.settings.linkLineWidth,
                dashLength: state.settings.linkDashLength,
                dashGap: state.settings.linkDashGap,
                arrowSize: state.settings.arrowSize,
                startMarker: state.settings.linkStartMarker,
                endMarker: state.settings.linkEndMarker
            }];
            setCreationMode(state.settings.autoLink ? 'link-start' : null);
            setTempStart(null);
            setStateAndHistory({
                ...state,
                links: nextLinks,
                layers: {
                    ...state.layers,
                    links: [...(state.layers?.links || []), newId]
                }
            });
            if (!state.settings.autoLink) {
                setSelection({ type: 'link', ids: [newId] });
            }
        }
    };

    const selectedGuideIds = useMemo(
        () => (selection?.type === 'guide' ? (selection.ids || []) : []),
        [selection]
    );
    const selectedZoneIds = useMemo(
        () => (selection?.type === 'zone' ? (selection.ids || []) : []),
        [selection]
    );
    const selectedLinkIds = useMemo(
        () => (selection?.type === 'link' ? (selection.ids || []) : []),
        [selection]
    );
    const selectedEdgeIds = useMemo(
        () => (selection?.type === 'edge' ? (selection.ids || []) : []),
        [selection]
    );
    const selectedArrowIds = useMemo(
        () => (selection?.type === 'edge-arrow' ? (selection.ids || []) : []),
        [selection]
    );
    const selectedMeasurementIds = useMemo(
        () => (selection?.type === 'measurement' ? (selection.ids || []) : []),
        [selection]
    );

    const selectedGuides = selectedGuideIds.map((id) => state.guides.find((guide) => guide.id === id)).filter(Boolean);
    const selectedZones = selectedZoneIds.map((id) => state.zones.find((zone) => zone.id === id)).filter(Boolean);
    const selectedLinks = selectedLinkIds.map((id) => state.links.find((link) => link.id === id)).filter(Boolean);
    const selectedEdges = selectedEdgeIds.map((id) => boldEdgeMap.get(id)).filter(Boolean);
    const selectedArrows = selectedArrowIds.map((id) => state.edgeArrows.find((arrow) => arrow.id === id)).filter(Boolean);
    const selectedMeasurements = selectedMeasurementIds.map((id) => (state.measurements || []).find((m) => m.id === id)).filter(Boolean);

    const selectedGuide = selectedGuides[0] || null;
    const selectedZone = selectedZones[0] || null;
    const selectedLink = selectedLinks[0] || null;
    const selectedEdge = selectedEdges[0] || null;
    const selectedArrow = selectedArrows[0] || null;
    const selectedMeasurement = selectedMeasurements[0] || null;

    const copyFromElement = useCallback((type, element) => {
        if (type === 'guide') {
            setStyleClipboard({
                type: 'guide',
                style: {
                    style: element.style ?? state.settings.guideStyle,
                    lineWidth: element.lineWidth ?? state.settings.guideLineWidth,
                    dashLength: element.dashLength ?? state.settings.guideDashLength,
                    dashGap: element.dashGap ?? state.settings.guideDashGap
                }
            });
        } else if (type === 'zone') {
            setStyleClipboard({
                type: 'zone',
                style: {
                    hatchType: element.hatchType ?? state.settings.hatchType,
                    color: element.color ?? state.settings.zoneColor,
                    borderWidth: element.borderWidth ?? state.settings.zoneBorderWidth,
                    patternWidth: element.patternWidth ?? state.settings.zonePatternWidth
                }
            });
        } else if (type === 'link') {
            setStyleClipboard({
                type: 'link',
                style: {
                    style: element.style ?? state.settings.linkStyle,
                    lineWidth: element.lineWidth ?? state.settings.linkLineWidth,
                    dashLength: element.dashLength ?? state.settings.linkDashLength,
                    dashGap: element.dashGap ?? state.settings.linkDashGap,
                    color: element.color ?? state.settings.linkColor,
                    arrowSize: element.arrowSize ?? state.settings.arrowSize,
                    startMarker: element.startMarker ?? state.settings.linkStartMarker,
                    endMarker: element.endMarker ?? state.settings.linkEndMarker
                }
            });
        } else if (type === 'edge') {
            setStyleClipboard({
                type: 'edge',
                style: {
                    weight: element.weight ?? state.settings.boldWeight
                }
            });
        } else if (type === 'edge-arrow') {
            setStyleClipboard({
                type: 'edge-arrow',
                style: {
                    type: element.type ?? state.settings.edgeArrowType,
                    size: element.size ?? state.settings.edgeArrowSize,
                    ratio: element.ratio ?? state.settings.edgeArrowRatio,
                    color: element.color ?? state.settings.edgeArrowColor
                }
            });
        }
    }, [state.settings]);

    const pasteToElement = useCallback((type, element) => {
        if (!styleClipboard || styleClipboard.type !== type) return;
        if (type === 'guide') {
            const nextGuides = state.guides.map((guide) =>
                guide.id === element.id ? { ...guide, ...styleClipboard.style } : guide
            );
            setStateAndHistory({ ...state, guides: nextGuides });
        } else if (type === 'zone') {
            const nextZones = state.zones.map((zone) =>
                zone.id === element.id ? { ...zone, ...styleClipboard.style } : zone
            );
            setStateAndHistory({ ...state, zones: nextZones });
        } else if (type === 'link') {
            const nextLinks = state.links.map((link) =>
                link.id === element.id ? { ...link, ...styleClipboard.style } : link
            );
            setStateAndHistory({ ...state, links: nextLinks });
        } else if (type === 'edge') {
            updateBoldEdges([element.id], { weight: styleClipboard.style.weight });
        } else if (type === 'edge-arrow') {
            const nextArrows = state.edgeArrows.map((arrow) =>
                arrow.id === element.id ? { ...arrow, ...styleClipboard.style } : arrow
            );
            setStateAndHistory({ ...state, edgeArrows: nextArrows });
        }
    }, [styleClipboard, state, setStateAndHistory, updateBoldEdges]);

    const copyFromSelection = useCallback(() => {
        if (selectedGuide) copyFromElement('guide', selectedGuide);
        else if (selectedZone) copyFromElement('zone', selectedZone);
        else if (selectedLink) copyFromElement('link', selectedLink);
        else if (selectedEdge) copyFromElement('edge', selectedEdge);
        else if (selectedArrow) copyFromElement('edge-arrow', selectedArrow);
    }, [selectedGuide, selectedZone, selectedLink, selectedEdge, selectedArrow, copyFromElement]);

    const pasteToSelection = useCallback(() => {
        if (!styleClipboard || !selection) return;
        if (selection.type === 'guide' && selectedGuideIds.length) {
            updateGuides(selectedGuideIds, styleClipboard.style);
        } else if (selection.type === 'zone' && selectedZoneIds.length) {
            updateZones(selectedZoneIds, styleClipboard.style);
        } else if (selection.type === 'link' && selectedLinkIds.length) {
            updateLinks(selectedLinkIds, styleClipboard.style);
        } else if (selection.type === 'edge' && selectedEdgeIds.length) {
            updateBoldEdges(selectedEdgeIds, styleClipboard.style);
        } else if (selection.type === 'edge-arrow' && selectedArrowIds.length) {
            updateEdgeArrows(selectedArrowIds, styleClipboard.style);
        }
    }, [styleClipboard, selection, selectedGuideIds, selectedZoneIds, selectedLinkIds, selectedEdgeIds, selectedArrowIds, updateGuides, updateZones, updateLinks, updateBoldEdges, updateEdgeArrows]);

    const handleElementClick = useCallback((type, element, modifiers = {}) => {
        const applySelection = () => {
            const multi = modifiers.multi;
            if (!multi) {
                setSelection({ type, ids: [element.id] });
                return;
            }
            setSelection((prev) => {
                if (!prev) return { type, ids: [element.id] };
                if (prev.type !== type) return prev;
                const ids = prev.ids || [];
                const exists = ids.includes(element.id);
                const nextIds = exists ? ids.filter((id) => id !== element.id) : [...ids, element.id];
                return nextIds.length ? { type, ids: nextIds } : null;
            });
        };

        if (cursorFilter) {
            applySelection();
            return;
        }

        if (creationMode === 'delete') return;
        if (creationMode && creationMode.startsWith('measure')) {
            if (type === 'guide' && element?.id) {
                handleMeasurementEndpoint({ kind: 'guide', guideId: element.id });
            }
            return;
        }
        if (creationMode === 'copy') {
            copyFromElement(type, element);
            setSelection({ type, ids: [element.id] });
            setCreationMode(null);
            return;
        }
        if (creationMode === 'paste') {
            if (styleClipboard?.type === type) {
                pasteToElement(type, element);
                setSelection({ type, ids: [element.id] });
                setCreationMode(null);
            }
            return;
        }
        if (creationMode === null) {
            applySelection();
        }
    }, [cursorFilter, creationMode, copyFromElement, pasteToElement, styleClipboard, setSelection, handleMeasurementEndpoint]);

    const handleCopyButton = useCallback(() => {
        if (selection?.ids?.length) {
            copyFromSelection();
            return;
        }
        setCreationMode((prev) => (prev === 'copy' ? null : 'copy'));
    }, [selection, copyFromSelection]);

    const handlePasteButton = useCallback(() => {
        if (!styleClipboard) return;
        setCreationMode((prev) => (prev === 'paste' ? null : 'paste'));
    }, [styleClipboard]);

    const canPaste = Boolean(styleClipboard);
    const clipboardType = styleClipboard?.type ?? null;

    const sanitizeFileBaseName = (rawName) => {
        const source = (String(rawName || '').trim() || 'timing-diagram');
        const cleaned = source
            .split('')
            .filter((ch) => ch.charCodeAt(0) >= 32 && !/[<>:"/\\|?*]/.test(ch))
            .join('');
        return cleaned
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    };

    useEffect(() => {
        const handler = (event) => {
            const key = event.key.toLowerCase();
            const isMac = navigator.platform.toUpperCase().includes('MAC');
            const hasModifier = isMac ? event.metaKey : event.ctrlKey;
            if (!hasModifier) return;
            const tagName = event.target?.tagName;
            if (tagName && ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName)) return;
            if (key === 'c') {
                event.preventDefault();
                if (selection?.ids?.length) {
                    copyFromSelection();
                } else {
                    setCreationMode('copy');
                }
            } else if (key === 'v') {
                event.preventDefault();
                if (selection && styleClipboard?.type === selection.type) {
                    pasteToSelection();
                } else if (styleClipboard) {
                    setCreationMode('paste');
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [selection, styleClipboard, copyFromSelection, pasteToSelection]);

    const downloadSVG = () => {
        const svgElement = document.querySelector('.diagram-canvas svg');
        if (!svgElement) return;
        const baseName = sanitizeFileBaseName(state.diagramName);
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = svgUrl;
        downloadLink.download = `${baseName || 'timing-diagram'}.svg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        setTimeout(() => URL.revokeObjectURL(svgUrl), 0);
    };

    const saveConfig = () => {
        const baseName = sanitizeFileBaseName(state.diagramName);
        const data = JSON.stringify(state, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${baseName || 'timing-diagram'}_settings.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const config = JSON.parse(event.target.result);
                if (typeof config !== 'object') throw new Error('Invalid JSON');
                const normalized = normalizeState(config);
                applyState(normalized);
                saveToHistory(normalized);
            } catch {
                alert("Invalid config file");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const clampZoom = (nextZoom) => Math.min(ZOOM.MAX, Math.max(ZOOM.MIN, nextZoom));
    const zoomIn = () => setCanvasZoom((prev) => clampZoom(parseFloat((prev + ZOOM.STEP).toFixed(3))));
    const zoomOut = () => setCanvasZoom((prev) => clampZoom(parseFloat((prev - ZOOM.STEP).toFixed(3))));
    const handleCanvasWheel = (event) => {
        if (!(event.ctrlKey || event.metaKey)) return;
        event.preventDefault();
        const direction = event.deltaY < 0 ? 1 : -1;
        const intensity = Math.min(3, Math.max(1, Math.abs(event.deltaY) / 120));
        const step = ZOOM.STEP * intensity;
        setCanvasZoom((prev) => clampZoom(parseFloat((prev + direction * step).toFixed(3))));
    };

    const bounds = useMemo(() => {
        const baseWidth = state.settings.duration * state.settings.timeScale + DIAGRAM_LABEL_COLUMN_WIDTH + DIAGRAM_PADDING;
        const baseHeight = computeDiagramHeightFromLayout(signalLayoutRows);
        const extraLeftLabel = Math.max(0, -(state.settings.labelX || 0));

        let viewBoxX = -extraLeftLabel;
        let viewBoxY = 0;
        let width = baseWidth + extraLeftLabel;
        let height = baseHeight;

        const legendSize = estimateLegendSize(state.legend, { fontSize: state.settings.fontSize });
        let legendBox = null;
        if (legendSize.width > 0 && legendSize.height > 0) {
            const pos = resolveLegendPosition(state.legend, legendSize, { baseWidth });
            legendBox = { x: pos.x, y: pos.y, width: legendSize.width, height: legendSize.height, ...legendSize };

            const minX = legendBox.x;
            const maxX = legendBox.x + legendBox.width;
            const minY = legendBox.y;
            const maxY = legendBox.y + legendBox.height;

            const currentMaxX = viewBoxX + width;
            if (minX < viewBoxX) {
                const extraLeft = viewBoxX - minX;
                viewBoxX = minX;
                width += extraLeft;
            }
            if (maxX > currentMaxX) {
                width += (maxX - currentMaxX);
            }

            const currentMaxY = viewBoxY + height;
            if (minY < viewBoxY) {
                const extraTop = viewBoxY - minY;
                viewBoxY = minY;
                height += extraTop;
            }
            if (maxY > currentMaxY) {
                height += (maxY - currentMaxY);
            }
        }

        return { width, height, viewBoxX, viewBoxY, legendBox };
    }, [state.settings.duration, state.settings.timeScale, state.settings.labelX, state.settings.fontSize, state.legend, signalLayoutRows]);

    const diagramWidth = bounds.width;
    const diagramHeight = bounds.height;
    const zoomToFit = () => {
        const stage = canvasStageRef.current;
        if (!stage || !diagramWidth || !diagramHeight) return;

        const style = window.getComputedStyle(stage);
        const paddingX = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
        const paddingY = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
        const safety = 24;
        const availableWidth = Math.max(0, stage.clientWidth - paddingX - safety);
        const availableHeight = Math.max(0, stage.clientHeight - paddingY - safety);
        if (!availableWidth || !availableHeight) return;

        const fitZoom = availableWidth / diagramWidth;
        const fitHeightZoom = availableHeight / diagramHeight;
        const nextZoom = clampZoom(parseFloat((Math.min(fitZoom, fitHeightZoom) * 0.995).toFixed(3)));
        setCanvasZoom(nextZoom);
    };

    const startSideResize = (side) => (event) => {
        event.preventDefault();
        event.stopPropagation();

        const startX = event.clientX;
        const startWidth = side === 'left' ? leftPanelWidth : rightPanelWidth;
        const minWidth = side === 'left' ? PANELS.LEFT_MIN_WIDTH : PANELS.RIGHT_MIN_WIDTH;
        const maxWidth = side === 'left' ? PANELS.LEFT_MAX_WIDTH : PANELS.RIGHT_MAX_WIDTH;

        const prevCursor = document.body.style.cursor;
        const prevUserSelect = document.body.style.userSelect;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const onMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const rawNext = side === 'left' ? startWidth + deltaX : startWidth - deltaX;
            const next = Math.max(minWidth, Math.min(maxWidth, rawNext));
            if (side === 'left') {
                setLeftPanelWidth(next);
            } else {
                setRightPanelWidth(next);
            }
        };

        const cleanup = () => {
            window.removeEventListener('pointermove', onMove);
            document.body.style.cursor = prevCursor;
            document.body.style.userSelect = prevUserSelect;
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', cleanup, { once: true });
        window.addEventListener('pointercancel', cleanup, { once: true });
    };

    return (
        <div className="app-container">
            <TopBar
                diagramName={state.diagramName}
                onDiagramNameCommit={updateDiagramName}
                fileInputRef={fileInputRef}
                handleFileUpload={handleFileUpload}
                resetDiagram={resetDiagram}
                saveConfig={saveConfig}
                undo={undo}
                redo={redo}
                historyIndex={historyState.index}
                historyLength={historyState.entries.length}
                downloadSVG={downloadSVG}
            />

            <div className="main-body">
                <SignalsPanel
                    style={{ width: leftPanelWidth }}
                    signals={state.signals}
                    oscillatorsOnly={oscillatorsOnly}
                    addOscillator={addOscillator}
                    addCounter={addCounter}
                    updateSignal={updateSignalValue}
                    removeSignal={removeSignal}
                    reorderSignals={reorderSignals}
                    handleSignalScroll={handleSignalScroll}
                />

                <div
                    className="panel-resizer panel-resizer-vertical"
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Resize left panel"
                    tabIndex={0}
                    onPointerDown={startSideResize('left')}
                />

                <main className="main-content">
                    <div className="canvas-toolbar-shell">
                        <CanvasToolbar
                            creationMode={creationMode}
                            setCreationMode={(nextMode) => {
                                const nextSelectionType = getModeSelectionType(nextMode);
                                const isSpecial = nextMode === 'delete' || nextMode === 'copy' || nextMode === 'paste';
                                if (nextMode && !isSpecial) {
                                    setSelection(null);
                                }
                                if (!nextMode || !String(nextMode).startsWith('measure')) {
                                    setMeasurementStart(null);
                                } else if (nextMode === 'measure-start') {
                                    setMeasurementStart(null);
                                }
                                if (!nextSelectionType || (cursorFilter && cursorFilter !== nextSelectionType)) {
                                    setCursorFilter(null);
                                }
                                setCreationMode(nextMode);
                            }}
                            cursorFilter={cursorFilter}
                            setCursorFilter={(next) => {
                                setCursorFilter(next);
                            }}
                            onCopyStyle={handleCopyButton}
                            onPasteStyle={handlePasteButton}
                            canPaste={canPaste}
                        />
                    </div>
                    <div ref={canvasStageRef} className="canvas-stage" onClick={() => setSelection(null)} onWheel={handleCanvasWheel}>
                        <div className="canvas-stage-inner">
                            <div className="diagram-zoom-shell" style={{ width: diagramWidth * canvasZoom, height: diagramHeight * canvasZoom }}>
                                <div className="diagram-zoom-inner" style={{ transform: `scale(${canvasZoom})` }}>
                                    <div className="diagram-canvas">
                                        <Diagram
                                            diagramName={state.diagramName}
                                            legend={state.legend}
                                            bounds={bounds}
                                            signals={state.signals}
                                            boldEdges={boldEdgeMap}
                                            toggleBoldEdge={toggleBoldEdge}
                                            duration={state.settings.duration}
                                            spacing={state.settings.spacing}
                                            timeScale={state.settings.timeScale}
                                            lineWidth={state.settings.lineWidth}
                                            boldWeight={state.settings.boldWeight}
                                            edgeArrows={state.edgeArrows}
                                            edgeArrowType={state.settings.edgeArrowType}
                                            edgeArrowSize={state.settings.edgeArrowSize}
                                            edgeArrowRatio={state.settings.edgeArrowRatio}
                                            edgeArrowColor={state.settings.edgeArrowColor}
                                            fontSize={state.settings.fontSize}
                                            fontFamily={state.settings.fontFamily}
                                            boldLabels={state.settings.boldLabels}
                                            labelX={state.settings.labelX}
                                            labelYOffset={state.settings.labelYOffset}
                                            labelJustify={state.settings.labelJustify}
                                            guides={state.guides}
                                            zones={state.zones}
                                            links={state.links}
                                            layers={state.layers}
                                            measurements={state.measurements}
                                            creationMode={creationMode}
                                            clipboardType={clipboardType}
                                            deleteGuide={deleteGuide}
                                            deleteZone={deleteZone}
                                            deleteLink={deleteLink}
                                            deleteMeasurement={deleteMeasurement}
                                            deleteEdgeArrow={deleteEdgeArrow}
                                            linkLineWidth={state.settings.linkLineWidth}
                                            linkStyle={state.settings.linkStyle}
                                            linkDashLength={state.settings.linkDashLength}
                                            linkDashGap={state.settings.linkDashGap}
                                            linkStartMarker={state.settings.linkStartMarker}
                                            linkEndMarker={state.settings.linkEndMarker}
                                            linkColor={state.settings.linkColor}
                                            arrowSize={state.settings.arrowSize}
                                            guideLineWidth={state.settings.guideLineWidth}
                                            guideStyle={state.settings.guideStyle}
                                            guideDashLength={state.settings.guideDashLength}
                                            guideDashGap={state.settings.guideDashGap}
                                            guideExtraHeight={state.settings.guideExtraHeight}
                                            guideUseRelativeExtents={state.settings.guideUseRelativeExtents}
                                            guideUpperExtension={state.settings.guideUpperExtension}
                                            guideLowerExtension={state.settings.guideLowerExtension}
                                            oscWaveHeight={state.settings.oscWaveHeight}
                                            counterWaveHeight={state.settings.counterWaveHeight}
                                            signalSpacingMode={state.settings.signalSpacingMode}
                                            zoneBorderWidth={state.settings.zoneBorderWidth}
                                            zonePatternWidth={state.settings.zonePatternWidth}
                                            hatchType={state.settings.hatchType}
                                            zoneColor={state.settings.zoneColor}
                                            counterFontSize={state.settings.counterFontSize}
                                            selection={selection}
                                            onElementClick={handleElementClick}
                                            cursorFilter={cursorFilter}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="canvas-zoom-controls">
                        <button className="canvas-zoom-btn" onClick={zoomIn} aria-label="Zoom in" title="Zoom in">+</button>
                        <button className="canvas-zoom-btn" onClick={zoomOut} aria-label="Zoom out" title="Zoom out">−</button>
                        <button className="canvas-zoom-btn canvas-zoom-fit-btn" onClick={zoomToFit} aria-label="Zoom to fit" title="Zoom to fit">
                            <IconZoomFit />
                        </button>
                    </div>
                </main>

                <div
                    className="panel-resizer panel-resizer-vertical"
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Resize right panel"
                    tabIndex={0}
                    onPointerDown={startSideResize('right')}
                />

                <RightSidebar
                    style={{ width: rightPanelWidth }}
                    settings={state.settings}
                    legend={state.legend}
                    updateSettings={updateSettings}
                    applyStateBatch={(updater) => setStateAndHistory(updater)}
                    handleSettingScroll={handleSettingScroll}
                    selection={selection}
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
                    guides={state.guides}
                    zones={state.zones}
                    links={state.links}
                    boldEdges={state.boldEdges}
                    edgeArrows={state.edgeArrows}
                    measurements={state.measurements}
                    updateGuides={updateGuides}
                    updateZones={updateZones}
                    updateLinks={updateLinks}
                    updateMeasurements={updateMeasurements}
                    updateBoldEdges={updateBoldEdges}
                    updateEdgeArrows={updateEdgeArrows}
                    creationMode={creationMode}
                />
            </div>
        </div >
    );
}

export default App;
