"use client";

import { useCallback, useEffect, useRef } from "react";

export function CopyCodeButton() {
  return null;
}

function applyButtonStyles(btn: HTMLButtonElement) {
  Object.assign(btn.style, {
    position: "absolute",
    top: "10px",
    right: "12px",
    padding: "2px 6px",
    fontSize: "10px",
    fontFamily: "var(--font-mono)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    background: "none",
    border: "none",
    borderRadius: "0",
    color: "var(--text-faint)",
    cursor: "pointer",
    transition: "color 0.15s",
    lineHeight: "1.4",
  });
}

function applyLabelStyles(label: HTMLSpanElement) {
  Object.assign(label.style, {
    position: "absolute",
    top: "10px",
    left: "1rem",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--text-faint)",
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

    btn.textContent = "COPIED";
    btn.style.color = "var(--accent)";
    setTimeout(() => {
      btn.textContent = "COPY";
      btn.style.color = "var(--text-faint)";
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
      btn.textContent = "COPY";
      applyButtonStyles(btn);
      btn.addEventListener("mouseenter", () => {
        btn.style.color = "var(--text-primary)";
      });
      btn.addEventListener("mouseleave", () => {
        if (btn.textContent !== "COPIED") {
          btn.style.color = "var(--text-faint)";
        }
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
