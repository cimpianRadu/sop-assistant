import { requirePlatformAdmin } from "@/lib/platform-gate";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/shared/header";
import { ActivityIcon, UsersIcon } from "lucide-react";
import { PlatformNavLink } from "./nav-link";

export const metadata = {
  title: "Platform admin",
  robots: { index: false, follow: false },
};

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      <div className="container mx-auto px-4 py-6 w-full max-w-7xl flex-1">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Platform admin
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Sopia internal</h1>
        </div>
        <nav className="flex gap-1 border-b mb-6 -mx-1">
          <PlatformNavLink href="/platform/ai-usage">
            <ActivityIcon className="size-4" />
            AI usage
          </PlatformNavLink>
          <PlatformNavLink href="/platform/accounts">
            <UsersIcon className="size-4" />
            Accounts
          </PlatformNavLink>
          <Link
            href="/insights"
            className="ml-auto text-xs text-muted-foreground hover:text-foreground self-center px-3"
          >
            ↗ Founder insights
          </Link>
        </nav>
        {children}
      </div>
    </div>
  );
}
