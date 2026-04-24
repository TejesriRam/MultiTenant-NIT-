// ─── Auth / User ────────────────────────────────────────────────────────────

export type Role = "OWNER" | "ADMIN" | "MEMBER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string;
  organizationName: string;
  avatarInitials: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ─── Tasks ──────────────────────────────────────────────────────────────────

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdById: string;
  createdBy: { name: string; email: string };
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
}

export interface TasksResponse {
  data: Task[];
  nextCursor?: string;
  total: number;
}

export interface TaskQueryParams {
  limit?: number;
  cursor?: string;
  search?: string;
  status?: TaskStatus | "";
  sort?: "newest" | "oldest";
}

// ─── Members ────────────────────────────────────────────────────────────────

export interface Member {
  id: string;
  userId: string;
  organizationId: string;
  role: Role;
  createdAt: string;

  user: {
    id: string;
    name: string;
    email: string;
  };
}
export interface AddMemberPayload {
  email: string;
  role: Role;
}

// Add this alongside AddMemberPayload:
export interface CreateMemberPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateRolePayload {
  role: Role;
}

// ─── Logs ───────────────────────────────────────────────────────────────────

export type LogAction =
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_DELETED"
  | "TASK_RESTORED"
  | "MEMBER_ADDED"
  | "ROLE_UPDATED"
  | "MEMBER_REMOVED";

export interface ActivityLog {
  id: string;
  action: LogAction;
  actorId: string;
  actorName: string;
  entityType: "TASK" | "MEMBER";
  entityId: string;
  organizationId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface LogsResponse {
  data: ActivityLog[];
  total: number;
}

// ─── UI Helpers ─────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: Role[];
}