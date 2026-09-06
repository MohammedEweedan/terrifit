import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { storefrontCopy } from "@/i18n/storefront";
import { websiteCopy } from "@/i18n/website";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { marketingDetails, marketingUi } from "@/i18n/marketing";
import { TerrifitMark } from "@/components/brand/TerrifitMark";

export function TerrifitFooter({locale,copy}:{locale:Locale;copy:Dictionary}) {
  const extra=websiteCopy(locale); const detail=marketingDetails[locale]; const ui=marketingUi[locale];
  // Slugs here are either a route folder or a member of `destinations`, which
  // the `[destination]` catch-all serves. The legal row below is separate: those
  // are the actual policies under /legal, not the marketing pages.
  const columns=[
    [copy.footer.productTitle,[[ui.nav[0],"app"],[ui.nav[2],"maps"],[detail.band[0],"band"],[ui.nav[4],"shop"],[extra.coaching,"coaching"],[extra.membership,"membership"]]],
    [copy.nav.creators,[[copy.footer.product[2],"creators"],[copy.footer.product[3],"platform"],[copy.footer.product[4],"platform"],[copy.faq.eyebrow,"support"]]],
    [copy.footer.companyTitle,copy.footer.company.map((label,index)=>[label,["about","careers","press","contact"][index]])],
  ] as const;
  return <footer className="tf-footer"><div className="tf-shell"><div className="tf-footer-brand"><Link href={`/${locale}`}><TerrifitMark className="tf-mark" size={20}/>TERRIFIT</Link><p>{storefrontCopy(locale).slogan.join(" ")}</p></div><div className="tf-footer-grid">{columns.map(([title,links],index)=><div key={title} className={index===2?"tf-company-col":""}><h3>{title}</h3><div>{links.map(([label,slug])=><Link key={label} href={`/${locale}/${slug}`}>{label}</Link>)}</div></div>)}</div><p className="tf-disclaimer">{copy.footer.disclaimer}</p><div className="tf-footer-bottom"><ThemeToggle labels={{theme:copy.nav.theme,light:copy.nav.themeLight,dark:copy.nav.themeDark}}/><span>© {new Date().getFullYear()} TERRIFIT · {copy.footer.rights}</span><div><Link href={`/${locale}/legal/privacy`}>{copy.footer.legal[0]}</Link><Link href={`/${locale}/legal/terms`}>{copy.footer.legal[1]}</Link><Link href={`/${locale}/legal/refunds`}>{copy.footer.legal[2]}</Link><Link href={`/${locale}/legal/health`}>{copy.progress.disclaimerTitle}</Link><Link href={`/${locale}/legal/affiliate`}>{copy.footer.legal[3]}</Link><Link href={`/${locale}/legal/cookies`}>{copy.footer.legal[4]}</Link></div></div></div></footer>;
}
