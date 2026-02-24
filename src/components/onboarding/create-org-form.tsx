"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createOrganization } from "@/lib/actions/organizations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2Icon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CreateOrgForm() {
  const t = useTranslations("Onboarding");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createOrganization(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">{t("createOrgTitle")}</CardTitle>
        <CardDescription>{t("createOrgSubtitle")}</CardDescription>
      </CardHeader>
      <form action={handleSubmit} className="flex flex-col gap-6">
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">{t("orgName")}</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder={t("orgNamePlaceholder")}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2Icon className="h-4 w-4 animate-spin" />}
            {loading ? t("creating") : t("createOrg")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
