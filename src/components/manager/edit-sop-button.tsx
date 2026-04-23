"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PencilIcon } from "lucide-react";

export function EditSopButton() {
  const t = useTranslations("Manager");
  return (
    <Button
      variant="outline"
      size="default"
      className="gap-1.5"
      onClick={() => toast.info(t("editComingSoon"))}
    >
      <PencilIcon className="size-4" />
      {t("editSop")}
    </Button>
  );
}
