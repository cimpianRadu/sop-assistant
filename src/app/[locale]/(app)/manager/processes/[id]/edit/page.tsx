import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
import { EditProcessForm } from "@/components/manager/edit-process-form";
import { ChevronRightIcon } from "lucide-react";
import type { ChecklistStep } from "@/lib/types";

export default async function EditProcessPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Manager");
  const tc = await getTranslations("Common");

  const session = await getSessionContext();
  if (!session) notFound();
  if (session.role !== "admin" && session.role !== "manager") notFound();

  const supabase = await createClient();

  const [{ data: process }, { data: steps }] = await Promise.all([
    supabase.from("processes").select("*").eq("id", id).single(),
    supabase
      .from("checklist_steps")
      .select("*")
      .eq("process_id", id)
      .order("step_number"),
  ]);

  if (!process) notFound();
  if (process.org_id !== session.org_id) notFound();

  const checklist = ((steps as ChecklistStep[]) || []).map((s) => s.step_text);

  return (
    <div className="max-w-3xl space-y-6">
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
        <Link
          href="/manager/processes"
          className="hover:text-foreground shrink-0"
        >
          {t("yourProcesses")}
        </Link>
        <ChevronRightIcon className="size-3.5 shrink-0" />
        <Link
          href={`/manager/processes/${id}`}
          className="hover:text-foreground shrink-0 truncate max-w-[200px]"
        >
          {process.title}
        </Link>
        <ChevronRightIcon className="size-3.5 shrink-0" />
        <span className="text-foreground">{t("editProcess")}</span>
      </nav>

      <h2 className="text-2xl font-bold tracking-tight">{t("editProcess")}</h2>

      <EditProcessForm
        processId={id}
        initialTitle={process.title}
        initialDescription={process.description}
        initialSopText={process.sop_text}
        initialChecklist={checklist}
      />
    </div>
  );
}
