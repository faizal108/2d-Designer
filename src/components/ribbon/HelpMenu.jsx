import React from "react";
import IconButton from "../ui/IconButton";

const IconHelp = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" strokeWidth="1.2" />
    <path d="M9.09 9a3 3 0 1 1 5.82 1c-.6.67-1.5 1.1-1.5 2" strokeWidth="1.5" />
    <path d="M12 17h.01" strokeWidth="2" />
  </svg>
);

export default function HelpMenu() {
  return (
    <div className="flex items-center gap-2">
      <IconButton
        icon={<IconHelp />}
        label="Docs"
        tooltip="Open documentation (demo)"
        onClick={() => alert("Open docs (demo)")}
      />
      <IconButton
        icon={<IconHelp />}
        label="About"
        tooltip="About this app"
        onClick={() => alert("RootMerge CAD — demo build")}
      />
    </div>
  );
}
