export type UserRole = "manager" | "operator";

export type SubscriptionStatus = "trialing" | "active" | "expired";

export type Profile = {
  id: string;
  email: string;
  role: UserRole;
  trial_ends_at: string | null;
  subscription_status: SubscriptionStatus;
  created_at: string;
};

export type Process = {
  id: string;
  manager_id: string;
  title: string;
  description: string;
  sop_text: string;
  created_at: string;
};

export type ChecklistStep = {
  id: string;
  process_id: string;
  step_number: number;
  step_text: string;
};

export type ExecutionStatus = "in_progress" | "completed";

export type Execution = {
  id: string;
  process_id: string;
  operator_id: string;
  status: ExecutionStatus;
  started_at: string;
  completed_at: string | null;
};

export type ExecutionStep = {
  id: string;
  execution_id: string;
  checklist_step_id: string;
  completed: boolean;
  completed_at: string | null;
};

// Joined types for UI
export type ExecutionWithProfile = Execution & {
  profiles: Pick<Profile, "email">;
};

export type ExecutionStepWithDetails = ExecutionStep & {
  checklist_steps: ChecklistStep;
};

export type GenerateSopResponse = {
  sop: string;
  checklist: string[];
};

// Assignments
export type ProcessAssignment = {
  id: string;
  process_id: string;
  operator_id: string;
  assigned_by: string;
  created_at: string;
};

export type ProcessAssignmentWithProfile = ProcessAssignment & {
  profiles: Pick<Profile, "email">;
};

// Help Requests
export type HelpRequest = {
  id: string;
  execution_id: string;
  checklist_step_id: string;
  operator_id: string;
  process_id: string;
  question: string;
  ai_response: string | null;
  escalated: boolean;
  escalation_note: string | null;
  resolved: boolean;
  created_at: string;
  resolved_at: string | null;
};

export type HelpRequestWithDetails = HelpRequest & {
  profiles: Pick<Profile, "email">;
  processes: Pick<Process, "title">;
  checklist_steps: Pick<ChecklistStep, "step_text" | "step_number">;
};
