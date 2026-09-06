import { TerrifitHeader } from "@/components/navigation/TerrifitHeader";
import { TerrifitFooter } from "@/components/navigation/TerrifitFooter";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

/**
 * Header, page, footer — the frame every route outside the landing page uses.
 *
 * The landing page composes its own chrome because its header starts
 * transparent over the hero video; everything else gets this, so the nav and
 * footer can never drift apart between pages.
 */
export function SiteShell({
  locale,
  children,
  className,
}: {
  locale: Locale;
  children: React.ReactNode;
  className?: string;
}) {
  const copy = getDictionary(locale);
  return (
    <div className={`tf-site ${className ?? ""}`}>
      <TerrifitHeader locale={locale} copy={copy} />
      <main id="main-content">{children}</main>
      <TerrifitFooter locale={locale} copy={copy} />
    </div>
  );
}
