"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { removeMember } from "@/lib/actions/organizations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import type { OrgMemberWithProfile } from "@/lib/types";

export function MemberList({
  members,
  currentUserId,
}: {
  members: OrgMemberWithProfile[];
  currentUserId: string;
}) {
  const t = useTranslations("Admin");
  const tt = useTranslations("Toast");
  const [removing, setRemoving] = useState<string | null>(null);

  async function handleRemove(memberId: string) {
    setRemoving(memberId);
    await removeMember(memberId);
    toast.success(tt("memberRemoved"));
    setRemoving(null);
  }

  return (
    <Card>
      <CardContent>
        {members.length === 0 ? (
          <EmptyState icon={UsersIcon} title={t("noMembers")} />
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between flex-wrap gap-2 border rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {member.profiles.full_name || member.profiles.email}
                    </p>
                    {member.profiles.full_name && (
                      <p className="text-xs text-muted-foreground">
                        {member.profiles.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {member.role}
                  </Badge>
                  {member.user_id !== currentUserId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemove(member.id)}
                      disabled={removing === member.id}
                    >
                      {removing === member.id
                        ? t("removing")
                        : t("removeMember")}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
