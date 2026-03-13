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
    <nav className="flex flex-col gap-6 p-6 pt-4 font-sans">
      {categories.map((cat) => (
        <div key={cat.name}>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-accent/70">
            {formatName(cat.name)}
          </p>
          <ul className="space-y-0.5">
            {cat.articles.map((article) => {
              const href = `/docs/${article.slug.join("/")}`;
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                      active
                        ? "border-l-2 border-accent bg-accent/12 text-accent font-medium"
                        : "text-text-secondary hover:bg-surface hover:text-text-primary"
                    }`}
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
      <aside className="hidden lg:block fixed left-0 top-14 bottom-0 w-64 overflow-y-auto border-r border-border bg-surface">
        {nav}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 overflow-y-auto bg-background shadow-xl">
            <div className="h-14 flex items-center px-6 border-b border-border">
              <span className="font-semibold text-text-primary font-sans">Sewera Docs</span>
            </div>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
