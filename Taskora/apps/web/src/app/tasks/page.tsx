"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import {
    useTasks,
    useCreateTask,
    useUpdateTask,
    useDeleteTask,
} from "@/hooks/queries";
import { Task, TaskStatus, TaskQueryParams } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import {
    Plus,
    Search,
    SlidersHorizontal,
    Loader2,
    RotateCcw,
    ClipboardList,
    CheckSquare,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_FILTERS: { label: string; value: TaskStatus | ""; dot: string }[] = [
    { label: "All", value: "", dot: "#94A3B8" },
    { label: "To Do", value: "TODO", dot: "#94A3B8" },
    { label: "In Progress", value: "IN_PROGRESS", dot: "#F59E0B" },
    { label: "Done", value: "DONE", dot: "#10B981" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TasksPage() {
    const { canSeeAllTasks } = useAuth();

    const [params, setParams] = useState<TaskQueryParams>({
        limit: 20, sort: "newest", status: "", search: "",
    });
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | undefined>();

    const { data, isLoading, isError } = useTasks(params);
    const createTask = useCreateTask();
    const updateTask = useUpdateTask();
    const deleteTask = useDeleteTask();

    const tasks = data?.data ?? [];
    const total = data?.total ?? tasks.length;

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        setParams((p) => ({ ...p, search }));
    }

    function handleStatusFilter(status: TaskStatus | "") {
        setParams((p) => ({ ...p, status }));
    }

    function handleEdit(task: Task) {
        setEditingTask(task);
        setModalOpen(true);
    }

    function handleDelete(task: Task) {
        if (confirm(`Delete "${task.title}"? It will move to trash.`)) {
            deleteTask.mutate(task.id);
        }
    }

    async function handleSubmit(values: { title: string; description?: string; status: TaskStatus }) {
        if (editingTask) {
            await updateTask.mutateAsync({ id: editingTask.id, payload: values });
        } else {
            await createTask.mutateAsync(values);
        }
        setModalOpen(false);
        setEditingTask(undefined);
    }

    function clearFilters() {
        setSearch("");
        setParams({ limit: 20, sort: "newest", status: "", search: "" });
    }

    const hasActiveFilters = !!(params.search || params.status);

    function openNewTask() {
        setEditingTask(undefined);
        setModalOpen(true);
    }

    return (
        <AppShell>
            <div className="space-y-7 max-w-7xl">

                {/* ── Header ──────────────────────────────────────────────────── */}
                <div className="flex items-start justify-between gap-6 flex-wrap pt-1">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)", boxShadow: "0 4px 12px rgba(37,99,235,0.35)" }}>
                                <CheckSquare className="w-4.5 h-4.5 text-white" />
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight text-slate-900 leading-none">
                                Tasks
                            </h1>
                        </div>
                        <p className="text-sm text-slate-400 font-medium pl-12">
                            {canSeeAllTasks
                                ? "All organization tasks · stay aligned and ship faster"
                                : "Your assigned work · focused and organized"}
                        </p>
                    </div>

                    {/* New Task button */}
                    <button
                        onClick={openNewTask}
                        className="group relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white overflow-hidden transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 flex-shrink-0"
                        style={{
                            background: "linear-gradient(135deg,#2563eb 0%,#4f46e5 100%)",
                            boxShadow: "0 4px 16px rgba(37,99,235,0.45)",
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(37,99,235,0.55)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(37,99,235,0.45)"}
                    >
                        {/* sheen */}
                        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%]" style={{ transition: "transform 0.5s ease, opacity 0.3s" }} />
                        <Plus className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
                        New Task
                    </button>
                </div>

                {/* ── Toolbar ─────────────────────────────────────────────────── */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                    <div className="flex flex-col lg:flex-row gap-0 items-stretch divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

                        {/* Search */}
                        <form onSubmit={handleSearch} className="relative flex-shrink-0 lg:w-80 p-3">
                            <Search className="w-4 h-4 absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search tasks…"
                                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-150"
                            />
                        </form>

                        {/* Filter pills */}
                        <div className="flex items-center gap-2 flex-1 px-4 py-3 flex-wrap">
                            {STATUS_FILTERS.map(f => {
                                const active = params.status === f.value;
                                return (
                                    <button
                                        key={f.value}
                                        onClick={() => handleStatusFilter(f.value)}
                                        className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150",
                                            active
                                                ? "bg-slate-900 text-white shadow-sm scale-[1.02]"
                                                : "bg-white text-slate-500 border border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50"
                                        )}
                                    >
                                        <span
                                            className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors"
                                            style={{ background: active ? "#fff" : f.dot }}
                                        />
                                        {f.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Sort + Reset */}
                        <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0">
                            <select
                                value={params.sort}
                                onChange={e => setParams(p => ({ ...p, sort: e.target.value as "newest" | "oldest" }))}
                                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-600 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all cursor-pointer appearance-none pr-7 bg-no-repeat"
                                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundPosition: "right 8px center" }}
                            >
                                <option value="newest">Newest first</option>
                                <option value="oldest">Oldest first</option>
                            </select>

                            <button
                                onClick={clearFilters}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-150",
                                    hasActiveFilters
                                        ? "text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
                                        : "text-slate-400 border-transparent hover:border-slate-200 hover:text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                <RotateCcw className="w-3 h-3" />
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Body ────────────────────────────────────────────────────── */}
                {isLoading ? (
                    <div className="py-28 flex flex-col items-center justify-center gap-3">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                style={{ background: "linear-gradient(135deg,#eff6ff,#eef2ff)" }}>
                                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 font-medium">Loading tasks…</p>
                    </div>

                ) : isError ? (
                    <div className="py-28 flex flex-col items-center justify-center gap-3 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                            <SlidersHorizontal className="w-6 h-6 text-red-300" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-600">Failed to load tasks</p>
                            <p className="text-xs text-slate-400 mt-0.5">Please try refreshing the page</p>
                        </div>
                    </div>

                ) : tasks.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-6 text-center">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-3xl flex items-center justify-center border border-blue-100"
                                style={{ background: "linear-gradient(135deg,#eff6ff,#eef2ff)" }}>
                                <ClipboardList className="w-10 h-10 text-blue-300" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                                <Plus className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                <Sparkles className="w-3 h-3 text-emerald-400" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-lg font-semibold text-slate-700">
                                {hasActiveFilters ? "No tasks match" : "No tasks yet"}
                            </p>
                            <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                                {hasActiveFilters
                                    ? "Try adjusting your search or filters to find what you're looking for."
                                    : "Create your first task and start building momentum."}
                            </p>
                        </div>
                        {hasActiveFilters ? (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all duration-150"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Clear filters
                            </button>
                        ) : (
                            <button
                                onClick={openNewTask}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                                style={{
                                    background: "linear-gradient(135deg,#2563eb 0%,#4f46e5 100%)",
                                    boxShadow: "0 4px 16px rgba(37,99,235,0.4)",
                                }}
                            >
                                <Plus className="w-4 h-4" />
                                Create first task
                            </button>
                        )}
                    </div>

                ) : (
                    <div className="space-y-4">
                        {/* Meta row */}
                        <div className="flex items-center justify-between px-0.5">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    {total} Task{total !== 1 ? "s" : ""}
                                </span>
                                {hasActiveFilters && (
                                    <span className="text-xs text-blue-500 font-medium">· filtered</span>
                                )}
                            </div>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-xs font-medium text-blue-500 hover:text-blue-700 transition-colors"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {tasks.map((task: Task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <TaskFormModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditingTask(undefined); }}
                onSubmit={handleSubmit}
                defaultValues={editingTask}
                isEdit={!!editingTask}
            />
        </AppShell>
    );
}
