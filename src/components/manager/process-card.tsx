import { Link } from "@/i18n/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Process } from "@/lib/types";

export function ProcessCard({ process }: { process: Process }) {
  return (
    <Link href={`/manager/processes/${process.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle className="text-lg">{process.title}</CardTitle>
          <CardDescription className="line-clamp-2">{process.description}</CardDescription>
          <p className="text-xs text-muted-foreground pt-1">{new Date(process.created_at).toLocaleDateString()}</p>
        </CardHeader>
      </Card>
    </Link>
  );
}
