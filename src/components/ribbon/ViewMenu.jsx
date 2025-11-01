import { useContext } from "react";
import { SettingsContext } from "../../contexts/SettingsContext";

export default function ViewMenu() {
  const { settings, updateSetting } = useContext(SettingsContext);

  return (
    <div className="flex gap-4 items-center">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={settings.gridEnabled}
          onChange={(e) => updateSetting("gridEnabled", e.target.checked)}
        />
        Show Grid
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={settings.snapToPoint}
          onChange={(e) => updateSetting("snapToPoint", e.target.checked)}
        />
        Snap to Point
      </label>
    </div>
  );
}
