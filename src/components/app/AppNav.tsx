"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { websiteCopy } from "@/i18n/website";

const TABS = ["today", "coach", "trends", "body"] as const;

/**
 * Three tabs. On a phone they sit at the bottom, where a thumb is — this is
 * checked one-handed, standing up, usually before six in the morning.
 */
export function AppNav({
  locale,
  labels,
}: {
  locale: Locale;
  labels: Record<"today" | "trends" | "body" | "account", string>;
}) {
  const pathname = usePathname();
  const href = (tab: string) => (tab === "today" ? `/${locale}/dashboard` : `/${locale}/dashboard/${tab}`);

  return (
    <nav className="ap-nav" aria-label={labels.today}>
      {TABS.map((tab) => {
        const target = href(tab);
        const active = pathname === target;
        return (
          <Link key={tab} href={target} aria-current={active ? "page" : undefined} className={active ? "is-active" : undefined}>
            {tab === "coach" ? websiteCopy(locale).coach : labels[tab]}
          </Link>
        );
      })}
    </nav>
  );
}
