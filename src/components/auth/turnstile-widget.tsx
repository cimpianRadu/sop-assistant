"use client";

import { useTheme } from "next-themes";
import { Turnstile } from "@marsidev/react-turnstile";

type Props = {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
};

export function TurnstileWidget({ onVerify, onExpire, onError }: Props) {
  const { resolvedTheme } = useTheme();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) return null;

  return (
    <Turnstile
      siteKey={siteKey}
      onSuccess={onVerify}
      onExpire={onExpire}
      onError={onError}
      options={{
        theme: resolvedTheme === "dark" ? "dark" : "light",
        size: "flexible",
      }}
    />
  );
}
