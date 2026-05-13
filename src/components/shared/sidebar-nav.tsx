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
  ShieldCheckIcon,
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

function buildSections(
  role: NavRole,
  openEscalations: number,
  isPlatformAdmin: boolean
): NavSection[] {
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
      href: "/manager/escalations",
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

  if (isPlatformAdmin) {
    sections.push({
      labelKey: "platform",
      items: [
        {
          href: "/platform/ai-usage",
          labelKey: "platform",
          icon: ShieldCheckIcon,
        },
      ],
    });
  }

  return sections;
}

type Props = {
  role: NavRole;
  openEscalations?: number;
  orgName?: string;
  isPlatformAdmin?: boolean;
  onNavigate?: () => void;
  /** When true, renders with compact spacing suitable for a drawer. */
  compact?: boolean;
};

export function SidebarNav({
  role,
  openEscalations = 0,
  orgName,
  isPlatformAdmin = false,
  onNavigate,
  compact = false,
}: Props) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const sections = buildSections(role, openEscalations, isPlatformAdmin);

  return (
    <nav
      aria-label="Primary"
      className="flex flex-col gap-0.5 flex-1 min-h-0"
    >
      {sections.map((section, idx) => (
        <div key={section.labelKey} className={cn(idx > 0 && "mt-4")}>
          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {t(section.labelKey)}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const hrefBase = item.href.split("#")[0];
              // The Platform item points at /platform/ai-usage but should
              // light up on any /platform/* subpage.
              const active = hrefBase.startsWith("/platform")
                ? pathname.startsWith("/platform")
                : pathname === hrefBase;
              return (
                <li key={item.href + item.labelKey}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground"
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
        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mt-auto"
      >
        <HelpCircleIcon className="size-4 shrink-0" />
        <span className="truncate">{t("helpFeedback")}</span>
      </a>

      {orgName && !compact && (
        <div className="mt-3 pt-3 border-t px-2.5 text-[11px] text-muted-foreground">
          <p className="font-medium text-foreground truncate">{orgName}</p>
          <p className="truncate capitalize mt-0.5">{role}</p>
        </div>
      )}

      {/* Unused icon import placeholder (reserved for Analytics future nav). */}
      <BarChart3Icon className="hidden" aria-hidden />
    </nav>
  );
}
