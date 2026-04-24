import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Role, TaskStatus, LogAction } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRoleClass(role: Role) {
  return {
    OWNER: "role-owner",
    ADMIN: "role-admin",
    MEMBER: "role-user",
  }[role];
}

export function getStatusClass(status: TaskStatus) {
  return {
    TODO: "status-todo",
    IN_PROGRESS: "status-in-progress",
    DONE: "status-done",
  }[status];
}

export function formatStatus(status: TaskStatus) {
  return { TODO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done" }[status];
}

export function formatRole(role: Role) {
  return { OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member" }[role];
}

export function formatLogAction(action: LogAction): string {
  return {
    TASK_CREATED: "Created task",
    TASK_UPDATED: "Updated task",
    TASK_DELETED: "Deleted task",
    TASK_RESTORED: "Restored task",
    MEMBER_ADDED: "Added member",
    ROLE_UPDATED: "Updated role",
    MEMBER_REMOVED: "Removed member",
  }[action] ?? action;
}

export function getLogActionColor(action: LogAction): string {
  const map: Record<string, string> = {
    TASK_CREATED: "text-emerald-600 dark:text-emerald-400",
    TASK_UPDATED: "text-blue-600 dark:text-blue-400",
    TASK_DELETED: "text-red-600 dark:text-red-400",
    TASK_RESTORED: "text-amber-600 dark:text-amber-400",
    MEMBER_ADDED: "text-purple-600 dark:text-purple-400",
    ROLE_UPDATED: "text-indigo-600 dark:text-indigo-400",
    MEMBER_REMOVED: "text-red-600 dark:text-red-400",
  };
  return map[action] ?? "text-muted-foreground";
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
