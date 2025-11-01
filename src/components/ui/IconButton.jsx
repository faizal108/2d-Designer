export default function IconButton({ icon, label, tooltip, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 px-3 py-2 hover:bg-gray-700 rounded group"
      title={tooltip}
      aria-label={label}
    >
      <div className="w-8 h-8 flex items-center justify-center">{icon}</div>
      <div className="text-xs">{label}</div>
    </button>
  );
}
