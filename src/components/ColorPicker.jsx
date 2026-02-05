import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const DEEP_PALETTE = ['#4c72b0', '#dd8452', '#55a868', '#c44e52', '#8172b3', '#937860', '#da8bc3', '#8c8c8c', '#ccb974', '#64b5cd'];
const TAB10_PALETTE = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];
const PRESET_SET = new Set([...DEEP_PALETTE, ...TAB10_PALETTE]);
const RECENT_STORAGE_KEY = 'tdg-color-recents';
const MAX_RECENTS = 9;

export const ColorPicker = ({
    color,
    onChange,
    label,
    initColor = '#000000',
    className = '',
    inputClassName = '',
    labelClassName = '',
    variant = 'full'
}) => {
    const resolveColor = (value, fallback) => {
        if (typeof value !== 'string') return fallback;
        const trimmed = value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
        const short = trimmed.match(/^#([0-9a-fA-F]{3})$/);
        if (short) return `#${short[1].split('').map((ch) => ch + ch).join('')}`;
        return fallback;
    };

    const resolvedColor = resolveColor(color, initColor);
    const containerRef = useRef(null);
    const colorInputRef = useRef(null);
    const panelRef = useRef(null);
    const pendingValueRef = useRef(resolvedColor);
    const [panelStyle, setPanelStyle] = useState({
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        visibility: 'hidden'
    });
    const [isOpen, setIsOpen] = useState(variant !== 'compact');
    const [recentColors, setRecentColors] = useState(() => {
        if (typeof window === 'undefined') return [];
        try {
            const stored = JSON.parse(window.localStorage.getItem(RECENT_STORAGE_KEY) || '[]');
            return Array.isArray(stored)
                ? stored.filter((item) => typeof item === 'string' && !PRESET_SET.has(item))
                : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        if (variant !== 'compact' || !isOpen) return;
        const handleClickOutside = (event) => {
            const inContainer = containerRef.current?.contains(event.target);
            const inPanel = panelRef.current?.contains(event.target);
            if (!inContainer && !inPanel) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [variant, isOpen]);

    const computePanelStyle = () => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) {
            return { position: 'fixed', top: '-9999px', left: '-9999px', visibility: 'hidden' };
        }
        const panel = panelRef.current;
        const panelWidth = panel?.offsetWidth || 260;
        const panelHeight = panel?.offsetHeight || 0;
        const gap = 6;
        let left = rect.left;
        const maxLeft = Math.max(8, window.innerWidth - panelWidth - 8);
        if (left > maxLeft) left = maxLeft;
        let top = rect.bottom + gap;
        const maxTop = Math.max(8, window.innerHeight - panelHeight - 8);
        if (panelHeight && top > maxTop) {
            top = Math.max(8, rect.top - gap - panelHeight);
        }
        return {
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            visibility: panelHeight ? 'visible' : 'hidden'
        };
    };

    useLayoutEffect(() => {
        if (variant !== 'compact' || !isOpen) return;
        const updatePosition = () => setPanelStyle(computePanelStyle());
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [variant, isOpen]);

    useEffect(() => {
        pendingValueRef.current = resolvedColor;
    }, [resolvedColor]);

    const updateRecents = (value) => {
        if (PRESET_SET.has(value)) return;
        setRecentColors((prev) => {
            const next = [value, ...prev.filter((item) => item !== value)].slice(0, MAX_RECENTS);
            try {
                window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
            } catch {
                // Ignore storage failures (private mode, quota, etc.)
            }
            return next;
        });
    };

    const handlePresetSelect = (value) => {
        const normalized = resolveColor(value, resolvedColor);
        if (typeof onChange === 'function') {
            onChange(normalized);
        }
    };

    const handleRecentSelect = (value) => {
        const normalized = resolveColor(value, resolvedColor);
        if (typeof onChange === 'function') {
            onChange(normalized);
        }
        updateRecents(normalized);
    };

    const handlePreview = (value) => {
        const normalized = resolveColor(value, resolvedColor);
        pendingValueRef.current = normalized;
    };

    const handleCommit = (value) => {
        const normalized = resolveColor(value ?? pendingValueRef.current, resolvedColor);
        updateRecents(normalized);
        if (typeof onChange === 'function') {
            onChange(normalized);
        }
    };

    const paletteSections = useMemo(() => ([
        { label: 'Deep', colors: DEEP_PALETTE },
        { label: 'Tab10', colors: TAB10_PALETTE }
    ]), []);

    const recentSlots = useMemo(() => {
        const slots = Array.from({ length: MAX_RECENTS }).fill(null);
        recentColors.slice(0, MAX_RECENTS).forEach((value, idx) => {
            slots[idx] = value;
        });
        return slots;
    }, [recentColors]);

    const showPanel = variant !== 'compact' || isOpen;
    const panelBody = showPanel ? (
        <div
            ref={panelRef}
            className={`color-picker-panel ${variant === 'compact' ? 'compact-panel' : ''}`}
            style={variant === 'compact' ? panelStyle : undefined}
        >
            {paletteSections.map((section) => (
                <div key={section.label} className="color-picker-row">
                    <div className="color-picker-row-title">{section.label}</div>
                    <div className="color-picker-row-swatches">
                        {section.colors.map((swatch) => (
                            <button
                                key={swatch}
                                type="button"
                                className={`color-picker-swatch-btn ${swatch === resolvedColor ? 'active' : ''}`}
                                style={{ backgroundColor: swatch }}
                                onClick={() => handlePresetSelect(swatch)}
                                title={swatch}
                                aria-label={`${section.label} color ${swatch}`}
                            />
                        ))}
                    </div>
                </div>
            ))}
            <div className="color-picker-row recent-row">
                <div className="color-picker-row-title">Recent</div>
                <div className="color-picker-row-swatches">
                    {recentSlots.map((swatch, index) => {
                        if (!swatch) {
                            return (
                                <button
                                    key={`empty-${index}`}
                                    type="button"
                                    className="color-picker-swatch-btn empty"
                                    aria-label="Empty recent color slot"
                                    disabled
                                />
                            );
                        }
                        return (
                            <button
                                key={swatch}
                                type="button"
                                className={`color-picker-swatch-btn ${swatch === resolvedColor ? 'active' : ''}`}
                                style={{ backgroundColor: swatch }}
                                onClick={() => handleRecentSelect(swatch)}
                                title={swatch}
                                aria-label={`Recent color ${swatch}`}
                            />
                        );
                    })}
                    <button
                        type="button"
                        className="color-picker-swatch-btn color-picker-custom-btn"
                        onClick={() => colorInputRef.current?.click()}
                        aria-label="Open color wheel"
                        title="Custom color"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 3v18" />
                            <path d="M3 12h18" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    ) : null;

    return (
        <div ref={containerRef} className={`input-group color-picker ${variant} ${className}`.trim()}>
            <div className="color-picker-header">
                {label && <label className={labelClassName} style={{ marginBottom: 0, marginTop: 0 }}>{label}</label>}
                <div className="color-picker-main">
                    <button
                        type="button"
                        className="color-picker-current"
                        title={resolvedColor}
                        aria-label="Toggle color presets"
                        style={{ backgroundColor: resolvedColor }}
                        onClick={() => {
                            if (variant === 'compact') {
                                setPanelStyle(computePanelStyle());
                                setIsOpen((prev) => !prev);
                            }
                        }}
                    />
                    <input
                        ref={colorInputRef}
                        type="color"
                        value={resolvedColor}
                        onInput={(e) => handlePreview(e.target.value)}
                        onChange={(e) => handleCommit(e.target.value)}
                        title={resolvedColor}
                        className={`color-picker-input ${inputClassName}`.trim()}
                        tabIndex={-1}
                    />
                </div>
            </div>
            {variant === 'compact' ? (showPanel ? createPortal(panelBody, document.body) : null) : panelBody}
        </div>
    );
};
