export default function TopBar() {
  return (
    <div className="flex items-center justify-between bg-surface px-4 py-2 border-b border-gray-600">
      <span className="font-bold text-lg">2D-DESIGNER</span>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-300">Faizal</span>
        <img
          src="https://ui-avatars.com/api/?name=F&background=1e293b&color=fff"
          alt="profile"
          className="w-8 h-8 rounded-full border border-gray-500"
        />
      </div>
    </div>
  );
}
