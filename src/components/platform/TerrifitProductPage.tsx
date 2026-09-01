"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import { TerrifitHeader } from "@/components/navigation/TerrifitHeader";
import { TerrifitFooter } from "@/components/navigation/TerrifitFooter";
import { marketingDetails, marketingUi } from "@/i18n/marketing";
import type { Destination } from "@/lib/destinations";
import shotHomeLight from "../../../public/media/app/home-light.png";
import shotBandDark from "../../../public/media/app/band-dark.png";
import shotShopLight from "../../../public/media/app/shop-light.png";
import { AppShowcase } from "@/components/platform/AppShowcase";
import heroMale from "../../../public/media/hero-male.jpg";
import heroFemale from "../../../public/media/hero-female.jpg";
import communityWide from "../../../public/media/community-wide.jpg";

// Band, Maps, Creators, Shop, Contact and the account pages now have
// purpose-built routes; what is left here is the platform overview and the
// information pages.
type InfoDestination = Exclude<Destination,"platform">;

export function TerrifitProductPage({ locale, destination, copy }: { locale: Locale; destination: Destination; copy: Dictionary }) {
  return (
    // `tf-site` carries the brand custom properties the shared header and footer
    // are styled from, so it has to be on every page they appear on.
    <div className="tf-site tp-site">
      <TerrifitHeader locale={locale} copy={copy} />
      <main>
        {destination === "platform" ? <PlatformPage locale={locale} copy={copy} /> : null}
        {destination !== "platform" ? <InformationPage locale={locale} destination={destination} copy={copy} /> : null}
      </main>
      <TerrifitFooter locale={locale} copy={copy} />
    </div>
  );
}

function PlatformPage({ locale, copy }: { locale: Locale; copy: Dictionary }) {
  const tabs=[copy.mock.progressTitle,copy.prototypes.tabs.feed.label,copy.prototypes.tabs.progress.label] as const; const [tab,setTab]=useState(0);
  return (
    <>
      <ProductHero eyebrow={copy.prototypes.eyebrow} title={copy.prototypes.headline} body={copy.prototypes.body} action={<Link href={`/${locale}#waitlist`}>{copy.finalCta.primary}</Link>} />
      <section className="tp-dashboard tp-shell">
        <div className="tp-tabs" role="tablist">{tabs.map((item,index) => <button key={item} className={tab === index ? "active" : ""} onClick={() => setTab(index)}>{item}</button>)}</div>
        {tab === 0 ? <TodayPanel copy={copy} locale={locale}/> : tab === 1 ? <FeedPanel copy={copy}/> : <ProgressPanel copy={copy}/>} 
      </section>
      <section className="tp-app-system tp-paper"><div className="tp-shell"><div><span>iOS + Android</span><h2>{copy.prototypes.headline}</h2><p>{copy.prototypes.body}</p><StoreBadges locale={locale} /></div><AppShowcase
        shots={[
          {
            src: shotHomeLight,
            label: "Today",
            note: "The same numbers, on paper instead of black.",
            alt: "The Terrifit app in light mode showing the daily signal with recovery, strain and sleep",
          },
          {
            src: shotBandDark,
            label: "Your V1",
            note: "Battery, firmware and the strap on your wrist.",
            alt: "The Terrifit app in dark mode showing a paired V1 band inside a battery ring",
          },
          {
            src: shotShopLight,
            label: "Fuel",
            note: "Supplements, straps and everything the band runs on.",
            alt: "The Terrifit shop in light mode showing supplement and strap products with prices",
          },
        ]}
      /></div></section>
    </>
  );
}

function TodayPanel({copy,locale}:{copy:Dictionary;locale:Locale}) {
  const detail=marketingDetails[locale]; const stats=[[copy.mock.recovery,"82%","+7"],[detail.common[1],"12.4",detail.common[6]],[copy.mock.sleep,"91%","7h 32m"]];
  return <div className="tp-board"><section className="tp-readiness-panel"><small>{copy.mock.date}</small><strong>82</strong><span>{copy.mock.recovery} · {detail.common[4]}</span><div className="tp-stat-row">{stats.map(([label,value,note])=><div key={label}><small>{label}</small><b>{value}</b><em>{note}</em></div>)}</div></section><section className="tp-workout-panel"><small>{copy.mock.nextWorkout} · 17:30</small><h2>{copy.mock.nextWorkoutValue}</h2>{copy.mock.mapSections.map((line,i)=><button key={line}><i>{i+1}</i><span>{line}</span><b>○</b></button>)}</section><aside className="tp-coach-panel"><span>{copy.mock.feedRole} · {copy.mock.feedTime}</span><h3>{copy.statement.emphasis}</h3><p>{copy.mock.feedCaption}</p><button>{copy.mock.submitCheckIn} →</button></aside></div>;
}

function FeedPanel({copy}:{copy:Dictionary}) {
  return <div className="tp-feed-grid">{[[heroMale,"Jordan Cole",copy.mock.feedCaption],[heroFemale,"Maya Reyes",copy.community.body],[communityWide,"Terrifit",copy.statement.emphasis]].map(([image,name,text])=><article key={name as string}><Image src={image} alt="" sizes="(max-width: 700px) 100vw, 32vw"/><div><small>{name as string} · {copy.mock.feedRole}</small><h3>{text as string}</h3><p>♡ {copy.mock.likes} &nbsp; ◯ {copy.mock.comments}</p></div></article>)}</div>;
}

function ProgressPanel({copy}:{copy:Dictionary}) {
  return <div className="tp-progress-grid"><article><span>{copy.progress.metrics[2]}</span><strong>12,450 kg <i>+18%</i></strong><div className="tp-chart">{[46,72,86,63,79,66,58].map((h,i)=><b key={i} style={{height:`${h}%`}}/>)}</div></article><article><span>{copy.mock.comparisons[0].label}</span><strong>{copy.mock.comparisons[0].value}</strong><svg viewBox="0 0 600 180" role="img" aria-label={copy.progress.headline}><path d="M5 25 C90 34 92 62 170 60 S260 100 330 97 S420 132 595 145" fill="none" stroke="currentColor" strokeWidth="5"/></svg></article></div>;
}




function InformationPage({locale,destination,copy:copyInput}:{locale:Locale;destination:InfoDestination;copy:Dictionary}) {
  const copy={...copyInput,faq:{...copyInput.faq,body:copyInput.waitlist.body}};
  const pages={about:{eyebrow:copy.audiences.eyebrow,title:copy.audiences.headline,body:copy.audiences.body,points:[copy.audiences.athleteBody,...copy.safeguards.items.slice(0,2).map(x=>x.title)]},careers:{eyebrow:copy.footer.company[1],title:copy.roadmap.headline,body:copy.roadmap.body,points:copy.roadmap.phases.map(x=>x.title)},press:{eyebrow:copy.footer.company[2],title:copy.roadmap.headline,body:copy.meta.description,points:copy.roadmap.phases.map(x=>x.items[0])},support:{eyebrow:copy.faq.eyebrow,title:copy.faq.headline,body:copy.faq.body,points:copy.faq.items.slice(0,3).map(x=>x.q)},} satisfies Record<InfoDestination,{eyebrow:string;title:string;body:string;points:string[]}>; const page=pages[destination];
  return <section className="tp-info"><div className="tp-shell"><span>{page.eyebrow}</span><h1>{page.title}</h1><p>{page.body}</p><div>{page.points.map((point,i)=><article key={point}><small>0{i+1}</small><h2>{point}</h2></article>)}</div><Link href={`/${locale}#waitlist`}>{copy.finalCta.primary}</Link></div></section>;
}

function ProductHero({eyebrow,title,body,action}:{eyebrow:string;title:string;body:string;action:React.ReactNode}) {
  return <section className="tp-product-hero"><div className="tp-shell"><span>{eyebrow}</span><h1>{title}</h1><p>{body}</p><div>{action}</div></div></section>;
}

function StoreBadges({locale}:{locale:Locale}) {
  const detail=marketingDetails[locale]; return <div className="tp-store-badges"><span>{marketingUi[locale].comingSoon}</span><div><Link href={`/${locale}#waitlist`}><small>{detail.app[2]}</small><b>App Store</b></Link><Link href={`/${locale}#waitlist`}><small>{detail.app[3]}</small><b>Google Play</b></Link></div></div>;
}
