"use client";

import { useEffect, useRef, useState } from "react";
import { useClientValue } from "@/lib/client-value";
import { cn } from "@/lib/cn";

/**
 * Reveals children once as they scroll into view. Reduced-motion users get the
 * content immediately — the CSS disables the transform, and the observer still
 * only ever adds content, never hides it.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  // Without an observer there is nothing to wait for, so the content is shown
  // immediately. Deciding that during render rather than in an effect keeps it
  // out of the cascading-render path.
  const canObserve = useClientValue(() => typeof IntersectionObserver !== "undefined", true);
  const visible = seen || !canObserve;

  useEffect(() => {
    const node = ref.current;
    if (!node || !canObserve) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [canObserve]);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={cn("reveal", className)}
      data-visible={visible}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
