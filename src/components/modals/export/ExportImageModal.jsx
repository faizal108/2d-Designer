import React, { useState } from "react";
import { exportCanvasAsPNG } from "../../../utils/export/exportImage";

export default function ExportImageModal({ isOpen, onClose }) {
  const [fileName, setFileName] = useState("drawing");
  const [format, setFormat] = useState("png");
  const [scale, setScale] = useState(1);

  if (!isOpen) return null;

  const FORMATS = [
    { label: "PNG (Recommended)", value: "png" },
    { label: "JPEG", value: "jpeg" },
    { label: "SVG (Coming Soon)", value: "svg", disabled: true },
    { label: "TIFF (Coming Soon)", value: "tiff", disabled: true },
  ];

  const onExport = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) {
      alert("Canvas not found.");
      return;
    }

    if (format === "png") {
      exportCanvasAsPNG(canvas, { scale, background: "#ffffff" }).then(
        (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${fileName}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      );

      onClose();
      return;
    }

    alert("This format is under development.");
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
      <div className="bg-surface p-6 rounded-xl w-96 border border-gray-700 shadow-xl">
        <h2 className="text-lg font-semibold mb-4">Export Image</h2>

        {/* Filename */}
        <label className="text-sm">File Name</label>
        <input
          className="w-full bg-gray-800 border border-gray-600 rounded p-2 mb-4"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
        />

        {/* Format */}
        <label className="text-sm">Format</label>
        <select
          className="w-full bg-gray-800 border border-gray-600 rounded p-2 mb-4"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
        >
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value} disabled={f.disabled}>
              {f.label}
            </option>
          ))}
        </select>

        {/* Resolution */}
        <label className="text-sm">Resolution Scale</label>
        <select
          className="w-full bg-gray-800 border border-gray-600 rounded p-2 mb-6"
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
        >
          <option value={1}>1x (Normal)</option>
          <option value={2}>2x (Retina)</option>
          <option value={4}>4x (Ultra HD)</option>
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
