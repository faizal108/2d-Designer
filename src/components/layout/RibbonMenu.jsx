import { useContext } from "react";
import { AppContext } from "../../contexts/AppContext";

const menus = [
  { key: "file", label: "File" },
  { key: "import", label: "Import" },
  { key: "export", label: "Export" },
  { key: "view", label: "View" },
  { key: "settings", label: "Settings" },
  { key: "help", label: "Help" },
];

export default function RibbonMenu() {
  const { selectedMenu, handleMenuSelect } = useContext(AppContext);

  return (
    <div className="flex bg-gray-800 text-gray-100 border-b border-gray-700">
      {menus.map((menu) => (
        <button
          key={menu.key}
          onClick={() => handleMenuSelect(menu.key)}
          className={`px-4 py-2 text-sm font-medium transition ${
            selectedMenu === menu.key
              ? "bg-primary/20 border-b-2 border-primary text-primary"
              : "hover:bg-gray-700"
          }`}
        >
          {menu.label}
        </button>
      ))}
    </div>
  );
}
