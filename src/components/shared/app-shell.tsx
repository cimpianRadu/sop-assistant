import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";
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
    <div className="min-h-screen bg-muted/30">
      <Header openEscalations={openEscalations} />
      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-0 max-w-[1400px] mx-auto">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block border-r bg-background/50 min-h-[calc(100vh-3.5rem)]">
          <div className="sticky top-0 p-4">
            <SidebarNav
              role={session.role}
              orgName={session.org_name}
              openEscalations={openEscalations}
            />
          </div>
        </aside>

        <main className="px-4 sm:px-6 py-6 min-w-0">{children}</main>
      </div>
    </div>
  );
}
