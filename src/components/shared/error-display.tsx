"use client";

import { useTranslations } from "next-intl";
import { AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface ErrorDisplayProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function ErrorDisplay({ error, reset }: ErrorDisplayProps) {
  const t = useTranslations("ErrorBoundary");

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center text-center pt-6">
          <AlertTriangleIcon className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {error.message || t("description")}
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button onClick={reset}>{t("tryAgain")}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
