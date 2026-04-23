import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PencilIcon } from "lucide-react";

export async function EditSopButton({ processId }: { processId: string }) {
  const t = await getTranslations("Manager");
  return (
    <Link href={`/manager/processes/${processId}/edit`}>
      <Button variant="outline" size="default" className="gap-1.5">
        <PencilIcon className="size-4" />
        {t("editSop")}
      </Button>
    </Link>
  );
}
