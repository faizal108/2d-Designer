// src/components/ui/Toggle.jsx
import React from "react";

/**
 * Toggle — custom checkbox (tailwind)
 * props:
 *  - checked, onChange, label, small (optional)
 */
export default function Toggle({ checked, onChange, label, small = false }) {
  const size = small ? "w-4 h-4" : "w-5 h-5";
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <span className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <span
          className={`flex ${size} items-center justify-center rounded border border-gray-600 bg-surface`}
        >
          {checked && (
            <svg
              className="w-3 h-3 text-primary"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414L8.414 15 5 11.586a1 1 0 111.414-1.414L8.414 12.172l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </span>
      </span>
      {label && <span className={small ? "text-xs" : "text-sm"}>{label}</span>}
    </label>
  );
}
