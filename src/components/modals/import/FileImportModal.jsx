import React, { useRef, useContext, useState } from "react";
import Modal from "../../ui/Modal";
import { SceneContext } from "../../../contexts/SceneContext";
import { parsePoints } from "../../../utils/parsePoints";

const SAMPLE_PATH = "/mnt/data/253b8f35-5323-4bfd-8414-b68db9b512a0.png";

export default function FileImportModal({ isOpen, onClose }) {
  const { setAllPoints } = useContext(SceneContext);
  const inputRef = useRef(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const onChooseFile = () => inputRef.current && inputRef.current.click();

  const onFileChange = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      const txt = await f.text();
      const parsed = parsePoints(txt);
      setAllPoints(parsed);
      setError("");
      onClose();
    } catch (err) {
      console.error(err);
      setError(String(err.message || err));
    }
  };

  return (
    <Modal title="Import File" onClose={onClose}>
      <div className="mb-3 text-sm text-gray-300">
        Select a text file containing point data (JSON array or lines). Sample
        asset: <code className="text-xs">{SAMPLE_PATH}</code>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".txt,text/plain"
        className="hidden"
        onChange={onFileChange}
      />
      <div className="flex gap-2">
        <button
          className="px-3 py-1 rounded bg-primary text-white"
          onClick={onChooseFile}
        >
          Choose file
        </button>
        <button
          className="px-3 py-1 rounded"
          onClick={() => {
            setAllPoints([]);
            onClose();
          }}
        >
          Clear Scene
        </button>
      </div>

      {error && <div className="mt-3 text-red-400">{error}</div>}
    </Modal>
  );
}
