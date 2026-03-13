"use client";

import { useRef } from "react";
import { useCopyCodeButtons } from "./CopyCodeButton";

export function ArticleRenderer({ contentHtml }: { contentHtml: string }) {
  const ref = useRef<HTMLElement>(null);
  useCopyCodeButtons(ref);

  return (
    <article
      ref={ref}
      className="prose prose-zinc dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-pre:bg-[#1a1a2e] prose-pre:text-sm prose-code:before:content-none prose-code:after:content-none prose-code:bg-foreground/5 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-a:text-accent prose-a:no-underline hover:prose-a:underline"
      dangerouslySetInnerHTML={{ __html: contentHtml }}
    />
  );
}
