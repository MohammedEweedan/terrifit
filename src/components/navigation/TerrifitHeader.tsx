"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { marketingUi } from "@/i18n/marketing";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { TerrifitMark } from "@/components/brand/TerrifitMark";
import { rememberAttribution } from "@/lib/referral-client";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { websiteCopy } from "@/i18n/website";
import { CartButton } from "@/components/shop/CartButton";
import { SiteSearch } from "@/components/search/SiteSearch";
import { getPagesCopy } from "@/i18n/pages";
import heroMale from "../../../public/media/sled.jpg";

// Creators (index 3) is parked with the social product; the page stays but is
// unlinked. Labels come from `ui.nav` by position, so each entry carries the
// index it belongs to rather than relying on its place in this array.
const items = [
  { slug: "app", label: 0 },
  { slug: "band", label: 1 },
  { slug: "maps", label: 2 },
  { slug: "shop", label: 4 },
] as const;

export function TerrifitHeader({locale,copy}:{locale:Locale;copy:Dictionary}) {
  const [open,setOpen]=useState(false); const [solid,setSolid]=useState(false); const pathname=usePathname(); const ui=marketingUi[locale]; const search=getPagesCopy(locale).search; const extra=websiteCopy(locale); const links=[...items.map(item=>({slug:item.slug,label:ui.nav[item.label]})),{slug:"hardware",label:extra.hardware},{slug:"coaching",label:extra.coaching},{slug:"membership",label:extra.membership}];
  useEffect(()=>{rememberAttribution()},[pathname]);
  useEffect(()=>{const onScroll=()=>setSolid(window.scrollY>24);onScroll();window.addEventListener("scroll",onScroll,{passive:true});return()=>window.removeEventListener("scroll",onScroll)},[]);
  useEffect(()=>{document.body.style.overflow=open?"hidden":"";const key=(e:KeyboardEvent)=>e.key==="Escape"&&setOpen(false);window.addEventListener("keydown",key);return()=>{document.body.style.overflow="";window.removeEventListener("keydown",key)}},[open]);
  function join(event:React.MouseEvent){setOpen(false);if(pathname===`/${locale}`){event.preventDefault();window.dispatchEvent(new CustomEvent("terrifit:open-waitlist"))}}
  return <>
    <header className={`tf-header ${solid||open||pathname!==`/${locale}`?"is-solid":""}`}>
      <div className="tf-shell tf-header-inner">
        {/* Five siblings, ordered by CSS rather than by markup: on a wide screen
            they read left to right; on a phone the language sits on the leading
            edge, the wordmark centres, and the bag and menu take the trailing
            edge. Keeping them siblings is what lets that happen without either
            layout being nested inside the other. */}
        <Link href={`/${locale}`} className="tf-wordmark" aria-label="Terrifit home"><TerrifitMark className="tf-mark" size={20}/>{/* The letters need their own element so the mark can mask them as it
            sweeps past. Marked aria-hidden with the accessible name on the
            link, so a partly masked wordmark is never read out. */}<span className="tf-wordmark-text" aria-hidden>TERRIFIT</span></Link>
        <nav className="tf-desktop-nav" aria-label="Primary navigation">{links.map(({slug,label})=><Link key={slug} href={`/${locale}/${slug}`} aria-current={pathname===`/${locale}/${slug}`?"page":undefined}>{label}</Link>)}</nav>
        <SiteSearch locale={locale} labels={search}/>
        <div className="tf-locale-wrap"><LocaleSwitcher current={locale} label={ui.chooseLanguage}/><ThemeToggle className="tf-theme-toggle" labels={{theme:copy.nav.theme,light:copy.nav.themeLight,dark:copy.nav.themeDark}}/></div>
        <div className="tf-header-actions"><CartButton locale={locale}/><Link className="tf-signin" href={`/${locale}/signin`}>{ui.signIn}</Link><Link className="tf-button tf-button-small" href={`/${locale}#waitlist`} onClick={join}>{copy.nav.join}</Link><button type="button" className={`tf-menu-button ${open?"is-open":""}`} aria-label={open?copy.nav.closeMenu:copy.nav.openMenu} aria-expanded={open} onClick={()=>setOpen(v=>!v)}><span/><span/></button></div>
      </div>
    </header>
    <AnimatePresence>{open?<motion.div className="tf-mobile-drawer" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.22}}><div className="tf-mobile-drawer-inner"><div className="tf-mobile-search"><SiteSearch locale={locale} labels={search}/></div><div className="tf-mobile-menu-label">{copy.hero.eyebrow}</div><nav aria-label="Mobile navigation">{links.map(({slug,label},index)=><motion.div key={slug} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.04+index*.04}}><Link href={`/${locale}/${slug}`} onClick={()=>setOpen(false)}><span>0{index+1}</span>{label}<b>↗</b></Link></motion.div>)}</nav><div className="tf-mobile-feature"><Image src={heroMale} alt="Terrifit athlete" sizes="88vw"/><div><span>{copy.progress.eyebrow}</span><small>{copy.progress.metrics[3]}</small></div></div><div className="tf-mobile-actions"><Link className="tf-button" href={`/${locale}#waitlist`} onClick={join}>{copy.finalCta.primary}</Link><Link className="tf-text-link" href={`/${locale}/signin`} onClick={()=>setOpen(false)}>{ui.signIn}<span>→</span></Link></div></div></motion.div>:null}</AnimatePresence>
  </>;
}
