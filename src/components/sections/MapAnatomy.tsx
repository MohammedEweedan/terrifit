"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Ring } from "@/components/ui/Ring";
import { Bar } from "@/components/mock/parts";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";

type TabKey = keyof Dictionary["mapAnatomy"]["tabs"];

const TAB_ORDER: TabKey[] = ["training", "nutrition", "checkins", "supplements", "milestones"];

/** Localised short weekday names, week starting Monday. */
function weekdays(locale: Locale): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  // 2024-01-01 was a Monday.
  return Array.from({ length: 7 }, (_, index) =>
    formatter.format(new Date(Date.UTC(2024, 0, 1 + index))),
  );
}

export function MapAnatomy({
  d,
  locale,
  showHeading = true,
}: {
  d: Dictionary;
  locale: Locale;
  showHeading?: boolean;
}) {
  const [active, setActive] = useState<TabKey>("training");
  const tab = d.mapAnatomy.tabs[active];

  function choose(key: TabKey) {
    setActive(key);
    track("map_tab", { tab: key });
  }

  return (
    <section id="map" className="scroll-mt-20 py-24">
      <Container>
        {showHeading ? (
          <SectionHeading
            eyebrow={d.mapAnatomy.eyebrow}
            headline={d.mapAnatomy.headline}
            body={d.mapAnatomy.body}
          />
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <Reveal>
            <div role="tablist" aria-label={d.mapAnatomy.eyebrow} className="flex flex-col">
              {TAB_ORDER.map((key) => {
                const isActive = key === active;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`map-panel-${key}`}
                    id={`map-tab-${key}`}
                    onClick={() => choose(key)}
                    className={cn(
                      "group cursor-pointer border-s-2 py-4 text-start transition-colors ps-5",
                      isActive
                        ? "border-accent"
                        : "border-border hover:border-border-strong",
                    )}
                  >
                    <span
                      className={cn(
                        "block text-[0.95rem] font-semibold transition-colors",
                        isActive ? "text-fg" : "text-fg-3 group-hover:text-fg-2",
                      )}
                    >
                      {d.mapAnatomy.tabs[key].label}
                    </span>
                    {isActive ? (
                      <>
                        <span className="mt-2 block text-[0.85rem] font-medium text-accent">
                          {tab.headline}
                        </span>
                        <span className="mt-1.5 block max-w-sm text-[0.83rem] leading-relaxed text-fg-2">
                          {tab.body}
                        </span>
                      </>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </Reveal>

          <Reveal delay={100}>
            <MapCard d={d} locale={locale} active={active} />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

function MapCard({
  d,
  locale,
  active,
}: {
  d: Dictionary;
  locale: Locale;
  active: TabKey;
}) {
  const sample = d.mapAnatomy.sample;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4 border-b border-border bg-bg-elev p-5">
        <div className="min-w-0">
          <p className="text-[1rem] font-semibold text-fg">{sample.mapTitle}</p>
          <p className="mt-1 text-[0.78rem] text-fg-2">{sample.coach}</p>
          <p className="mt-3 text-[0.7rem] text-fg-3">{sample.version}</p>
        </div>
        <Ring value={62} size={64} stroke={6} label={`${sample.adherence} 62%`}>
          <span className="numeric text-[0.95rem] font-semibold text-fg">62</span>
          <span className="text-[0.55rem] text-fg-3">%</span>
        </Ring>
      </div>

      <div
        id={`map-panel-${active}`}
        role="tabpanel"
        aria-labelledby={`map-tab-${active}`}
        className="min-h-[248px] p-5"
      >
        {active === "training" ? <TrainingPanel d={d} locale={locale} /> : null}
        {active === "nutrition" ? <NutritionPanel d={d} /> : null}
        {active === "checkins" ? <CheckInPanel d={d} /> : null}
        {active === "supplements" ? <SupplementPanel d={d} /> : null}
        {active === "milestones" ? <MilestonePanel d={d} /> : null}
      </div>

      <p className="border-t border-border bg-accent-soft px-5 py-3 text-[0.75rem] text-fg-2">
        {sample.supportLine}
      </p>
    </div>
  );
}

function PanelLabel({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow text-fg-3">{children}</p>;
}

function TrainingPanel({ d, locale }: { d: Dictionary; locale: Locale }) {
  const days = weekdays(locale);
  // Mon / Tue / Thu / Fri / Sat are training days in this sample block.
  const trainingDays = [0, 1, 3, 4, 5];

  return (
    <div>
      <PanelLabel>{d.mapPanel.sessionsThisWeek}</PanelLabel>
      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {days.map((day, index) => {
          const isTraining = trainingDays.includes(index);
          const isDone = isTraining && index < 3;
          return (
            <div
              key={day}
              className={cn(
                "rounded-lg border p-2 text-center",
                isTraining ? "border-accent-line bg-accent-soft" : "border-border bg-bg-elev",
              )}
            >
              <p className="truncate text-[0.6rem] text-fg-3">{day}</p>
              <p
                className={cn(
                  "mt-1.5 text-[0.75rem] font-semibold",
                  isDone ? "text-accent" : isTraining ? "text-fg" : "text-fg-3",
                )}
              >
                {isDone ? "✓" : isTraining ? "•" : "–"}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-border bg-bg-elev p-4">
        <p className="text-[0.7rem] text-fg-3">{d.mock.nextWorkout}</p>
        <p className="mt-1 text-[0.9rem] font-semibold text-fg">
          {d.mapAnatomy.sample.sessionName}
        </p>
        <p className="mt-1 text-[0.72rem] text-fg-2">{d.mock.nextWorkoutValue}</p>
      </div>
    </div>
  );
}

function NutritionPanel({ d }: { d: Dictionary }) {
  const macros = [
    { label: d.mapPanel.protein, value: "185 g", pct: 88 },
    { label: d.mapPanel.carbs, value: "240 g", pct: 71 },
    { label: d.mapPanel.fat, value: "70 g", pct: 54 },
  ];

  return (
    <div className="space-y-5">
      {macros.map((macro) => (
        <div key={macro.label}>
          <div className="flex items-baseline justify-between">
            <span className="text-[0.8rem] text-fg-2">{macro.label}</span>
            <span className="numeric text-[0.95rem] font-semibold text-fg">{macro.value}</span>
          </div>
          <div className="mt-2">
            <Bar value={macro.pct} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CheckInPanel({ d }: { d: Dictionary }) {
  return (
    <div>
      <PanelLabel>{d.mapPanel.nextCheckIn}</PanelLabel>
      <p className="mt-3 text-[0.95rem] font-semibold text-warn">{d.mock.checkInDueValue}</p>
      <ul className="mt-4 space-y-2">
        {d.mapPanel.checkInItems.map((item) => (
          <li
            key={item}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-bg-elev px-3 py-2 text-[0.8rem] text-fg-2"
          >
            <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SupplementPanel({ d }: { d: Dictionary }) {
  return (
    <div>
      <div className="flex items-start gap-3 rounded-xl border border-border bg-bg-elev p-4">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent"
          aria-hidden="true"
        >
          ◆
        </span>
        <div className="min-w-0">
          <p className="text-[0.9rem] font-semibold text-fg">{d.mapPanel.supplementName}</p>
          <p className="numeric mt-0.5 text-[0.78rem] text-fg-2">{d.mapPanel.supplementDose}</p>
        </div>
      </div>
      <p className="mt-4 rounded-lg border border-dashed border-border-strong px-3 py-2.5 text-[0.72rem] text-fg-3">
        {d.mapPanel.disclosure}
      </p>
    </div>
  );
}

function MilestonePanel({ d }: { d: Dictionary }) {
  return (
    <ol className="relative space-y-5 ps-5">
      <span
        className="absolute inset-y-1 start-[3px] w-px bg-border-strong"
        aria-hidden="true"
      />
      {d.mapPanel.milestones.map((milestone) => (
        <li key={milestone.week} className="relative">
          <span
            className={cn(
              "absolute -start-5 top-1 size-[7px] rounded-full ring-4 ring-surface",
              milestone.done ? "bg-accent" : "bg-border-strong",
            )}
            aria-hidden="true"
          />
          <p className="numeric text-[0.7rem] text-fg-3">{milestone.week}</p>
          <p
            className={cn(
              "mt-0.5 text-[0.85rem]",
              milestone.done ? "font-medium text-fg" : "text-fg-2",
            )}
          >
            {milestone.label}
          </p>
        </li>
      ))}
    </ol>
  );
}
