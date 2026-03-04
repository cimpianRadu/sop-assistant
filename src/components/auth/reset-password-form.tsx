"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { resetPassword } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { translateAuthError } from "@/lib/auth-errors";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordRules } from "@/components/auth/password-rules";
import { allRulesPass } from "@/lib/password-validation";

export function ResetPasswordForm() {
  const t = useTranslations("Auth");
  const tc = useTranslations("Common");
  const te = useTranslations("Errors");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");

  function handleSubmit(formData: FormData) {
    setError(null);

    if (!allRulesPass(password)) {
      setError(te("password_too_weak"));
      return;
    }

    startTransition(async () => {
      const result = await resetPassword(formData);
      if (result?.error) {
        setError(translateAuthError(result.error, te));
      }
      // On success, the server action redirects
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">{t("resetPasswordTitle")}</CardTitle>
        <CardDescription>{t("resetPasswordSubtitle")}</CardDescription>
      </CardHeader>
      <form action={handleSubmit} className="flex flex-col gap-6">
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">{t("newPassword")}</Label>
            <PasswordInput
              id="password"
              name="password"
              placeholder={t("passwordPlaceholder")}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PasswordRules password={password} />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !allRulesPass(password)}
          >
            {isPending && <Loader2Icon className="h-4 w-4 animate-spin" />}
            {isPending ? t("resettingPassword") : t("resetPassword")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
