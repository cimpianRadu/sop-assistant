"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { signup } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SignupForm() {
  const t = useTranslations("Auth");
  const tc = useTranslations("Common");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signup(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">{t("signupTitle")}</CardTitle>
        <CardDescription>{t("signupSubtitle")}</CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{tc("email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{tc("password")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={t("passwordPlaceholder")}
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label>{tc("role")}</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="manager"
                  defaultChecked
                  className="accent-primary"
                />
                <span className="text-sm">{tc("manager")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="operator"
                  className="accent-primary"
                />
                <span className="text-sm">{tc("operator")}</span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("roleDescription")}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("creatingAccount") : t("createAccount")}
          </Button>
          <p className="text-sm text-muted-foreground">
            {t("haveAccount")}{" "}
            <Link href="/auth/login" className="text-primary underline">
              {t("logInLink")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
