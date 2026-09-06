"use client";
import { useState } from "react";
import Link from "next/link";
import type { CoachingDashboard } from "@/lib/coaching/service";
import type { CheckIn } from "@/lib/coaching/engine";
import type { Locale } from "@/i18n/config";

export function CoachingWorkspace({initial,locale}:{initial:CoachingDashboard;locale:Locale}) {
  const [data,setData]=useState(initial);
  const [minutes,setMinutes]=useState(35);
  const [feeling,setFeeling]=useState<CheckIn["feeling"]>("ready");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const session=data.applied?.session??data.next?.session;
  const paused=data.applied?.kind==="rest";
  const ar=locale==="ar";
  const t=(en:string,arabic:string)=>ar?arabic:en;
  async function change(action:"propose"|"apply"|"undo") {
    if(busy)return;setBusy(true);setError("");
    try {
      const response=await fetch("/api/app/coach",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,day:data.day,slot:data.slot,revision:data.revision,...(action==="propose"?{checkIn:{minutes,feeling}}:{}),...(action==="apply"?{proposalId:data.draft?.id}:{})})});
      const result=await response.json();
      if(!response.ok){if(response.status===409){const fresh=await fetch("/api/app/coach");if(fresh.ok)setData(await fresh.json());}throw new Error(result.message||t("We couldn't save that change. Try again.","تعذّر حفظ التعديل. حاول مجدداً."));}
      setData(result);
    }catch(e){setError(e instanceof Error?e.message:t("Connection failed. Please try again.","تعذّر الاتصال. حاول مجدداً."));}finally{setBusy(false);}
  }
  return <><header className="ap-head"><p className="ap-eyebrow">{t("Guided coaching","توجيه التدريب")}</p><h1>{t("Make the plan fit.","خطة تناسب يومك.")}</h1><p className="rf-note">{t("Your programme and your check-in. Review a change before it reaches your next workout.","برنامجك وإجاباتك. راجع التعديل قبل تطبيقه على تدريبك التالي.")}</p></header>
    {error?<p className="rf-error" role="alert">{error}</p>:null}
    {!data.next?<section className="rf-coach-panel"><h2>{t("Start with a Map.","ابدأ ببرنامج.")}</h2><p>{t("Choose and join a programme in the native app to see your next session here.","اختر برنامجاً وانضم إليه في التطبيق لتظهر جلستك التالية هنا.")}</p><div className="rf-actions"><Link className="rf-link" href={`/${locale}/maps`}>{t("Explore Maps","استكشف Maps")} →</Link></div></section>:<>
      <section className="rf-coach-panel"><p className="rf-kicker">{t("Next session","الجلسة التالية")} · {data.next.mapName}</p><h2>{paused?t("Session paused","تم إيقاف الجلسة"):session?.name}</h2>{!paused&&session?<p>{session.minutes} {t("minutes","دقيقة")} · {session.exercises.length} {t("exercises","تمارين")}</p>:null}
      {data.applied?<div role="status"><p><strong>{t("Your adjustment is saved.","تم حفظ تعديلك.")}</strong> {!paused?t("Open the workout in the native app to train with this plan.","افتح التدريب في التطبيق لاستخدام هذه الخطة."):null}</p><p>{data.applied.reason}</p><ul>{data.applied.changes.map(line=><li key={line}>{line}</li>)}</ul><button onClick={()=>void change("undo")} disabled={busy}>{t("Restore original session","استعد الجلسة الأصلية")}</button></div>:null}
      </section>
      <section className="rf-coach-panel"><fieldset className="rf-fieldset"><legend>{t("Time available","الوقت المتاح")}</legend><div className="rf-options">{[20,35,50,75].map(n=><button key={n} disabled={busy} aria-pressed={minutes===n} onClick={()=>setMinutes(n)}>{n} {t("min","دقيقة")}</button>)}</div></fieldset><fieldset className="rf-fieldset"><legend>{t("How do you feel?","كيف تشعر؟")}</legend><div className="rf-options">{([['ready',t('Ready','مستعد')],['tired',t('Low energy','طاقة منخفضة')],['pain',t('Pain or unwell','ألم أو تعب')]] as const).map(([key,label])=><button key={key} disabled={busy} aria-pressed={feeling===key} onClick={()=>setFeeling(key)}>{label}</button>)}</div></fieldset><button className="rf-primary" disabled={busy} onClick={()=>void change("propose")}>{busy?t("Saving…","جارٍ الحفظ…"):t("Review an adjustment","راجع تعديلاً")}</button></section>
      {data.draft?<section className="rf-coach-panel" aria-live="polite"><p className="rf-kicker">{t("Proposal","المقترح")}</p><h2>{data.draft.title}</h2><div className="rf-comparison"><div>{t("Original","الأصلية")}<strong>{data.draft.originalMinutes} <small>{t("min","دقيقة")}</small></strong></div><div>{t("Proposed","المقترحة")}<strong>{data.draft.session?`${data.draft.session.minutes} ${t("min","دقيقة")}`:t("Pause","توقف")}</strong></div></div><p>{data.draft.reason}</p><ul>{data.draft.changes.map(line=><li key={line}>{line}</li>)}</ul><button className="rf-primary" disabled={busy} onClick={()=>void change("apply")}>{busy?t("Saving…","جارٍ الحفظ…"):t("Apply to this session","طبّق على هذه الجلسة")}</button></section>:null}
    </>}
    <p className="rf-note">{t("Coach uses guided rules. It is not an AI chat or a medical assessment. Health scores do not change the prescription. You can undo a saved adjustment before starting.","يستخدم المدرب قواعد توجيهية. ليس محادثة ذكاء اصطناعي أو تقييماً طبياً. المؤشرات الصحية لا تغيّر وصفة التدريب. يمكنك التراجع قبل البدء.")}</p>
    <div className="rf-actions"><Link className="rf-link" href={`/${locale}/coaching`}>{t("How coaching works","كيف يعمل التوجيه")} →</Link></div>
  </>;
}
