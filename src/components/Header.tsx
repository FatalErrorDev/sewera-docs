"use client";

import { ThemeToggle } from "./ThemeToggle";

export function Header({
  onMenuToggle,
  onSearchOpen,
}: {
  onMenuToggle: () => void;
  onSearchOpen: () => void;
}) {
  return (
    <header className="relative sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md font-sans">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="flex h-9 w-9 items-center justify-center rounded-md text-text-muted hover:bg-surface hover:text-text-primary lg:hidden"
        aria-label="Toggle menu"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Logo */}
      <a href="/" className="text-sm font-bold tracking-tight text-accent">
        Sewera Docs
      </a>

      <div className="flex-1" />

      {/* Search button */}
      <button
        onClick={onSearchOpen}
        className="flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-text-muted transition-colors hover:border-text-muted hover:text-text-secondary"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-xs text-text-muted sm:inline">
          Ctrl K
        </kbd>
      </button>

      <ThemeToggle />

      {/* Decorative gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
    </header>
  );
}
