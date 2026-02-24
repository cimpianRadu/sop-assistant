"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { acceptInvite } from "@/lib/actions/organizations";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";

export function AcceptInviteCard({
  orgName,
  role,
  token,
}: {
  orgName: string;
  role: string;
  token: string;
}) {
  const t = useTranslations("Invite");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    setLoading(true);
    setError(null);
    const result = await acceptInvite(token);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
        <CardDescription>
          {t("invitedTo", { orgName, role })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex items-center justify-center gap-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">{t("orgLabel")}</p>
            <p className="font-medium">{orgName}</p>
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">{t("roleLabel")}</p>
            <Badge variant="secondary" className="capitalize">
              {role}
            </Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleAccept}
          className="w-full"
          disabled={loading}
        >
          {loading && <Loader2Icon className="h-4 w-4 animate-spin" />}
          {loading ? t("accepting") : t("accept")}
        </Button>
      </CardFooter>
    </Card>
  );
}
