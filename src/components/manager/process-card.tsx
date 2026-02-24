import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ProcessWithCreator } from "@/lib/types";

export function ProcessCard({ process }: { process: ProcessWithCreator }) {
  const locale = useLocale();
  const creatorName = process.profiles?.full_name || process.profiles?.email;

  return (
    <Link href={`/manager/processes/${process.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle className="text-lg">{process.title}</CardTitle>
          <CardDescription className="line-clamp-2">
            {process.description}
          </CardDescription>
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground">
              {new Date(process.created_at).toLocaleDateString(locale)}
            </p>
            {creatorName && (
              <p className="text-xs text-muted-foreground">{creatorName}</p>
            )}
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
