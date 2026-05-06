"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

let mermaidLoaded: Promise<typeof import("mermaid").default> | null = null;

function loadMermaid() {
  if (!mermaidLoaded) {
    mermaidLoaded = import("mermaid").then((m) => m.default);
  }
  return mermaidLoaded;
}

export function useMermaid(
  containerRef: React.RefObject<HTMLElement | null>,
  contentKey: string,
) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const codeBlocks = container.querySelectorAll<HTMLElement>(
      "pre > code.language-mermaid",
    );
    if (codeBlocks.length === 0) return;

    let cancelled = false;

    const newNodes: HTMLElement[] = [];
    codeBlocks.forEach((code) => {
      const pre = code.parentElement as HTMLPreElement | null;
      if (!pre) return;
      const source = code.textContent ?? "";
      const replacement = document.createElement("pre");
      replacement.className = "mermaid";
      replacement.textContent = source;
      pre.replaceWith(replacement);
      newNodes.push(replacement);
    });

    loadMermaid().then((mermaid) => {
      if (cancelled || newNodes.length === 0) return;
      mermaid.initialize({
        startOnLoad: false,
        theme: resolvedTheme === "dark" ? "dark" : "default",
        securityLevel: "strict",
      });
      mermaid.run({ nodes: newNodes }).catch(() => {
        /* mermaid logs its own parse errors */
      });
    });

    return () => {
      cancelled = true;
    };
  }, [containerRef, contentKey, resolvedTheme]);
}
