import React from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import ThemeSwitcher from "./components/ThemeSwitcher";
import { AppProvider } from "./contexts/AppContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { SceneProvider } from "./contexts/SceneContext";

import TopBar from "./components/layout/TopBar";
import RibbonMenu from "./components/layout/RibbonMenu";
import SubMenuPanel from "./components/layout/SubMenuPanel";
import Workspace from "./components/layout/Workspace";

function AppContent() {
  return (
    <AppProvider>
      <SettingsProvider>
        <SceneProvider>
          <div className="flex flex-col h-screen">
            <TopBar />
            <RibbonMenu />
            <SubMenuPanel />
            <div className="flex-1">
              <Workspace />
            </div>
          </div>
        </SceneProvider>
      </SettingsProvider>
    </AppProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
