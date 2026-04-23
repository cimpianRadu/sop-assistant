import type { createClient } from "@/lib/supabase/server";
import type { ProcessWithCreator } from "@/lib/types";

export type ProcessCardData = ProcessWithCreator & {
  stepCount: number;
  totalRuns: number;
  activeRuns: number;
  operatorCount: number;
  lastRunAt: string | null;
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * For a list of processes, fetch aggregate data used by ProcessCard:
 * step count, total/in-progress executions, assigned operator count, last run.
 *
 * Uses a single batched select for each aggregate, then groups client-side.
 */
export async function enrichProcesses(
  supabase: SupabaseClient,
  processes: ProcessWithCreator[]
): Promise<ProcessCardData[]> {
  if (processes.length === 0) return [];
  const ids = processes.map((p) => p.id);

  const [steps, executions, assignments] = await Promise.all([
    supabase.from("checklist_steps").select("process_id").in("process_id", ids),
    supabase
      .from("executions")
      .select("process_id, status, started_at")
      .in("process_id", ids),
    supabase
      .from("process_assignments")
      .select("process_id, operator_id")
      .in("process_id", ids),
  ]);

  const stepCounts = new Map<string, number>();
  for (const s of (steps.data || []) as { process_id: string }[]) {
    stepCounts.set(s.process_id, (stepCounts.get(s.process_id) || 0) + 1);
  }

  const totalRuns = new Map<string, number>();
  const activeRuns = new Map<string, number>();
  const lastRun = new Map<string, string>();
  for (const e of (executions.data || []) as {
    process_id: string;
    status: string;
    started_at: string;
  }[]) {
    totalRuns.set(e.process_id, (totalRuns.get(e.process_id) || 0) + 1);
    if (e.status === "in_progress") {
      activeRuns.set(e.process_id, (activeRuns.get(e.process_id) || 0) + 1);
    }
    const prev = lastRun.get(e.process_id);
    if (!prev || new Date(e.started_at) > new Date(prev)) {
      lastRun.set(e.process_id, e.started_at);
    }
  }

  const opSets = new Map<string, Set<string>>();
  for (const a of (assignments.data || []) as {
    process_id: string;
    operator_id: string;
  }[]) {
    if (!opSets.has(a.process_id)) opSets.set(a.process_id, new Set());
    opSets.get(a.process_id)!.add(a.operator_id);
  }

  return processes.map((p) => ({
    ...p,
    stepCount: stepCounts.get(p.id) || 0,
    totalRuns: totalRuns.get(p.id) || 0,
    activeRuns: activeRuns.get(p.id) || 0,
    operatorCount: opSets.get(p.id)?.size || 0,
    lastRunAt: lastRun.get(p.id) || null,
  }));
}
