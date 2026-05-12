import { useState, useEffect } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="px-6 py-3 bg-black/40 dark:bg-white/10 backdrop-blur-3xl border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white transition-all pointer-events-auto"
      data-testid="button-theme-toggle"
    >
      [ REALITY: {dark ? "DARK" : "LIGHT"} ]
    </button>
  );
}
