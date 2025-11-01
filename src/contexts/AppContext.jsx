import React, { createContext, useEffect, useState } from "react";
import { getLocal, setLocal } from "../utils/storage";

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [selectedMenu, setSelectedMenu] = useState(() =>
    getLocal("selectedMenu", "file")
  );
  const [userRole, setUserRole] = useState(() => getLocal("userRole", "admin")); // later from backend

  const handleMenuSelect = (menu) => {
    setSelectedMenu(menu);
    setLocal("selectedMenu", menu);
  };

  const value = {
    selectedMenu,
    handleMenuSelect,
    userRole,
    setUserRole,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
