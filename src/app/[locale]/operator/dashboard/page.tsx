import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ClipboardListIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import type { Process } from "@/lib/types";

export default async function OperatorDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Operator");
  const supabase = await createClient();

  const { data: processes } = await supabase
    .from("processes")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t("assignedProcesses")}</h2>

      {!processes || processes.length === 0 ? (
        <EmptyState
          icon={ClipboardListIcon}
          title={t("noProcesses")}
          description={t("noProcessesHint")}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(processes as Process[]).map((process) => (
            <Link
              key={process.id}
              href={`/operator/processes/${process.id}`}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{process.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {process.description}
                  </CardDescription>
                  <p className="text-xs text-muted-foreground pt-1">
                    {new Date(process.created_at).toLocaleDateString()}
                  </p>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
