import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  headline,
  body,
  align = "start",
  className,
}: {
  eyebrow: string;
  headline: string;
  body?: string;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <Reveal
      className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}
    >
      <p
        className={cn(
          "eyebrow text-accent",
          // The trailing rule only reads correctly on a left-aligned block.
          align === "start" && "rule-label",
        )}
      >
        {eyebrow}
      </p>
      <h2 className="display-lg mt-5 text-fg">{headline}</h2>
      {body ? (
        <p className="mt-6 text-[1rem] leading-relaxed text-fg-2">{body}</p>
      ) : null}
    </Reveal>
  );
}
