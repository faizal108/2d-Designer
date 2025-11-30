import React, { useState } from "react";
import IconButton from "../ui/IconButton";
import FileImportModal from "../modals/import/FileImportModal";
import PointsImportModal from "../modals/import/PointsImportModal";
import StreamImportModal from "../modals/import/StreamImportModal";

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
  const [openFile, setOpenFile] = useState(false);
  const [openPoints, setOpenPoints] = useState(false);
  const [openStream, setOpenStream] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <IconButton
          icon={<IconImport />}
          label="Import File"
          tooltip="Import file"
          onClick={() => setOpenFile(true)}
        />
        <IconButton
          icon={<IconImport />}
          label="Import Points"
          tooltip="Paste points"
          onClick={() => setOpenPoints(true)}
        />
        <IconButton
          icon={<IconImport />}
          label="Import Stream"
          tooltip="Import from serial stream"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("stream.open"));
          }}
        />
      </div>

      <FileImportModal isOpen={openFile} onClose={() => setOpenFile(false)} />
      <PointsImportModal
        isOpen={openPoints}
        onClose={() => setOpenPoints(false)}
      />
      <StreamImportModal
        isOpen={openStream}
        onClose={() => setOpenStream(false)}
      />
    </>
  );
}
