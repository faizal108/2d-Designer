// src/components/ribbon/FileMenu.jsx
import React, { useRef, useState, useContext } from "react";
import Modal from "../ui/Modal";
import IconButton from "../ui/IconButton";
import { SceneContext } from "../../contexts/SceneContext";
import { parsePoints } from "../../utils/parsePoints";

/**
 * FileMenu — New / Open / Save behaviors
 * - New: asks for confirmation then clears scene via SceneContext.clear()
 * - Open: opens native file picker, reads file text, parses with parsePoints(), sets scene via setAllPoints()
 * - Save: serializes current scene points as line-based "x,y" per line and triggers download .txt
 *
 * Integration: relies on SceneContext { points, setAllPoints, clear }
 */

const IconFile = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
      strokeWidth="1.5"
    />
    <path d="M14 2v6h6" strokeWidth="1.5" />
  </svg>
);

const IconOpen = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path d="M12 3v12" strokeWidth="1.5" />
    <path d="M8 7l4-4 4 4" strokeWidth="1.5" />
    <path d="M21 21H3" strokeWidth="1.5" />
  </svg>
);

const IconSave = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
      strokeWidth="1.2"
    />
    <path d="M17 21v-8H7v8" strokeWidth="1.2" />
  </svg>
);

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "scene.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function FileMenu() {
  const { points, setAllPoints, clear } = useContext(SceneContext);
  const fileInputRef = useRef(null);
  const [openModal, setOpenModal] = useState(false);

  // NEW
  const onNew = () => {
    if (!points || points.length === 0) {
      clear();
      return;
    }
    if (
      confirm(
        "Discard current scene and create a new file? This will clear all points."
      )
    ) {
      clear();
    }
  };

  // OPEN
  const onOpenClick = () => {
    if (fileInputRef.current) fileInputRef.current.value = null;
    fileInputRef.current && fileInputRef.current.click();
  };

  const onFileChange = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      const text = await f.text();
      const parsed = parsePoints(text);
      if (!parsed || parsed.length === 0) {
        alert("File parsed but no valid points were found.");
        return;
      }
      setAllPoints(parsed);
      // optional: auto-fit command (if you have workspace auto-fit event)
      window.dispatchEvent(
        new CustomEvent("workspace.cmd", { detail: { type: "fit" } })
      );
    } catch (err) {
      console.error(err);
      alert("Failed reading or parsing file: " + (err.message || err));
    }
  };

  // SAVE
  const onSave = () => {
    if (!points || points.length === 0) {
      alert("No points to save.");
      return;
    }
    // choose a simple text format: x,y per line (ISO: preserve z or t as additional columns if present)
    // We'll write CSV-like lines: x,y[,z][,t]
    const lines = points.map((p) => {
      // keep extra fields if present
      const extras = [];
      if (p.z !== undefined) extras.push(p.z);
      if (p.t !== undefined) extras.push(p.t);
      return [p.x, p.y, ...extras].join(",");
    });
    const text = lines.join("\n");
    downloadText("scene_points.txt", text);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,text/plain"
        className="hidden"
        onChange={onFileChange}
      />

      <IconButton
        icon={<IconOpen />}
        label="Open"
        tooltip="Open .txt file and draw from it"
        onClick={onOpenClick}
      />
      <IconButton
        icon={<IconFile />}
        label="New"
        tooltip="Create new file (clears scene)"
        onClick={onNew}
      />
      <IconButton
        icon={<IconSave />}
        label="Save"
        tooltip="Save scene as .txt"
        onClick={onSave}
      />

      {/* Optional quick modal to show file options / recent files */}
      {openModal && (
        <Modal title="File options" onClose={() => setOpenModal(false)}>
          <div className="mb-2">No additional file options yet.</div>
          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-1 rounded bg-primary text-white"
              onClick={() => setOpenModal(false)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
