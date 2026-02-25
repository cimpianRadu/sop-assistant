"use client";

import { useTranslations } from "next-intl";
import { CheckIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PASSWORD_RULES,
  getPasswordStrength,
  type PasswordStrength,
} from "@/lib/password-validation";

const STRENGTH_CONFIG: Record<
  PasswordStrength,
  { segments: number; color: string; textColor: string }
> = {
  empty: { segments: 0, color: "bg-muted", textColor: "text-muted-foreground" },
  weak: { segments: 1, color: "bg-red-500", textColor: "text-red-500" },
  fair: { segments: 2, color: "bg-yellow-500", textColor: "text-yellow-500" },
  strong: { segments: 3, color: "bg-green-500", textColor: "text-green-500" },
};

interface PasswordRulesProps {
  password: string;
}

export function PasswordRules({ password }: PasswordRulesProps) {
  const t = useTranslations("PasswordRules");

  if (password.length === 0) return null;

  const strength = getPasswordStrength(password);
  const config = STRENGTH_CONFIG[strength];

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">{t("strength")}</span>
          <span className={cn("text-xs font-medium", config.textColor)}>
            {t(strength)}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map((segment) => (
            <div
              key={segment}
              className={cn(
                "h-1.5 rounded-full flex-1 transition-colors",
                segment <= config.segments ? config.color : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      <ul className="space-y-1">
        {PASSWORD_RULES.map((rule) => {
          const passed = rule.test(password);
          return (
            <li key={rule.key} className="flex items-center gap-2 text-xs">
              {passed ? (
                <CheckIcon className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
              ) : (
                <XIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <span
                className={cn(
                  passed
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground"
                )}
              >
                {t(rule.key)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
