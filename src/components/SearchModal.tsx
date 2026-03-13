"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { formatName } from "@/lib/format";

type SearchRecord = {
  slug: string[];
  title: string;
  description: string;
  category: string;
};

export function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<SearchRecord[]>([]);
  const [results, setResults] = useState<SearchRecord[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (open && records.length === 0) {
      fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/search-index.json`)
        .then((r) => r.json())
        .then((data) => setRecords(data));
    }
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open, records.length]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(records);
      setSelectedIndex(0);
      return;
    }
    const fuse = new Fuse(records, {
      keys: ["title", "description", "category"],
      threshold: 0.4,
    });
    setResults(fuse.search(query).map((r) => r.item));
    setSelectedIndex(0);
  }, [query, records]);

  const navigate = useCallback(
    (record: SearchRecord) => {
      onClose();
      router.push(`/docs/${record.slug.join("/")}`);
    },
    [onClose, router]
  );

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      navigate(results[selectedIndex]);
    }
  }

  // Group results by category
  const grouped: { category: string; items: { record: SearchRecord; globalIndex: number }[] }[] = [];
  let currentCategory = "";
  results.forEach((r, i) => {
    if (r.category !== currentCategory) {
      currentCategory = r.category;
      grouped.push({ category: r.category, items: [] });
    }
    grouped[grouped.length - 1].items.push({ record: r, globalIndex: i });
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ paddingTop: "15vh" }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "560px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-strong)",
          borderRadius: 0,
        }}
      >
        {/* Input */}
        <div style={{ padding: "0" }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search documentation..."
            style={{
              width: "100%",
              fontFamily: "var(--font-mono)",
              fontSize: "14px",
              background: "var(--bg-elevated)",
              border: "none",
              borderBottom: "1px solid var(--border-default)",
              borderRadius: 0,
              padding: "12px 16px",
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
        </div>

        {/* Results */}
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {results.length === 0 && query && (
            <p
              style={{
                padding: "32px 16px",
                textAlign: "center",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--text-muted)",
              }}
            >
              No results found.
            </p>
          )}
          {grouped.map((group) => (
            <div key={group.category}>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  color: "var(--text-faint)",
                  letterSpacing: "0.1em",
                  padding: "8px 16px 4px",
                }}
              >
                {formatName(group.category)}
              </p>
              {group.items.map(({ record, globalIndex }) => (
                <button
                  key={record.slug.join("/")}
                  onClick={() => navigate(record)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 16px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color:
                      globalIndex === selectedIndex
                        ? "var(--text-primary)"
                        : "var(--text-secondary)",
                    background:
                      globalIndex === selectedIndex
                        ? "var(--bg-elevated)"
                        : "transparent",
                    border: "none",
                    borderRadius: 0,
                    cursor: "pointer",
                    transition: "background 0.1s, color 0.1s",
                  }}
                >
                  <span style={{ color: "var(--accent)", marginRight: "6px" }}>{"→"}</span>
                  {record.title}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--text-faint)",
            textAlign: "center",
            padding: "8px",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          {"ESC to close · ↑↓ to navigate · ENTER to open"}
        </div>
      </div>
    </div>
  );
}
