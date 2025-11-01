import { useContext } from "react";
import { AppContext } from "../../contexts/AppContext";
import FileMenu from "../ribbon/FileMenu";
import ImportMenu from "../ribbon/ImportMenu";
import ExportMenu from "../ribbon/ExportMenu";
import ViewMenu from "../ribbon/ViewMenu";
// import SettingsMenu from "../ribbon/SettingsMenu";
import HelpMenu from "../ribbon/HelpMenu";

const menuMap = {
  file: FileMenu,
  import: ImportMenu,
  export: ExportMenu,
  view: ViewMenu,
//   settings: SettingsMenu,
  help: HelpMenu,
};

export default function SubMenuPanel() {
  const { selectedMenu } = useContext(AppContext);
  const ActiveMenu = menuMap[selectedMenu] || (() => null);
  return (
    <div className="bg-gray-900 text-gray-200 border-b border-gray-700 px-4 py-2">
      <ActiveMenu />
    </div>
  );
}
