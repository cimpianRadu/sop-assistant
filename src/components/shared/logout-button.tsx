"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";

export function LogoutButton({
  variant = "outline",
  size = "sm",
  className,
}: {
  variant?: "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const tc = useTranslations("Common");
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await logout();
  }

  return (
    <form action={handleLogout}>
      <Button
        variant={variant}
        size={size}
        type="submit"
        className={className}
        disabled={loading}
      >
        {loading && <Loader2Icon className="h-4 w-4 animate-spin" />}
        {tc("logOut")}
      </Button>
    </form>
  );
}
