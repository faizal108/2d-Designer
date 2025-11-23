import React, { useState, useContext } from "react";
import { SceneContext } from "../../../contexts/SceneContext";
import { generateDXF } from "../../../utils/export/exportDXF";
import { downloadText } from "../../../utils/download";

export default function ExportDXFModal({ isOpen, onClose }) {
  const { points } = useContext(SceneContext);

  const [fileName, setFileName] = useState("drawing");
  const [version, setVersion] = useState("AC1021"); // Default 2013

  if (!isOpen) return null;

  const DXF_VERSIONS = [
    { label: "AutoCAD 2010 / 2013", value: "AC1021" },
    { label: "AutoCAD 2014", value: "AC1024" },
    { label: "AutoCAD 2018", value: "AC1032" },
    { label: "AutoCAD 2022", value: "AC1036" },
  ];

  const onExport = () => {
    if (!points || points.length === 0) {
      alert("No points to export.");
      return;
    }

    const dxf = generateDXF(points, { version });
    downloadText(`${fileName}.dxf`, dxf);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
      <div className="bg-surface p-6 rounded-xl w-96 border border-gray-700 shadow-xl">
        <h2 className="text-lg font-semibold mb-4">Export DXF</h2>

        {/* Filename */}
        <label className="text-sm">File Name</label>
        <input
          className="w-full bg-gray-800 border border-gray-600 rounded p-2 mb-4"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
        />

        {/* DXF version */}
        <label className="text-sm">DXF Version</label>
        <select
          className="w-full bg-gray-800 border border-gray-600 rounded p-2 mb-5"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
        >
          {DXF_VERSIONS.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label} ({v.value})
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-3">
          <button className="px-4 py-2 bg-gray-700 rounded" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-primary text-white rounded"
            onClick={onExport}
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
