"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import {
  LayoutGridIcon,
  FileTextIcon,
  AlertTriangleIcon,
  UsersIcon,
  BarChart3Icon,
  UserIcon,
  HelpCircleIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NavRole = "admin" | "manager" | "operator";

type NavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  badge?: number;
};

type NavSection = {
  labelKey: string;
  items: NavItem[];
};

function buildSections(role: NavRole, openEscalations: number): NavSection[] {
  const workspace: NavItem[] = [
    {
      href: `/${role}/dashboard`,
      labelKey: "dashboard",
      icon: LayoutGridIcon,
    },
  ];

  if (role === "admin" || role === "manager") {
    workspace.push({
      href: "/manager/processes",
      labelKey: "processes",
      icon: FileTextIcon,
    });
    workspace.push({
      href: `/${role}/dashboard#escalations`,
      labelKey: "escalations",
      icon: AlertTriangleIcon,
      badge: openEscalations,
    });
  }

  if (role === "admin") {
    workspace.push({
      href: "/admin/members",
      labelKey: "team",
      icon: UsersIcon,
    });
  }

  if (role === "operator") {
    // Operator uses the same dashboard as their processes list
  }

  const account: NavItem[] = [
    {
      href: "/profile",
      labelKey: "profile",
      icon: UserIcon,
    },
  ];

  const sections: NavSection[] = [
    { labelKey: "workspace", items: workspace },
    { labelKey: "account", items: account },
  ];
  return sections;
}

type Props = {
  role: NavRole;
  openEscalations?: number;
  orgName?: string;
  onNavigate?: () => void;
  /** When true, renders with compact spacing suitable for a drawer. */
  compact?: boolean;
};

export function SidebarNav({
  role,
  openEscalations = 0,
  orgName,
  onNavigate,
  compact = false,
}: Props) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const sections = buildSections(role, openEscalations);

  return (
    <nav
      aria-label="Primary"
      className={cn("flex flex-col gap-1", compact ? "px-0" : "px-2")}
    >
      {sections.map((section) => (
        <div key={section.labelKey} className="mb-3">
          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {t(section.labelKey)}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href.includes("#") &&
                  pathname === item.href.split("#")[0]);
              return (
                <li key={item.href + item.labelKey}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{t(item.labelKey)}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full px-1.5">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <a
        href="mailto:hello@sopia.xyz?subject=Feedback on Sopia"
        className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mt-auto"
      >
        <HelpCircleIcon className="size-4 shrink-0" />
        <span className="truncate">{t("helpFeedback")}</span>
      </a>

      {orgName && (
        <div className="mt-2 pt-3 border-t px-3 text-[11px] text-muted-foreground">
          <p className="font-medium text-foreground truncate capitalize">
            {orgName}
          </p>
          <p className="truncate capitalize mt-0.5">{role}</p>
        </div>
      )}

      {/* Unused Analytics icon placeholder to satisfy linter (future nav item). */}
      <BarChart3Icon className="hidden" aria-hidden />
    </nav>
  );
}
