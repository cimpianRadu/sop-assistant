import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CreateProcessForm } from "@/components/manager/create-process-form";
import { getSessionContext } from "@/lib/session";
import { ChevronRightIcon } from "lucide-react";

export default async function NewProcessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Manager");
  const tc = await getTranslations("Common");
  const session = await getSessionContext();

  return (
    <div className="max-w-3xl space-y-6">
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-sm text-muted-foreground overflow-x-auto"
      >
        <Link
          href={`/${session?.role ?? "manager"}/dashboard`}
          className="hover:text-foreground shrink-0"
        >
          {tc("dashboard")}
        </Link>
        <ChevronRightIcon className="size-3.5 shrink-0" />
        <Link href="/manager/processes" className="hover:text-foreground shrink-0">
          {t("yourProcesses")}
        </Link>
        <ChevronRightIcon className="size-3.5 shrink-0" />
        <span className="text-foreground">{t("createNewProcess")}</span>
      </nav>

      <h2 className="text-2xl font-bold tracking-tight">
        {t("createNewProcess")}
      </h2>

      <CreateProcessForm />
    </div>
  );
}
