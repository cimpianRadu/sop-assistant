import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CreateProcessForm } from "@/components/manager/create-process-form";
import { Button } from "@/components/ui/button";
import { getSessionContext } from "@/lib/session";

export default async function NewProcessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Manager");
  const session = await getSessionContext();

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link href={`/${session?.role ?? "manager"}/dashboard`}><Button variant="ghost" size="sm">{t("backToDashboard")}</Button></Link>
      <h2 className="text-2xl font-bold">{t("createNewProcess")}</h2>
      <CreateProcessForm />
    </div>
  );
}
