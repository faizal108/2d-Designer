import React, { useContext, useState } from "react";
import { ViewContext } from "../../contexts/ViewContext";

export default function FloatingMenu() {
  const {
    showGrid,
    setShowGrid,
    showPoints,
    setShowPoints,
    algorithm,
    setAlgorithm,
  } = useContext(ViewContext);

  const [open, setOpen] = useState(true);

  const dispatch = (type, data = {}) => {
    window.dispatchEvent(
      new CustomEvent("workspace.cmd", { detail: { type, data } })
    );
  };

  return (
    <div className="absolute top-4 left-4 z-50 bg-gray-900/95 text-white p-3 rounded-lg shadow-xl border border-gray-700 w-64">
      <div className="flex justify-between items-center">
        <span className="font-semibold text-sm">Workspace Controls</span>
        <button onClick={() => setOpen(!open)} className="text-xs opacity-60 hover:opacity-100">
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {open && (
        <div className="mt-3 flex flex-col gap-4">

          {/* Zoom controls */}
          <div>
            <div className="text-xs mb-1 opacity-70">Zoom</div>
            <div className="flex gap-2">
              <button
                onClick={() => dispatch("zoomBy", { factor: 1.25 })}
                className="px-2 py-1 rounded bg-gray-700"
              >
                +
              </button>
              <button
                onClick={() => dispatch("zoomBy", { factor: 0.80 })}
                className="px-2 py-1 rounded bg-gray-700"
              >
                −
              </button>
              <button
                onClick={() => dispatch("fit")}
                className="px-3 py-1 rounded bg-gray-700"
              >
                Fit
              </button>
              <button
                onClick={() => dispatch("reset")}
                className="px-3 py-1 rounded bg-gray-700"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
              Show Grid
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showPoints}
                onChange={(e) => setShowPoints(e.target.checked)}
              />
              Show Points
            </label>
          </div>

          {/* Algorithm */}
          <div className="text-sm">
            <span className="opacity-70 text-xs">Drawing Algorithm</span>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="w-full mt-1 p-1 bg-gray-800 border border-gray-700 rounded"
            >
              <option value="linear">Linear</option>
              <option value="curved">Curved</option>
              <option value="compare">Compare Mode</option>
            </select>
          </div>

        </div>
      )}
    </div>
  );
}
