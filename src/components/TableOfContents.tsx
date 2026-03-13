"use client";

import { Heading } from "@/types/content";
import { useEffect, useState } from "react";

export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "0px 0px -80% 0px", threshold: 0.1 }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav
      className="hidden xl:block"
      style={{
        position: "sticky",
        top: "64px",
        width: "224px",
        flexShrink: 0,
        alignSelf: "flex-start",
        padding: "24px 16px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--text-muted)",
          marginBottom: "12px",
        }}
      >
        {"// on this page"}
      </p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {headings.map((h) => {
          const active = activeId === h.id;
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  display: "block",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  padding: "4px 8px",
                  paddingLeft: h.level === 3 ? "16px" : "8px",
                  textDecoration: "none",
                  borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
                  transition: "color 0.15s",
                }}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
