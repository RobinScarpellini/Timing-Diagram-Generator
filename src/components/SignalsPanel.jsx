import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NumberField, SelectField } from './InputFields';
import { ColorPicker } from './ColorPicker';

const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const IconTrash = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
const IconInverse = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 2.1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 21.9l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>;
const IconChevronDown = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>;
const IconChevronUp = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>;

const SignalsPanel = ({
    style,
    signals,
    oscillatorsOnly,
    addOscillator,
    addCounter,
    updateSignal,
    removeSignal,
    reorderSignals,
    handleSignalScroll
}) => {
    const scrollRef = useRef(null);
    const [expanded, setExpanded] = useState(() => new Set());
    const cardRefs = useRef(new Map());
    const prevRects = useRef(new Map());
    const [draggingId, setDraggingId] = useState(null);
    const dragPreviewCleanupRef = useRef(null);
    const lastPointerYRef = useRef(null);
    const lastPointerDirectionRef = useRef(null);
    const lastReorderRef = useRef({ targetId: null, direction: null });

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return undefined;

        const handleWheel = (event) => {
            const active = document.activeElement;
            if (!active) return;
            if (active.tagName !== 'INPUT' || active.type !== 'number') return;
            if (!container.contains(active)) return;
            event.preventDefault();
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, []);

    useEffect(() => () => {
        if (!dragPreviewCleanupRef.current) return;
        dragPreviewCleanupRef.current();
        dragPreviewCleanupRef.current = null;
    }, []);

    useLayoutEffect(() => {
        // FLIP animation for reorder: animate cards to their new positions after drop.
        const nextRects = new Map();
        signals.forEach((sig) => {
            const node = cardRefs.current.get(sig.id);
            if (!node) return;
            nextRects.set(sig.id, node.getBoundingClientRect());
        });

        const prev = prevRects.current;
        signals.forEach((sig) => {
            const node = cardRefs.current.get(sig.id);
            const prevRect = prev.get(sig.id);
            const nextRect = nextRects.get(sig.id);
            if (!node || !prevRect || !nextRect || sig.id === draggingId) return;

            const dx = prevRect.left - nextRect.left;
            const dy = prevRect.top - nextRect.top;
            if (!dx && !dy) return;

            node.style.transition = 'none';
            node.style.transform = `translate(${dx}px, ${dy}px)`;

            window.requestAnimationFrame(() => {
                node.style.transition = 'transform 140ms ease';
                node.style.transform = '';
            });
        });

        prevRects.current = nextRects;
    }, [signals, draggingId]);

    return (
        <div className="sidebar" style={style}>
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto' }}>
                {signals.map((sig, sigIdx) => (
                    <div
                        key={sig.id}
                        ref={(node) => {
                            if (node) {
                                cardRefs.current.set(sig.id, node);
                            } else {
                                cardRefs.current.delete(sig.id);
                            }
                        }}
                        className={`signal-card ${expanded.has(sig.id) ? 'expanded' : ''} ${draggingId === sig.id ? 'dragging' : ''}`}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            const sourceId = draggingId || e.dataTransfer.getData('text/plain');
                            if (!sourceId || sourceId === sig.id) return;

                            const currentY = e.clientY;
                            const previousY = lastPointerYRef.current;
                            let pointerDirection = lastPointerDirectionRef.current;
                            if (previousY !== null && currentY !== previousY) {
                                pointerDirection = currentY > previousY ? 'down' : 'up';
                                lastPointerDirectionRef.current = pointerDirection;
                            }
                            lastPointerYRef.current = currentY;
                            if (!pointerDirection) return;

                            const sourceIndex = signals.findIndex((item) => item.id === sourceId);
                            const targetIndex = signals.findIndex((item) => item.id === sig.id);
                            if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;

                            const relationDirection = targetIndex > sourceIndex ? 'down' : 'up';
                            if (relationDirection !== pointerDirection) return;

                            const nextIndex = sourceIndex + (pointerDirection === 'down' ? 1 : -1);
                            const nextTarget = signals[nextIndex];
                            if (!nextTarget || nextTarget.id === sourceId) return;

                            if (lastReorderRef.current.targetId === nextTarget.id && lastReorderRef.current.direction === pointerDirection) return;
                            lastReorderRef.current = { targetId: nextTarget.id, direction: pointerDirection };
                            reorderSignals(sourceId, nextTarget.id);
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            const sourceId = draggingId || e.dataTransfer.getData('text/plain');
                            if (!sourceId || sourceId === sig.id) return;
                            reorderSignals(sourceId, sig.id);
                        }}
                    >
                        <div className="signal-card-header">
                            <button
                                className="signal-drag-handle"
                                draggable
                                onDragStart={(e) => {
                                    if (dragPreviewCleanupRef.current) {
                                        dragPreviewCleanupRef.current();
                                        dragPreviewCleanupRef.current = null;
                                    }
                                    e.dataTransfer.effectAllowed = 'move';
                                    e.dataTransfer.setData('text/plain', sig.id);
                                    setDraggingId(sig.id);
                                    lastPointerYRef.current = null;
                                    lastPointerDirectionRef.current = null;
                                    lastReorderRef.current = { targetId: null, direction: null };

                                    const cardNode = e.currentTarget.closest('.signal-card');
                                    if (!cardNode || !e.dataTransfer.setDragImage) return;
                                    const rect = cardNode.getBoundingClientRect();
                                    const previewNode = cardNode.cloneNode(true);
                                    previewNode.classList.add('signal-card-drag-preview');
                                    previewNode.style.position = 'fixed';
                                    previewNode.style.top = '-9999px';
                                    previewNode.style.left = '-9999px';
                                    previewNode.style.pointerEvents = 'none';
                                    previewNode.style.width = `${rect.width}px`;
                                    document.body.appendChild(previewNode);
                                    e.dataTransfer.setDragImage(previewNode, e.clientX - rect.left, e.clientY - rect.top);
                                    dragPreviewCleanupRef.current = () => {
                                        previewNode.remove();
                                    };
                                }}
                                onDragEnd={() => {
                                    setDraggingId(null);
                                    lastPointerYRef.current = null;
                                    lastPointerDirectionRef.current = null;
                                    lastReorderRef.current = { targetId: null, direction: null };
                                    if (!dragPreviewCleanupRef.current) return;
                                    dragPreviewCleanupRef.current();
                                    dragPreviewCleanupRef.current = null;
                                }}
                                title="Reorder"
                                aria-label={`Reorder ${sig.name || `signal ${sigIdx + 1}`}`}
                            >
                                #
                            </button>

                            <ColorPicker color={sig.color} onChange={(c) => updateSignal(sig.id, 'color', c)} label="" variant="compact" />

                            <input
                                className="signal-label-input"
                                value={sig.name}
                                onChange={(e) => updateSignal(sig.id, 'name', e.target.value)}
                                placeholder={sig.type === 'oscillator' ? 'Oscillator label' : 'Counter label'}
                            />

                            {sig.type === 'oscillator' ? (
                                <button
                                    className={`signal-icon-btn ${sig.inverted ? 'active' : ''}`}
                                    onClick={() => updateSignal(sig.id, 'inverted', !sig.inverted)}
                                    title="Invert"
                                    aria-label="Invert"
                                >
                                    <IconInverse />
                                </button>
                            ) : (
                                <button
                                    className={`signal-icon-btn signal-polarity-btn ${(sig.polarity || 'rising') === 'falling' ? 'active' : ''}`}
                                    onClick={() => updateSignal(sig.id, 'polarity', (sig.polarity || 'rising') === 'falling' ? 'rising' : 'falling')}
                                    title={`Edge: ${(sig.polarity || 'rising') === 'falling' ? 'Falling' : 'Rising'} (click to toggle)`}
                                    aria-label="Toggle polarity"
                                >
                                    {(sig.polarity || 'rising') === 'falling' ? 'F' : 'R'}
                                </button>
                            )}

                            <button
                                className="signal-icon-btn signal-delete-btn"
                                onClick={() => removeSignal(sig.id)}
                                title="Delete"
                                aria-label="Delete"
                            >
                                <IconTrash />
                            </button>

                            <button
                                className="signal-icon-btn"
                                onClick={() => {
                                    setExpanded((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(sig.id)) next.delete(sig.id);
                                        else next.add(sig.id);
                                        return next;
                                    });
                                }}
                                title={expanded.has(sig.id) ? 'Collapse' : 'Expand'}
                                aria-label={expanded.has(sig.id) ? 'Collapse settings' : 'Expand settings'}
                            >
                                {expanded.has(sig.id) ? <IconChevronUp /> : <IconChevronDown />}
                            </button>
                        </div>

                        {expanded.has(sig.id) && (
                            <div className="signal-card-body">
                                <div className="grid-2">
                                    {sig.type === 'oscillator' ? (
                                        <>
                                            <NumberField label="Period" value={sig.period} step={10} onChange={(e) => updateSignal(sig.id, 'period', e.target.value)} onScroll={handleSignalScroll(sig.id, 'period', sig.period, 10, false)} />
                                            <NumberField label="Delay" value={sig.delay} step={5} onChange={(e) => updateSignal(sig.id, 'delay', e.target.value)} onScroll={handleSignalScroll(sig.id, 'delay', sig.delay, 5, true)} />
                                            <NumberField label="Edge Count" value={sig.edgeCount ?? -1} step={1} onChange={(e) => updateSignal(sig.id, 'edgeCount', e.target.value)} onScroll={handleSignalScroll(sig.id, 'edgeCount', sig.edgeCount ?? -1, 1, true)} />
                                            <div className="input-group edge-count-hint">
                                                <label />
                                                <div>-1 = infinite</div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <SelectField label="Ref" value={sig.referenceOscId || ''} onChange={(e) => updateSignal(sig.id, 'referenceOscId', e.target.value)} options={oscillatorsOnly.map((osc) => ({ value: osc.id, label: osc.name }))} />
                                            <SelectField label="Edge" value={sig.polarity} onChange={(e) => updateSignal(sig.id, 'polarity', e.target.value)} options={[{ value: 'rising', label: 'Rising' }, { value: 'falling', label: 'Falling' }]} />
                                            <NumberField
                                                label="Start"
                                                value={sig.startEdge || 1}
                                                onChange={(e) => updateSignal(sig.id, 'startEdge', Math.max(1, parseInt(e.target.value, 10) || 1))}
                                                onScroll={handleSignalScroll(sig.id, 'startEdge', sig.startEdge || 1, 1, false)}
                                            />
                                            <NumberField
                                                label="End"
                                                value={sig.endEdge || 10}
                                                onChange={(e) => updateSignal(sig.id, 'endEdge', Math.max(1, parseInt(e.target.value, 10) || 1))}
                                                onScroll={handleSignalScroll(sig.id, 'endEdge', sig.endEdge || 10, 1, false)}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="footer-btn-group">
                <div className="grid-2">
                    <button className="primary-btn" onClick={addOscillator} style={{ justifyContent: 'center', width: '100%', gap: '6px', padding: '8px 0' }}>
                        <IconPlus />
                        <span style={{ marginRight: '4px' }}>Oscillator</span>
                    </button>
                    <button className="primary-btn" onClick={addCounter} style={{ justifyContent: 'center', background: '#334155', width: '100%', gap: '6px', padding: '8px 0' }}>
                        <IconPlus />
                        <span style={{ marginRight: '4px' }}>Counter</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SignalsPanel;
