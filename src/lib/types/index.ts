export type UserRole = "admin" | "manager" | "operator";

export type OrgRole = "admin" | "manager" | "operator";

export type SubscriptionStatus = "trialing" | "active" | "expired" | "past_due" | "cancelled" | "inactive";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  trial_ends_at: string | null;
  subscription_status: SubscriptionStatus;
  current_period_end: string | null;
  created_at: string;
};

export type OrgMember = {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  invited_by: string | null;
  invited_at: string;
  joined_at: string;
};

export type OrgMemberWithProfile = OrgMember & {
  profiles: Pick<Profile, "email" | "full_name">;
};

export type OrgInvite = {
  id: string;
  org_id: string;
  email: string;
  role: Exclude<OrgRole, "admin">;
  token: string;
  invited_by: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
};

export type SessionContext = {
  user_id: string;
  email: string;
  org_id: string;
  org_name: string;
  role: OrgRole;
  trial_ends_at: string | null;
  subscription_status: SubscriptionStatus;
  current_period_end: string | null;
};

export type Process = {
  id: string;
  org_id: string;
  created_by: string;
  title: string;
  description: string;
  sop_text: string;
  created_at: string;
  updated_at: string;
  current_version: number;
};

export type ProcessVersionStep = {
  step_number: number;
  step_text: string;
};

export type ProcessVersion = {
  id: string;
  process_id: string;
  org_id: string;
  version_number: number;
  title: string;
  description: string;
  sop_text: string;
  steps_snapshot: ProcessVersionStep[];
  updated_by: string | null;
  updated_at: string;
};

export type ProcessVersionWithAuthor = ProcessVersion & {
  profiles: Pick<Profile, "email" | "full_name"> | null;
};

export type ProcessWithCreator = Process & {
  profiles: Pick<Profile, "email" | "full_name">;
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
  checklist_step_id: string | null;
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
  checklist_steps: Pick<ChecklistStep, "step_text" | "step_number"> | null;
};
