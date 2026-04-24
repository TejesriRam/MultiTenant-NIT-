import axios from "axios";
import {
    TaskQueryParams,
    CreateTaskPayload,
    UpdateTaskPayload,
} from "@/types";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
    withCredentials: true,
});

// ─── Request interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
    if (typeof window === "undefined") return config;

    const token = localStorage.getItem("tf_token");
    const orgId = localStorage.getItem("tf_org_id");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (orgId) {
        config.headers["x-org-id"] = orgId;
    }

    return config;
});

// ─── Response interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (
            err.response?.status === 401 &&
            typeof window !== "undefined"
        ) {
            localStorage.removeItem("tf_token");
            localStorage.removeItem("tf_user");
            localStorage.removeItem("tf_org_id");
            window.location.href = "/login";
        }
        return Promise.reject(err);
    }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
    login: (data: { email: string; password: string }) =>
        api.post("/auth/login", data),
    register: (data: {
        email: string;
        password: string;
        name: string;
        organizationName: string;
    }) => api.post("/auth/register", data),
    logout: () => api.post("/auth/logout"),
    me: () => api.get("/auth/profile"),
};

// ─── Tasks ───────────────────────────────────────────────────────────────────
export const tasksApi = {
    // GET /tasks?cursor=...&limit=...&search=...&status=...&sort=...
    list: (params?: TaskQueryParams) => api.get("/tasks", { params }),

    // GET /tasks/trash  — must be declared before /:id in the controller
    trash: () => api.get("/tasks/trash"),

    // GET /tasks/:id
    findOne: (id: string) => api.get(`/tasks/${id}`),

    // POST /tasks
    create: (data: CreateTaskPayload) => api.post("/tasks", data),

    // PATCH /tasks/:id  — must be declared before /:id/restore in the controller
    update: (id: string, data: UpdateTaskPayload) =>
        api.patch(`/tasks/${id}`, data),

    // DELETE /tasks/:id  (soft delete)
    delete: (id: string) => api.delete(`/tasks/${id}`),

    // PATCH /tasks/:id/restore
    restore: (id: string) => api.patch(`/tasks/${id}/restore`),

    // DELETE /tasks/:id/purge  (hard delete — OWNER/ADMIN only)
    purge: (id: string) => api.delete(`/tasks/${id}/purge`),
};

// ─── Members ─────────────────────────────────────────────────────────────────
export const membersApi = {
    list: () => api.get("/members"),
    add: (data: any) => api.post("/members", data),
    updateRole: (id: string, data: any) =>
        api.patch(`/members/${id}/role`, data),
    remove: (id: string) => api.delete(`/members/${id}`),
    create: (data: { name: string; email: string; password: string; role: string }) =>
        api.post("/members/create", data),
};

// ─── Logs ─────────────────────────────────────────────────────────────────────
// Backend returns: { data: ActivityLog[], total: number, page: number, limit: number }
export const logsApi = {
    list: (params?: { page?: number; limit?: number }) =>
        api.get("/logs", { params }),
};

export default api;
