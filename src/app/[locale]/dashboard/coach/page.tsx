import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getCurrentUser } from "@/lib/auth";
import { loadCoaching } from "@/lib/coaching/service";
import { CoachingWorkspace } from "@/components/app/CoachingWorkspace";
export default async function CoachPage({params}:{params:Promise<{locale:string}>}) {
  const {locale}=await params;if(!isLocale(locale))notFound();
  const user=await getCurrentUser();if(!user)redirect(`/${locale}/signin`);
  return <CoachingWorkspace initial={await loadCoaching(user.id)} locale={locale}/>;
}
