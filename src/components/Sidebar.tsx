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
    <nav className="flex flex-col gap-6 p-6 pt-4">
      {categories.map((cat) => (
        <div key={cat.name}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/40">
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
                        ? "border-l-2 border-accent bg-accent/10 text-accent font-medium"
                        : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
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
      <aside className="hidden lg:block fixed left-0 top-14 bottom-0 w-64 overflow-y-auto border-r border-foreground/10 bg-background">
        {nav}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 overflow-y-auto bg-background shadow-xl">
            <div className="h-14 flex items-center px-6 border-b border-foreground/10">
              <span className="font-semibold text-foreground">Claude Docs</span>
            </div>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
