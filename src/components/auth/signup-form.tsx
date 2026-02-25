"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { signup } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { PasswordRules } from "@/components/auth/password-rules";

export function SignupForm() {
  const t = useTranslations("Auth");
  const tc = useTranslations("Common");
  const te = useTranslations("Errors");
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const isEmailValid =
    email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const showEmailError = emailTouched && email.length > 0 && !isEmailValid;

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signup(formData);
      if (result?.error) {
        setError(translateAuthError(result.error, te));
      } else if (result?.success) {
        setSuccess(true);
      }
    });
  }

  if (success) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">{t("checkEmailTitle")}</CardTitle>
          <CardDescription>{t("checkEmailDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t("checkEmailSpam")}
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/auth/login" className="text-sm text-primary underline">
            {t("backToLogin")}
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">{t("signupTitle")}</CardTitle>
        <CardDescription>{t("signupSubtitle")}</CardDescription>
      </CardHeader>
      <form action={handleSubmit} className="flex flex-col gap-6">
        {inviteToken && (
          <input type="hidden" name="inviteToken" value={inviteToken} />
        )}
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="fullName">{tc("fullName")}</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder={t("fullNamePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{tc("email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
            />
            {showEmailError && (
              <p className="text-xs text-destructive">
                {te("invalid_email_format")}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{tc("password")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={t("passwordPlaceholder")}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PasswordRules password={password} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2Icon className="h-4 w-4 animate-spin" />}
            {isPending ? t("creatingAccount") : t("createAccount")}
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
