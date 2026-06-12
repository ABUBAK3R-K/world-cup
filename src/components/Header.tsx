"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function Header() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      setIsDark(true);
    }
  }, []);

  const toggleDark = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  };

  return (
    <header className="w-full flex items-center justify-between py-4 sm:py-6 px-4 sm:px-8 border-b-2 border-[var(--theme-ink)] mb-8 transition-colors">
      {/* 8-0 Logo */}
      <div className="flex items-center gap-2 sm:gap-4 select-none">
        <div className="relative">
          {/* Shadow/Offset layer */}
          <span className="text-4xl sm:text-6xl font-black absolute top-0.5 sm:top-1 left-1 sm:left-2 text-[var(--theme-accent)] whitespace-nowrap">
            8-0
          </span>
          {/* Main text layer */}
          <span className="text-4xl sm:text-6xl font-black relative text-[var(--theme-ink)] whitespace-nowrap">
            8-0
          </span>
        </div>
        
        <div className="h-8 sm:h-12 w-[2px] sm:w-[3px] bg-[var(--theme-ink)]/20 mx-1 sm:mx-2 transition-colors" />

        <div className="flex flex-col">
          <div className="leading-none flex flex-col mb-0.5 sm:mb-1">
            <span className="text-xl sm:text-3xl font-black tracking-tighter text-[var(--theme-ink)] h-4 sm:h-6 overflow-visible transition-colors">WORLD</span>
            <span className="text-xl sm:text-3xl font-black tracking-tighter text-[var(--theme-ink)] h-4 sm:h-6 overflow-visible transition-colors">CUP XI</span>
          </div>
          <span className="text-[7px] sm:text-[10px] uppercase font-black tracking-[0.2em] text-[var(--theme-ink)]/60 mt-1 sm:mt-2 transition-colors hidden sm:block">
            BUILD · SIMULATE · 8-0
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 sm:gap-3">
        <button
          onClick={toggleDark}
          className="brutal-btn-alt px-3 sm:px-4 py-2 flex items-center justify-center gap-2 !bg-transparent min-w-[40px] sm:min-w-auto"
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4" />
              <span className="hidden sm:inline">LIGHT</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4" />
              <span className="hidden sm:inline">DARK</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
