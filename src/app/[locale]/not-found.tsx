import { getTranslations } from "next-intl/server";
import { FileQuestionIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="flex flex-col items-center text-center">
        <FileQuestionIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground mt-2 max-w-sm">{t("description")}</p>
        <Button asChild className="mt-6">
          <Link href="/">{t("goHome")}</Link>
        </Button>
      </div>
    </div>
  );
}
