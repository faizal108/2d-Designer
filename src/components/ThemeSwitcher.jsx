import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export default function ThemeSwitcher() {
  const { theme, setTheme, THEMES } = useContext(ThemeContext);

  return (
    <div className="flex items-center gap-2">
      {THEMES.map(t => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          className={`px-3 py-1 rounded-md border 
            ${theme === t ? 'border-primary bg-primary/10 text-primary' : 'border-transparent hover:border-muted'}`}
          aria-pressed={theme === t}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
