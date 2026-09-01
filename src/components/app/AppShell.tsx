import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { PagesCopy } from "@/i18n/pages";
import { TerrifitMark } from "@/components/brand/TerrifitMark";
import { AppNav } from "@/components/app/AppNav";

/**
 * The app's own chrome.
 *
 * Deliberately not the marketing header: no locale switcher, no waitlist CTA,
 * no search. Someone opening this is checking one number before they train,
 * and everything that is not that is in the way.
 */
export function AppShell({
  locale,
  copy,
  name,
  children,
}: {
  locale: Locale;
  copy: PagesCopy["app"];
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="ap">
      <header className="ap-top">
        <div className="ap-shell ap-top-inner">
          <Link href={`/${locale}`} className="ap-brand" aria-label={copy.brand}>
            <TerrifitMark className="tf-mark" size={18} />
            <span>{copy.brand}</span>
          </Link>
          <AppNav locale={locale} labels={copy.nav} />
          <Link className="ap-account" href={`/${locale}/account`}>
            {name}
          </Link>
        </div>
      </header>

      <main className="ap-shell ap-main">{children}</main>

      <footer className="ap-foot">
        <div className="ap-shell">
          <p>{copy.footer}</p>
        </div>
      </footer>
    </div>
  );
}
