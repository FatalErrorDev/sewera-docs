"use client";

import { useRef } from "react";
import { useCopyCodeButtons } from "./CopyCodeButton";
import { useMermaid } from "./Mermaid";

export function ArticleRenderer({ contentHtml }: { contentHtml: string }) {
  const ref = useRef<HTMLElement>(null);
  useMermaid(ref, contentHtml);
  useCopyCodeButtons(ref);

  return (
    <article
      ref={ref}
      className="prose dark:prose-invert max-w-none"
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: "17px",
        lineHeight: 1.8,
        color: "var(--text-primary)",
      }}
      dangerouslySetInnerHTML={{ __html: contentHtml }}
    />
  );
}
