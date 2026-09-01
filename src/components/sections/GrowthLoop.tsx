import type { Dictionary } from "@/i18n";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * The growth loop, drawn as a ring with a pulse travelling it.
 *
 * Laid out with trigonometry rather than absolute positioning so the labels
 * stay evenly spaced whatever the node count, and rendered as SVG so it is
 * crisp at any size and needs no client JS.
 */
export function GrowthLoop({ d }: { d: Dictionary }) {
  const nodes = d.loop.nodes;
  const size = 520;
  const centre = size / 2;
  const radius = 176;
  const circumference = 2 * Math.PI * radius;

  const points = nodes.map((label, index) => {
    // Start at twelve o'clock and run clockwise.
    const angle = (index / nodes.length) * Math.PI * 2 - Math.PI / 2;
    return {
      label,
      x: centre + radius * Math.cos(angle),
      y: centre + radius * Math.sin(angle),
      angle,
    };
  });

  return (
    <section className="band noise border-y border-border bg-bg-elev py-24">
      <div className="bloom start-1/2 top-1/2 size-[460px] -translate-x-1/2 -translate-y-1/2 opacity-30" />
      <Container className="grid items-center gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <SectionHeading
          eyebrow={d.loop.eyebrow}
          headline={d.loop.headline}
          body={d.loop.body}
        />

        <Reveal delay={120}>
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="mx-auto w-full max-w-[520px]"
            role="img"
            aria-label={`${d.loop.headline} ${nodes.join(" → ")}`}
          >
            <circle
              cx={centre}
              cy={centre}
              r={radius}
              fill="none"
              stroke="var(--border-strong)"
              strokeWidth="1"
            />
            {/* Travelling pulse: a short dash chasing round the ring. */}
            <circle
              className="dash-flow"
              cx={centre}
              cy={centre}
              r={radius}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${circumference * 0.08} ${circumference}`}
            />

            {points.map((point, index) => (
              <g key={point.label}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill="var(--accent)"
                  stroke="var(--bg-elev)"
                  strokeWidth="3"
                />
                <text
                  x={point.x + Math.cos(point.angle) * 26}
                  y={point.y + Math.sin(point.angle) * 26}
                  textAnchor={
                    Math.abs(Math.cos(point.angle)) < 0.25
                      ? "middle"
                      : Math.cos(point.angle) > 0
                        ? "start"
                        : "end"
                  }
                  dominantBaseline="middle"
                  className="text-[13px]"
                  fill="var(--fg-2)"
                  style={{ fontWeight: 500 }}
                >
                  {point.label}
                </text>
                <text
                  x={point.x}
                  y={point.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[8px]"
                  fill="transparent"
                >
                  {index + 1}
                </text>
              </g>
            ))}
          </svg>
        </Reveal>
      </Container>
    </section>
  );
}
