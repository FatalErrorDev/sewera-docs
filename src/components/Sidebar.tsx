"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Category } from "@/types/content";
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
            {cat.articles.map((article) => {
              const href = `/docs/${article.slug.join("/")}`;
              const active = pathname === href;
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
                      padding: active ? "6px 18px 6px 18px" : "6px 20px",
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
            })}
          </ul>
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
