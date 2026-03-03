"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateProfile } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2Icon } from "lucide-react";

type ProfileFormProps = {
  fullName: string | null;
  email: string;
  role: string;
  orgName: string;
  memberSince: string;
  locale: string;
};

export function ProfileForm({
  fullName,
  email,
  role,
  orgName,
  memberSince,
  locale,
}: ProfileFormProps) {
  const t = useTranslations("Profile");
  const tt = useTranslations("Toast");
  const [saving, setSaving] = useState(false);

  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email[0].toUpperCase();

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    const result = await updateProfile(formData);
    if (result.success) {
      toast.success(tt("profileUpdated"));
    }
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("personalInfo")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{fullName || email}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="capitalize">
                  {role}
                </Badge>
                <span className="text-xs text-muted-foreground">{orgName}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">{t("fullName")}</Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={fullName || ""}
              placeholder={t("fullNamePlaceholder")}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {t("memberSince", {
              date: new Date(memberSince).toLocaleDateString(locale),
            })}
          </p>

          <Button type="submit" disabled={saving}>
            {saving && <Loader2Icon className="h-4 w-4 animate-spin" />}
            {saving ? t("saving") : t("saveChanges")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
