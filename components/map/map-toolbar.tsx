"use client";

import { Check, Plus, Redo2, Save, Undo2, ZoomIn } from "lucide-react";

export function MapToolbar({ onAdd, onUndo, onRedo, onFit, onSave, saved, canUndo, canRedo }: {
  onAdd: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onFit: () => void;
  onSave: () => void;
  saved: boolean;
  canUndo: boolean;
  canRedo: boolean;
}) {
  return <div className="map-toolbar">
    <button className="toolbar-primary" onClick={onAdd}><Plus size={17} /> Add bibble</button>
    <span className="toolbar-divider" />
    <button className="toolbar-button" onClick={onUndo} disabled={!canUndo} aria-label="Undo" title="Undo (Ctrl+Z)"><Undo2 size={16} /></button>
    <button className="toolbar-button" onClick={onRedo} disabled={!canRedo} aria-label="Redo" title="Redo (Ctrl+Shift+Z or Ctrl+Y)"><Redo2 size={16} /></button>
    <button className="toolbar-button toolbar-text-button" onClick={onFit}><ZoomIn size={16} /> Fit view</button>
    <span className="toolbar-spacer" />
    <button className="toolbar-save" onClick={onSave}>{saved ? <Check size={16} /> : <Save size={16} />}{saved ? "Saved" : "Save"}</button>
  </div>;
}
