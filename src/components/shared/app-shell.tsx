import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
import { isFounderEmail } from "@/lib/analytics/founder-gate";
import { Header } from "./header";
import { SidebarNav } from "./sidebar-nav";

/**
 * Shared authenticated shell — top banners + header + desktop sidebar + main.
 * Mobile: sidebar collapses into a Sheet drawer (see MobileNav).
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getSessionContext();

  // Compute open-escalation count for roles that see it
  let openEscalations = 0;
  if (session && (session.role === "admin" || session.role === "manager")) {
    const supabase = await createClient();
    const { data: processes } = await supabase
      .from("processes")
      .select("id")
      .eq("org_id", session.org_id);
    const processIds = (processes || []).map((p) => p.id);
    if (processIds.length > 0) {
      const { count } = await supabase
        .from("help_requests")
        .select("*", { count: "exact", head: true })
        .eq("escalated", true)
        .eq("resolved", false)
        .in("process_id", processIds);
      openEscalations = count || 0;
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Header />
        <main className="container mx-auto px-4 py-6">{children}</main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-muted/30">
      <Header openEscalations={openEscalations} />
      <div className="flex-1 flex overflow-hidden lg:grid lg:grid-cols-[208px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col border-r bg-background overflow-y-auto py-4 px-2">
          <SidebarNav
            role={session.role}
            orgName={session.org_name}
            openEscalations={openEscalations}
            isPlatformAdmin={isFounderEmail(session.email)}
          />
        </aside>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
