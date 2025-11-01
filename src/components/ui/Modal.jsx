export default function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-surface text-text rounded shadow-lg w-[min(90%,720px)] p-4 z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{title}</h3>
          <button className="px-2 py-1" onClick={onClose}>
            ✕
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
