import React, { createContext, useEffect, useState } from "react";

export const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

const THEMES = ["light", "dark", "solar"]; // extend as needed
const STORAGE_KEY = "app.theme";

export function ThemeProvider({ children }) {
  const [theme, setThemeRaw] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return saved;
    } catch (e) {
      // localStorage may be unavailable (private mode), fall through
    }
    // fallback to system preference
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  });

  useEffect(() => {
    // apply theme attribute on <html> for CSS variables
    document.documentElement.setAttribute("data-theme", theme);
    // add a class for transition control
    document.documentElement.classList.add("theme-transition");
    // persist
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // ignore storage errors (read-only environments)
    }
  }, [theme]);

  const setTheme = (next) => {
    if (!THEMES.includes(next)) {
      console.warn(`Theme "${next}" not registered. Falling back to "light".`);
      return setThemeRaw("light");
    }
    setThemeRaw(next);
  };

  const toggleTheme = () => {
    setThemeRaw((t) => (t === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}
