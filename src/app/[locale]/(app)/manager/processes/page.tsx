import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import { ProcessList } from "@/components/manager/process-list";
import { Button } from "@/components/ui/button";
import { enrichProcesses } from "@/lib/process-enrichment";
import { ChevronRightIcon, PlusIcon } from "lucide-react";
import type { ProcessWithCreator } from "@/lib/types";

export default async function ProcessesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Manager");
  const tc = await getTranslations("Common");

  const session = await getSessionContext();
  if (!session) return null;

  const supabase = await createClient();

  const { data: processes } = await supabase
    .from("processes")
    .select("*, profiles!created_by(email, full_name)")
    .eq("org_id", session.org_id)
    .order("created_at", { ascending: false });

  const list = (processes as ProcessWithCreator[]) || [];
  const enriched = await enrichProcesses(supabase, list);

  return (
    <div className="max-w-5xl space-y-6">
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-sm text-muted-foreground overflow-x-auto"
      >
        <Link
          href={`/${session.role}/dashboard`}
          className="hover:text-foreground shrink-0"
        >
          {tc("dashboard")}
        </Link>
        <ChevronRightIcon className="size-3.5 shrink-0" />
        <span className="text-foreground">{t("yourProcesses")}</span>
      </nav>

      {/* Head */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("yourProcesses")}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {enriched.length}{" "}
            {enriched.length === 1 ? "process" : "processes"}
          </p>
        </div>
        <Link href="/manager/processes/new">
          <Button size="sm" className="gap-1.5">
            <PlusIcon className="size-4" />
            {t("newProcess")}
          </Button>
        </Link>
      </div>

      <ProcessList processes={enriched} />
    </div>
  );
}
