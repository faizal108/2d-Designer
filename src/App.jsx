import React from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import ThemeSwitcher from "./components/ThemeSwitcher";

function AppContent() {
  return (
    <div className="min-h-screen p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold">
          My Vite + Tailwind Multi-theme App
        </h1>
      </header>

      <main>
        <ThemeSwitcher />

        <section className="mt-6 p-6 rounded-lg shadow-sm bg-surface">
          <h2 className="text-xl font-medium text-text">Surface card</h2>
          <p className="text-muted">
            This demonstrates background and text tokens driven by CSS
            variables.
          </p>
          <button className="mt-4 px-4 py-2 rounded bg-primary text-white">
            Primary action
          </button>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
