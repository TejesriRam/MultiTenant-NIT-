import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { tasksApi, membersApi, logsApi } from "@/lib/api";
import {
  TaskQueryParams,
  CreateTaskPayload,
  UpdateTaskPayload,
  AddMemberPayload,
  UpdateRolePayload,
  CreateMemberPayload,
} from "@/types";

// ─── Tasks ──────────────────────────────────────────────────────────────────

/**
 * Paginated / filtered task list.
 * Backend returns: { data: Task[], total: number, nextCursor: string | null }
 */
export function useTasks(params: TaskQueryParams) {
  return useQuery({
    queryKey: ["tasks", params],
    queryFn: async () => {
      const res = await tasksApi.list(params);
      return res.data; // { data: Task[], total: number, nextCursor }
    },
    placeholderData: keepPreviousData,
  });
}

/**
 * Soft-deleted tasks list.
 * Backend returns: { data: Task[], total: number }
 */
export function useTrash() {
  return useQuery({
    queryKey: ["tasks", "trash"],
    queryFn: async () => {
      const res = await tasksApi.trash();
      return res.data; // { data: Task[], total: number }
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) =>
      tasksApi.create(payload),
    onSuccess: () => {
      // Invalidate all task list queries (any param combination)
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTaskPayload;
    }) => tasksApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => {
      // Soft-deleted task disappears from list AND appears in trash
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useRestoreTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.restore(id),
    onSuccess: () => {
      // Restored task must vanish from trash AND reappear in task list
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function usePurgeTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.purge(id),
    onSuccess: () => {
      // Purged task must vanish from trash AND general task cache
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// ─── Members ────────────────────────────────────────────────────────────────

export function useMembers() {
  return useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const res = await membersApi.list();
      return res.data;
    },
  });
}

export function useAddMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddMemberPayload) =>
      membersApi.add(payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateRolePayload;
    }) => membersApi.updateRole(id, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => membersApi.remove(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMemberPayload) =>
      membersApi.create(payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

// ─── Logs ────────────────────────────────────────────────────────────────────

/**
 * Paginated activity log list.
 * Backend returns: { data: ActivityLog[], total: number, page: number, limit: number }
 *
 * Refetch interval keeps the logs view live without a manual refresh.
 */
export function useLogs(params?: { limit?: number; page?: number }) {
  return useQuery({
    queryKey: ["logs", params],
    queryFn: async () => {
      const res = await logsApi.list(params);
      return res.data; // { data: ActivityLog[], total: number }
    },
    // Auto-refresh every 15 s so new events appear without a page reload
    refetchInterval: 15_000,
    // Always re-fetch on window focus so logs are fresh when user returns
    refetchOnWindowFocus: true,
  });
}