import React, { useEffect, useRef, useState } from 'react';

const IconLoad = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>;
const IconSave = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>;
const IconUndo = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>;
const IconRedo = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" /></svg>;
const IconDownload = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
const IconNew = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>;
const IconPen = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>;

const TopBar = ({
    diagramName,
    onDiagramNameCommit,
    fileInputRef,
    handleFileUpload,
    resetDiagram,
    saveConfig,
    undo,
    redo,
    historyIndex,
    historyLength,
    downloadSVG
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [draftName, setDraftName] = useState(diagramName || '');
    const inputRef = useRef(null);

    useEffect(() => {
        if (!isEditing) return;
        const id = window.requestAnimationFrame(() => {
            inputRef.current?.focus();
            inputRef.current?.select?.();
        });
        return () => window.cancelAnimationFrame(id);
    }, [isEditing]);

    const commit = () => {
        const next = draftName.trim();
        if (next !== (diagramName || '')) {
            onDiagramNameCommit(next);
        }
        setIsEditing(false);
    };

    const startEditing = () => {
        setDraftName(diagramName || '');
        setIsEditing(true);
    };

    const cancel = () => {
        setDraftName(diagramName || '');
        setIsEditing(false);
    };

    return (
        <div className="top-bar">
            <div className="top-bar-group top-bar-left">
                <button className="icon-btn" onClick={resetDiagram} title="New Diagram"><IconNew /> New</button>
                <button className="icon-btn" onClick={() => fileInputRef.current.click()} title="Load Config"><IconLoad /> Load</button>
                <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} accept="application/json,.json" />
                <button className="icon-btn" onClick={saveConfig} title="Save Config"><IconSave /> Save</button>
            </div>

            <div className="top-bar-center">
                <div className="diagram-name-shell">
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            className="diagram-name-input"
                            value={draftName}
                            size={Math.max(6, (draftName || '').length || 0)}
                            onChange={(e) => setDraftName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') commit();
                                if (e.key === 'Escape') cancel();
                            }}
                            onBlur={commit}
                            placeholder="Untitled"
                        />
                    ) : (
                        <div
                            className="diagram-name-text"
                            title={diagramName || 'Untitled'}
                            onDoubleClick={startEditing}
                        >
                            {diagramName || 'Untitled'}
                        </div>
                    )}
                    <button
                        className="icon-btn diagram-name-pen"
                        onClick={startEditing}
                        title="Edit diagram name"
                        aria-label="Edit diagram name"
                    >
                        <IconPen />
                    </button>
                </div>
            </div>

            <div className="top-bar-group top-bar-right">
                <button className="icon-btn" onClick={undo} disabled={historyIndex <= 0} title="Undo"><IconUndo /></button>
                <button className="icon-btn" onClick={redo} disabled={historyIndex >= historyLength - 1} title="Redo"><IconRedo /></button>
                <button onClick={downloadSVG} className="primary-btn">
                    <IconDownload />
                    Export SVG
                </button>
            </div>
        </div>
    );
};

export default TopBar;
