"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { inviteMember } from "@/lib/actions/organizations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2Icon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InviteForm() {
  const t = useTranslations("Admin");
  const tc = useTranslations("Common");
  const te = useTranslations("Errors");
  const tt = useTranslations("Toast");
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInviteLink(null);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await inviteMember(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.token) {
        const link = `${window.location.origin}/invite/${result.token}`;
        setInviteLink(link);
        if (result.emailError) {
          toast.error(tt("emailFailed"));
        } else {
          toast.success(tt("inviteSent"));
        }
      }
    } catch {
      setError("unknown_error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      toast.success(tt("linkCopied"));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("inviteMember")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{te(error)}</AlertDescription>
            </Alert>
          )}

          {inviteLink && (
            <Alert>
              <AlertDescription className="space-y-2">
                <p className="font-medium">{t("inviteLink")}</p>
                <div className="flex gap-2">
                  <Input value={inviteLink} readOnly className="text-xs" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                  >
                    {t("copyLink")}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-3">
            <div className="w-full sm:flex-1">
              <Label htmlFor="invite-email" className="sr-only">
                {tc("email")}
              </Label>
              <Input
                id="invite-email"
                name="email"
                type="email"
                placeholder={tc("email")}
                required
              />
            </div>
            <div>
              <Label htmlFor="invite-role" className="sr-only">
                {t("memberRole")}
              </Label>
              <select
                id="invite-role"
                name="role"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                defaultValue="operator"
              >
                <option value="operator">{tc("operator")}</option>
                <option value="manager">{tc("manager")}</option>
              </select>
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2Icon className="h-4 w-4 animate-spin" />}
              {loading ? t("inviting") : t("inviteMember")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
