import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import { ProcessList } from "@/components/manager/process-list";
import { Button } from "@/components/ui/button";
import type { ProcessWithCreator } from "@/lib/types";

export default async function ProcessesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Manager");

  const session = await getSessionContext();
  if (!session) return null;

  const supabase = await createClient();

  const { data: processes } = await supabase
    .from("processes")
    .select("*, profiles!created_by(email, full_name)")
    .eq("org_id", session.org_id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("yourProcesses")}</h2>
        <Link href="/manager/processes/new">
          <Button size="sm">{t("newProcess")}</Button>
        </Link>
      </div>
      <ProcessList processes={(processes as ProcessWithCreator[]) || []} />
    </div>
  );
}
