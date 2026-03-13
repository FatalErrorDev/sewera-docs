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
      fetch("/api/search-index")
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
        else {
          // parent handles opening
        }
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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border dark:border-accent/20 bg-background shadow-2xl font-sans">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-text-muted"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search documentation..."
            className="flex-1 bg-transparent py-4 text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
          <kbd
            className="rounded border border-border px-1.5 py-0.5 text-xs text-text-muted cursor-pointer"
            onClick={onClose}
          >
            Esc
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && query && (
            <p className="px-3 py-8 text-center text-sm text-text-muted">
              No results found.
            </p>
          )}
          {results.map((r, i) => (
            <button
              key={r.slug.join("/")}
              onClick={() => navigate(r)}
              className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
                i === selectedIndex
                  ? "bg-accent/8 text-accent"
                  : "text-text-secondary hover:bg-surface"
              }`}
            >
              <div className="text-sm font-medium">{r.title}</div>
              <div className="mt-0.5 text-xs text-text-muted">
                {formatName(r.category)}
                {r.description && ` — ${r.description}`}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
