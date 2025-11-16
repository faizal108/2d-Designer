import React, { useContext } from "react";
import { ViewContext } from "../../contexts/ViewContext";

export default function ViewMenu() {
  const {
    showGrid,
    setShowGrid,
    showPoints,
    setShowPoints,
    algorithm,
    setAlgorithm,
  } = useContext(ViewContext);

  return (
    <div className="flex items-center gap-6">
      {/* Grid */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showGrid}
          onChange={(e) => setShowGrid(e.target.checked)}
          className="w-4 h-4 accent-primary"
        />
        <span className="text-sm">Show Grid</span>
      </label>

      {/* Points */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showPoints}
          onChange={(e) => setShowPoints(e.target.checked)}
          className="w-4 h-4 accent-primary"
        />
        <span className="text-sm">Show Points</span>
      </label>

      {/* Algo select */}
      <label className="flex items-center gap-2 text-sm">
        Mode:
        <select
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
        >
          <option value="linear">Linear</option>
          <option value="curved">Curve Detect</option>
          <option value="compare">Compare Mode</option>
        </select>
      </label>
    </div>
  );
}
