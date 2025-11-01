import React, { useState } from "react";
import Modal from "../ui/Modal";
import IconButton from "../ui/IconButton";

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

const IconNew = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path d="M12 5v14M5 12h14" strokeWidth="1.5" />
  </svg>
);

export default function FileMenu() {
  const [openDemo, setOpenDemo] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <IconButton
        icon={<IconFile />}
        label="Open"
        tooltip="Open file (demo)"
        onClick={() => setOpenDemo(true)}
      />
      <IconButton
        icon={<IconNew />}
        label="New"
        tooltip="Create new project"
        onClick={() => {
          if (confirm("Discard current project and create new?")) {
            window.dispatchEvent(new CustomEvent("scene.clear"));
          }
        }}
      />
      <IconButton
        icon={<IconFile />}
        label="Save"
        tooltip="Save project (demo)"
        onClick={() => {
          alert("Demo: Save triggered — integrate backend later.");
        }}
      />

      {openDemo && (
        <Modal title="Open File (Demo)" onClose={() => setOpenDemo(false)}>
          <div className="mb-3">
            This is a demo file open dialog. Hook up real file pickers /
            importers later.
          </div>

          <div className="flex gap-2 justify-end">
            <button
              className="px-3 py-1 rounded bg-primary text-white"
              onClick={() => setOpenDemo(false)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
