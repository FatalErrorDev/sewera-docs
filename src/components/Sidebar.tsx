"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Article, Category, Subcategory } from "@/types/content";
import { formatName } from "@/lib/format";

export function Sidebar({
  categories,
  open,
  onClose,
}: {
  categories: Category[];
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  // Track which subcategories are expanded (by "category/subcategory" key)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  // Auto-expand the subcategory containing the active article
  useEffect(() => {
    for (const cat of categories) {
      for (const sub of cat.subcategories) {
        const key = `${cat.name}/${sub.name}`;
        const hasActive = sub.articles.some(
          (a) => pathname === `/docs/${a.slug.join("/")}`
        );
        if (hasActive) {
          setExpanded((prev) => {
            if (prev.has(key)) return prev;
            const next = new Set(prev);
            next.add(key);
            return next;
          });
        }
      }
    }
  }, [pathname, categories]);

  function toggleSub(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function ArticleLink({ article, indent = false }: { article: Article; indent?: boolean }) {
    const href = `/docs/${article.slug.join("/")}`;
    const active = pathname === href;
    const basePadding = indent ? 28 : 20;
    return (
      <li key={href}>
        <Link
          href={href}
          onClick={onClose}
          style={{
            display: "block",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: active ? "var(--accent)" : "var(--text-secondary)",
            padding: active
              ? `6px ${basePadding - 2}px 6px ${basePadding - 2}px`
              : `6px ${basePadding}px`,
            textDecoration: "none",
            borderLeft: active
              ? "2px solid var(--accent)"
              : "2px solid transparent",
            background: active ? "var(--accent-dim)" : "transparent",
            transition: "color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!active) {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.background = "var(--bg-elevated)";
            }
          }}
          onMouseLeave={(e) => {
            if (!active) {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.background = "transparent";
            }
          }}
        >
          {article.title}
        </Link>
      </li>
    );
  }

  const nav = (
    <nav style={{ paddingTop: "24px" }}>
      {categories.map((cat, catIndex) => (
        <div key={cat.name}>
          {catIndex > 0 && (
            <div
              style={{
                height: "1px",
                background: "var(--border-subtle)",
                margin: "12px 0",
              }}
            />
          )}
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 500,
              color: "var(--text-muted)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "0 20px",
              marginBottom: "4px",
            }}
          >
            {formatName(cat.name)}
          </p>
          <ul style={{ listStyle: "none" }}>
            {cat.articles.map((article) => (
              <ArticleLink key={article.slug.join("/")} article={article} />
            ))}
          </ul>
          {cat.subcategories.map((sub) => {
            const key = `${cat.name}/${sub.name}`;
            const isExpanded = expanded.has(key);
            return (
              <div key={sub.name} style={{ marginTop: "8px" }}>
                <button
                  onClick={() => toggleSub(key)}
                  style={{
                    all: "unset",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    width: "100%",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    fontSize: "9px",
                    fontWeight: 500,
                    color: "var(--text-faint)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "4px 28px",
                    marginBottom: "2px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-faint)";
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "8px",
                      transition: "transform 0.15s",
                      transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                    }}
                  >
                    ▶
                  </span>
                  {sub.displayName}
                </button>
                {isExpanded && (
                  <ul style={{ listStyle: "none" }}>
                    {sub.articles.map((article) => (
                      <ArticleLink key={article.slug.join("/")} article={article} indent />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:block"
        style={{
          position: "fixed",
          left: 0,
          top: "48px",
          bottom: 0,
          width: "240px",
          overflowY: "auto",
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border-default)",
        }}
      >
        {nav}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)" }}
            onClick={onClose}
          />
          <aside
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "240px",
              overflowY: "auto",
              background: "var(--bg-surface)",
            }}
          >
            <div
              style={{
                height: "48px",
                display: "flex",
                alignItems: "center",
                padding: "0 20px",
                borderBottom: "1px solid var(--border-default)",
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "var(--text-primary)",
                fontWeight: 500,
              }}
            >
              SEWERA DOCS
            </div>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
