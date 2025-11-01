import React from "react";
import IconButton from "../ui/IconButton";

const IconExport = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path d="M12 3v12" strokeWidth="1.5" />
    <path d="M21 21H3" strokeWidth="1.5" />
    <path d="M16 8l-4 4-4-4" strokeWidth="1.5" />
  </svg>
);

export default function ExportMenu() {
  return (
    <div className="flex items-center gap-2">
      <IconButton
        icon={<IconExport />}
        label="Export JSON"
        tooltip="Export scene as JSON"
        onClick={() => {
          alert("Demo: export JSON");
        }}
      />
      <IconButton
        icon={<IconExport />}
        label="Export SVG"
        tooltip="Export as SVG (demo)"
        onClick={() => {
          alert("Demo: export SVG");
        }}
      />
    </div>
  );
}
