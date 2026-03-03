"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cancelInvite, resendInvite } from "@/lib/actions/organizations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2Icon, MailIcon } from "lucide-react";
import type { OrgInvite } from "@/lib/types";

export function PendingInvites({ invites }: { invites: OrgInvite[] }) {
  const t = useTranslations("Admin");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);

  const tt = useTranslations("Toast");

  async function handleCancel(inviteId: string) {
    setCancelling(inviteId);
    await cancelInvite(inviteId);
    toast.success(tt("inviteCancelled"));
    setCancelling(null);
  }

  async function handleResend(inviteId: string) {
    setResending(inviteId);
    const result = await resendInvite(inviteId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(tt("inviteResent"));
    }
    setResending(null);
  }

  const pending = invites.filter((i) => !i.accepted_at);

  if (pending.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("pendingInvites")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pending.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between flex-wrap gap-2 border rounded-lg p-3"
            >
              <div>
                <p className="text-sm font-medium">{invite.email}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(invite.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {invite.role}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResend(invite.id)}
                  disabled={resending === invite.id}
                >
                  {resending === invite.id ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <MailIcon className="size-4" />
                  )}
                  {resending === invite.id
                    ? t("resending")
                    : t("resendInvite")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleCancel(invite.id)}
                  disabled={cancelling === invite.id}
                >
                  {cancelling === invite.id
                    ? t("cancelling")
                    : t("cancelInvite")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
