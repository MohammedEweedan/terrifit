"use client";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { AppDownloads } from "@/lib/app-downloads";
import { track } from "@/lib/analytics";

export function DownloadLinks({locale,downloads,placement}:{locale:Locale;downloads:AppDownloads;placement:string}) {
  const ar=locale==="ar";
  return <div className="ax-downloads">{([['ios','iOS','App Store'],['android','Android','Google Play']] as const).map(([platform,name,store])=>{
    const url=downloads[platform];
    return <a key={platform} className="ax-download" href={url??`/${locale}?source=app-${platform}#waitlist`} onClick={()=>track(url?"app_download_click":"app_launch_interest",{platform,placement})}><svg viewBox="0 0 24 24" width="25" height="25" fill="none" aria-hidden><rect x="6" y="2" width="12" height="20" rx="3" stroke="currentColor" strokeWidth="1.5"/><path d="M10 5h4M11 19h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg><span><small>{url?(ar?"حمّل من":"Download on"):(ar?"أبلغني عند الإطلاق":"Get launch updates")}</small><strong>{url?store:name}</strong></span><span className="ax-download-arrow">↗</span></a>;
  })}</div>;
}
export function AppConversion({locale,downloads,monthly}:{locale:Locale;downloads:AppDownloads;monthly:string}) {
  const ar=locale==="ar";
  const loop=ar?[
    ["01","اقرأ يومك","مؤشرات التعافي والجهد والنوم في الواجهة التي تعرفها. افتح المؤشر لتفهم مدخلاته وحدوده.","المؤشرات","/legal/health"],
    ["02","ابدأ تدريبك","افتح جلستك التالية وسجّل المجموعات والتكرارات والأوزان. وقتك أقل؟ راجع تعديلاً مع المدرب أولاً.","توجيه التدريب","/coaching"],
    ["03","شاهد ما أنجزت","جلساتك المكتملة وأيامك النشطة في ملخص أسبوعي. شارك إن أردت، مع بقاء قراءاتك الصحية خاصة.","برامج Maps","/maps"],
  ]:[
    ["01","Read your day","Recovery, strain and sleep in the interface you know. Open a score to understand its readings and limitations.","Understand the scores","/legal/health"],
    ["02","Do the session","Open your next workout and log sets, reps and weights. Less time today? Review an adjustment with Coach first.","Explore coaching","/coaching"],
    ["03","See what you did","Completed sessions and active days become your weekly summary. Share it when you want, keeping health readings private.","Explore Maps","/maps"],
  ];
  const faq=ar?[
    ["هل يجب شراء V1؟","لا. يمكنك استخدام التدريب والتسجيل دون جهاز جديد. Apple Health متاح على iOS حسب البيانات والصلاحيات."],
    ["هل التطبيق متاح للتنزيل الآن؟",downloads.ios||downloads.android?"استخدم رابط المتجر المتاح أعلاه. قد تختلف الإتاحة حسب بلدك وجهازك.":"التطبيق قيد التطوير. اختر iOS أو Android للحصول على أخبار الإطلاق. لن ننقلك إلى رابط متجر غير متاح."],
    ["هل العضوية مجانية؟",`تتوفر المؤشرات اليومية والتدريب الأساسي في Free. تبدأ Pro من ${monthly} شهرياً. الأجهزة والمكملات منفصلة.`],
    ["ماذا تعني مشاركة أسبوعي؟","أنت تختار فتح نافذة المشاركة. يحتوي الملخص على عدد الجلسات والأيام النشطة فقط، دون قراءات طبية أو تفاصيل الملف."],
  ]:[
    ["Do I need to buy a V1?","No. Programmes and workout logging work without a new wearable. Apple Health imports are available on iOS, subject to your permissions and available data."],
    ["Can I download it now?",downloads.ios||downloads.android?"Use an available store link above. Availability can vary by country and device.":"The native app is in development. Choose iOS or Android for launch updates. We will link directly to the stores when the app is available."],
    ["What is included for free?",`Daily scores, programme access and workout logging are included in Free. Pro starts at ${monthly} per month. Hardware and supplements are separate.`],
    ["What happens when I share my week?","You choose when to open the share sheet. The summary contains completed-session and active-day counts, without health readings or profile details."],
  ];
  return <>
    <section className="ax-routine ax-shell" id="daily"><div className="ax-detail-head"><p className="ax-eyebrow">{ar?"داخل يومك":"Inside your day"}</p><h2>{ar?"اقرأ. تدرب. كرّر.":"Read. Train. Repeat."}</h2><p>{ar?"البيانات تصبح مفيدة عندما تساعدك على الخطوة التالية.":"The numbers earn their place when they help you take the next step."}</p></div><div className="ax-routine-grid">{loop.map(([n,title,body,label,href])=><article key={n}><span>{n}</span><h3>{title}</h3><p>{body}</p><Link href={`/${locale}${href}`}>{label} →</Link></article>)}</div></section>
    <section className="ax-access"><div className="ax-shell ax-access-grid"><div><p className="ax-eyebrow">{ar?"ابدأ بما لديك":"Start with what you have"}</p><h2>{ar?"تطبيقك أولاً. أجهزتك باختيارك.":"Your app first. Your hardware, your choice."}</h2></div><div><p>{ar?"استخدم هاتفك لتتبع التدريب. اربط Apple Health على iOS عندما تريد إضافة قراءاتك. شراء سوار ليس شرطاً للبدء.":"Use your phone to follow and log your training. Connect Apple Health on iOS when you want to bring in your readings. Buying a band is optional."}</p><div className="ax-access-facts"><span>{ar?"مجاني للبدء":"Free to start"}</span><span>{ar?"بيانات خاصة افتراضياً":"Private by default"}</span><span>{ar?"دون شراء جهاز":"No hardware purchase"}</span></div><Link className="ax-text-link" href={`/${locale}/membership`}>{ar?"قارن Free وPro":"Compare Free and Pro"} →</Link></div></div></section>
    <section className="ax-shell ax-faq"><div className="ax-detail-head"><p className="ax-eyebrow">{ar?"قبل التنزيل":"Before you download"}</p><h2>{ar?"تفاصيل تستحق المعرفة.":"A few things worth knowing."}</h2></div><div>{faq.map(([q,a])=><details key={q}><summary>{q}<span aria-hidden>+</span></summary><p>{a}</p></details>)}</div></section>
    <section className="ax-download-section ax-shell" id="get-app"><p className="ax-eyebrow">TERRIFIT / {ar?"على هاتفك":"On your phone"}</p><h2>{ar?"خطوتك التالية تبدأ هنا.":"Your next session starts here."}</h2><p>{ar?"واجهة تعرفها. مساحة لتقدمك. اختر منصتك للبدء.":"The interface you know. More room for your progress. Choose your platform to get started."}</p><DownloadLinks locale={locale} downloads={downloads} placement="app-footer"/><p className="ax-note">{downloads.ios||downloads.android?(ar?"قد تختلف الإتاحة حسب السوق.":"Availability may vary by market."):(ar?"قيد التطوير لـ iOS وAndroid. أخبار الإطلاق فقط.":"In development for iOS and Android. Launch updates only.")}</p></section>
    <aside className="ax-download-dock"><div className="ax-shell"><span><strong>Terrifit</strong><small>{ar?"على هاتفك":"On your phone"}</small></span><a href="#get-app">{downloads.ios||downloads.android?(ar?"حمّل التطبيق":"Get the app"):(ar?"أخبار الإطلاق":"Get launch updates")} ↗</a></div></aside>
  </>;
}
