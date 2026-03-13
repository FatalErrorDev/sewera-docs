"use client";

import { useRef } from "react";
import { useCopyCodeButtons } from "./CopyCodeButton";

export function ArticleRenderer({ contentHtml }: { contentHtml: string }) {
  const ref = useRef<HTMLElement>(null);
  useCopyCodeButtons(ref);

  return (
    <article
      ref={ref}
      className="prose dark:prose-invert max-w-none"
      style={{
        fontFamily: "var(--font-serif)",
        fontSize: "17px",
        lineHeight: 1.8,
        color: "var(--text-primary)",
      }}
      dangerouslySetInnerHTML={{ __html: contentHtml }}
    />
  );
}
