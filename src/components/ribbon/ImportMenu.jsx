import React, { useState, useContext } from "react";
import Modal from "../ui/Modal";
import IconButton from "../ui/IconButton";
import { SceneContext } from "../../contexts/SceneContext";
import { parsePoints } from "../../utils/parsePoints";

const IconImport = () => (
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

export default function ImportMenu() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [pointsOpen, setPointsOpen] = useState(false);
  const { addPoints } = useContext(SceneContext);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const onImportPoints = () => {
    try {
      const parsed = parsePoints(text);
      addPoints(parsed);
      setPointsOpen(false);
      setText("");
      setError("");
    } catch (e) {
      setError(String(e.message || e));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <IconButton
        icon={<IconImport />}
        label="Import File"
        tooltip="Import file (demo)"
        onClick={() => setDemoOpen(true)}
      />
      <IconButton
        icon={<IconImport />}
        label="Import Points"
        tooltip="Import points (paste JSON or lines)"
        onClick={() => setPointsOpen(true)}
      />

      {demoOpen && (
        <Modal title="Import File (Demo)" onClose={() => setDemoOpen(false)}>
          <div className="mb-2">
            Demo importer — wire real file parsing later.
          </div>
          <input type="file" className="mb-3" />
          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-1 rounded"
              onClick={() => setDemoOpen(false)}
            >
              Close
            </button>
            <button
              className="px-3 py-1 rounded bg-primary text-white"
              onClick={() => {
                alert("Demo: file import");
                setDemoOpen(false);
              }}
            >
              Import
            </button>
          </div>
        </Modal>
      )}

      {pointsOpen && (
        <Modal title="Import Points" onClose={() => setPointsOpen(false)}>
          <div className="mb-2 text-sm text-gray-300">
            Accepts two formats:
            <ul className="list-disc ml-5">
              <li>
                JSON array of objects:{" "}
                <code>
                  [{"{"}"x":10,"y":20{"}"}]
                </code>
              </li>
              <li>
                Line-based: <code>x:20,y:20</code> or <code>20,20</code>
              </li>
            </ul>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="w-full p-2 bg-black/60 rounded text-sm"
            placeholder='Paste points here... e.g.
[
  {"x":10,"y":20},
  {"x":20,"y":30}
]'
          />

          {error && <div className="text-red-400 mt-2">{error}</div>}

          <div className="flex justify-end gap-2 mt-3">
            <button
              className="px-3 py-1 rounded"
              onClick={() => setPointsOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-3 py-1 rounded bg-primary text-white"
              onClick={onImportPoints}
            >
              Import points
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
