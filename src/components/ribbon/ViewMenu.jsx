// src/components/ribbon/ViewMenu.jsx
import React, { useContext } from "react";
import IconButton from "../ui/IconButton";
import Toggle from "../ui/Toggle";
import { ViewContext } from "../../contexts/ViewContext";

const IconZoomIn = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor">
    <path d="M12 5v6m0 0v6m0-6h6m-6 0H6" strokeWidth="1.5" />
  </svg>
);
const IconZoomOut = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor">
    <path d="M6 12h12" strokeWidth="1.5" />
  </svg>
);
const IconFit = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor">
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" strokeWidth="1.5" />
  </svg>
);
const IconCenter = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor">
    <circle cx="12" cy="12" r="2" strokeWidth="1.5" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeWidth="1.5" />
  </svg>
);
const IconReset = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor">
    <path d="M12 4a8 8 0 1 1-7.5 5" strokeWidth="1.5" />
    <path d="M4 4v5h5" strokeWidth="1.5" />
  </svg>
);

export default function ViewMenu() {
  const {
    showGrid,
    setShowGrid,
    showPoints,
    setShowPoints,
    algorithm,
    setAlgorithm,
    crosshair,
    setCrosshair,
    axes,
    setAxes,
    showControls,
    setShowControls,
    showMeasureOnHover,
    setShowMeasureOnHover,
  } = useContext(ViewContext);

  const emit = (evt) => window.dispatchEvent(new CustomEvent(evt));

  return (
    <div className="flex items-center gap-6">
      {/* left group: toggles (using custom Toggle for consistent UI) */}
      <div className="flex items-center gap-4">
        <Toggle checked={showGrid} onChange={setShowGrid} label="Grid" />
        <Toggle checked={showPoints} onChange={setShowPoints} label="Points" />
        <Toggle checked={axes} onChange={setAxes} label="Axes" />
        <Toggle checked={crosshair} onChange={setCrosshair} label="Crosshair" />
        <Toggle
          checked={showControls}
          onChange={setShowControls}
          label="Controls"
        />
        <Toggle
          checked={showMeasureOnHover}
          onChange={setShowMeasureOnHover}
          label="Measure on point hover"
        />
      </div>

      {/* mode selector */}
      <div className="flex items-center gap-2">
        <label className="text-sm">Mode</label>
        <select
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value)}
          className="bg-surface border border-gray-700 rounded px-2 py-1 text-sm"
        >
          <option value="linear">Linear</option>
          <option value="curved">Curved</option>
          <option value="compare">Compare</option>
          <option value="preview">Preview</option>
        </select>
      </div>

      {/* zoom & view controls (larger IconButton for consistency) */}
      <div className="flex items-center gap-2 ml-4">
        <IconButton
          icon={<IconZoomIn />}
          label="Zoom In"
          onClick={() => emit("view.zoom.in")}
        />
        <IconButton
          icon={<IconZoomOut />}
          label="Zoom Out"
          onClick={() => emit("view.zoom.out")}
        />
        <IconButton
          icon={<IconFit />}
          label="Fit"
          onClick={() => emit("view.fit")}
        />
        <IconButton
          icon={<IconCenter />}
          label="Center"
          onClick={() => emit("view.center")}
        />
        <IconButton
          icon={<IconReset />}
          label="Reset"
          onClick={() => emit("view.reset")}
        />
      </div>
    </div>
  );
}
