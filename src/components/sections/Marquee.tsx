import { Fragment } from "react";
import type { Dictionary } from "@/i18n";

/**
 * Ticker of product guarantees. Two identical runs sit in the track so the
 * CSS loop is seamless; the duplicate is hidden from assistive technology.
 */
export function Marquee({ d }: { d: Dictionary }) {
  const run = (
    <div className="flex shrink-0 items-center">
      {d.marquee.map((item) => (
        <Fragment key={item}>
          <span className="whitespace-nowrap px-7 text-[0.8rem] font-medium tracking-wide text-fg-2">
            {item}
          </span>
          <span className="size-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
        </Fragment>
      ))}
    </div>
  );

  return (
    <div className="marquee-mask border-y border-border bg-bg-elev py-4">
      <div className="marquee-track">
        {run}
        <div aria-hidden="true" className="flex shrink-0 items-center">
          {run}
        </div>
      </div>
    </div>
  );
}
