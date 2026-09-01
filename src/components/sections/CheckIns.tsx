"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Silhouette } from "@/components/mock/Silhouette";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";

type VisibilityKey = keyof Dictionary["checkIns"]["visibility"];

const VISIBILITY_ORDER: VisibilityKey[] = ["private", "coach", "friends", "community", "public"];

export function CheckIns({ d }: { d: Dictionary }) {
  const [blur, setBlur] = useState(7);
  const [visibility, setVisibility] = useState<VisibilityKey>("coach");

  return (
    <section id="check-ins" className="scroll-mt-20 py-24">
      <Container>
        <SectionHeading
          eyebrow={d.checkIns.eyebrow}
          headline={d.checkIns.headline}
          body={d.checkIns.body}
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Reveal>
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
              <div className="grid grid-cols-2 gap-px bg-border">
                <Silhouette className="aspect-[4/5]" blur={blur} tone="neutral" />
                <Silhouette className="aspect-[4/5]" blur={blur} tone="accent" />
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor="blur-strength"
                    className="text-[0.85rem] font-medium text-fg"
                  >
                    {d.checkIns.faceBlurLabel}
                  </label>
                  <span
                    className={cn(
                      "numeric rounded-full border px-2.5 py-0.5 text-[0.7rem] font-medium",
                      blur > 0
                        ? "border-accent-line bg-accent-soft text-accent"
                        : "border-border text-fg-3",
                    )}
                  >
                    {blur > 0 ? d.checkIns.faceBlurOn : d.checkIns.faceBlurOff}
                  </span>
                </div>

                <input
                  id="blur-strength"
                  type="range"
                  min={0}
                  max={14}
                  step={1}
                  value={blur}
                  onChange={(event) => setBlur(Number(event.target.value))}
                  onPointerUp={() => track("blur_adjust", { value: blur })}
                  className="mt-4 w-full cursor-pointer accent-[var(--accent)]"
                  aria-describedby="blur-hint"
                />
                <p id="blur-hint" className="mt-2 text-[0.72rem] text-fg-3">
                  {d.checkIns.dragHint}
                </p>
                <p className="mt-4 border-t border-border pt-4 text-[0.75rem] leading-relaxed text-fg-2">
                  {d.checkIns.faceBlurNote}
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100} className="flex flex-col gap-6">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="eyebrow text-fg-3">{d.checkIns.visibilityTitle}</p>
              <div className="mt-4 flex flex-col gap-1.5" role="radiogroup">
                {VISIBILITY_ORDER.map((key) => {
                  const option = d.checkIns.visibility[key];
                  const isActive = key === visibility;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => {
                        setVisibility(key);
                        track("visibility_select", { value: key });
                      }}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-start transition-colors",
                        isActive
                          ? "border-accent bg-accent-soft"
                          : "border-border hover:border-border-strong",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-4 shrink-0 place-items-center rounded-full border",
                          isActive ? "border-accent" : "border-border-strong",
                        )}
                        aria-hidden="true"
                      >
                        {isActive ? <span className="size-2 rounded-full bg-accent" /> : null}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={cn(
                            "block text-[0.85rem] font-medium",
                            isActive ? "text-fg" : "text-fg-2",
                          )}
                        >
                          {option.label}
                        </span>
                        <span className="block text-[0.72rem] text-fg-3">{option.note}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-warn/35 bg-warn/[0.06] p-5">
              <p className="flex items-center gap-2 text-[0.85rem] font-semibold text-warn">
                <span aria-hidden="true">⚠</span>
                {d.checkIns.warningTitle}
              </p>
              <p className="mt-2.5 text-[0.8rem] leading-relaxed text-fg-2">
                {d.checkIns.warningBody}
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
