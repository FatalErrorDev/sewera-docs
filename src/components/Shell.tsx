"use client";

import { useState, useEffect, useCallback } from "react";
import { Category } from "@/types/content";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { SearchModal } from "./SearchModal";

export function Shell({
  categories,
  children,
}: {
  categories: Category[];
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <Header
        onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        onSearchOpen={openSearch}
      />
      <Sidebar
        categories={categories}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <SearchModal open={searchOpen} onClose={closeSearch} />
      <main className="lg:pl-[240px]">
        {children}
      </main>
    </>
  );
}
