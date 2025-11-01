import React, { createContext, useState, useEffect } from "react";
import { getLocal, setLocal } from "../utils/storage";

export const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() =>
    getLocal("appSettings", { gridEnabled: true, snapToPoint: false })
  );

  const updateSetting = (key, value) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };
      setLocal("appSettings", newSettings);
      return newSettings;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}
