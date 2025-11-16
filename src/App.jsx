import React from "react";
import { AppProvider } from "./contexts/AppContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { SceneProvider } from "./contexts/SceneContext";
import { ViewProvider } from "./contexts/ViewContext";

import TopBar from "./components/layout/TopBar";
import RibbonMenu from "./components/layout/RibbonMenu";
import SubMenuPanel from "./components/layout/SubMenuPanel";
import Workspace from "./components/workspace/Workspace";

export default function App() {
  return (
    <AppProvider>
      <SettingsProvider>
        <SceneProvider>
          <ViewProvider>   {/* <-- YOU MISSED THIS */}
            <div className="flex flex-col h-screen">
              <TopBar />
              <RibbonMenu />
              <SubMenuPanel />
              <div className="flex-1">
                <Workspace />
              </div>
            </div>
          </ViewProvider>
        </SceneProvider>
      </SettingsProvider>
    </AppProvider>
  );
}
