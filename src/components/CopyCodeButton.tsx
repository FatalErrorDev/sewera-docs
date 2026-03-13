"use client";

import { useCallback, useEffect, useRef } from "react";

export function CopyCodeButton() {
  return null;
}

export function useCopyCodeButtons(containerRef: React.RefObject<HTMLElement | null>) {
  const buttonsRef = useRef<Map<HTMLPreElement, HTMLButtonElement>>(new Map());

  const handleCopy = useCallback(async (pre: HTMLPreElement, btn: HTMLButtonElement) => {
    const code = pre.querySelector("code");
    if (!code) return;
    const text = code.innerText;

    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    btn.textContent = "Copied!";
    setTimeout(() => {
      btn.textContent = "Copy";
    }, 2000);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const pres = container.querySelectorAll("pre");
    pres.forEach((pre) => {
      if (buttonsRef.current.has(pre)) return;
      pre.style.position = "relative";
      const btn = document.createElement("button");
      btn.textContent = "Copy";
      btn.className =
        "absolute top-2 right-2 px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors";
      btn.addEventListener("click", () => handleCopy(pre, btn));
      pre.appendChild(btn);
      buttonsRef.current.set(pre, btn);
    });

    return () => {
      buttonsRef.current.forEach((btn, pre) => {
        btn.removeEventListener("click", () => handleCopy(pre, btn));
        btn.remove();
      });
      buttonsRef.current.clear();
    };
  }, [containerRef, handleCopy]);
}
