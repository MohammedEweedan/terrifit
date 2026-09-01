import type { Dictionary } from "@/i18n";
import { Ring } from "@/components/ui/Ring";
import { Silhouette } from "./Silhouette";
import { Avatar, Bar, Chip, Row, Sparkline, type Tone } from "./parts";

type Mock = Dictionary["mock"];

const SCREEN = "flex h-full flex-col gap-3 overflow-hidden px-3.5 pb-3.5 pt-8";

function ScreenBar({ title, trailing }: { title: string; trailing?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[11px] font-semibold tracking-wide text-fg">{title}</p>
      {trailing}
    </div>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-surface p-3 ${className}`}>{children}</div>
  );
}

/** The compact daily performance header that sits above the feed. */
export function DailyHeader({ m, compact = false }: { m: Mock; compact?: boolean }) {
  return (
    <Card className="!p-3.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-fg-3">{m.date}</p>
          <p className="mt-0.5 text-[12px] font-semibold text-fg">{m.greeting}</p>
        </div>
        <div className="text-end">
          <p className="numeric text-[18px] font-semibold leading-none text-accent">18</p>
          <p className="mt-1 text-[9px] text-fg-3">{m.streakUnit}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3.5">
        <Ring value={62} size={compact ? 62 : 68} stroke={6} label={`${m.mapProgress} 62%`}>
          <span className="numeric text-[15px] font-semibold text-fg">62</span>
          <span className="text-[8px] text-fg-3">%</span>
        </Ring>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div>
            <p className="text-[9px] text-fg-3">{m.nextWorkout}</p>
            <p className="truncate text-[11px] font-medium text-fg">{m.nextWorkoutValue}</p>
          </div>
          <div className="hairline" />
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9px] text-fg-3">{m.checkInDue}</p>
              <p className="truncate text-[11px] font-medium text-warn">{m.checkInDueValue}</p>
            </div>
            <div className="text-end">
              <p className="text-[9px] text-fg-3">{m.recovery}</p>
              <p className="numeric text-[11px] font-medium text-good">68%</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function FeedScreen({ m }: { m: Mock }) {
  return (
    <div className={SCREEN}>
      <ScreenBar
        title="Terrifit"
        trailing={<span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />}
      />

      <DailyHeader m={m} compact />

      <Card className="!p-0 overflow-hidden">
        <div className="flex items-center gap-2 p-3">
          <Avatar label="N" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[11px] font-semibold text-fg">
              <span className="truncate">{m.feedAuthor}</span>
              <VerifiedMark />
            </p>
            <p className="truncate text-[9px] text-fg-3">
              {m.feedRole} · {m.feedTime}
            </p>
          </div>
          <Chip tone="accent">{m.feedTag}</Chip>
        </div>

        <div className="grid grid-cols-2 gap-px bg-border">
          <Silhouette className="aspect-[3/4]" tone="neutral" />
          <Silhouette className="aspect-[3/4]" tone="accent" />
        </div>

        <div className="p-3">
          <p className="text-[10.5px] leading-snug text-fg-2">{m.feedCaption}</p>
          <div className="mt-2.5 flex items-center gap-3 text-[9px] text-fg-3">
            <span className="numeric">♡ {m.likes}</span>
            <span className="numeric">◌ {m.comments}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function MapScreen({ m, d }: { m: Mock; d: Dictionary }) {
  const sample = d.mapAnatomy.sample;

  return (
    <div className={SCREEN}>
      <ScreenBar title={d.prototypes.tabs.map.label} />

      <Card className="!p-0 overflow-hidden">
        <div className="relative h-24 bg-gradient-to-br from-accent/35 to-transparent">
          <div className="absolute inset-x-0 bottom-0 p-3">
            <p className="text-[12px] font-semibold leading-tight text-fg">{sample.mapTitle}</p>
            <p className="mt-0.5 text-[9px] text-fg-2">{sample.coach}</p>
          </div>
        </div>
        <div className="flex items-center justify-between px-3 py-2.5">
          <p className="numeric text-[13px] font-semibold text-fg">{m.mapPrice}</p>
          <p className="text-[9px] text-fg-3">
            <span className="numeric text-fg">★ {m.mapRating}</span> · {m.mapReviews}
          </p>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <Ring value={62} size={52} stroke={5} label={`${sample.adherence} 62%`}>
            <span className="numeric text-[12px] font-semibold text-fg">62</span>
          </Ring>
          <div className="flex-1">
            <p className="text-[9px] text-fg-3">{sample.week}</p>
            <p className="mt-0.5 text-[11px] font-medium text-fg">{sample.adherence} 62%</p>
            <p className="mt-1.5 text-[9px] text-fg-3">{sample.version}</p>
          </div>
        </div>
      </Card>

      <div className="rounded-xl border border-accent-line bg-accent-soft p-2.5">
        <p className="text-[9.5px] leading-snug text-fg-2">{m.mapSupport}</p>
      </div>

      <Card className="!p-0">
        {m.mapSections.map((section, index) => (
          <div
            key={section}
            className={`flex items-center justify-between px-3 py-2.5 text-[10.5px] text-fg ${
              index > 0 ? "border-t border-border" : ""
            }`}
          >
            <span>{section}</span>
            <span className="flip-rtl text-fg-3" aria-hidden="true">
              ›
            </span>
          </div>
        ))}
      </Card>

      <button
        type="button"
        tabIndex={-1}
        className="mt-auto w-full rounded-lg bg-accent py-2.5 text-[11px] font-semibold text-accent-fg"
      >
        {m.mapCta}
      </button>
    </div>
  );
}

export function CheckInScreen({ m, d }: { m: Mock; d: Dictionary }) {
  return (
    <div className={SCREEN}>
      <ScreenBar title={m.checkInTitle} trailing={<Chip tone="good">{m.privateBadge}</Chip>} />

      <div className="grid grid-cols-3 gap-1.5">
        {[m.photoFront, m.photoSide, m.photoBack].map((label, index) => (
          <div key={label} className="overflow-hidden rounded-lg border border-border">
            <Silhouette
              className="aspect-[3/4]"
              blur={6}
              tone={index === 1 ? "neutral" : "accent"}
            />
            <p className="bg-surface px-1.5 py-1 text-center text-[8.5px] text-fg-3">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-2">
        <span className="text-[10px] text-fg-2">{d.checkIns.faceBlurLabel}</span>
        <span className="ms-auto inline-flex h-4 w-7 items-center rounded-full bg-accent p-0.5">
          <span className="ms-auto size-3 rounded-full bg-accent-fg" />
        </span>
      </div>

      <Card>
        <Row label={m.weight} value={m.weightValue} />
        <div className="hairline" />
        <Row label={m.waist} value={m.waistValue} />
        <div className="hairline" />
        <Row label={m.sleep} value={m.sleepValue} />
      </Card>

      <Card>
        <p className="text-[9px] text-fg-3">{m.visibility}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <p className="text-[11px] font-medium text-fg">{m.visibilityValue}</p>
          <span className="flip-rtl text-fg-3" aria-hidden="true">
            ›
          </span>
        </div>
      </Card>

      <button
        type="button"
        tabIndex={-1}
        className="mt-auto w-full rounded-lg bg-accent py-2.5 text-[11px] font-semibold text-accent-fg"
      >
        {m.submitCheckIn}
      </button>
    </div>
  );
}

export function DashboardScreen({ m }: { m: Mock }) {
  return (
    <div className={SCREEN}>
      <ScreenBar
        title={m.dashboardTitle}
        trailing={<span className="text-[9px] text-fg-3">{m.dashboardSub}</span>}
      />

      <Card className="!p-0">
        {m.clients.map((client, index) => (
          <div
            key={client.name}
            className={`px-3 py-2.5 ${index > 0 ? "border-t border-border" : ""}`}
          >
            <div className="flex items-center gap-2">
              <Avatar label={client.name.slice(0, 1)} tone={client.tone as Tone} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium text-fg">{client.name}</p>
                <p className="truncate text-[9px] text-fg-3">{client.map}</p>
              </div>
              <Chip tone={client.tone as Tone}>{client.status}</Chip>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Bar value={client.adherence} tone={client.tone as Tone} />
              <span className="numeric w-8 text-end text-[9px] text-fg-3">
                {client.adherence}%
              </span>
            </div>
          </div>
        ))}
      </Card>

      <Card>
        <div className="flex items-baseline justify-between">
          <p className="text-[9px] text-fg-3">{m.revenue}</p>
          <p className="numeric text-[9px] font-medium text-good">{m.revenueDelta}</p>
        </div>
        <p className="numeric mt-1 text-[20px] font-semibold text-fg">{m.revenueValue}</p>
        <Sparkline
          points={[4, 6, 5, 8, 7, 11, 10, 14]}
          className="mt-2 h-8"
          color="var(--accent)"
        />
      </Card>
    </div>
  );
}

export function ProgressScreen({ m }: { m: Mock }) {
  const rings = [
    { label: m.ringAdherence, value: 91, color: "var(--accent)" },
    { label: m.ringRecovery, value: 68, color: "var(--good)" },
    { label: m.ringSleep, value: 74, color: "var(--warn)" },
  ];

  return (
    <div className={SCREEN}>
      <ScreenBar
        title={m.progressTitle}
        trailing={<Chip tone="good">{m.privateBadge}</Chip>}
      />

      <Card>
        <div className="flex items-start justify-between">
          {rings.map((ring) => (
            <div key={ring.label} className="flex flex-col items-center gap-1.5">
              <Ring
                value={ring.value}
                size={62}
                stroke={5}
                color={ring.color}
                label={`${ring.label} ${ring.value}%`}
              >
                <span className="numeric text-[13px] font-semibold text-fg">{ring.value}</span>
              </Ring>
              <span className="text-[8.5px] text-fg-3">{ring.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-baseline justify-between">
          <p className="text-[9px] text-fg-3">{m.weight}</p>
          <p className="numeric text-[13px] font-semibold text-fg">{m.weightValue}</p>
        </div>
        <Sparkline
          points={[82.1, 81.6, 81.0, 80.4, 80.2, 79.5, 78.9, 78.4]}
          className="mt-2 h-9"
          color="var(--good)"
        />
      </Card>

      <Card>
        <p className="text-[9px] text-fg-3">{m.vsLastMonth}</p>
        <div className="mt-1">
          {m.comparisons.map((comparison, index) => (
            <div key={comparison.label}>
              {index > 0 ? <div className="hairline" /> : null}
              <Row label={comparison.label} value={comparison.value} tone="good" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function VerifiedMark() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true" className="shrink-0">
      <circle cx="6" cy="6" r="6" fill="var(--accent)" />
      <path
        d="m3.4 6.2 1.8 1.8 3.4-3.8"
        stroke="var(--accent-fg)"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
