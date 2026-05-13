"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { deleteAccounts } from "@/lib/actions/platform-accounts";
import { FLAG_LABELS, type SuspicionFlag } from "@/lib/platform/suspicious";
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

type Row = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  org_name: string | null;
  flags: string[];
  last_sign_in_at: string | null;
};

export function AccountsCleanup({
  rows,
  locale,
}: {
  rows: Row[];
  locale: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground rounded-lg border bg-card p-6">
        No flagged accounts. ✓
      </p>
    );
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  };

  const handleDelete = () => {
    const ids = [...selected];
    startTransition(async () => {
      const res = await deleteAccounts(ids);
      if (res.failed.length === 0) {
        toast.success(`Deleted ${res.ok} account${res.ok === 1 ? "" : "s"}.`);
      } else {
        toast.error(
          `Deleted ${res.ok}, failed ${res.failed.length}. First error: ${res.failed[0].error}`
        );
      }
      setSelected(new Set());
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selected.size === 0
            ? `${rows.length} flagged`
            : `${selected.size} selected of ${rows.length}`}
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              disabled={selected.size === 0 || isPending}
            >
              {isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <Trash2Icon className="size-4" />
              )}
              Delete selected
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {selected.size} account{selected.size === 1 ? "" : "s"}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the auth user, profile, and any org
                memberships. Orgs left with zero members will be deleted too.
                Cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 w-8">
                <Checkbox
                  checked={selected.size === rows.length}
                  onCheckedChange={toggleAll}
                />
              </th>
              <th className="text-left px-3 py-2 font-medium">Email</th>
              <th className="text-left px-3 py-2 font-medium">Name</th>
              <th className="text-left px-3 py-2 font-medium">Org</th>
              <th className="text-left px-3 py-2 font-medium">Flags</th>
              <th className="text-left px-3 py-2 font-medium">Signed up</th>
              <th className="text-left px-3 py-2 font-medium">Last sign-in</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isSel = selected.has(r.id);
              return (
                <tr
                  key={r.id}
                  className={
                    "border-t cursor-pointer hover:bg-muted/30 " +
                    (isSel ? "bg-primary/5" : "")
                  }
                  onClick={() => toggle(r.id)}
                >
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSel}
                      onCheckedChange={() => toggle(r.id)}
                    />
                  </td>
                  <td className="px-3 py-2 font-mono text-xs truncate max-w-[260px]">
                    {r.email}
                  </td>
                  <td className="px-3 py-2 truncate max-w-[180px]">
                    {r.full_name || (
                      <span className="text-muted-foreground italic">
                        no name
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 truncate max-w-[180px] text-muted-foreground">
                    {r.org_name || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {r.flags.map((f) => (
                        <span
                          key={f}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive whitespace-nowrap"
                          title={FLAG_LABELS[f as SuspicionFlag] ?? f}
                        >
                          {FLAG_LABELS[f as SuspicionFlag] ?? f}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {r.last_sign_in_at ? (
                      new Date(r.last_sign_in_at).toLocaleDateString(locale, {
                        month: "short",
                        day: "numeric",
                      })
                    ) : (
                      <span className="text-destructive/70">never</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
