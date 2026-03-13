"use client";

import { useCallback, useEffect, useRef } from "react";

export function CopyCodeButton() {
  return null;
}

function applyButtonStyles(btn: HTMLButtonElement) {
  Object.assign(btn.style, {
    position: "absolute",
    top: "0.5rem",
    right: "0.75rem",
    padding: "0.25rem 0.5rem",
    fontSize: "0.7rem",
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    borderRadius: "0.375rem",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    color: "var(--text-muted)",
    cursor: "pointer",
    transition: "color 0.15s, background 0.15s",
    lineHeight: "1.4",
  });
}

function applyLabelStyles(label: HTMLSpanElement) {
  Object.assign(label.style, {
    position: "absolute",
    top: "0.5rem",
    left: "1rem",
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--text-muted)",
    lineHeight: "1.4",
  });
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

      // Add language label
      const code = pre.querySelector("code");
      if (code) {
        const langClass = Array.from(code.classList).find((c) => c.startsWith("language-"));
        if (langClass) {
          const lang = langClass.replace("language-", "");
          const label = document.createElement("span");
          label.textContent = lang;
          applyLabelStyles(label);
          pre.appendChild(label);
        }
      }

      // Add copy button
      const btn = document.createElement("button");
      btn.textContent = "Copy";
      applyButtonStyles(btn);
      btn.addEventListener("mouseenter", () => {
        btn.style.color = "var(--text-secondary)";
        btn.style.background = "var(--border)";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.color = "var(--text-muted)";
        btn.style.background = "var(--surface)";
      });
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
