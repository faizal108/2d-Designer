import React, { useState, useContext } from "react";
import Modal from "../../ui/Modal";
import { SceneContext } from "../../../contexts/SceneContext";
import { parsePoints } from "../../../utils/parsePoints";

export default function PointsImportModal({ isOpen, onClose }) {
  const { addPoints } = useContext(SceneContext);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const onImport = () => {
    try {
      const parsed = parsePoints(text);
      // addPoints should append; if you want to replace use setAllPoints
      addPoints(parsed);
      setText("");
      setError("");
      onClose();
    } catch (err) {
      setError(String(err.message || err));
    }
  };

  return (
    <Modal title="Import Points" onClose={onClose}>
      <div className="mb-2 text-sm text-gray-300">
        Accepts JSON array or line-based coordinates (e.g. <code>10,20</code> or{" "}
        <code>{"{x:10,y:20}"}</code>).
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        className="w-full p-2 bg-black/60 rounded text-sm"
        placeholder={`Paste points here...\n10,20\n20,30\n...`}
      />

      {error && <div className="text-red-400 mt-2">{error}</div>}

      <div className="flex justify-end gap-2 mt-3">
        <button className="px-3 py-1 rounded" onClick={onClose}>
          Cancel
        </button>
        <button
          className="px-3 py-1 rounded bg-primary text-white"
          onClick={onImport}
        >
          Import
        </button>
      </div>
    </Modal>
  );
}
