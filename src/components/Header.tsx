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
    <header
      className="sticky top-0 z-30 flex items-center justify-between font-mono"
      style={{
        height: "48px",
        background: "var(--bg-base)",
        borderBottom: "1px solid var(--border-default)",
        padding: "0 24px",
      }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "32px",
          height: "32px",
          color: "var(--text-muted)",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
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
      <a
        href="/"
        style={{
          fontSize: "13px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "var(--text-primary)",
          textDecoration: "none",
          fontFamily: "var(--font-mono)",
          fontWeight: 500,
        }}
      >
        SEWERA DOCS
      </a>

      <div style={{ flex: 1 }} />

      {/* Search button */}
      <button
        onClick={onSearchOpen}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          cursor: "pointer",
          padding: "4px",
          marginRight: "8px",
        }}
        className="hover:!text-[var(--text-primary)]"
        aria-label="Search"
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
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      <ThemeToggle />
    </header>
  );
}
