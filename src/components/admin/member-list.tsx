"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { removeMember } from "@/lib/actions/organizations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2Icon, UsersIcon, Loader2Icon } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrgMemberWithProfile } from "@/lib/types";

const ROLE_STYLES: Record<string, string> = {
  admin:
    "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-900/50",
  manager:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-900/50",
  operator:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900/50",
};

const AVATAR_COLORS: Record<string, string> = {
  admin: "bg-purple-500 text-white",
  manager: "bg-amber-500 text-white",
  operator: "bg-blue-500 text-white",
};

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2)
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export function MemberList({
  members,
  currentUserId,
}: {
  members: OrgMemberWithProfile[];
  currentUserId: string;
}) {
  const t = useTranslations("Admin");
  const tc = useTranslations("Common");
  const tt = useTranslations("Toast");
  const locale = useLocale();
  const [removing, setRemoving] = useState<string | null>(null);

  async function handleRemove(memberId: string) {
    setRemoving(memberId);
    await removeMember(memberId);
    toast.success(tt("memberRemoved"));
    setRemoving(null);
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState icon={UsersIcon} title={t("noMembers")} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-2 sm:p-3">
        <ul className="divide-y">
          {members.map((member) => {
            const name = member.profiles.full_name || member.profiles.email;
            const initials = getInitials(
              member.profiles.full_name,
              member.profiles.email
            );
            const joinedLabel = formatRelativeTime(member.joined_at, locale);
            return (
              <li
                key={member.id}
                className="flex items-center gap-3 py-2.5 px-1 sm:px-2 flex-wrap"
              >
                <span
                  className={cn(
                    "size-9 rounded-full grid place-items-center text-xs font-bold shrink-0",
                    AVATAR_COLORS[member.role] || "bg-muted text-foreground"
                  )}
                >
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{name}</p>
                  {member.profiles.full_name && (
                    <p className="text-xs text-muted-foreground truncate">
                      {member.profiles.email}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground hidden sm:block whitespace-nowrap">
                  Joined {joinedLabel}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border capitalize",
                    ROLE_STYLES[member.role] ||
                      "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {member.role}
                </span>
                {member.user_id !== currentUserId && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        disabled={removing === member.id}
                        aria-label={t("removeMember")}
                      >
                        {removing === member.id ? (
                          <Loader2Icon className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2Icon className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent size="sm">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t("removeMemberConfirmTitle")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("removeMemberConfirmDescription")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => handleRemove(member.id)}
                        >
                          {t("removeMemberConfirmAction")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
