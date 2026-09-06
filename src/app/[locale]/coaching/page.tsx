import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { isLocale } from "@/i18n/config";
import { websiteCopy } from "@/i18n/website";

export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata> {
  const {locale}=await params; if(!isLocale(locale)) return {};
  return {title:`${websiteCopy(locale).coaching} — Terrifit`,description:"Review practical adjustments to your next workout. Your programme, your time, your decision.",alternates:{canonical:`/${locale}/coaching`}};
}
export default async function CoachingPage({params}:{params:Promise<{locale:string}>}) {
  const {locale}=await params; if(!isLocale(locale)) notFound();
  const ar=locale==="ar";
  const steps=ar?[
    ["ابدأ من خطتك","اختر برنامجاً من Maps. يعرف المدرب جلستك التالية وتمارينها وموضعك في البرنامج."],
    ["أخبرنا عن يومك","حدّد وقتك وكيف تشعر. راجع الجلسة المقترحة وسبب كل تغيير قبل الموافقة."],
    ["درّب وسجّل وكرّر","تفتح الجلسة بالتعديل الذي وافقت عليه. احفظ تدريبك لتراه في تقدمك الأسبوعي."],
  ]:[
    ["Start with your Map","Choose a programme. Coach starts from your next session, its exercises, and your place in the programme."],
    ["Tell us about today","Choose your available time and how you feel. See the proposed session and the reason for every change before accepting."],
    ["Train. Log. Come back.","Your accepted adjustment opens in the workout. Save the completed session and see it in your weekly progress."],
  ];
  return <SiteShell locale={locale}><div className="rf-page"><header className="rf-hero rf-shell rf-split"><div><p className="rf-kicker">TERRIFIT / {websiteCopy(locale).coaching}</p><h1>{ar?"خطتك. على مقاس يومك.":"Your plan. On your terms."}</h1><p className="rf-lede">{ar?"خمسون دقيقة في الخطة، وخمس وثلاثون في يومك. راجع ما يمكن تغييره، وافهم السبب، ثم قرّر.":"Fifty minutes in the plan. Thirty-five in your day. See what can change, understand why, and make the call."}</p><div className="rf-actions"><Link className="tf-button" href={`/${locale}/dashboard/coach`}>{ar?"افتح المدرب":"Open Coach"} ↗</Link><Link className="rf-link" href={`/${locale}/maps`}>{ar?"استكشف Maps":"Explore Maps"} →</Link></div><p className="rf-note">{ar?"توجيه التدريب متاح في النسخة التطويرية. ليس مدرباً بشرياً أو محادثة ذكاء اصطناعي.":"Guided coaching in the development app. This is a programme adjustment tool, not a human coach or an AI chat."}</p></div><figure className="rf-capture"><Image src={`/media/app/shots/${ar?"ar":"terrifit"}-maps.jpg`} alt={ar?"مكتبة Maps في تطبيق Terrifit الفعلي":"The Maps library in the actual Terrifit native app"} width={440} height={956} sizes="292px" preload/><figcaption>{ar?"لقطة من التطبيق · يبدأ المدرب من برنامجك":"Native app capture · Coach starts with your Map"}</figcaption></figure></header><section className="rf-section"><div className="rf-shell"><h2>{ar?"من الخطة إلى التنفيذ.":"From a plan to a session."}</h2><div className="rf-steps">{steps.map(([title,body],i)=><article key={title}><span>0{i+1}</span><h3>{title}</h3><p>{body}</p></article>)}</div></div></section><section className="rf-section"><div className="rf-shell rf-faq"><h2>{ar?"أنت صاحب القرار.":"You keep the final say."}</h2><details open><summary>{ar?"ماذا يتغير؟":"What can Coach change?"}</summary><p>{ar?"يمكنه تقليل العمل عبر حذف تمارين كاملة من نهاية الجلسة مع إبقاء ترتيب التمارين والراحة والجهد. الوقت تقديري. إذا لم يتسع الوقت لجلسة مناسبة، يقترح تأجيلها.":"Coach can shorten a session by removing complete exercises from the end while preserving exercise order, rest and effort. Times are estimates. If there is not enough room for a sensible session, it suggests pausing instead of rushing."}</p></details><details><summary>{ar?"هل يمكن التراجع؟":"Can I undo an adjustment?"}</summary><p>{ar?"نعم. لا يتغير التدريب دون موافقتك. يمكنك استعادة الجلسة الأصلية قبل البدء. ينتهي التعديل عند تغير جلستك أو يومك.":"Yes. Your workout changes only after you accept a proposal. Restore the original before you start. A proposal expires when your day or programme position changes."}</p></details><details><summary>{ar?"ماذا عن الصحة والإصابات؟":"What about health conditions or pain?"}</summary><p>{ar?"يتوقف المدرب عن وصف التدريب عندما تبلغ عن ألم أو عندما يحتوي ملفك على قيد صحي. لا يفسّر مؤشراتك طبياً ولا يمنحك تصريحاً للتدريب.":"Coach pauses workout recommendations when you report pain or your profile includes a health constraint. It does not diagnose symptoms, use a recovery score as medical clearance, or prescribe around an injury."}</p></details><div className="rf-actions"><Link className="rf-link" href={`/${locale}/app`}>{ar?"شاهد التطبيق":"See the app"} →</Link><Link className="rf-link" href={`/${locale}/membership`}>{ar?"قارن العضويات":"Compare membership"} →</Link></div></div></section></div></SiteShell>;
}
