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
      <a
        href="/"
        onClick={(e) => {
          if (window.innerWidth < 1024) {
            e.preventDefault();
            onMenuToggle();
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          textDecoration: "none",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/favicon.ico" alt="" width={20} height={20} style={{ display: "block" }} />
        <span
          style={{
            fontSize: "13px",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "var(--text-primary)",
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
          }}
        >
          SEWERA DOCS
        </span>
      </a>

      <div style={{ display: "flex", alignItems: "center" }}>
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
      </div>
    </header>
  );
}
