"use client";

import { useRef } from "react";
import { useCopyCodeButtons } from "./CopyCodeButton";

export function ArticleRenderer({ contentHtml }: { contentHtml: string }) {
  const ref = useRef<HTMLElement>(null);
  useCopyCodeButtons(ref);

  return (
    <article
      ref={ref}
      className="prose dark:prose-invert max-w-none text-text-primary prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-text-primary prose-headings:scroll-mt-20 prose-h1:text-3xl prose-h1:mb-4 prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-text-primary prose-p:mb-6 prose-a:text-accent prose-a:underline prose-a:decoration-accent/30 prose-a:underline-offset-2 hover:prose-a:decoration-accent prose-strong:text-text-primary prose-strong:font-semibold prose-blockquote:border-l-2 prose-blockquote:border-accent prose-blockquote:bg-surface prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:text-text-secondary prose-blockquote:not-italic prose-pre:bg-code-bg prose-pre:text-code-text prose-pre:text-sm prose-pre:rounded-xl prose-pre:border prose-pre:border-border prose-code:before:content-none prose-code:after:content-none prose-code:bg-surface prose-code:text-text-primary prose-code:rounded-md prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:text-[0.9em] prose-table:text-sm prose-th:font-sans prose-th:font-medium prose-th:text-text-secondary prose-th:border-border prose-td:border-border prose-hr:border-border prose-hr:my-12 prose-li:marker:text-text-muted prose-img:rounded-xl prose-img:border prose-img:border-border"
      dangerouslySetInnerHTML={{ __html: contentHtml }}
    />
  );
}
