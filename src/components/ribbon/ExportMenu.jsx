import React, { useState } from "react";
import IconButton from "../ui/IconButton";
import ExportDXFModal from "../modals/ExportDXFModal";
import ExportImageModal from "../modals/ExportImageModal";

const IconExport = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor">
    <path d="M12 3v12" strokeWidth="1.5" />
    <path d="M21 21H3" strokeWidth="1.5" />
    <path d="M16 8l-4 4-4-4" strokeWidth="1.5" />
  </svg>
);

export default function ExportMenu() {
  const [openDXF, setOpenDXF] = useState(false);
  const [openImage, setOpenImage] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <IconButton
          icon={<IconExport />}
          label="Export DXF"
          tooltip="Export as DXF file"
          onClick={() => setOpenDXF(true)}
        />

        <IconButton
          icon={<IconExport />}
          label="Export Image"
          tooltip="Export PNG/JPEG/SVG"
          onClick={() => setOpenImage(true)}
        />
      </div>

      {/* Modals */}
      <ExportDXFModal isOpen={openDXF} onClose={() => setOpenDXF(false)} />
      <ExportImageModal
        isOpen={openImage}
        onClose={() => setOpenImage(false)}
      />
    </>
  );
}
